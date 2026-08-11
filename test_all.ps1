$ErrorActionPreference = "Stop"

# SmartRetailX - Automated Integration / Failure Test Suite
# Run:
# powershell -ExecutionPolicy Bypass -File .\test-all.ps1

$user = "http://localhost:3001/api/v1"
$notify = "http://localhost:3002/api/v1"
$order = "http://localhost:3003/api/v1"
$product = "http://localhost:3004/api/v1"

$email = "alice@smartretailx.com"
$password = "Password123!"
$sku = "SKU-002"
$price = 24.99

$pass = 0
$fail = 0
$results = @()

function Test-Result($name, $ok, $details) {
    if ($ok) {
        $script:pass++
        Write-Host "PASS  $name" -ForegroundColor Green
    } else {
        $script:fail++
        Write-Host "FAIL  $name" -ForegroundColor Red
    }
    $script:results += [PSCustomObject]@{
        Test = $name
        Result = if ($ok) { "PASS" } else { "FAIL" }
        Details = $details
    }
}

function Api($uri, $method="Get", $headers=@{}, $body=$null) {
    if ($null -ne $body) {
        return Invoke-RestMethod -Uri $uri -Method $method -Headers $headers `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json -Depth 10)
    }
    return Invoke-RestMethod -Uri $uri -Method $method -Headers $headers
}

function Get-Stock($headers) {
    $r = Api "$product/products" "Get" $headers
    $p = $r.items | Where-Object { $_.sku -eq $sku } | Select-Object -First 1
    if ($null -eq $p) { throw "Product $sku not found." }
    return [int]$p.inventory.stock
}

function Wait-Health($name, $url) {
    for ($i=1; $i -le 20; $i++) {
        try {
            Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 3 | Out-Null
            return $true
        } catch {
            Start-Sleep 1
        }
    }
    return $false
}

Write-Host "`n============================================" -ForegroundColor Magenta
Write-Host " SmartRetailX Automated Test Suite" -ForegroundColor Magenta
Write-Host "============================================`n" -ForegroundColor Magenta

# 1. Ensure services are running
docker compose start | Out-Null
Start-Sleep 3

# 2. Health checks
$health = @(
    @("User Service", "$user/health"),
    @("Notification Service", "$notify/health"),
    @("Order Service", "$order/health"),
    @("Product Inventory Service", "$product/health")
)

foreach ($h in $health) {
    try {
        Invoke-RestMethod -Uri $h[1] -Method Get -TimeoutSec 5 | Out-Null
        Test-Result "Health - $($h[0])" $true "Health endpoint responded."
    } catch {
        Test-Result "Health - $($h[0])" $false $_.Exception.Message
    }
}

# 3. Login
try {
    $login = Api "$user/auth/login" "Post" @{"Content-Type"="application/json"} @{
        email=$email
        password=$password
    }

    $token = $login.token
    if ([string]::IsNullOrWhiteSpace($token)) { throw "No JWT returned." }

    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }

    Test-Result "JWT Login" $true "Token received."
} catch {
    Test-Result "JWT Login" $false $_.Exception.Message
    exit 1
}

# 4. Invalid JWT
try {
    Api "$product/products" "Get" @{Authorization="Bearer invalid-token"} | Out-Null
    Test-Result "Invalid JWT Rejection" $false "Invalid token was accepted."
} catch {
    Test-Result "Invalid JWT Rejection" $true "Invalid token rejected."
}

# 5. Product retrieval + baseline stock
try {
    $products = Api "$product/products" "Get" $headers
    $p = $products.items | Where-Object {$_.sku -eq $sku} | Select-Object -First 1
    Test-Result "Product Retrieval" ($null -ne $p) "SKU=$sku"

    $before = Get-Stock $headers
    Write-Host "Baseline $sku stock = $before" -ForegroundColor Cyan
    Test-Result "Inventory Baseline" ($before -ge 1) "Stock=$before"
} catch {
    Test-Result "Product / Inventory Baseline" $false $_.Exception.Message
    exit 1
}

# 6. Normal cross-service order
$orderCreated = $null
try {
    $body = @{
        items = @(@{
            sku=$sku
            quantity=1
            price=$price
        })
    }

    $orderCreated = Api "$order/orders" "Post" $headers $body
    $afterOrder = Get-Stock $headers

    Test-Result "Create Order" ($orderCreated.status -eq "PENDING") `
        "Order=$($orderCreated.id), status=$($orderCreated.status)"

    Test-Result "Inventory Consumed" ($afterOrder -eq ($before-1)) `
        "Before=$before, After=$afterOrder"

    try {
        $notes = Api "$notify/notifications" "Get" $headers
        $found = $notes.items | Where-Object {$_.message -match [regex]::Escape($orderCreated.id)}
        Test-Result "Order Notification Created" ($null -ne $found) "Order=$($orderCreated.id)"
    } catch {
        Test-Result "Order Notification Created" $false $_.Exception.Message
    }
} catch {
    Test-Result "Create Order" $false $_.Exception.Message
}

# 7. Cancellation + release + idempotency
if ($null -ne $orderCreated) {
    try {
        $cancel = Api "$order/orders/$($orderCreated.id)/status" "Patch" $headers @{
            status="CANCELLED"
        }

        $afterCancel = Get-Stock $headers
        Test-Result "Cancel Order" ($cancel.status -eq "CANCELLED") "Order=$($orderCreated.id)"
        Test-Result "Inventory Released On Cancel" ($afterCancel -eq $before) `
            "Before=$before, AfterCancel=$afterCancel"

        try {
            Api "$order/orders/$($orderCreated.id)/status" "Patch" $headers @{
                status="CANCELLED"
            } | Out-Null
        } catch {}

        $afterSecondCancel = Get-Stock $headers
        Test-Result "Cancellation Idempotency" ($afterSecondCancel -eq $afterCancel) `
            "AfterCancel=$afterCancel, AfterSecondCancel=$afterSecondCancel"
    } catch {
        Test-Result "Cancellation / Release" $false $_.Exception.Message
    }
}

# 8. Insufficient inventory
try {
    $stock = Get-Stock $headers
    $body = @{
        items = @(@{
            sku=$sku
            quantity=($stock+100)
            price=$price
        })
    }
    Api "$order/orders" "Post" $headers $body | Out-Null
    Test-Result "Insufficient Inventory Rejection" $false "Order unexpectedly succeeded."
} catch {
    Test-Result "Insufficient Inventory Rejection" $true "Order rejected."
}

# 9. Inventory service failure
Write-Host "`n--- Inventory Service Failure Test ---" -ForegroundColor Cyan
try {
    $stock = Get-Stock $headers

    if ($stock -lt 1) {
        Test-Result "Inventory Failure Setup" $false "SKU-002 has no stock."
    } else {
        docker compose stop product-inventory-service | Out-Null
        Start-Sleep 2

        try {
            Api "$order/orders" "Post" $headers @{
                items=@(@{sku=$sku; quantity=1; price=$price})
            } | Out-Null

            Test-Result "Inventory Service Failure Handling" $false `
                "Order succeeded while inventory service was stopped."
        } catch {
            Test-Result "Inventory Service Failure Handling" $true `
                "Order failed while inventory service was unavailable."
        }

        docker compose start product-inventory-service | Out-Null
        $recovered = Wait-Health "Inventory" "$product/health"
        Test-Result "Inventory Service Recovery" $recovered "Service restarted."
    }
} catch {
    Test-Result "Inventory Failure Test" $false $_.Exception.Message
    docker compose start product-inventory-service | Out-Null
}

# 10. Notification service failure
Write-Host "`n--- Notification Service Failure Test ---" -ForegroundColor Cyan
try {
    $stock = Get-Stock $headers

    if ($stock -lt 1) {
        Test-Result "Notification Failure Setup" $false "SKU-002 has no stock."
    } else {
        docker compose stop notification-service | Out-Null
        Start-Sleep 2

        try {
            $failureOrder = Api "$order/orders" "Post" $headers @{
                items=@(@{sku=$sku; quantity=1; price=$price})
            }

            # This is deliberately recorded as a pass if the core order succeeds.
            # It demonstrates that notification failure does not necessarily block ordering.
            Test-Result "Notification Service Failure Handling" $true `
                "Order succeeded while Notification Service was stopped. Order=$($failureOrder.id)"
        } catch {
            Test-Result "Notification Service Failure Handling" $false `
                "Order failed while Notification Service was stopped: $($_.ErrorDetails.Message)"
        }

        docker compose start notification-service | Out-Null
        $recovered = Wait-Health "Notification" "$notify/health"
        Test-Result "Notification Service Recovery" $recovered "Service restarted."
    }
} catch {
    Test-Result "Notification Failure Test" $false $_.Exception.Message
    docker compose start notification-service | Out-Null
}

# 11. Final service state
Write-Host "`n--- Final Service Check ---" -ForegroundColor Cyan
$services = @(
    "user-service",
    "notification-service",
    "order-service",
    "product-inventory-service"
)

$running = docker compose ps --services --filter "status=running"

foreach ($s in $services) {
    Test-Result "Docker Running - $s" ($running -contains $s) "Service running=$($running -contains $s)"
}

# 12. Summary
Write-Host "`n============================================" -ForegroundColor Magenta
Write-Host " TEST SUMMARY" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
$results | Format-Table -AutoSize

Write-Host "Passed: $pass" -ForegroundColor Green
Write-Host "Failed: $fail" -ForegroundColor Red
Write-Host "Total : $($pass+$fail)" -ForegroundColor Cyan

if ($fail -eq 0) {
    Write-Host "`nALL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSOME TESTS FAILED - REVIEW THE OUTPUT" -ForegroundColor Yellow
    exit 1
}