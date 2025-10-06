# Gemini API Key Setup

This guide shows you how to securely store your Gemini API key for the Seequence extension.

## 🔑 Getting Your API Key

1. **Go to Google AI Studio**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Create a new API key**
4. **Copy the key** (it will look like: `AIzaSyC...`)

## 🔒 Secure Storage Options

### Option 1: PEM File (Recommended)

**Step 1: Create the PEM file**

```bash
./setup-api-key.sh
```

**Step 2: Load the key when needed**

```bash
# Load key for current session
source load-api-key.sh

# Or add to your shell profile for permanent access
echo 'source /path/to/Seequence/load-api-key.sh' >> ~/.bashrc
```

### Option 2: Environment Variable

```bash
# Temporary (current session only)
export GEMINI_API_KEY='your-api-key-here'

# Permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.bashrc
```

## 🧪 Testing Your Setup

```bash
# Test the integration
python test-gemini.py

# Test the server
curl http://localhost:8080/health
```

## 🔐 Security Features

- **PEM file permissions**: Set to 600 (owner read/write only)
- **Git ignore**: PEM files are excluded from version control
- **Multiple fallbacks**: Works with environment variables or PEM files
- **No hardcoded keys**: API keys are never stored in code

## 🚀 Using with the Extension

1. **Start the Python server**:

   ```bash
   ./start-python-summarizer.sh
   ```

2. **Use the Chrome extension**:
   - Select text on any webpage
   - Click the Seequence icon
   - Click "Create Diagram"
   - Enjoy natural, AI-generated summaries!

## 🔧 Troubleshooting

**"GEMINI_API_KEY not found"**

- Make sure you've run `./setup-api-key.sh` or set the environment variable
- Check that the PEM file exists and has correct permissions

**"Failed to initialize Gemini API"**

- Verify your API key is correct
- Check your internet connection
- Ensure you have API quota remaining

**"Google Generative AI library not available"**

- Run `./setup-gemini.sh` to install dependencies
- Make sure you're in the virtual environment

## 📁 File Structure

```
Seequence/
├── .gitignore                 # Excludes *.pem files
├── gemini-api-key.pem         # Your API key (not in git)
├── setup-api-key.sh          # Creates PEM file
├── load-api-key.sh           # Loads key from PEM
├── test-gemini.py            # Tests the integration
└── summarizer/
    ├── gemini_summarizer.py  # Enhanced summarizer
    └── server.py             # HTTP server
```
