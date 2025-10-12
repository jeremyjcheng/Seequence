// Chrome Nano AI Processor for Seequence Extension
// Uses only Chrome's built-in AI APIs - no external dependencies
// Designed for "download and use right away" experience

class ChromeNanoProcessor {
  constructor() {
    this.isAvailable = false;
    this.session = null;
    this.performanceMetrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  // Check if Chrome Nano AI is available
  async checkAvailability() {
    console.log("Chrome Nano Processor: Checking availability...");

    try {
      // Check if window.ai exists (Chrome Nano API)
      if (!("ai" in window)) {
        console.log("Chrome Nano Processor: window.ai not available");
        return false;
      }

      // Check if languageModel is available
      if (!("languageModel" in window.ai)) {
        console.log("Chrome Nano Processor: languageModel not available");
        return false;
      }

      // Test creating a session
      this.session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });

      console.log("Chrome Nano Processor: Available and initialized");
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.log("Chrome Nano Processor: Not available -", error.message);
      this.isAvailable = false;
      return false;
    }
  }

  // Analyze text structure using Chrome Nano
  async analyzeTextStructure(text) {
    if (!this.isAvailable) {
      throw new Error("Chrome Nano AI not available");
    }

    const startTime = performance.now();

    try {
      const prompt = `Analyze this text and extract its structure. Return a JSON object with:
      - "type": the content type (causal, sequential, comparative, hierarchical, narrative)
      - "mainTopic": the main subject (max 50 chars)
      - "keyPoints": array of main ideas (max 5, each max 100 chars)
      - "relationships": array of relationships between points
      - "structure": the overall organization pattern
      - "confidence": analysis confidence (0-1)

      Text: "${text.substring(0, 2000)}"

      Return only valid JSON.`;

      const result = await this.session.prompt(prompt);
      const analysis = JSON.parse(result);

      // Update performance metrics
      const responseTime = performance.now() - startTime;
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.averageResponseTime =
        this.performanceMetrics.totalResponseTime /
        this.performanceMetrics.totalRequests;

      analysis.source = "chrome-nano";
      return analysis;
    } catch (error) {
      console.error("Chrome Nano analysis failed:", error);
      throw error;
    }
  }

  // Generate summary using Chrome Nano
  async generateSummary(text, length = "short") {
    if (!this.isAvailable) {
      throw new Error("Chrome Nano AI not available");
    }

    const startTime = performance.now();

    try {
      const lengthMapping = {
        short: "in 2-3 sentences",
        medium: "in 4-5 sentences",
        long: "in 6-8 sentences",
      };

      const prompt = `Summarize this text ${
        lengthMapping[length] || lengthMapping.short
      }:

      "${text}"

      Return only the summary text.`;

      const summary = await this.session.prompt(prompt);

      // Update performance metrics
      const responseTime = performance.now() - startTime;
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.averageResponseTime =
        this.performanceMetrics.totalResponseTime /
        this.performanceMetrics.totalRequests;

      return {
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: summary.length / text.length,
        source: "chrome-nano",
      };
    } catch (error) {
      console.error("Chrome Nano summarization failed:", error);
      throw error;
    }
  }

  // Generate diagram data using Chrome Nano
  async generateDiagramData(text, diagramType = "auto") {
    if (!this.isAvailable) {
      throw new Error("Chrome Nano AI not available");
    }

    const startTime = performance.now();

    try {
      const prompt = `Create a diagram data structure for this text. Return a JSON object with:
      - "nodes": array of nodes with id, label, type, and content
      - "edges": array of connections with source, target, and label
      - "layout": suggested layout type (flowchart, timeline, hierarchy, network)
      - "title": diagram title

      Text: "${text.substring(0, 2000)}"
      Diagram Type: ${diagramType}

      Return only valid JSON.`;

      const result = await this.session.prompt(prompt);
      const diagramData = JSON.parse(result);

      // Update performance metrics
      const responseTime = performance.now() - startTime;
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.averageResponseTime =
        this.performanceMetrics.totalResponseTime /
        this.performanceMetrics.totalRequests;

      diagramData.source = "chrome-nano";
      return diagramData;
    } catch (error) {
      console.error("Chrome Nano diagram generation failed:", error);
      throw error;
    }
  }

  // Detect language using Chrome Nano
  async detectLanguage(text) {
    if (!this.isAvailable) {
      throw new Error("Chrome Nano AI not available");
    }

    try {
      const prompt = `Detect the language of this text and return a JSON object with:
      - "language": the detected language code (e.g., "en", "es", "fr")
      - "confidence": confidence score (0-1)

      Text: "${text.substring(0, 500)}"

      Return only valid JSON.`;

      const result = await this.session.prompt(prompt);
      const detection = JSON.parse(result);

      detection.source = "chrome-nano";
      return detection;
    } catch (error) {
      console.error("Chrome Nano language detection failed:", error);
      throw error;
    }
  }

  // Translate text using Chrome Nano
  async translateText(text, targetLanguage) {
    if (!this.isAvailable) {
      throw new Error("Chrome Nano AI not available");
    }

    try {
      const prompt = `Translate this text to ${targetLanguage}. Return only the translated text:

      "${text}"`;

      const translatedText = await this.session.prompt(prompt);

      return {
        translatedText,
        sourceLanguage: "auto-detected",
        targetLanguage,
        source: "chrome-nano",
      };
    } catch (error) {
      console.error("Chrome Nano translation failed:", error);
      throw error;
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      isAvailable: this.isAvailable,
      sessionActive: this.session !== null,
    };
  }

  // Get processor status
  getStatus() {
    return {
      available: this.isAvailable,
      sessionActive: this.session !== null,
      performance: this.performanceMetrics,
      source: "chrome-nano",
    };
  }
}

// Export for use in background script
if (typeof module !== "undefined" && module.exports) {
  module.exports = ChromeNanoProcessor;
} else if (typeof self !== "undefined") {
  self.ChromeNanoProcessor = ChromeNanoProcessor;
}
