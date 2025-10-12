#!/bin/bash

# Load Gemini API key from PEM file
if [ -f "gemini-api-key.pem" ]; then
    export GEMINI_API_KEY=$(cat gemini-api-key.pem | sed -n '2p')
    echo " Gemini API key loaded from PEM file"
    echo " Key: ${GEMINI_API_KEY:0:10}..."
else
    echo " gemini-api-key.pem not found!"
    echo "Run ./setup-api-key.sh to create it."
    exit 1
fi
