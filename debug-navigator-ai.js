// Debug script to test Chrome's built-in AI APIs (like Mochi used)
// Run this in Chrome DevTools console to check AI availability

console.log("=== Chrome Built-in AI Debug (Mochi Style) ===");
console.log("Chrome version:", navigator.userAgent);

// Check for navigator.summarizer (like Mochi used)
console.log("navigator.summarizer exists:", "summarizer" in navigator);
if ("summarizer" in navigator) {
  console.log("navigator.summarizer object:", navigator.summarizer);

  try {
    const result = await navigator.summarizer.summarize({
      text: "This is a test of the Chrome built-in Summarizer API.",
      maxLength: 50,
    });
    console.log("Summarizer API test result:", result);
  } catch (error) {
    console.error("Summarizer API test error:", error);
  }
} else {
  console.log("navigator.summarizer does not exist");
}

// Check for navigator.translator
console.log("navigator.translator exists:", "translator" in navigator);
if ("translator" in navigator) {
  console.log("navigator.translator object:", navigator.translator);

  try {
    const result = await navigator.translator.translate({
      text: "Hello world",
      from: "en",
      to: "es",
    });
    console.log("Translator API test result:", result);
  } catch (error) {
    console.error("Translator API test error:", error);
  }
} else {
  console.log("navigator.translator does not exist");
}

// Check all navigator properties
console.log("All navigator properties:", Object.keys(navigator));
console.log(
  "Navigator properties containing 'ai' or 'summarizer':",
  Object.keys(navigator).filter(
    (key) =>
      key.toLowerCase().includes("ai") ||
      key.toLowerCase().includes("summarizer") ||
      key.toLowerCase().includes("translator")
  )
);

console.log("=== END DEBUG SCRIPT ===");
