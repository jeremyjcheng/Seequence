// Content script for Seequence Chrome extension
// Handles text selection detection and communication with popup

let selectedText = "";

// Import AI processor
const script = document.createElement("script");
script.src = chrome.runtime.getURL("content/ai-processor.js");
script.onload = function () {
  console.log("Content AI Processor loaded");
};
document.head.appendChild(script);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    sendResponse({ selectedText: selectedText });
  } else if (request.action === "clearSelection") {
    selectedText = "";
    // Also clear the browser selection
    window.getSelection().removeAllRanges();
    sendResponse({ success: true });
  } else if (request.action === "processText") {
    // Process text using AI in content script context
    processTextWithAI(request.text, request.diagramType)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Process text using AI
async function processTextWithAI(text, diagramType) {
  console.log("Content script: Processing text with AI");

  // Wait for AI processor to be available
  let attempts = 0;
  while (!window.contentAIProcessor && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.contentAIProcessor) {
    throw new Error("AI processor not available");
  }

  // Check if AI is available
  if (!window.contentAIProcessor.isAvailable) {
    console.log("Content script: AI not available, checking...");
    await window.contentAIProcessor.checkAvailability();
  }

  // Generate diagram data
  const diagramData = await window.contentAIProcessor.generateDiagramData(
    text,
    diagramType
  );
  console.log("Content script: Generated diagram data:", diagramData);

  return diagramData;
}

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
