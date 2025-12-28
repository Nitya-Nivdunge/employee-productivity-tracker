# Frontend Setup Script
Write-Host " Setting up Frontend..." -ForegroundColor Cyan

# Create directories
New-Item -ItemType Directory -Force -Path "src\components"
New-Item -ItemType Directory -Force -Path "src\components\Charts"
New-Item -ItemType Directory -Force -Path "src\services"

Write-Host " Directories created" -ForegroundColor Green
Write-Host " Installing dependencies..." -ForegroundColor Yellow

# Install dependencies
npm install

Write-Host " Frontend setup complete!" -ForegroundColor Green
Write-Host " Start frontend with: npm start" -ForegroundColor Yellow