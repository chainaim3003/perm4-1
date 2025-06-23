# PowerShell script for git operations
Write-Host "Current repository status:" -ForegroundColor Green
Write-Host ""

# Check if there are any existing tags
Write-Host "Checking existing tags..." -ForegroundColor Yellow
git tag
Write-Host ""

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
git status
Write-Host ""

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .
Write-Host ""

# Commit with the specified message
Write-Host "Creating commit with message 'initial commits'..." -ForegroundColor Yellow
git commit -m "initial commits"
Write-Host ""

# Create the first tag v0.1.0
Write-Host "Creating tag v0.1.0..." -ForegroundColor Yellow
git tag -a v0.1.0 -m "initial commits"
Write-Host ""

# Show the new tag
Write-Host "New tag created:" -ForegroundColor Green
git tag
Write-Host ""

# Show tag details
Write-Host "Tag details:" -ForegroundColor Green
git show v0.1.0 --stat
Write-Host ""

Write-Host "Git operations completed successfully!" -ForegroundColor Green
Read-Host "Press Enter to continue"
