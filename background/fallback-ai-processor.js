// Fallback AI Processor for Seequence Extension
// Uses available Chrome AI APIs or heuristic fallback
// Designed to work on any Chrome version

class FallbackAIProcessor {
  constructor() {
    this.isAvailable = false;
    this.availableAPIs = [];
    this.performanceMetrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  // Check what AI APIs are available
  async checkAvailability() {
    console.log("Fallback AI Processor: Checking availability...");

    try {
      const availableAPIs = [];

      // Check for Prompt API
      if ("ai" in navigator && "prompt" in navigator.ai) {
        availableAPIs.push("prompt");
        console.log("Found Prompt API");
      }

      // Check for Summarizer API
      if ("ai" in navigator && "summarizer" in navigator.ai) {
        availableAPIs.push("summarizer");
        console.log("Found Summarizer API");
      }

      // Check for Translator API
      if ("ai" in navigator && "translator" in navigator.ai) {
        availableAPIs.push("translator");
        console.log("Found Translator API");
      }

      // Check for Writer API
      if ("ai" in navigator && "writer" in navigator.ai) {
        availableAPIs.push("writer");
        console.log("Found Writer API");
      }

      // Check for window.ai (Chrome Nano)
      if ("ai" in window && "languageModel" in window.ai) {
        availableAPIs.push("window.ai");
        console.log("Found window.ai languageModel");
      }

      this.availableAPIs = availableAPIs;
      this.isAvailable = availableAPIs.length > 0;

      console.log("Available APIs:", availableAPIs);
      console.log(
        "Fallback AI Processor:",
        this.isAvailable ? "Available" : "Not Available"
      );

      return this.isAvailable;
    } catch (error) {
      console.log(
        "Fallback AI Processor: Error checking availability -",
        error.message
      );
      this.isAvailable = false;
      return false;
    }
  }

  // Analyze text structure using available APIs
  async analyzeTextStructure(text) {
    if (!this.isAvailable) {
      return await this.analyzeHeuristic(text);
    }

    const startTime = performance.now();

    try {
      // Try Prompt API first
      if (this.availableAPIs.includes("prompt")) {
        return await this.analyzeWithPromptAPI(text);
      }

      // Try window.ai if available
      if (this.availableAPIs.includes("window.ai")) {
        return await this.analyzeWithWindowAI(text);
      }

      // Fallback to heuristic
      return await this.analyzeHeuristic(text);
    } catch (error) {
      console.error("AI analysis failed, using heuristic fallback:", error);
      return await this.analyzeHeuristic(text);
    } finally {
      const responseTime = performance.now() - startTime;
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.averageResponseTime =
        this.performanceMetrics.totalResponseTime /
        this.performanceMetrics.totalRequests;
    }
  }

  // Analyze using Prompt API
  async analyzeWithPromptAPI(text) {
    const prompt = `Analyze this text and extract its structure. Return a JSON object with:
    - "type": the content type (causal, sequential, comparative, hierarchical, narrative)
    - "mainTopic": the main subject (max 50 chars)
    - "keyPoints": array of main ideas (max 5, each max 100 chars)
    - "relationships": array of relationships between points
    - "structure": the overall organization pattern
    - "confidence": analysis confidence (0-1)

    Text: "${text.substring(0, 2000)}"

    Return only valid JSON.`;

    try {
      const result = await navigator.ai.prompt.prompt({
        prompt: prompt,
      });

      const analysis = JSON.parse(result);
      analysis.source = "prompt-api";
      return analysis;
    } catch (error) {
      console.error("Prompt API analysis failed:", error);
      throw error;
    }
  }

  // Analyze using window.ai
  async analyzeWithWindowAI(text) {
    if (!this.session) {
      this.session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });
    }

    const prompt = `Analyze this text and extract its structure. Return a JSON object with:
    - "type": the content type (causal, sequential, comparative, hierarchical, narrative)
    - "mainTopic": the main subject (max 50 chars)
    - "keyPoints": array of main ideas (max 5, each max 100 chars)
    - "relationships": array of relationships between points
    - "structure": the overall organization pattern
    - "confidence": analysis confidence (0-1)

    Text: "${text.substring(0, 2000)}"

    Return only valid JSON.`;

    try {
      const result = await this.session.prompt(prompt);
      const analysis = JSON.parse(result);
      analysis.source = "window.ai";
      return analysis;
    } catch (error) {
      console.error("window.ai analysis failed:", error);
      throw error;
    }
  }

  // Heuristic analysis fallback
  async analyzeHeuristic(text) {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Simple content type detection
    let type = "narrative";
    if (words.some((w) => ["first", "second", "then", "next"].includes(w))) {
      type = "sequential";
    } else if (
      words.some((w) => ["because", "therefore", "causes"].includes(w))
    ) {
      type = "causal";
    } else if (
      words.some((w) => ["versus", "compared", "different"].includes(w))
    ) {
      type = "comparative";
    }

    const keyPoints = sentences.slice(0, 5).map((s, index) => ({
      text: s.trim(),
      order: index + 1,
      type: "point",
    }));

    const relationships = [];
    for (let i = 0; i < keyPoints.length - 1; i++) {
      relationships.push({
        from: i,
        to: i + 1,
        type: "related",
        label: "→",
      });
    }

    return {
      type,
      confidence: 0.5,
      mainTopic: sentences[0]?.substring(0, 50) + "..." || "Main Topic",
      keyPoints,
      relationships,
      structure: type,
      source: "heuristic",
    };
  }

  // Generate summary using available APIs
  async generateSummary(text, length = "short") {
    if (!this.isAvailable) {
      return await this.summarizeHeuristic(text, length);
    }

    const startTime = performance.now();

    try {
      // Try Summarizer API first
      if (this.availableAPIs.includes("summarizer")) {
        return await this.summarizeWithAPI(text, length);
      }

      // Try Prompt API
      if (this.availableAPIs.includes("prompt")) {
        return await this.summarizeWithPromptAPI(text, length);
      }

      // Fallback to heuristic
      return await this.summarizeHeuristic(text, length);
    } catch (error) {
      console.error(
        "Summary generation failed, using heuristic fallback:",
        error
      );
      return await this.summarizeHeuristic(text, length);
    } finally {
      const responseTime = performance.now() - startTime;
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.averageResponseTime =
        this.performanceMetrics.totalResponseTime /
        this.performanceMetrics.totalRequests;
    }
  }

  // Summarize using Summarizer API
  async summarizeWithAPI(text, length) {
    const lengthMapping = {
      short: 100,
      medium: 200,
      long: 300,
    };

    const maxLength = lengthMapping[length] || 150;

    try {
      const result = await navigator.ai.summarizer.summarize({
        text: text,
        maxLength: maxLength,
      });

      return {
        summary: result,
        originalLength: text.length,
        summaryLength: result.length,
        compressionRatio: result.length / text.length,
        source: "summarizer-api",
      };
    } catch (error) {
      console.error("Summarizer API failed:", error);
      throw error;
    }
  }

  // Summarize using Prompt API
  async summarizeWithPromptAPI(text, length) {
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

    try {
      const summary = await navigator.ai.prompt.prompt({
        prompt: prompt,
      });

      return {
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: summary.length / text.length,
        source: "prompt-api",
      };
    } catch (error) {
      console.error("Prompt API summarization failed:", error);
      throw error;
    }
  }

  // Heuristic summarization fallback
  async summarizeHeuristic(text, length) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const lengthMapping = {
      short: 2,
      medium: 3,
      long: 4,
    };

    const summaryLength = lengthMapping[length] || 2;
    const summary = sentences.slice(0, summaryLength).join(". ") + ".";

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: summary.length / text.length,
      source: "heuristic",
    };
  }

  // Generate diagram data
  async generateDiagramData(text, diagramType = "auto") {
    try {
      const analysis = await this.analyzeTextStructure(text);
      return await this.generateDiagramFromAnalysis(analysis, diagramType);
    } catch (error) {
      console.error("Diagram generation failed:", error);
      throw error;
    }
  }

  // Generate diagram from analysis
  async generateDiagramFromAnalysis(analysis, diagramType) {
    const nodes = analysis.keyPoints.map((point, index) => ({
      id: `node_${index}`,
      label:
        point.text.substring(0, 30) + (point.text.length > 30 ? "..." : ""),
      type: "concept",
      content: point.text,
      order: index + 1,
    }));

    const edges = analysis.relationships.map((rel, index) => ({
      id: `edge_${index}`,
      source: `node_${rel.from}`,
      target: `node_${rel.to}`,
      label: rel.label,
      type: rel.type,
    }));

    return {
      title: analysis.mainTopic,
      layout: analysis.type === "sequential" ? "timeline" : "flowchart",
      nodes,
      edges,
      type: analysis.type,
      source: analysis.source,
    };
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      isAvailable: this.isAvailable,
      availableAPIs: this.availableAPIs,
    };
  }

  // Get processor status
  getStatus() {
    return {
      available: this.isAvailable,
      availableAPIs: this.availableAPIs,
      performance: this.performanceMetrics,
      source: "fallback-ai",
    };
  }
}

// Export for use in background script
if (typeof module !== "undefined" && module.exports) {
  module.exports = FallbackAIProcessor;
} else if (typeof self !== "undefined") {
  self.FallbackAIProcessor = FallbackAIProcessor;
}
