// Debug script to check AI availability and diagnose issues
// Run this in the browser console to debug AI API availability

async function debugAIAvailability() {
  console.log("🔍 Debugging AI Availability...");
  console.log("Chrome Version:", navigator.userAgent);
  console.log("Navigator object:", navigator);

  // Check if navigator.ai exists
  if (!("ai" in navigator)) {
    console.error("❌ navigator.ai is not available");
    console.log("This means Chrome built-in AI APIs are not available.");
    console.log("Possible causes:");
    console.log("1. Chrome version < 138");
    console.log("2. Required flags not enabled");
    console.log("3. Running in incognito mode");
    console.log("4. Extension context issues");
    return false;
  }

  console.log("✅ navigator.ai is available");
  console.log("Available AI APIs:", Object.keys(navigator.ai));

  // Test each API
  const apis = [
    "summarizer",
    "prompt",
    "translator",
    "languageDetector",
    "writer",
    "rewriter",
    "proofreader",
  ];

  for (const api of apis) {
    try {
      if (api in navigator.ai) {
        console.log(`✅ ${api} API is available`);

        // Test the API with a simple call
        if (api === "summarizer") {
          try {
            const result = await navigator.ai.summarizer.summarize({
              text: "This is a test.",
              maxLength: 10,
            });
            console.log(`✅ ${api} API test successful:`, result);
          } catch (error) {
            console.error(`❌ ${api} API test failed:`, error);
          }
        } else if (api === "prompt") {
          try {
            const result = await navigator.ai.prompt.prompt({
              prompt: "Hello, this is a test.",
            });
            console.log(`✅ ${api} API test successful:`, result);
          } catch (error) {
            console.error(`❌ ${api} API test failed:`, error);
          }
        }
      } else {
        console.log(`❌ ${api} API is not available`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${api} API:`, error);
    }
  }

  return true;
}

// Run the debug function
debugAIAvailability();
