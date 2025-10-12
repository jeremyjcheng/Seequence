// AI Processor for Content Script Context
// This runs in the main thread where AI APIs are available

console.log("=== AI PROCESSOR INITIALIZATION ===");
console.log("AI Processor: Script loaded on:", window.location.href);
console.log("AI Processor: window.ai available:", "ai" in window);
console.log("AI Processor: navigator.ai available:", "ai" in navigator);

class ContentAIProcessor {
  constructor() {
    console.log("AI Processor: Constructor called");
    this.isAvailable = false;
    this.availableAPIs = [];
    this.performanceMetrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
    console.log("AI Processor: Instance created");
  }

  // Check what AI APIs are available in content script context
  async checkAvailability() {
    console.log("Content AI Processor: Checking availability...");

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

      // Always mark as available - skip hardware checks
      this.isAvailable = true;

      console.log("Available APIs:", availableAPIs);
      console.log("Content AI Processor: Available (hardware checks bypassed)");

      return this.isAvailable;
    } catch (error) {
      console.log(
        "Content AI Processor: Error checking availability -",
        error.message
      );
      // Even on error, mark as available to bypass hardware checks
      this.isAvailable = true;
      return true;
    }
  }

  // Analyze text structure using available APIs
  async analyzeTextStructure(text) {
    const startTime = performance.now();

    try {
      // Always try AI APIs first, regardless of hardware checks
      // Try Prompt API first
      if (this.availableAPIs.includes("prompt")) {
        try {
          return await this.analyzeWithPromptAPI(text);
        } catch (error) {
          console.log("Prompt API failed, trying next option:", error.message);
        }
      }

      // Try window.ai if available
      if (this.availableAPIs.includes("window.ai")) {
        try {
          return await this.analyzeWithWindowAI(text);
        } catch (error) {
          console.log("window.ai failed, trying next option:", error.message);
        }
      }

      // Try other APIs if available
      if (this.availableAPIs.includes("summarizer")) {
        try {
          return await this.analyzeWithSummarizerAPI(text);
        } catch (error) {
          console.log(
            "Summarizer API failed, trying next option:",
            error.message
          );
        }
      }

      // Fallback to heuristic
      console.log("All AI APIs failed, using heuristic fallback");
      return await this.analyzeHeuristic(text);
    } catch (error) {
      console.error(
        "All analysis methods failed, using heuristic fallback:",
        error
      );
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

  // Analyze using Summarizer API (simplified approach)
  async analyzeWithSummarizerAPI(text) {
    try {
      // Use summarizer to get key points, then build analysis
      const summary = await navigator.ai.summarizer.summarize({
        text: text,
        maxLength: 200,
      });

      // Create a simple analysis from the summary
      const sentences = summary
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      const keyPoints = sentences.map((s, index) => ({
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
        type: "narrative",
        confidence: 0.7,
        mainTopic: sentences[0]?.substring(0, 50) + "..." || "Main Topic",
        keyPoints,
        relationships,
        structure: "narrative",
        source: "summarizer-api",
      };
    } catch (error) {
      console.error("Summarizer API analysis failed:", error);
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

  // Generate summary using available APIs
  async generateSummary(text, length = "short") {
    const startTime = performance.now();

    try {
      // Always try AI APIs first, regardless of hardware checks
      // Try Summarizer API first
      if (this.availableAPIs.includes("summarizer")) {
        try {
          return await this.summarizeWithSummarizerAPI(text, length);
        } catch (error) {
          console.log(
            "Summarizer API failed, trying next option:",
            error.message
          );
        }
      }

      // Try Prompt API
      if (this.availableAPIs.includes("prompt")) {
        try {
          return await this.summarizeWithPromptAPI(text, length);
        } catch (error) {
          console.log("Prompt API failed, trying next option:", error.message);
        }
      }

      // Try window.ai if available
      if (this.availableAPIs.includes("window.ai")) {
        try {
          return await this.summarizeWithWindowAI(text, length);
        } catch (error) {
          console.log("window.ai failed, trying next option:", error.message);
        }
      }

      // Fallback to heuristic
      console.log("All AI APIs failed, using heuristic fallback for summary");
      return await this.summarizeHeuristic(text, length);
    } catch (error) {
      console.error(
        "All summary methods failed, using heuristic fallback:",
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
  async summarizeWithSummarizerAPI(text, length) {
    try {
      const maxLength =
        length === "short" ? 100 : length === "medium" ? 200 : 300;
      const summary = await navigator.ai.summarizer.summarize({
        text: text,
        maxLength: maxLength,
      });

      return {
        summary: summary,
        source: "summarizer-api",
      };
    } catch (error) {
      console.error("Summarizer API summary failed:", error);
      throw error;
    }
  }

  // Summarize using Prompt API
  async summarizeWithPromptAPI(text, length) {
    try {
      const lengthInstruction =
        length === "short"
          ? "in 1-2 sentences"
          : length === "medium"
          ? "in 2-3 sentences"
          : "in 3-4 sentences";

      const prompt = `Summarize the following text ${lengthInstruction}:\n\n${text}`;

      const result = await navigator.ai.prompt(prompt);

      return {
        summary: result,
        source: "prompt-api",
      };
    } catch (error) {
      console.error("Prompt API summary failed:", error);
      throw error;
    }
  }

  // Summarize using window.ai
  async summarizeWithWindowAI(text, length) {
    if (!this.session) {
      this.session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });
    }

    const lengthInstruction =
      length === "short"
        ? "in 1-2 sentences"
        : length === "medium"
        ? "in 2-3 sentences"
        : "in 3-4 sentences";

    const prompt = `Summarize the following text ${lengthInstruction}:\n\n${text}`;

    try {
      const result = await this.session.prompt(prompt);
      return {
        summary: result,
        source: "window.ai",
      };
    } catch (error) {
      console.error("window.ai summary failed:", error);
      throw error;
    }
  }

  // Heuristic summary fallback
  async summarizeHeuristic(text, length) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    let summary;
    if (length === "short") {
      summary = sentences[0] || text.substring(0, 100) + "...";
    } else if (length === "medium") {
      summary = sentences.slice(0, 2).join(". ") + ".";
    } else {
      summary = sentences.slice(0, 3).join(". ") + ".";
    }

    return {
      summary: summary.trim(),
      source: "heuristic",
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
      source: "content-ai",
    };
  }
}

// Create global instance
window.contentAIProcessor = new ContentAIProcessor();

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.contentAIProcessor.checkAvailability();
  });
} else {
  window.contentAIProcessor.checkAvailability();
}
