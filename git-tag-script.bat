@echo off
echo Current repository status:
echo.

REM Check if there are any existing tags
echo Checking existing tags...
git tag
echo.

REM Check git status
echo Checking git status...
git status
echo.

REM Add all changes
echo Adding all changes...
git add .
echo.

REM Commit with the specified message
echo Creating commit with message "initial commits"...
git commit -m "initial commits"
echo.

REM Create the first tag v0.1.0
echo Creating tag v0.1.0...
git tag -a v0.1.0 -m "initial commits"
echo.

REM Show the new tag
echo New tag created:
git tag
echo.

REM Show tag details
echo Tag details:
git show v0.1.0 --stat
echo.

echo Git operations completed successfully!
pause
