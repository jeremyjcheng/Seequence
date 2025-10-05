// AI Processor for Seequence Chrome extension
// Handles Gemini Nano API integration for text processing and diagram generation

class AIProcessor {
  constructor() {
    this.session = null;
    this.isAvailable = false;
  }

  // Check if AI API is available
  async checkAvailability() {
    try {
      if (window.ai && window.ai.languageModel) {
        const capabilities = await window.ai.languageModel.capabilities();
        this.isAvailable = capabilities.available !== "no";
        console.log("AI API available:", this.isAvailable);
        return this.isAvailable;
      }
    } catch (error) {
      console.error("Error checking AI availability:", error);
      this.isAvailable = false;
    }
    return false;
  }

  // Initialize AI session
  async initialize() {
    if (!this.isAvailable) {
      await this.checkAvailability();
    }

    if (this.isAvailable && !this.session) {
      try {
        this.session = await window.ai.languageModel.create({
          temperature: 0.7,
          topK: 40,
        });
        console.log("AI session created successfully");
        return true;
      } catch (error) {
        console.error("Error creating AI session:", error);
        return false;
      }
    }
    return this.isAvailable;
  }

  // Analyze text structure and extract key information
  async analyzeTextStructure(text) {
    if (!(await this.initialize())) {
      throw new Error("AI API not available");
    }

    const prompt = `Analyze the following text and extract its structure. Return a JSON object with:
    - "type": the content type (causal, sequential, comparative, hierarchical, narrative)
    - "mainTopic": the main subject
    - "keyPoints": array of main ideas
    - "relationships": array of relationships between points
    - "structure": the overall organization pattern

    Text: "${text}"

    Return only valid JSON, no additional text.`;

    try {
      const result = await this.session.prompt(prompt);
      const analysis = JSON.parse(result);
      console.log("Text analysis result:", analysis);
      return analysis;
    } catch (error) {
      console.error("Error analyzing text:", error);
      throw error;
    }
  }

  // Generate diagram data structure
  async generateDiagramData(text, diagramType = "auto") {
    if (!(await this.initialize())) {
      throw new Error("AI API not available");
    }

    const analysis = await this.analyzeTextStructure(text);

    // Determine diagram type if auto
    if (diagramType === "auto") {
      diagramType = this.selectDiagramType(analysis.type);
    }

    const prompt = `Based on the analysis, create a diagram data structure for a ${diagramType}. 
    Return a JSON object with:
    - "nodes": array of nodes with id, label, type, and content
    - "edges": array of connections with source, target, and label
    - "layout": suggested layout type
    - "title": diagram title

    Analysis: ${JSON.stringify(analysis)}
    Diagram Type: ${diagramType}

    Return only valid JSON, no additional text.`;

    try {
      const result = await this.session.prompt(prompt);
      const diagramData = JSON.parse(result);
      console.log("Diagram data generated:", diagramData);
      return diagramData;
    } catch (error) {
      console.error("Error generating diagram data:", error);
      throw error;
    }
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

  // Simplify text for different reading levels
  async simplifyText(text, level = "standard") {
    if (!(await this.initialize())) {
      throw new Error("AI API not available");
    }

    const levelPrompts = {
      simple:
        "Rewrite this text in simple, easy-to-understand language suitable for beginners:",
      standard: "Keep this text at a standard reading level:",
      advanced:
        "Rewrite this text for an advanced audience with technical details:",
    };

    const prompt = `${levelPrompts[level]} "${text}"`;

    try {
      const result = await this.session.prompt(prompt);
      return result;
    } catch (error) {
      console.error("Error simplifying text:", error);
      throw error;
    }
  }

  // Get session status
  getStatus() {
    return {
      available: this.isAvailable,
      sessionActive: this.session !== null,
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIProcessor;
} else {
  window.AIProcessor = AIProcessor;
}
