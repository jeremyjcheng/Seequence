#!/bin/bash

# Stop Python Summarizer Server for Seequence
echo "Stopping Seequence Python Summarizer Server..."

# Kill the server process
pkill -f 'python.*server.py'

if [ $? -eq 0 ]; then
    echo "Server stopped successfully"
else
    echo "No server process found (it may not have been running)"
fi

echo "The Chrome extension will now fall back to JavaScript summarization"
