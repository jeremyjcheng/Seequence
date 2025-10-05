#!/bin/bash

# Setup script for Seequence Python Summarizer
echo "Setting up Seequence Python Summarizer..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

echo "Creating virtual environment..."

# Create virtual environment
python3 -m venv venv

echo "Activating virtual environment and installing dependencies..."

# Activate virtual environment and install requirements
source venv/bin/activate
pip install -r requirements.txt

# Download spaCy English model
echo "Downloading spaCy English model..."
python -m spacy download en_core_web_sm

echo "Setup complete!"
echo ""
echo "To test the summarizer, run:"
echo "source venv/bin/activate && python summarizer.py --text 'Your text here'"
echo ""
echo "Or pipe text to it:"
echo "source venv/bin/activate && echo 'Your text here' | python summarizer.py"
echo ""
echo "The Chrome extension will automatically use the virtual environment Python."
