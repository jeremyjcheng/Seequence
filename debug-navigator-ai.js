// Debug script to check window.ai availability
// Run this in the extension's background script console

console.log("=== NAVIGATOR.AI DEBUG SCRIPT ===");
console.log("Chrome version:", navigator.userAgent);
console.log("window.ai exists:", "ai" in window);

if ("ai" in window) {
  console.log("window.ai object:", window.ai);
  console.log("Available AI APIs:", Object.keys(window.ai));

  // Test Prompt API
  if ("prompt" in window.ai) {
    console.log("window.ai.prompt exists:", typeof window.ai.prompt);
    try {
      const testResult = await window.ai.prompt.prompt({
        prompt: "Hello, this is a test.",
      });
      console.log("Prompt API test successful:", testResult);
    } catch (error) {
      console.log("Prompt API test failed:", error);
    }
  } else {
    console.log("window.ai.prompt does not exist");
  }

  // Test Summarizer API
  if ("summarizer" in window.ai) {
    console.log("window.ai.summarizer exists:", typeof window.ai.summarizer);
    try {
      const testResult = await window.ai.summarizer.summarize({
        text: "This is a test.",
        maxLength: 10,
      });
      console.log("Summarizer API test successful:", testResult);
    } catch (error) {
      console.log("Summarizer API test failed:", error);
    }
  } else {
    console.log("window.ai.summarizer does not exist");
  }
} else {
  console.log("window.ai is not available");
  console.log("This means:");
  console.log("1. Chrome version is too old (< 128)");
  console.log("2. Chrome flags are not enabled");
  console.log("3. Not using Chrome Dev/Canary channel");
}

console.log("=== END DEBUG SCRIPT ===");
