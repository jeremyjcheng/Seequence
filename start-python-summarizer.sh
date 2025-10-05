#!/bin/bash

# Start Python Summarizer Server for Seequence
echo "🚀 Starting Seequence Python Summarizer Server..."

cd summarizer

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Check if server is already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "Server is already running on port 8080"
    echo "To stop it, run: pkill -f 'python.*server.py'"
    exit 1
fi

# Start the server
echo "Starting server on http://localhost:8080"
echo "he Chrome extension will now use advanced Python NLP summarization!"
echo "Press Ctrl+C to stop the server"
echo ""

source venv/bin/activate
python server.py 8080
