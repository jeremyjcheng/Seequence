# Seequence Extension Troubleshooting Guide

## 🐛 Common Issues and Solutions

### **Issue: Extension Can't Process Selected Text**

#### **Symptoms:**

- Text selection works but no diagram is generated
- Error messages about AI not being available
- Extension popup shows "AI processing not available"

#### **Root Causes & Solutions:**

### **1. Chrome Built-in AI APIs Not Available**

**Cause:** Chrome version < 138 or AI flags not enabled

**Solution:**

```bash
# Check Chrome version
chrome://version/

# Enable required flags
chrome://flags/#optimization-guide-on-device-model
chrome://flags/#on-device-model-service
chrome://flags/#ai-service

# Set all to "Enabled" and restart Chrome
```

**Debug Steps:**

1. Open browser console (F12)
2. Run: `console.log('ai' in navigator)`
3. Should return `true` if APIs are available

### **2. Python Server Not Running**

**Cause:** Server-side AI fallback not available

**Solution:**

```bash
cd /Users/jeremycheng/Documents/Seequence
./start-python-summarizer.sh
```

**Verify Server:**

```bash
curl http://localhost:8080/health
# Should return JSON status
```

### **3. Extension Context Issues**

**Cause:** Extension running in wrong context or permissions

**Solution:**

1. Reload extension in `chrome://extensions/`
2. Check manifest permissions
3. Ensure extension is enabled

### **4. Content Script Not Loading**

**Cause:** Content script not injected into page

**Solution:**

1. Refresh the webpage
2. Check if content script is loaded in DevTools
3. Verify manifest content_scripts configuration

## 🔍 Debug Steps

### **Step 1: Check AI Availability**

```javascript
// Run in browser console
async function checkAI() {
  console.log("Chrome version:", navigator.userAgent);
  console.log("navigator.ai exists:", "ai" in navigator);
  if ("ai" in navigator) {
    console.log("Available APIs:", Object.keys(navigator.ai));
  }
}
checkAI();
```

### **Step 2: Test Extension Communication**

```javascript
// Run in extension popup console
chrome.runtime.sendMessage(
  {
    action: "checkAIAvailability",
  },
  (response) => {
    console.log("AI Status:", response);
  }
);
```

### **Step 3: Test Text Selection**

```javascript
// Run in page console
chrome.runtime.sendMessage(
  {
    action: "getSelectedText",
  },
  (response) => {
    console.log("Selected text:", response);
  }
);
```

### **Step 4: Test Processing**

```javascript
// Run in extension popup console
chrome.runtime.sendMessage(
  {
    action: "processText",
    text: "This is a test sentence for processing.",
    diagramType: "auto",
  },
  (response) => {
    console.log("Processing result:", response);
  }
);
```

## 🚀 Quick Fixes

### **Fix 1: Enable Chrome AI Flags**

1. Go to `chrome://flags/`
2. Search for "ai" and "on-device"
3. Enable all AI-related flags
4. Restart Chrome

### **Fix 2: Start Python Server**

```bash
cd /Users/jeremycheng/Documents/Seequence/summarizer
./setup.sh
./start-server.sh
```

### **Fix 3: Reload Extension**

1. Go to `chrome://extensions/`
2. Find Seequence extension
3. Click reload button
4. Refresh any open tabs

### **Fix 4: Check Console Errors**

1. Open DevTools (F12)
2. Check Console tab for errors
3. Look for AI-related error messages
4. Check Network tab for failed requests

## 📊 Expected Behavior

### **With Built-in AI APIs (Chrome 138+):**

- ✅ Fast processing (50-200ms)
- ✅ No network requests
- ✅ Works offline
- ✅ Privacy-first

### **With Python Server (Hybrid):**

- ✅ Enhanced accuracy
- ✅ Complex content handling
- ✅ Server at localhost:8080
- ✅ Network requests to local server

### **With Fallback AI:**

- ✅ Basic functionality
- ✅ Heuristic processing
- ✅ No external dependencies
- ✅ Lower accuracy

## 🆘 Still Not Working?

### **Check These:**

1. **Chrome Version:** Must be 138+ for built-in AI
2. **Extension Permissions:** Check manifest.json
3. **Content Script:** Verify it's loading on pages
4. **Server Status:** Ensure Python server is running
5. **Console Errors:** Look for specific error messages

### **Debug Commands:**

```bash
# Check if server is running
lsof -i :8080

# Test server health
curl -X GET http://localhost:8080/health

# Check extension logs
# Open chrome://extensions/ → Seequence → Inspect views: background page
```

### **Contact Support:**

If issues persist, provide:

1. Chrome version
2. Console error messages
3. Extension status
4. Server status
5. Steps to reproduce

## 🔧 Advanced Debugging

### **Enable Verbose Logging:**

```javascript
// Add to background script
localStorage.setItem("debug", "true");
```

### **Test Individual Components:**

```javascript
// Test built-in AI
navigator.ai.summarizer
  .summarize({
    text: "Test text",
    maxLength: 50,
  })
  .then(console.log);

// Test server
fetch("http://localhost:8080/health")
  .then((r) => r.json())
  .then(console.log);
```

### **Monitor Network Requests:**

1. Open DevTools → Network tab
2. Try to process text
3. Look for requests to localhost:8080
4. Check for CORS errors
