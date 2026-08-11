# ---- CONFIG ----
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3M2UzOWRkNi05ZWUyLTRkZjctOTNhZi01ZTRmMjM4MDhhMjkiLCJlbWFpbCI6ImFsaWNlQHNtYXJ0cmV0YWlseC5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3ODY0NzE1NDcsImV4cCI6MTc4NjQ3NTE0N30.YaJwQCpBXz77awibwyhUVI52yG0y4Cpbh5HCjR0WpNU"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$ordersBase = "http://localhost:3003/api/v1/orders"
$productsBase = "http://localhost:3004/api/v1/products"
$sku = "SKU-002"

function Get-Stock {
    param($label)
    $products = Invoke-RestMethod -Uri $productsBase -Headers $headers -Method Get
    $p = $products.items | Where-Object { $_.sku -eq $sku }
    Write-Host "[$label] $sku stock = $($p.inventory.stock)" -ForegroundColor Cyan
    return $p.inventory.stock
}

# 1. Baseline
$before = Get-Stock "BEFORE ORDER"

# 2. Create order
$body = @{ items = @(@{ sku = $sku; quantity = 2; price = 24.99 }) } | ConvertTo-Json -Depth 5
$order = Invoke-RestMethod -Uri $ordersBase -Headers $headers -Method Post -Body $body
Write-Host "Order created: $($order.id) status=$($order.status)" -ForegroundColor Yellow

# 3. Stock after order
$afterOrder = Get-Stock "AFTER ORDER"

# 4. Cancel order  -- ADJUST THIS ENDPOINT/METHOD TO MATCH YOUR API
try {
    $cancelUrl = "$ordersBase/$($order.id)/cancel"
    $cancelled = Invoke-RestMethod -Uri $cancelUrl -Headers $headers -Method Patch
    Write-Host "Order cancelled: status=$($cancelled.status)" -ForegroundColor Yellow
} catch {
    Write-Host "Cancel via PATCH /cancel failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying PUT with status=CANCELLED instead..." -ForegroundColor Yellow
    $cancelBody = @{ status = "CANCELLED" } | ConvertTo-Json
    $cancelled = Invoke-RestMethod -Uri "$ordersBase/$($order.id)" -Headers $headers -Method Put -Body $cancelBody
    Write-Host "Order cancelled: status=$($cancelled.status)" -ForegroundColor Yellow
}

# 5. Stock after cancel
$afterCancel = Get-Stock "AFTER CANCEL"

# 6. Idempotency check - cancel again, stock should NOT change further
try {
    Invoke-RestMethod -Uri $cancelUrl -Headers $headers -Method Patch | Out-Null
} catch {
    Write-Host "Second cancel attempt rejected (expected if idempotent): $($_.Exception.Message)" -ForegroundColor Green
}
$afterDoubleCancel = Get-Stock "AFTER 2ND CANCEL ATTEMPT"

# ---- SUMMARY ----
Write-Host "`n--- SUMMARY ---" -ForegroundColor Magenta
Write-Host "Before order:        $before"
Write-Host "After order:         $afterOrder  (expected: before - 2)"
Write-Host "After cancel:        $afterCancel  (expected: back to $before)"
Write-Host "After 2nd cancel:    $afterDoubleCancel  (expected: still $before, not $($before + 2))"

if ($afterCancel -eq $before) {
    Write-Host "PASS: Cancellation released inventory correctly." -ForegroundColor Green
} else {
    Write-Host "FAIL: Inventory not restored on cancellation." -ForegroundColor Red
}
if ($afterDoubleCancel -eq $afterCancel) {
    Write-Host "PASS: Cancellation is idempotent (no double-release)." -ForegroundColor Green
} else {
    Write-Host "FAIL: Double-cancel released stock twice!" -ForegroundColor Red
}