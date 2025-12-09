#!/bin/bash

echo "Starting Image Generation Service..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
echo "Checking dependencies..."
if ! pip show fastapi > /dev/null 2>&1; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo ""
fi

# Start the service
echo "Starting service on http://localhost:8000"
echo "API docs available at: http://localhost:8000/docs"
echo ""
python main.py



