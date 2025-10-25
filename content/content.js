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
  // Wait a bit for the script to initialize
  setTimeout(() => {
    // Content script runs in isolated world, can't directly access main world
    // We need to communicate via postMessage instead
    console.log(
      "Content: Testing communication with main world AI processor..."
    );

    // Send a ping to the main world to test communication
    window.postMessage(
      {
        __seequence: true,
        action: "ping",
        source: "content-script",
        requestId: "ping-test",
      },
      "*"
    );

    console.log("Content: Ping sent to main world AI processor");
  }, 1000);
};
script.onerror = function (error) {
  console.error("Content: Failed to load AI processor script:", error);
  console.error(
    "Content: Script URL:",
    chrome.runtime.getURL("content/ai-processor.js")
  );
};
document.head.appendChild(script);

// Bridge to communicate with the main-world AI processor via postMessage
const pendingRequests = new Map();
window.addEventListener("message", (event) => {
  if (event.source !== window) return; // only accept messages from same page
  const data = event.data;
  if (!data || data.__seequence !== true) return;

  // Handle ping response
  if (data.type === "response" && data.requestId === "ping-test") {
    console.log(
      "Content: Ping response received from AI processor:",
      data.data
    );
    console.log("Content: AI Processor communication is working!");
    return;
  }

  // Handle other responses
  if (data.type !== "response") return;

  const { requestId, success } = data;
  const entry = pendingRequests.get(requestId);
  if (!entry) return;
  pendingRequests.delete(requestId);

  if (success) {
    entry.resolve(data.data);
  } else {
    entry.reject(new Error(data.error || "Main world AI error"));
  }
});

function sendToMainWorld(action, payload = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Main world AI timeout for action: ${action}`));
    }, timeoutMs);

    pendingRequests.set(requestId, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });

    window.postMessage(
      { __seequence: true, action, requestId, ...payload },
      "*"
    );
  });
}

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
  } else if (request.action === "rewriteText") {
    console.log(
      "Content: rewriteText requested, prompt length:",
      request.prompt?.length || 0
    );
    // Rewrite text using AI in content script context
    rewriteTextWithAI(request.prompt)
      .then((result) => {
        console.log("Content: rewriteText completed successfully");
        sendResponse({
          success: true,
          result: result.rewrittenText,
          source: result.source,
        });
      })
      .catch((error) => {
        console.error("Content: rewriteText failed:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  } else if (request.action === "checkAvailability") {
    console.log("Content: checkAvailability requested");
    // Check if AI processor is available in main world
    if (window.contentAIProcessor) {
      console.log("Content: AI Processor available in main world");
      console.log(
        "Content: Available APIs:",
        window.contentAIProcessor.availableAPIs
      );
      sendResponse({ success: true, available: true });
    } else {
      console.log("Content: AI Processor not available in main world");
      console.log(
        "Content: This is expected if Chrome AI APIs are not enabled"
      );

      sendResponse({
        success: false,
        available: false,
        error: "AI Processor not available - Chrome AI APIs not enabled",
      });
    }
  } else {
    console.log("Content: Unknown action requested:", request.action);
    sendResponse({ success: false, error: "Unknown action" });
  }
});

// Process text using AI
async function processTextWithAI(text, diagramType) {
  console.log("Content script: Processing text with AI");

  // Check if AI processor is available
  if (!window.contentAIProcessor) {
    console.error("Content script: AI Processor not available in main world");
    throw new Error("AI Processor not available");
  }

  // Ensure main-world AI is initialized
  console.log("Content script: Requesting AI availability in main world...");
  await sendToMainWorld("checkAvailability");

  // Generate diagram data via main world
  const diagramData = await sendToMainWorld("analyze", {
    text,
    diagramType,
  });
  console.log("Content script: Generated diagram data:", diagramData);
  return diagramData;
}

// Generate summary using AI
async function generateSummaryWithAI(text, length) {
  console.log("Content script: Generating summary with AI");

  // Check if AI processor is available
  if (!window.contentAIProcessor) {
    console.error("Content script: AI Processor not available in main world");
    throw new Error("AI Processor not available");
  }

  // Ensure main-world AI is initialized
  console.log("Content script: Requesting AI availability in main world...");
  await sendToMainWorld("checkAvailability");

  // Generate summary via main world
  const summaryResult = await sendToMainWorld("summarize", {
    text,
    length,
  });
  console.log("Content script: Generated summary:", summaryResult);
  return summaryResult;
}

// Rewrite text using AI
async function rewriteTextWithAI(prompt) {
  console.log("Content script: Rewriting text with AI");

  // Check if AI processor is available
  if (!window.contentAIProcessor) {
    console.error("Content script: AI Processor not available in main world");
    throw new Error("AI Processor not available");
  }

  // Ensure main-world AI is initialized
  console.log("Content script: Requesting AI availability in main world...");
  await sendToMainWorld("checkAvailability");

  // Rewrite text via main world
  const rewriteResult = await sendToMainWorld("rewrite", {
    prompt,
  });
  console.log("Content script: Generated rewrite:", rewriteResult);
  return rewriteResult;
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
