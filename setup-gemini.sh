#!/bin/bash

# Setup script for Gemini API integration
echo "Setting up Gemini API for Seequence..."

# Check if virtual environment exists
if [ ! -d "summarizer/venv" ]; then
    echo "Virtual environment not found. Please run summarizer/setup.sh first."
    exit 1
fi

# Activate virtual environment
source summarizer/venv/bin/activate

# Install Gemini API
echo "Installing Google Generative AI library..."
pip install google-generativeai

# Check for API key
if [ -z "$GEMINI_API_KEY" ]; then
    echo ""
    echo "GEMINI_API_KEY environment variable not set!"
    echo ""
    echo "To get a Gemini API key:"
    echo "1. Go to https://makersuite.google.com/app/apikey"
    echo "2. Create a new API key"
    echo "3. Set it as an environment variable:"
    echo "   export GEMINI_API_KEY='your-api-key-here'"
    echo ""
    echo "Or add it to your shell profile (.bashrc, .zshrc, etc.):"
    echo "   echo 'export GEMINI_API_KEY=\"your-api-key-here\"' >> ~/.bashrc"
    echo ""
    echo "The extension will still work with the fallback summarizer."
else
    echo "GEMINI_API_KEY found: ${GEMINI_API_KEY:0:10}..."
fi

echo ""
echo "Setup complete!"
echo ""
echo "To test the Gemini summarizer:"
echo "export GEMINI_API_KEY='your-key'"
echo "cd summarizer && source venv/bin/activate"
echo "python gemini_summarizer.py --text 'Your text here' --json"
