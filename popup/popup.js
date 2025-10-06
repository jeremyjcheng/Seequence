// Popup script for Seequence Chrome extension
// Handles UI interactions and communication with content script

document.addEventListener("DOMContentLoaded", async () => {
  // Check if D3 loaded successfully
  if (typeof d3 === "undefined") {
    console.error("D3.js failed to load");
  } else {
    console.log("D3.js loaded successfully");
  }

  // Get references to UI elements
  const noSelectionDiv = document.getElementById("no-selection");
  const hasSelectionDiv = document.getElementById("has-selection");
  const processingDiv = document.getElementById("processing");
  const diagramViewDiv = document.getElementById("diagram-view");
  const selectedTextElement = document.getElementById("selected-text");
  const createDiagramButton = document.getElementById("create-diagram");
  const resetSelectionButton = document.getElementById("reset-selection");
  const switchTypeButton = document.getElementById("switch-type");
  const exportDiagramButton = document.getElementById("export-diagram");
  const closeDiagramButton = document.getElementById("close-diagram");
  const diagramTitleElement = document.getElementById("diagram-title");
  const summaryLengthContainer = document.getElementById("summary-length");
  const summaryLengthOverlay = document.getElementById(
    "summary-length-diagram"
  );
  let summaryLength = "short"; // default

  // Initialize diagram renderer
  let diagramRenderer = null;
  let currentDiagramData = null;

  // Check for selected text when popup opens
  await checkForSelectedText();

  // Set up button click handlers
  createDiagramButton.addEventListener("click", handleCreateDiagram);
  resetSelectionButton.addEventListener("click", handleResetSelection);
  switchTypeButton.addEventListener("click", handleSwitchType);
  exportDiagramButton.addEventListener("click", handleExportDiagram);
  closeDiagramButton.addEventListener("click", handleCloseDiagram);

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

  async function checkForSelectedText() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if content script is available
      try {
        // Send message to content script to get selected text
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getSelectedText",
        });

        if (response && response.selectedText && response.selectedText.trim()) {
          showSelectedText(response.selectedText);
        } else {
          showNoSelection();
        }
      } catch (contentScriptError) {
        console.log("Content script not available, showing no selection state");
        showNoSelection();
      }
    } catch (error) {
      console.error("Error checking for selected text:", error);
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
  }

  function showProcessing() {
    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.add("hidden");
    processingDiv.classList.remove("hidden");
    diagramViewDiv.classList.add("hidden");
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
      console.log(
        "Popup: Text to summarize:",
        diagramData.originalText || diagramData.title || "Generated Diagram"
      );
      const summaryResponse = await chrome.runtime.sendMessage({
        action: "generateSummary",
        text:
          diagramData.originalText || diagramData.title || "Generated Diagram",
        length: summaryLength,
      });

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

  async function handleCreateDiagram() {
    try {
      showProcessing();

      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Send message to content script to get the full selected text
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "getSelectedText",
        });
      } catch (contentScriptError) {
        showError(
          "Content script not available. Please refresh the page and try again."
        );
        return;
      }

      if (response && response.selectedText) {
        console.log("Selected text length:", response.selectedText.length);

        // Check AI availability first
        const aiStatus = await chrome.runtime.sendMessage({
          action: "checkAIAvailability",
        });

        console.log("AI Status response:", aiStatus);

        if (!aiStatus.success) {
          showError(`AI check failed: ${aiStatus.error}`);
          return;
        }

        if (!aiStatus.status.available) {
          showError(
            "AI processing not available. Please ensure Chrome flags are enabled and you have the required hardware."
          );
          return;
        }

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

      // Clear any browser selection
      chrome.tabs.executeScript(tab.id, {
        code: "window.getSelection().removeAllRanges();",
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
