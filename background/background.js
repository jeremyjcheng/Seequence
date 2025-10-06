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

    // Enhanced content type detection with more sophisticated patterns
    let type = "narrative";
    let confidence = 0.5;

    // Causal relationships (cause-effect)
    const causalKeywords = [
      "because",
      "therefore",
      "causes",
      "leads to",
      "results in",
      "due to",
      "as a result",
      "consequently",
    ];
    const causalScore = words.filter((w) => causalKeywords.includes(w)).length;
    if (causalScore > 0) {
      type = "causal";
      confidence = Math.min(0.9, 0.5 + causalScore * 0.1);
    }

    // Sequential/Process (step-by-step)
    const sequentialKeywords = [
      "first",
      "second",
      "third",
      "then",
      "next",
      "finally",
      "step",
      "stage",
      "phase",
      "after",
      "before",
      "initially",
    ];
    const sequentialScore = words.filter((w) =>
      sequentialKeywords.includes(w)
    ).length;
    if (sequentialScore > causalScore && sequentialScore > 0) {
      type = "sequential";
      confidence = Math.min(0.9, 0.5 + sequentialScore * 0.1);
    }

    // Comparative (comparing things)
    const comparativeKeywords = [
      "versus",
      "compared to",
      "different",
      "similar",
      "contrast",
      "however",
      "whereas",
      "unlike",
      "like",
      "both",
      "either",
      "neither",
    ];
    const comparativeScore = words.filter((w) =>
      comparativeKeywords.includes(w)
    ).length;
    if (
      comparativeScore > Math.max(causalScore, sequentialScore) &&
      comparativeScore > 0
    ) {
      type = "comparative";
      confidence = Math.min(0.9, 0.5 + comparativeScore * 0.1);
    }

    // Hierarchical (categories, classifications)
    const hierarchicalKeywords = [
      "includes",
      "contains",
      "categories",
      "types",
      "levels",
      "class",
      "group",
      "category",
      "kind",
      "sort",
      "variety",
    ];
    const hierarchicalScore = words.filter((w) =>
      hierarchicalKeywords.includes(w)
    ).length;
    if (
      hierarchicalScore >
        Math.max(causalScore, sequentialScore, comparativeScore) &&
      hierarchicalScore > 0
    ) {
      type = "hierarchical";
      confidence = Math.min(0.9, 0.5 + hierarchicalScore * 0.1);
    }

    // Check for time-based narrative (biography, history)
    const timeKeywords = [
      "born",
      "died",
      "started",
      "ended",
      "began",
      "finished",
      "year",
      "decade",
      "century",
      "era",
      "period",
    ];
    const timeScore = words.filter((w) => timeKeywords.includes(w)).length;
    if (timeScore > 2 && type === "narrative") {
      type = "narrative";
      confidence = Math.min(0.9, 0.6 + timeScore * 0.05);
    }

    // Enhanced key point extraction based on content type
    let keyPoints = [];

    if (type === "sequential" || type === "narrative") {
      // For sequential/narrative content, extract chronological or step-based points
      keyPoints = sentences
        .slice(0, 6)
        .map((s) => s.trim())
        .filter((s) => s.length > 15)
        .map((s, index) => ({
          text: s,
          order: index + 1,
          type: "step",
        }));
    } else if (type === "comparative") {
      // For comparative content, extract contrasting points
      const comparativeSentences = sentences.filter((s) =>
        comparativeKeywords.some((keyword) => s.toLowerCase().includes(keyword))
      );
      keyPoints = comparativeSentences
        .slice(0, 4)
        .map((s) => s.trim())
        .filter((s) => s.length > 15)
        .map((s, index) => ({
          text: s,
          order: index + 1,
          type: "comparison",
        }));
    } else if (type === "hierarchical") {
      // For hierarchical content, extract category-based points
      keyPoints = sentences
        .slice(0, 5)
        .map((s) => s.trim())
        .filter((s) => s.length > 15)
        .map((s, index) => ({
          text: s,
          order: index + 1,
          type: "category",
        }));
    } else {
      // Default extraction
      keyPoints = sentences
        .slice(0, 5)
        .map((s) => s.trim())
        .filter((s) => s.length > 15)
        .map((s, index) => ({
          text: s,
          order: index + 1,
          type: "point",
        }));
    }

    // Generate relationships based on content type
    const relationships = [];
    for (let i = 0; i < keyPoints.length - 1; i++) {
      let relationshipType = "related";
      if (type === "sequential" || type === "narrative") {
        relationshipType = "sequence";
      } else if (type === "causal") {
        relationshipType = "causal";
      } else if (type === "comparative") {
        relationshipType = "comparison";
      } else if (type === "hierarchical") {
        relationshipType = "hierarchy";
      }

      relationships.push({
        from: i,
        to: i + 1,
        type: relationshipType,
      });
    }

    const analysis = {
      type: type,
      confidence: confidence,
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

    // Create nodes from enhanced key points
    const nodes = analysis.keyPoints.map((point, index) => ({
      id: `node_${index}`,
      label:
        point.text.substring(0, 30) + (point.text.length > 30 ? "..." : ""),
      type: point.type || "concept",
      content: point.text,
      order: point.order,
      nodeType: point.type || "concept",
    }));

    // Create edges from relationships with enhanced labels
    const edges = analysis.relationships.map((rel, index) => {
      let label = "→";
      if (rel.type === "sequence") label = "→";
      else if (rel.type === "causal") label = "→";
      else if (rel.type === "comparison") label = "↔";
      else if (rel.type === "hierarchy") label = "↓";
      else label = "—";

      return {
        id: `edge_${index}`,
        source: `node_${rel.from}`,
        target: `node_${rel.to}`,
        label: label,
        type: rel.type,
      };
    });

    const diagramData = {
      title: analysis.mainTopic,
      layout: diagramType,
      nodes: nodes,
      edges: edges,
      type: analysis.type,
      originalText: text, // Include original text for summary generation
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

  // Simple fallback summarizer (basic truncation only)
  async generateSummary(text) {
    console.log("Using basic fallback summarizer");

    // Simple truncation fallback
    if (text.length <= 120) {
      return text;
    }

    // Truncate at word boundary
    const words = text.split(" ");
    let truncated = "";
    for (const word of words) {
      if (truncated.length + word.length + 1 > 120) break;
      truncated += (truncated ? " " : "") + word;
    }

    return truncated + "...";
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

    // Try Gemini content analysis first
    try {
      console.log("Background: Attempting Gemini content analysis...");
      const analysisResponse = await callPythonAnalyzer(text);

      if (analysisResponse.success) {
        console.log("Background: Using Gemini analysis for diagram generation");
        const diagramData = convertAnalysisToDiagramData(
          analysisResponse.analysis,
          text
        );
        // Attach open-intent fields for renderer (no hardcoded taxonomy)
        if (analysisResponse.open_intent) {
          diagramData.intent = analysisResponse.open_intent.intent_label;
          diagramData.intentExplanation =
            analysisResponse.open_intent.intent_explanation;
          diagramData.visualization =
            analysisResponse.open_intent.visualization;
          diagramData.slots = analysisResponse.open_intent.slots;
          diagramData.intentConfidence =
            analysisResponse.open_intent.confidence;
        }
        sendResponse({
          success: true,
          data: diagramData,
        });
        return;
      }
    } catch (analysisError) {
      console.log(
        "Background: Gemini analysis failed, using fallback:",
        analysisError.message
      );
    }

    // Fallback to original AI processing
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
    const { text, length } = request;
    console.log("Background: Generating summary for text length:", text.length);
    console.log("Background: Requested summary length:", length);
    console.log(
      "Background: Text to summarize:",
      text.substring(0, 100) + "..."
    );

    // Try Python summarizer first
    try {
      console.log("Background: Attempting Python summarizer...");
      const summary = await callPythonSummarizer(text, length);
      // Enforce hard caps client-side as a safeguard if server returns longer text
      const maxLen = length === "long" ? 320 : length === "medium" ? 140 : 60;
      const finalSummary =
        summary && summary.length > maxLen
          ? summary.slice(0, maxLen - 1).trimEnd() + "…"
          : summary;
      console.log("Background: Python summarizer succeeded:", summary);
      sendResponse({
        success: true,
        summary: finalSummary,
      });
      return;
    } catch (pythonError) {
      console.log("Background: Python summarizer failed:", pythonError.message);

      // No fallback - require Python server
      sendResponse({
        success: false,
        error:
          "Python summarizer server not available. Please start the server with: ./start-python-summarizer.sh",
      });
      return;
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Call Python summarizer via HTTP request to local server
async function callPythonSummarizer(text, length) {
  try {
    console.log(
      "Background: Attempting to connect to Python summarizer server..."
    );

    const response = await fetch("http://localhost:8080/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        // Make tiers more distinct
        max_length: length === "long" ? 320 : length === "medium" ? 140 : 60,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log("Background: Python summarizer succeeded:", result.summary);
      return result.summary;
    } else {
      throw new Error(result.error || "Unknown error from Python summarizer");
    }
  } catch (error) {
    console.log(
      "Background: Python summarizer server not available:",
      error.message
    );
    throw error;
  }
}

// Call Python analyzer via HTTP request to local server
async function callPythonAnalyzer(text) {
  try {
    console.log(
      "Background: Attempting to connect to Python analyzer server..."
    );

    const response = await fetch("http://localhost:8080/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log("Background: Python analyzer succeeded:", result.analysis);
      return result;
    } else {
      throw new Error(result.error || "Unknown error from Python analyzer");
    }
  } catch (error) {
    console.log(
      "Background: Python analyzer server not available:",
      error.message
    );
    throw error;
  }
}

// Convert Gemini analysis to diagram data format
function convertAnalysisToDiagramData(analysis, originalText) {
  console.log("Background: Converting Gemini analysis to diagram data");

  // Create nodes from key points
  const nodes = analysis.keyPoints.map((point, index) => ({
    id: `node_${index}`,
    label: point.text.substring(0, 30) + (point.text.length > 30 ? "..." : ""),
    type: point.type || "concept",
    content: point.text,
    order: index + 1,
    nodeType: point.type || "concept",
    importance: point.importance || 3,
  }));

  // Create edges from relationships
  const edges = analysis.relationships.map((rel, index) => {
    let label = "→";
    if (rel.type === "sequence") label = "→";
    else if (rel.type === "causal") label = "→";
    else if (rel.type === "comparison") label = "↔";
    else if (rel.type === "hierarchy") label = "↓";
    else label = "—";

    return {
      id: `edge_${index}`,
      source: `node_${rel.from}`,
      target: `node_${rel.to}`,
      label: label,
      type: rel.type,
      description: rel.label || "",
    };
  });

  // Map content type to diagram layout
  let layout = "flowchart";
  switch (analysis.contentType) {
    case "sequential":
    case "narrative":
      layout = "timeline";
      break;
    case "comparative":
      layout = "compare";
      break;
    case "hierarchical":
      layout = "mindmap";
      break;
    case "causal":
      layout = "flowchart";
      break;
    default:
      layout = analysis.suggestedLayout || "flowchart";
  }

  const diagramData = {
    title: analysis.mainTopic,
    layout: layout,
    nodes: nodes,
    edges: edges,
    type: analysis.contentType,
    originalText: originalText,
    geminiGenerated: true,
  };

  console.log("Background: Converted diagram data:", diagramData);
  return diagramData;
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
