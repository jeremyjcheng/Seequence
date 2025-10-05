// Popup script for Seequence Chrome extension
// Handles UI interactions and communication with content script

document.addEventListener("DOMContentLoaded", async () => {
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

  async function checkForSelectedText() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Send message to content script to get selected text
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getSelectedText",
      });

      if (response && response.selectedText && response.selectedText.trim()) {
        showSelectedText(response.selectedText);
      } else {
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
  }

  function showSelectedText(text) {
    // Truncate text for preview (show first 200 characters)
    const previewText =
      text.length > 200 ? text.substring(0, 200) + "..." : text;

    selectedTextElement.textContent = previewText;

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

  function showDiagram(diagramData) {
    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.add("hidden");
    processingDiv.classList.add("hidden");
    diagramViewDiv.classList.remove("hidden");

    // Initialize diagram renderer if needed
    if (!diagramRenderer) {
      diagramRenderer = new DiagramRenderer("diagram-container");
    }

    // Store current diagram data
    currentDiagramData = diagramData;

    // Update title
    diagramTitleElement.textContent = diagramData.title || "Generated Diagram";

    // Render the diagram
    diagramRenderer.render(diagramData, diagramData.layout);
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
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getSelectedText",
      });

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
