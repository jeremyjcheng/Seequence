# Seequence

Transform text into interactive visual diagrams using local AI.

## Getting Started

### Development Setup

1. **Load the extension in Chrome:**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the Seequence project folder

2. **Test the extension:**
   - Go to any webpage with text content
   - Highlight/select some text
   - Click the Seequence extension icon in the toolbar
   - The popup should show your selected text

### Project Structure

```
Seequence/
├── manifest.json          # Extension configuration
├── popup/                 # Popup UI
│   ├── popup.html        # Popup structure
│   ├── popup.css         # Popup styling
│   └── popup.js          # Popup logic
├── content/              # Content scripts
│   └── content.js        # Text selection detection
├── background/           # Background service worker
│   └── background.js     # Extension lifecycle
└── assets/               # Static assets
    └── icons/            # Extension icons
```

### Current Features

- ✅ Text selection detection
- ✅ Popup UI with selected text preview
- ✅ Basic extension structure
- 🔄 AI processing (coming next)
- 🔄 Diagram generation (coming next)

### Next Steps

1. Research Chrome's Gemini Nano APIs
2. Implement AI text processing
3. Add diagram rendering
4. Create interactive features

## Privacy

This extension processes all data locally on your device using Chrome's built-in AI capabilities. No data is sent to external servers.
