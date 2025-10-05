# Seequence AI Setup Guide

## Prerequisites

Before the AI functionality will work, you need to set up Chrome's Gemini Nano API:

### 1. Hardware Requirements

- **Operating System**: Windows 10/11, macOS 13+ (Ventura), Linux, or ChromeOS
- **Storage**: At least 22 GB free space on Chrome profile volume
- **GPU**: 4+ GB VRAM
- **Network**: Unmetered connection (for initial model download)

### 2. Chrome Setup

#### Enable Experimental Flags

1. Open Chrome and go to `chrome://flags/#writer-api-for-gemini-nano`
2. Set the flag to **"Enabled"**
3. Restart Chrome

#### Check Chrome Version

- The Writer API is available in Chrome versions 137-142 (origin trial)
- Update Chrome to the latest version if needed

### 3. Origin Trial Registration (Required for Production)

For the extension to work in production, you need to register for the origin trial:

1. **Visit**: [Writer API Origin Trial Page](https://developer.chrome.com/docs/ai/writer-api)
2. **Click "Register"**
3. **Fill out the form**:
   - Acknowledge Google's Generative AI Prohibited Uses Policy
   - Provide your extension ID in format: `chrome-extension://YOUR_EXTENSION_ID`
4. **Copy the token** you receive
5. **Add to manifest.json**:
   ```json
   "origin_trial": {
     "token": "YOUR_ORIGIN_TRIAL_TOKEN"
   }
   ```

### 4. Get Your Extension ID

To get your extension ID for the origin trial:

1. Go to `chrome://extensions/`
2. Find your Seequence extension
3. Copy the ID (looks like: `nogejofjhkajlkcjannjblfbikmbpogp`)

## Testing the AI Integration

### 1. Load the Extension

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your Seequence folder

### 2. Test AI Processing

1. Go to any webpage with text content
2. Select some text
3. Click the Seequence extension icon
4. Click "Create Diagram"

### 3. Expected Behavior

**If AI is working:**

- You'll see "Processing..." for a few seconds
- Then an alert showing the generated diagram data
- The AI will have analyzed the text structure and created nodes/edges

**If AI is not working:**

- You'll get an error message about AI not being available
- Check that Chrome flags are enabled
- Verify hardware requirements are met

## Troubleshooting

### AI Not Available Error

1. **Check Chrome flags**: Ensure `#writer-api-for-gemini-nano` is enabled
2. **Restart Chrome**: After enabling flags
3. **Check Chrome version**: Must be 137-142
4. **Verify hardware**: 4GB+ VRAM, 22GB+ storage
5. **Check console**: Look for error messages in extension background

### Extension Won't Load

1. **Check manifest.json**: Ensure all required permissions are present
2. **Check file paths**: All referenced files must exist
3. **Check console**: Look for loading errors

### Performance Issues

1. **First run**: Initial model download can take time
2. **Large text**: Very long text selections may be slow
3. **Hardware**: Ensure GPU meets requirements

## Development Notes

- The AI processing happens in the background service worker
- All processing is local - no data leaves your device
- The current implementation shows results in alerts (placeholder)
- Next step: Implement actual diagram rendering with D3.js

## Next Steps

1. **Test AI integration** with the current setup
2. **Implement diagram rendering** to replace alert placeholders
3. **Add diagram export** functionality
4. **Create overlay/full-page views** for better diagram display
