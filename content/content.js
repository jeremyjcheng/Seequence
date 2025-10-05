// Content script for Seequence Chrome extension
// Handles text selection detection and communication with popup

let selectedText = "";

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    sendResponse({ selectedText: selectedText });
  } else if (request.action === "clearSelection") {
    selectedText = "";
    // Also clear the browser selection
    window.getSelection().removeAllRanges();
    sendResponse({ success: true });
  }
});

// Handle text selection
document.addEventListener("mouseup", handleTextSelection);
document.addEventListener("keyup", handleTextSelection);

function handleTextSelection() {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text) {
    selectedText = text;
    console.log(
      "Text selected:",
      text.substring(0, 100) + (text.length > 100 ? "..." : "")
    );
  } else {
    selectedText = "";
  }
}

// Also handle selection changes for better detection
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text) {
    selectedText = text;
  } else {
    selectedText = "";
  }
});
