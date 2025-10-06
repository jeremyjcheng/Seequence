#!/bin/bash

# Setup script for storing Gemini API key in PEM file
echo "Setting up Gemini API key storage..."

# Check if PEM file already exists
if [ -f "gemini-api-key.pem" ]; then
    echo "gemini-api-key.pem already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get API key from user
echo "Please enter your Gemini API key:"
read -s api_key

if [ -z "$api_key" ]; then
    echo "No API key provided. Setup cancelled."
    exit 1
fi

# Create PEM file with API key
echo "Creating PEM file..."
cat > gemini-api-key.pem << EOF
-----BEGIN GEMINI API KEY-----
$api_key
-----END GEMINI API KEY-----
EOF

# Set proper permissions (readable only by owner)
chmod 600 gemini-api-key.pem

echo "API key stored securely in gemini-api-key.pem"
echo "File permissions set to 600 (owner read/write only)"
echo ""
echo "To use the API key, run:"
echo "  export GEMINI_API_KEY=\$(cat gemini-api-key.pem | sed -n '2p')"
echo ""
echo "Or add this to your shell profile (.bashrc, .zshrc, etc.):"
echo "  echo 'export GEMINI_API_KEY=\$(cat \"$PWD/gemini-api-key.pem\" | sed -n \"2p\")' >> ~/.bashrc"
