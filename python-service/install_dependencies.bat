@echo off
echo Installing dependencies for Python 3.13 compatibility...
echo.

REM Install packages one by one to avoid dependency conflicts
echo Installing FastAPI...
pip install fastapi

echo Installing Uvicorn...
pip install "uvicorn[standard]"

echo Installing Python Multipart...
pip install python-multipart

echo Installing Pillow...
pip install Pillow

echo Installing Python Dotenv...
pip install python-dotenv

echo.
echo Installing Pydantic (latest version with Python 3.13 support)...
pip install pydantic

echo.
echo All dependencies installed!
echo.
pause



