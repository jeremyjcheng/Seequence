// Debug script to check navigator.ai availability
// Run this in the extension's background script console

console.log("=== NAVIGATOR.AI DEBUG SCRIPT ===");
console.log("Chrome version:", navigator.userAgent);
console.log("navigator.ai exists:", "ai" in navigator);

if ("ai" in navigator) {
  console.log("navigator.ai object:", navigator.ai);
  console.log("Available AI APIs:", Object.keys(navigator.ai));

  // Test Prompt API
  if ("prompt" in navigator.ai) {
    console.log("navigator.ai.prompt exists:", typeof navigator.ai.prompt);
    try {
      const testResult = await navigator.ai.prompt.prompt({
        prompt: "Hello, this is a test.",
      });
      console.log("Prompt API test successful:", testResult);
    } catch (error) {
      console.log("Prompt API test failed:", error);
    }
  } else {
    console.log("navigator.ai.prompt does not exist");
  }

  // Test Summarizer API
  if ("summarizer" in navigator.ai) {
    console.log(
      "navigator.ai.summarizer exists:",
      typeof navigator.ai.summarizer
    );
    try {
      const testResult = await navigator.ai.summarizer.summarize({
        text: "This is a test.",
        maxLength: 10,
      });
      console.log("Summarizer API test successful:", testResult);
    } catch (error) {
      console.log("Summarizer API test failed:", error);
    }
  } else {
    console.log("navigator.ai.summarizer does not exist");
  }
} else {
  console.log("navigator.ai is not available");
  console.log("This means:");
  console.log("1. Chrome version is too old (< 128)");
  console.log("2. Chrome flags are not enabled");
  console.log("3. Not using Chrome Dev/Canary channel");
}

console.log("=== END DEBUG SCRIPT ===");
