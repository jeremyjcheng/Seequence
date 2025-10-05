#!/bin/bash

# Start Seequence Python Summarizer Server
echo "Starting Seequence Python Summarizer Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if server is already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "Server is already running on port 8080"
    echo "To stop it, run: pkill -f 'python.*server.py'"
    exit 1
fi

# Start the server
echo "Starting server on http://localhost:8080"
python server.py 8080
