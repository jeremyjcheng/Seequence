// Background service worker for Seequence Chrome extension
// Handles extension lifecycle and coordinates between components

// AI Processor classes (included directly to avoid import() issues in service workers)
class AIProcessor {
  constructor() {
    this.session = null;
    this.isAvailable = false;
  }

  // Check if AI API is available
  async checkAvailability() {
    try {
      if (self.ai && self.ai.languageModel) {
        const capabilities = await self.ai.languageModel.capabilities();
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
        this.session = await self.ai.languageModel.create({
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

  // Get session status
  getStatus() {
    return {
      available: this.isAvailable,
      sessionActive: this.session !== null,
    };
  }
}

class AIProcessorFallback {
  constructor() {
    this.isAvailable = false;
  }

  // Check if AI API is available
  async checkAvailability() {
    try {
      if (self.ai && self.ai.languageModel) {
        const capabilities = await self.ai.languageModel.capabilities();
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

  // Enhanced JavaScript summarizer with NLP techniques
  async generateSummary(text) {
    console.log("Using enhanced JavaScript summarizer");

    // Extract sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    if (sentences.length === 0) {
      return text.length <= 120 ? text : text.substring(0, 120) + "...";
    }

    // If only one sentence, return it (truncated if needed)
    if (sentences.length === 1) {
      const sentence = sentences[0].trim();
      if (sentence.length <= 120) {
        return sentence;
      }
      // Truncate at word boundary
      const words = sentence.split(" ");
      let truncated = "";
      for (const word of words) {
        if (truncated.length + word.length + 1 > 120) break;
        truncated += (truncated ? " " : "") + word;
      }
      return truncated + "...";
    }

    // Simple extractive summarization using key phrase detection
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = {};

    // Count word frequencies (excluding common stop words)
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
    ]);

    words.forEach((word) => {
      if (!stopWords.has(word) && word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Score sentences based on word frequency and position
    const sentenceScores = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      let score = 0;

      sentenceWords.forEach((word) => {
        if (wordFreq[word]) {
          score += wordFreq[word];
        }
      });

      // Boost score for first sentence (often contains main topic)
      if (index === 0) score *= 1.5;

      // Boost score for sentences with proper nouns (capitalized words)
      const properNouns = sentence.match(/\b[A-Z][a-z]+\b/g) || [];
      score += properNouns.length * 2;

      return { sentence: sentence.trim(), score };
    });

    // Sort by score and get the best sentence
    sentenceScores.sort((a, b) => b.score - a.score);

    let summary = sentenceScores[0]?.sentence || sentences[0];

    // Clean up the summary
    summary = summary.trim();
    if (summary.length > 120) {
      // Truncate at word boundary
      const words = summary.split(" ");
      let truncated = "";
      for (const word of words) {
        if (truncated.length + word.length + 1 > 120) break;
        truncated += (truncated ? " " : "") + word;
      }
      summary = truncated + "...";
    }

    console.log("Generated enhanced summary:", summary);
    return summary;
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

let aiProcessor = null;

// Extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Seequence extension installed/updated:", details.reason);

  // Set default settings
  chrome.storage.sync.set({
    defaultDiagramType: "auto",
    readingLevel: "standard",
    showPrivacyNotice: true,
  });

  // Initialize AI processor
  initializeAI();
});

// Initialize AI processor
async function initializeAI() {
  try {
    // Try the real AI processor first
    aiProcessor = new AIProcessor();
    const isAvailable = await aiProcessor.checkAvailability();
    console.log("Real AI Processor initialized:", isAvailable);

    if (!isAvailable) {
      // Fall back to simulated AI processor
      console.log("Real AI not available, using fallback processor");
      aiProcessor = new AIProcessorFallback();
      const fallbackAvailable = await aiProcessor.checkAvailability();
      console.log("Fallback AI Processor initialized:", fallbackAvailable);
    }
  } catch (error) {
    console.error("Error initializing AI processor:", error);
    console.error("Error details:", error.stack);

    // Try fallback as last resort
    try {
      console.log("Loading fallback AI processor as last resort");
      aiProcessor = new AIProcessorFallback();
      const fallbackAvailable = await aiProcessor.checkAvailability();
      console.log("Fallback AI Processor loaded:", fallbackAvailable);
    } catch (fallbackError) {
      console.error("Failed to load fallback AI processor:", fallbackError);
    }
  }
}

// Handle extension icon click (though we're using popup, this is here for future use)
chrome.action.onClicked.addListener((tab) => {
  // This won't fire when popup is defined in manifest
  // But keeping it here for potential future overlay mode
  console.log("Extension icon clicked on tab:", tab.id);
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  switch (request.action) {
    case "processText":
      handleTextProcessing(request, sendResponse);
      return true; // Keep message channel open for async response
    case "checkAIAvailability":
      handleAICheck(sendResponse);
      return true;
    case "generateSummary":
      handleGenerateSummary(request, sendResponse);
      return true;
    case "saveDiagram":
      handleSaveDiagram(request, sendResponse);
      break;
    default:
      console.log("Unknown action:", request.action);
      sendResponse({ success: false, error: "Unknown action" });
  }
});

// Handle AI text processing
async function handleTextProcessing(request, sendResponse) {
  try {
    if (!aiProcessor) {
      await initializeAI();
    }

    if (!aiProcessor || !aiProcessor.isAvailable) {
      sendResponse({
        success: false,
        error:
          "AI API not available. Please ensure Chrome flags are enabled and you have the required hardware.",
      });
      return;
    }

    const { text, diagramType } = request;
    const diagramData = await aiProcessor.generateDiagramData(
      text,
      diagramType
    );

    sendResponse({
      success: true,
      data: diagramData,
    });
  } catch (error) {
    console.error("Error processing text:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Handle AI availability check
async function handleAICheck(sendResponse) {
  try {
    if (!aiProcessor) {
      await initializeAI();
    }

    const status = aiProcessor
      ? aiProcessor.getStatus()
      : { available: false, sessionActive: false };
    sendResponse({
      success: true,
      status: status,
    });
  } catch (error) {
    console.error("Error checking AI status:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Handle summary generation
async function handleGenerateSummary(request, sendResponse) {
  try {
    const { text } = request;
    console.log("Background: Generating summary for text length:", text.length);

    // Try Python summarizer first
    try {
      console.log("Background: Attempting Python summarizer...");
      const summary = await callPythonSummarizer(text);
      console.log("Background: Python summarizer succeeded:", summary);
      sendResponse({
        success: true,
        summary: summary,
      });
      return;
    } catch (pythonError) {
      console.log("Background: Python summarizer failed:", pythonError.message);
      console.log("Background: Falling back to JS version");
    }

    // Fallback to JavaScript summarizer
    if (!aiProcessor) {
      await initializeAI();
    }

    if (!aiProcessor || !aiProcessor.isAvailable) {
      sendResponse({
        success: false,
        error: "No summarizer available",
      });
      return;
    }

    const summary = await aiProcessor.generateSummary(text);
    sendResponse({
      success: true,
      summary: summary,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Call Python summarizer via HTTP request to local server
async function callPythonSummarizer(text) {
  try {
    // For now, we'll use a simple HTTP approach or fallback to enhanced JS
    // Chrome extensions can't spawn processes directly
    console.log(
      "Background: Python summarizer not available in service worker context"
    );
    throw new Error("Python summarizer requires different architecture");
  } catch (error) {
    throw error;
  }
}

// Handle diagram saving
async function handleSaveDiagram(request, sendResponse) {
  try {
    const { diagramData, title } = request;
    const timestamp = Date.now();

    // Save to local storage
    const savedDiagrams = (await chrome.storage.local.get(["diagrams"])) || {
      diagrams: [],
    };
    const diagrams = savedDiagrams.diagrams || [];

    diagrams.push({
      id: timestamp,
      title: title || "Untitled Diagram",
      data: diagramData,
      created: timestamp,
    });

    await chrome.storage.local.set({ diagrams: diagrams });

    sendResponse({
      success: true,
      id: timestamp,
    });
  } catch (error) {
    console.error("Error saving diagram:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}
