$ErrorActionPreference = "Stop"

$ACCOUNT_ID = "381491960645"
$REGION = "us-east-1"
$REPO_PREFIX = "smartretailx"
$ECR_URL = "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

Write-Host "Authenticating Docker to AWS ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URL

$services = @(
    @{ folder = "user-service"; repo = "user-service" },
    @{ folder = "product-inventory-service"; repo = "product-service" },
    @{ folder = "order-service"; repo = "order-service" },
    @{ folder = "notification-service"; repo = "notification-service" }
)

foreach ($service in $services) {
    $folderName = $service.folder
    $repoName = "$REPO_PREFIX-" + $service.repo
    
    Write-Host "`n-------------------------------------------" -ForegroundColor Magenta
    Write-Host " Building and Pushing: $repoName" -ForegroundColor Magenta
    Write-Host "-------------------------------------------`n" -ForegroundColor Magenta

    # Build local image
    Write-Host "Building Docker image..." -ForegroundColor Cyan
    docker build -t $repoName .\services\$folderName

    # Tag images with latest
    Write-Host "Tagging image for ECR as latest..." -ForegroundColor Cyan
    docker tag ${repoName}:latest ${ECR_URL}/${repoName}:latest

    # Push to ECR
    Write-Host "Pushing to ECR..." -ForegroundColor Cyan
    docker push ${ECR_URL}/${repoName}:latest
}

Write-Host "`nAll services successfully pushed to ECR!" -ForegroundColor Green
