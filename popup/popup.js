// Popup script for Seequence Chrome extension
// Handles UI interactions and communication with content script

document.addEventListener("DOMContentLoaded", async () => {
  // Get references to UI elements
  const noSelectionDiv = document.getElementById("no-selection");
  const hasSelectionDiv = document.getElementById("has-selection");
  const processingDiv = document.getElementById("processing");
  const selectedTextElement = document.getElementById("selected-text");
  const createDiagramButton = document.getElementById("create-diagram");
  const resetSelectionButton = document.getElementById("reset-selection");

  // Check for selected text when popup opens
  await checkForSelectedText();

  // Set up button click handlers
  createDiagramButton.addEventListener("click", handleCreateDiagram);
  resetSelectionButton.addEventListener("click", handleResetSelection);

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
  }

  function showSelectedText(text) {
    // Truncate text for preview (show first 200 characters)
    const previewText =
      text.length > 200 ? text.substring(0, 200) + "..." : text;

    selectedTextElement.textContent = previewText;

    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.remove("hidden");
    processingDiv.classList.add("hidden");
  }

  function showProcessing() {
    noSelectionDiv.classList.add("hidden");
    hasSelectionDiv.classList.add("hidden");
    processingDiv.classList.remove("hidden");
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
        // For now, just show an alert. Later this will process with AI and create diagrams
        setTimeout(() => {
          alert(
            `Selected text (${
              response.selectedText.length
            } characters):\n\n${response.selectedText.substring(0, 100)}...`
          );
          showSelectedText(response.selectedText);
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating diagram:", error);
      showNoSelection();
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
});
