// Fallback AI Processor for Seequence Chrome extension
// Simulates AI processing when Gemini Nano is not available

class AIProcessorFallback {
  constructor() {
    this.isAvailable = false;
  }

  // Check if AI API is available
  async checkAvailability() {
    try {
      if (window.ai && window.ai.languageModel) {
        const capabilities = await window.ai.languageModel.capabilities();
        this.isAvailable = capabilities.available !== "no";
        console.log("Real AI API available:", this.isAvailable);
        return this.isAvailable;
      }
    } catch (error) {
      console.log("Real AI API not available, using fallback");
    }

    // Fallback mode
    this.isAvailable = true; // Simulate availability
    console.log("Using fallback AI processor");
    return true;
  }

  // Initialize AI session
  async initialize() {
    return this.checkAvailability();
  }

  // Analyze text structure and extract key information (simulated)
  async analyzeTextStructure(text) {
    console.log("Analyzing text structure (fallback mode)");

    // Simple heuristic analysis
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Detect content type based on keywords
    let type = "narrative";
    if (
      words.some((w) =>
        ["because", "therefore", "causes", "leads to", "results in"].includes(w)
      )
    ) {
      type = "causal";
    } else if (
      words.some((w) =>
        ["first", "second", "then", "next", "finally", "step"].includes(w)
      )
    ) {
      type = "sequential";
    } else if (
      words.some((w) =>
        ["versus", "compared to", "different", "similar", "contrast"].includes(
          w
        )
      )
    ) {
      type = "comparative";
    } else if (
      words.some((w) =>
        ["includes", "contains", "categories", "types", "levels"].includes(w)
      )
    ) {
      type = "hierarchical";
    }

    // Extract key points (simple sentence-based extraction)
    const keyPoints = sentences
      .slice(0, 5)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    // Generate relationships
    const relationships = [];
    for (let i = 0; i < keyPoints.length - 1; i++) {
      relationships.push({
        from: i,
        to: i + 1,
        type: type === "sequential" ? "sequence" : "related",
      });
    }

    const analysis = {
      type: type,
      mainTopic: sentences[0]?.substring(0, 50) + "..." || "Main Topic",
      keyPoints: keyPoints,
      relationships: relationships,
      structure: type,
    };

    console.log("Text analysis result (fallback):", analysis);
    return analysis;
  }

  // Generate diagram data structure (simulated)
  async generateDiagramData(text, diagramType = "auto") {
    console.log("Generating diagram data (fallback mode)");

    const analysis = await this.analyzeTextStructure(text);

    // Determine diagram type if auto
    if (diagramType === "auto") {
      diagramType = this.selectDiagramType(analysis.type);
    }

    // Create nodes from key points
    const nodes = analysis.keyPoints.map((point, index) => ({
      id: `node_${index}`,
      label: point.substring(0, 30) + (point.length > 30 ? "..." : ""),
      type: "concept",
      content: point,
    }));

    // Create edges from relationships
    const edges = analysis.relationships.map((rel, index) => ({
      id: `edge_${index}`,
      source: `node_${rel.from}`,
      target: `node_${rel.to}`,
      label: rel.type === "sequence" ? "→" : "↔",
    }));

    const diagramData = {
      title: analysis.mainTopic,
      layout: diagramType,
      nodes: nodes,
      edges: edges,
      type: analysis.type,
    };

    console.log("Diagram data generated (fallback):", diagramData);
    return diagramData;
  }

  // Select appropriate diagram type based on content analysis
  selectDiagramType(contentType) {
    const typeMapping = {
      causal: "flowchart",
      sequential: "timeline",
      comparative: "compare",
      hierarchical: "mindmap",
      narrative: "flowchart",
    };
    return typeMapping[contentType] || "flowchart";
  }

  // Simplify text for different reading levels (simulated)
  async simplifyText(text, level = "standard") {
    console.log(`Simplifying text to ${level} level (fallback mode)`);

    // Simple text simplification
    let simplified = text;

    if (level === "simple") {
      // Remove complex words and shorten sentences
      simplified = text
        .replace(/[^\w\s.,!?]/g, "") // Remove special characters
        .replace(/\b\w{10,}\b/g, "word") // Replace long words
        .substring(0, Math.min(text.length, 200)); // Truncate
    } else if (level === "advanced") {
      // Keep original text
      simplified = text;
    }

    return simplified;
  }

  // Get session status
  getStatus() {
    return {
      available: this.isAvailable,
      sessionActive: true, // Always true in fallback mode
      fallback: true,
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIProcessorFallback;
} else {
  window.AIProcessorFallback = AIProcessorFallback;
}
