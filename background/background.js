// Background service worker for Seequence Chrome extension
// Handles extension lifecycle and coordinates between components

// Import AI processor (will be available in the background context)
let aiProcessor = null;

// Extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Seequence extension installed/updated:", details.reason);

  // Set default settings
  chrome.storage.sync.set({
    defaultDiagramType: "auto",
    readingLevel: "standard",
    showPrivacyNotice: true,
  });

  // Initialize AI processor
  initializeAI();
});

// Initialize AI processor
async function initializeAI() {
  try {
    // Import the AI processor script
    await import(chrome.runtime.getURL("ai/ai-processor.js"));

    if (window.AIProcessor) {
      aiProcessor = new window.AIProcessor();
      const isAvailable = await aiProcessor.checkAvailability();
      console.log("AI Processor initialized:", isAvailable);
    }
  } catch (error) {
    console.error("Error initializing AI processor:", error);
  }
}

// Handle extension icon click (though we're using popup, this is here for future use)
chrome.action.onClicked.addListener((tab) => {
  // This won't fire when popup is defined in manifest
  // But keeping it here for potential future overlay mode
  console.log("Extension icon clicked on tab:", tab.id);
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  switch (request.action) {
    case "processText":
      handleTextProcessing(request, sendResponse);
      return true; // Keep message channel open for async response
    case "checkAIAvailability":
      handleAICheck(sendResponse);
      return true;
    case "saveDiagram":
      handleSaveDiagram(request, sendResponse);
      break;
    default:
      console.log("Unknown action:", request.action);
      sendResponse({ success: false, error: "Unknown action" });
  }
});

// Handle AI text processing
async function handleTextProcessing(request, sendResponse) {
  try {
    if (!aiProcessor) {
      await initializeAI();
    }

    if (!aiProcessor || !aiProcessor.isAvailable) {
      sendResponse({
        success: false,
        error:
          "AI API not available. Please ensure Chrome flags are enabled and you have the required hardware.",
      });
      return;
    }

    const { text, diagramType } = request;
    const diagramData = await aiProcessor.generateDiagramData(
      text,
      diagramType
    );

    sendResponse({
      success: true,
      data: diagramData,
    });
  } catch (error) {
    console.error("Error processing text:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Handle AI availability check
async function handleAICheck(sendResponse) {
  try {
    if (!aiProcessor) {
      await initializeAI();
    }

    const status = aiProcessor
      ? aiProcessor.getStatus()
      : { available: false, sessionActive: false };
    sendResponse({
      success: true,
      status: status,
    });
  } catch (error) {
    console.error("Error checking AI status:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Handle diagram saving
async function handleSaveDiagram(request, sendResponse) {
  try {
    const { diagramData, title } = request;
    const timestamp = Date.now();

    // Save to local storage
    const savedDiagrams = (await chrome.storage.local.get(["diagrams"])) || {
      diagrams: [],
    };
    const diagrams = savedDiagrams.diagrams || [];

    diagrams.push({
      id: timestamp,
      title: title || "Untitled Diagram",
      data: diagramData,
      created: timestamp,
    });

    await chrome.storage.local.set({ diagrams: diagrams });

    sendResponse({
      success: true,
      id: timestamp,
    });
  } catch (error) {
    console.error("Error saving diagram:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}
