// Popup script for Seequence Chrome extension
// Handles UI interactions and communication with content script

// Import AI Client (will be loaded via script tag)
let AIClient = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== POPUP INITIALIZATION START ===");
  console.log("Popup: DOM loaded, initializing...");
  console.log("Popup: Chrome runtime available:", !!chrome.runtime);
  console.log("Popup: Chrome tabs available:", !!chrome.tabs);
  console.log("Popup: Window location:", window.location.href);

  // Check if D3 loaded successfully
  if (typeof d3 === "undefined") {
    console.error(
      "D3.js failed to load - this will cause diagram rendering issues"
    );
  } else {
    console.log("D3.js loaded successfully, version:", d3.version);
  }

  // Get references to UI elements
  console.log("Popup: Getting UI element references...");
  const noSelectionDiv = document.getElementById("no-selection");
  const hasSelectionDiv = document.getElementById("has-selection");
  const processingDiv = document.getElementById("processing");
  const diagramViewDiv = document.getElementById("diagram-view");
  const rewrittenTextDiv = document.getElementById("rewritten-text");
  const selectedTextElement = document.getElementById("selected-text");
  const createDiagramButton = document.getElementById("create-diagram");
  const rewriteTextButton = document.getElementById("rewrite-text");
  const createDiagramFromRewrittenButton = document.getElementById(
    "create-diagram-from-rewritten"
  );
  const backToSelectionButton = document.getElementById("back-to-selection");
  const copyRewrittenButton = document.getElementById("copy-rewritten");
  const resetSelectionButton = document.getElementById("reset-selection");
  const switchTypeButton = document.getElementById("switch-type");
  const exportDiagramButton = document.getElementById("export-diagram");
  const layoutSelect = document.getElementById("layout-select");
  const diagramTitleElement = document.getElementById("diagram-title");
  const summaryLengthContainer = document.getElementById("summary-length");
  const summaryLengthOverlay = document.getElementById(
    "summary-length-diagram"
  );
  const rewritingCategoryContainer =
    document.getElementById("rewriting-category");
  const rewritingLevelContainer = document.getElementById("rewriting-level");
  const rewritingInfoElement = document.getElementById("rewriting-info");
  const rewrittenTextContentElement = document.getElementById(
    "rewritten-text-content"
  );

  let summaryLength = "short"; // default
  let rewritingCategory = "textClarity"; // default
  let rewritingLevel = 3; // default
  let currentSelectedText = ""; // store selected text
  let currentRewrittenText = ""; // store rewritten text

  // Debug UI element availability
  console.log("Popup: UI elements found:");
  console.log("  - noSelectionDiv:", !!noSelectionDiv);
  console.log("  - hasSelectionDiv:", !!hasSelectionDiv);
  console.log("  - processingDiv:", !!processingDiv);
  console.log("  - diagramViewDiv:", !!diagramViewDiv);
  console.log("  - selectedTextElement:", !!selectedTextElement);
  console.log("  - createDiagramButton:", !!createDiagramButton);
  console.log("  - resetSelectionButton:", !!resetSelectionButton);
  console.log("  - switchTypeButton:", !!switchTypeButton);
  console.log("  - exportDiagramButton:", !!exportDiagramButton);
  console.log("  - layoutSelect:", !!layoutSelect);
  console.log("  - diagramTitleElement:", !!diagramTitleElement);
  console.log("  - summaryLengthContainer:", !!summaryLengthContainer);
  console.log("  - summaryLengthOverlay:", !!summaryLengthOverlay);

  // Initialize diagram renderer
  let diagramRenderer = null;
  let currentDiagramData = null;

  // Initialize AI Client
  try {
    // Import AI Client module
    const { default: AIClientClass } = await import("../src/ai/aiClient.js");
    AIClient = new AIClientClass();
    await AIClient.checkAvailability();
    console.log("Popup: AI Client initialized");
  } catch (error) {
    console.error("Popup: Failed to initialize AI Client:", error);
  }

  // Check for selected text when popup opens
  await checkForSelectedText();

  // Set up button click handlers
  createDiagramButton.addEventListener("click", handleCreateDiagram);
  rewriteTextButton.addEventListener("click", handleRewriteText);
  createDiagramFromRewrittenButton.addEventListener(
    "click",
    handleCreateDiagramFromRewritten
  );
  backToSelectionButton.addEventListener("click", handleBackToSelection);
  copyRewrittenButton.addEventListener("click", handleCopyRewritten);
  resetSelectionButton.addEventListener("click", handleResetSelection);
  switchTypeButton.addEventListener("click", handleSwitchType);
  exportDiagramButton.addEventListener("click", handleExportDiagram);
  // Close button removed from UI; users can click outside popup to dismiss
  if (layoutSelect) {
    layoutSelect.addEventListener("change", () => {
      if (diagramRenderer && currentDiagramData) {
        diagramRenderer.render(currentDiagramData, layoutSelect.value);
      }
    });
  }

  // Summary length selection
  if (summaryLengthContainer) {
    summaryLengthContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.matches(".length-button")) {
        for (const btn of summaryLengthContainer.querySelectorAll(
          ".length-button"
        )) {
          btn.classList.remove("active");
        }
        target.classList.add("active");
        summaryLength = target.getAttribute("data-length") || "short";
        // If diagram already shown, regenerate title summary
        if (currentDiagramData) {
          showDiagram(currentDiagramData);
        }
      }
    });
  }

  if (summaryLengthOverlay) {
    summaryLengthOverlay.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.matches(".length-button")) {
        for (const btn of summaryLengthOverlay.querySelectorAll(
          ".length-button"
        )) {
          btn.classList.remove("active");
        }
        target.classList.add("active");
        summaryLength = target.getAttribute("data-length") || "short";
        if (currentDiagramData) {
          showDiagram(currentDiagramData);
        }
      }
    });
  }

  // Rewriting category selection
  if (rewritingCategoryContainer) {
    rewritingCategoryContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.matches(".category-button")) {
        for (const btn of rewritingCategoryContainer.querySelectorAll(
          ".category-button"
        )) {
          btn.classList.remove("active");
        }
        target.classList.add("active");
        rewritingCategory =
          target.getAttribute("data-category") || "textClarity";
        updateRewritingInfo();
      }
    });
  }

  // Rewriting level selection
  if (rewritingLevelContainer) {
    rewritingLevelContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.matches(".level-button")) {
        for (const btn of rewritingLevelContainer.querySelectorAll(
          ".level-button"
        )) {
          btn.classList.remove("active");
        }
        target.classList.add("active");
        rewritingLevel = parseInt(target.getAttribute("data-level")) || 3;
        updateRewritingInfo();
      }
    });
  }

  async function checkForSelectedText() {
    console.log("=== CHECKING FOR SELECTED TEXT ===");
    try {
      // Get the active tab
      console.log("Popup: Querying for active tab...");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("Popup: Active tab found:", {
        id: tab.id,
        url: tab.url,
        title: tab.title,
      });

      // Check if content script is available
      try {
        console.log("Popup: Sending message to content script...");
        // Send message to content script to get selected text
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getSelectedText",
        });
        console.log("Popup: Content script response:", response);

        if (response && response.selectedText && response.selectedText.trim()) {
          console.log(
            "Popup: Text selected, length:",
            response.selectedText.length
          );
          console.log(
            "Popup: Selected text preview:",
            response.selectedText.substring(0, 100) + "..."
          );
          showSelectedText(response.selectedText);
        } else {
          console.log("Popup: No text selected or empty selection");
          showNoSelection();
        }
      } catch (contentScriptError) {
        console.log(
          "Popup: Content script not available:",
          contentScriptError.message
        );
        console.log(
          "Popup: This might be normal if no content script is injected yet"
        );
        showNoSelection();
      }
    } catch (error) {
      console.error("Popup: Error checking for selected text:", error);
      showNoSelection();
    }
  }

  function showNoSelection() {
    noSelectionDiv.classList.remove("hidden");
    hasSelectionDiv.classList.add("hidden");
    processingDiv.classList.add("hidden");
    diagramViewDiv.classList.add("hidden");
    // Reset overlay selector active state to current value
    const overlay = document.getElementById("summary-length-diagram");
    if (overlay) {
      for (const btn of overlay.querySelectorAll(".length-button")) {
        btn.classList.toggle(
          "active",
          (btn.getAttribute("data-length") || "") === summaryLength
        );
      }
    }
  }

  async function showSelectedText(text) {
    // Show the original text (truncated for display)
    if (!selectedTextElement) {
      console.error("Popup: selectedTextElement not found!");
      return;
    }

    // Store the full text for processing
    currentSelectedText = text;

    // Show original text (truncated for preview)
    const previewText =
      text.length > 200 ? text.substring(0, 200) + "..." : text;
    selectedTextElement.textContent = previewText;
    selectedTextElement.style.color = "#333";
    selectedTextElement.style.fontStyle = "italic";

    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.remove("hidden");
    processingDiv.classList.add("hidden");
    diagramViewDiv.classList.add("hidden");
    rewrittenTextDiv.classList.add("hidden");
  }

  // Update rewriting info display
  function updateRewritingInfo() {
    if (rewritingInfoElement) {
      const categoryNames = {
        textClarity: "Clarity",
        textFocus: "Focus",
        textPattern: "Pattern",
      };
      rewritingInfoElement.textContent = `${categoryNames[rewritingCategory]} Level ${rewritingLevel}`;
    }
  }

  function showProcessing() {
    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.add("hidden");
    processingDiv.classList.remove("hidden");
    diagramViewDiv.classList.add("hidden");
    rewrittenTextDiv.classList.add("hidden");
  }

  function showRewrittenText(rewrittenText) {
    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.add("hidden");
    processingDiv.classList.add("hidden");
    diagramViewDiv.classList.add("hidden");
    rewrittenTextDiv.classList.remove("hidden");

    // Update rewriting info
    updateRewritingInfo();

    // Display rewritten text
    if (rewrittenTextContentElement) {
      rewrittenTextContentElement.textContent = rewrittenText;
    }

    // Store rewritten text for diagram creation
    currentRewrittenText = rewrittenText;
  }

  async function showDiagram(diagramData) {
    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.add("hidden");
    processingDiv.classList.add("hidden");
    diagramViewDiv.classList.remove("hidden");

    // Check if D3 is available
    if (typeof d3 === "undefined") {
      showError(
        "D3.js library failed to load. Please refresh the extension and try again."
      );
      return;
    }

    // Initialize diagram renderer if needed
    if (!diagramRenderer) {
      try {
        diagramRenderer = new DiagramRenderer("diagram-container");
      } catch (error) {
        console.error("Failed to create diagram renderer:", error);
        showError("Failed to initialize diagram renderer. Please try again.");
        return;
      }
    }

    // Store current diagram data
    currentDiagramData = diagramData;

    // Generate summary for the diagram title
    try {
      console.log("Popup: Generating summary for diagram title");
      console.log("Popup: Diagram data:", diagramData);
      console.log("Popup: Selected summary length:", summaryLength);
      // Use the full original text for summarization, not the truncated title
      const textToSummarize =
        diagramData.originalText || diagramData.title || "Generated Diagram";
      console.log("Popup: Text to summarize length:", textToSummarize.length);
      console.log(
        "Popup: Text to summarize:",
        textToSummarize.substring(0, 100) + "..."
      );

      const summaryResponse = await chrome.runtime.sendMessage({
        action: "generateSummary",
        text: textToSummarize,
        length: summaryLength,
      });

      // Keep both segmented controls in sync after response
      const overlay = document.getElementById("summary-length-diagram");
      if (overlay) {
        for (const btn of overlay.querySelectorAll(".length-button")) {
          btn.classList.toggle(
            "active",
            (btn.getAttribute("data-length") || "") === summaryLength
          );
        }
      }

      if (summaryResponse.success) {
        console.log(
          "Popup: Using generated summary for diagram title:",
          summaryResponse.summary
        );
        diagramTitleElement.textContent = summaryResponse.summary;
      } else {
        console.log("Popup: Summary failed, using original title");
        diagramTitleElement.textContent =
          diagramData.title || "Generated Diagram";
      }
    } catch (error) {
      console.error("Popup: Error generating summary for diagram:", error);
      diagramTitleElement.textContent =
        diagramData.title || "Generated Diagram";
    }

    // Render the diagram
    try {
      diagramRenderer.render(diagramData, diagramData.layout);
    } catch (error) {
      console.error("Failed to render diagram:", error);
      showError("Failed to render diagram. Please try again.");
    }
  }

  function showError(message) {
    // For now, show error in an alert. Later we'll add a proper error state
    alert(`Error: ${message}`);
    showNoSelection();
  }

  function showDiagramResult(diagramData) {
    // Show the actual diagram instead of an alert
    showDiagram(diagramData);
  }

  // Handle text rewriting
  async function handleRewriteText() {
    console.log("=== REWRITE TEXT CLICKED ===");
    try {
      if (!currentSelectedText) {
        showError("No text selected for rewriting.");
        return;
      }

      if (!AIClient) {
        showError("AI Client not available. Please refresh and try again.");
        return;
      }

      console.log("Popup: Showing processing state...");
      showProcessing();

      console.log(
        "Popup: Rewriting text with category:",
        rewritingCategory,
        "level:",
        rewritingLevel
      );
      console.log("Popup: Text length:", currentSelectedText.length);

      // Use AI Client to rewrite text
      const result = await AIClient.rewriteText(
        currentSelectedText,
        rewritingCategory,
        rewritingLevel
      );

      console.log("Popup: Rewriting result:", result);

      if (result && result.rewrittenText) {
        showRewrittenText(result.rewrittenText);
      } else {
        showError("Text rewriting failed. Please try again.");
      }
    } catch (error) {
      console.error("Error rewriting text:", error);
      showError(`An error occurred while rewriting the text: ${error.message}`);
    }
  }

  // Handle creating diagram from rewritten text
  async function handleCreateDiagramFromRewritten() {
    console.log("=== CREATE DIAGRAM FROM REWRITTEN TEXT CLICKED ===");
    try {
      if (!currentRewrittenText) {
        showError("No rewritten text available for diagram creation.");
        return;
      }

      console.log("Popup: Showing processing state...");
      showProcessing();

      // Process rewritten text with AI
      const processResponse = await chrome.runtime.sendMessage({
        action: "processText",
        text: currentRewrittenText,
        diagramType: "auto",
      });

      console.log("Process response:", processResponse);

      if (processResponse.success) {
        showDiagramResult(processResponse.data);
      } else {
        showError(`AI processing failed: ${processResponse.error}`);
      }
    } catch (error) {
      console.error("Error creating diagram from rewritten text:", error);
      showError(
        `An error occurred while processing the rewritten text: ${error.message}`
      );
    }
  }

  // Handle back to selection
  function handleBackToSelection() {
    console.log("=== BACK TO SELECTION CLICKED ===");
    showSelectedText(currentSelectedText);
  }

  // Handle copy rewritten text
  async function handleCopyRewritten() {
    console.log("=== COPY REWRITTEN TEXT CLICKED ===");
    try {
      if (currentRewrittenText) {
        await navigator.clipboard.writeText(currentRewrittenText);
        console.log("Popup: Rewritten text copied to clipboard");
        // Could show a brief success message here
      } else {
        showError("No rewritten text to copy.");
      }
    } catch (error) {
      console.error("Error copying rewritten text:", error);
      showError("Failed to copy text to clipboard.");
    }
  }

  async function handleCreateDiagram() {
    console.log("=== CREATE DIAGRAM CLICKED ===");
    try {
      console.log("Popup: Showing processing state...");
      showProcessing();

      // Get the active tab
      console.log("Popup: Querying for active tab...");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("Popup: Active tab for diagram creation:", {
        id: tab.id,
        url: tab.url,
        title: tab.title,
      });

      // Send message to content script to get the full selected text
      let response;
      try {
        console.log("Popup: Requesting selected text from content script...");
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "getSelectedText",
        });
        console.log("Popup: Selected text response:", response);
      } catch (contentScriptError) {
        console.error(
          "Popup: Content script communication failed:",
          contentScriptError
        );
        showError(
          "Content script not available. Please refresh the page and try again."
        );
        return;
      }

      if (response && response.selectedText) {
        console.log(
          "Popup: Selected text length:",
          response.selectedText.length
        );
        console.log(
          "Popup: Selected text preview:",
          response.selectedText.substring(0, 200) + "..."
        );

        // Check AI availability first
        console.log("Popup: Checking AI availability...");
        const aiStatus = await chrome.runtime.sendMessage({
          action: "checkAIAvailability",
        });

        console.log("Popup: AI Status response:", aiStatus);

        if (!aiStatus.success) {
          console.error("Popup: AI check failed:", aiStatus.error);
          showError(`AI check failed: ${aiStatus.error}`);
          return;
        }

        // Skip hardware availability check - always proceed
        // if (!aiStatus.status.available) {
        //   showError(
        //     "AI processing not available. Please ensure Chrome flags are enabled and you have the required hardware."
        //   );
        //   return;
        // }

        // Process text with AI
        const processResponse = await chrome.runtime.sendMessage({
          action: "processText",
          text: response.selectedText,
          diagramType: "auto",
        });

        console.log("Process response:", processResponse);

        if (processResponse.success) {
          // Show the generated diagram data (for now, just display it)
          showDiagramResult(processResponse.data);
        } else {
          showError(`AI processing failed: ${processResponse.error}`);
        }
      } else {
        showError("No text selected or text selection failed.");
      }
    } catch (error) {
      console.error("Error creating diagram:", error);
      showError(
        `An error occurred while processing the text: ${error.message}`
      );
    }
  }

  async function handleResetSelection() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Send message to content script to clear selection
      await chrome.tabs.sendMessage(tab.id, {
        action: "clearSelection",
      });

      // Clear any browser selection (MV3)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            const sel = window.getSelection();
            if (sel && sel.removeAllRanges) sel.removeAllRanges();
          } catch (e) {
            console.error("Failed clearing selection in tab:", e);
          }
        },
      });

      // Show no selection state
      showNoSelection();
    } catch (error) {
      console.error("Error resetting selection:", error);
      // Still show no selection state even if there's an error
      showNoSelection();
    }
  }

  // Handle diagram type switching
  function handleSwitchType() {
    if (!currentDiagramData || !diagramRenderer) return;

    const currentType = diagramRenderer.currentType;
    let newType;

    // Cycle through available types
    switch (currentType) {
      case "flowchart":
        newType = "mindmap";
        break;
      case "mindmap":
        newType = "timeline";
        break;
      case "timeline":
        newType = "compare";
        break;
      case "compare":
        newType = "flowchart";
        break;
      default:
        newType = "flowchart";
    }

    diagramRenderer.switchType(newType);
    console.log(`Switched to ${newType} view`);
  }

  // Handle diagram export
  async function handleExportDiagram() {
    if (!diagramRenderer) return;

    try {
      // Export as PNG
      const blob = await diagramRenderer.exportPNG();
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `seequence-diagram-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      console.log("Diagram exported as PNG");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  }

  // Handle diagram close
  function handleCloseDiagram() {
    showNoSelection();
    if (diagramRenderer) {
      diagramRenderer.clear();
    }
    currentDiagramData = null;
  }
});
