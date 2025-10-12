// Content script for Seequence Chrome extension
// Handles text selection detection and communication with popup

console.log("=== CONTENT SCRIPT INITIALIZATION ===");
console.log("Content: Script loaded on:", window.location.href);
console.log("Content: Chrome runtime available:", !!chrome.runtime);
console.log("Content: Document ready state:", document.readyState);

let selectedText = "";

// Import AI processor
console.log("Content: Injecting AI processor script...");
const script = document.createElement("script");
script.src = chrome.runtime.getURL("content/ai-processor.js");
script.onload = function () {
  console.log("Content: AI Processor script loaded successfully");
  console.log(
    "Content: window.contentAIProcessor available:",
    !!window.contentAIProcessor
  );
};
script.onerror = function (error) {
  console.error("Content: Failed to load AI processor script:", error);
};
document.head.appendChild(script);

// Listen for messages from popup
console.log("Content: Setting up message listener...");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content: Message received:", request.action, "from:", sender);

  if (request.action === "getSelectedText") {
    console.log(
      "Content: getSelectedText requested, current selection length:",
      selectedText.length
    );
    sendResponse({ selectedText: selectedText });
  } else if (request.action === "clearSelection") {
    console.log("Content: clearSelection requested");
    selectedText = "";
    // Also clear the browser selection
    window.getSelection().removeAllRanges();
    sendResponse({ success: true });
  } else if (request.action === "processText") {
    console.log(
      "Content: processText requested, text length:",
      request.text?.length || 0
    );
    // Process text using AI in content script context
    processTextWithAI(request.text, request.diagramType)
      .then((result) => {
        console.log("Content: processText completed successfully");
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        console.error("Content: processText failed:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  } else if (request.action === "generateSummary") {
    console.log(
      "Content: generateSummary requested, text length:",
      request.text?.length || 0,
      "length:",
      request.length
    );
    // Generate summary using AI in content script context
    generateSummaryWithAI(request.text, request.length)
      .then((result) => {
        console.log("Content: generateSummary completed successfully");
        sendResponse({
          success: true,
          summary: result.summary,
          source: result.source,
        });
      })
      .catch((error) => {
        console.error("Content: generateSummary failed:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  } else {
    console.log("Content: Unknown action requested:", request.action);
    sendResponse({ success: false, error: "Unknown action" });
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

// Generate summary using AI
async function generateSummaryWithAI(text, length) {
  console.log("Content script: Generating summary with AI");

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

  // Generate summary
  const summaryResult = await window.contentAIProcessor.generateSummary(
    text,
    length
  );
  console.log("Content script: Generated summary:", summaryResult);

  return summaryResult;
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
