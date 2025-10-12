// Background service worker for Seequence Chrome extension
// Handles extension lifecycle and coordinates between components

console.log("SEQUENCE DEBUG: Background service worker loaded");

// Import AI processors
importScripts("./chrome-nano-processor.js");
importScripts("./fallback-ai-processor.js");

// Global variables for AI processors
let chromeNanoProcessor = null;
let fallbackAIProcessor = null;

// Built-in AI Processor using Mochi's approach (Gemini Nano via self.ai.prompt)
console.log("SEQUENCE DEBUG: Defining BuiltInAIProcessor class");
class BuiltInAIProcessor {
  constructor() {
    this.isAvailable = false;
    this.availableAPIs = {
      prompt: false,
      summarizer: false,
    };
    this.performanceMetrics = {
      promptTime: 0,
      totalRequests: 0,
    };
  }

  // Check availability of built-in AI APIs (following Mochi's pattern)
  async checkAvailability() {
    console.log(
      "SEQUENCE DEBUG: Checking Chrome built-in AI API availability..."
    );
    console.log("SEQUENCE DEBUG: Chrome version:", navigator.userAgent);
    console.log(
      "SEQUENCE DEBUG: navigator.summarizer exists:",
      "summarizer" in navigator
    );
    console.log(
      "SEQUENCE DEBUG: navigator.translator exists:",
      "translator" in navigator
    );
    console.log(
      "SEQUENCE DEBUG: navigator object keys:",
      Object.keys(navigator)
    );

    // Check for Chrome's built-in AI APIs (like Mochi used)
    const hasSummarizer = "summarizer" in navigator;
    const hasTranslator = "translator" in navigator;

    if (!hasSummarizer && !hasTranslator) {
      console.warn(
        "SEQUENCE DEBUG: Chrome built-in AI APIs not available - no summarizer or translator"
      );
      console.warn(
        "SEQUENCE DEBUG: Please enable Chrome flags: chrome://flags/#prompt-api-for-gemini-nano"
      );
      this.availableAPIs = { prompt: false, summarizer: false };
      this.isAvailable = false;
      return this.availableAPIs;
    }

    console.log(
      "SEQUENCE DEBUG: Chrome built-in AI APIs detected, checking individual APIs..."
    );

    // Check Summarizer API (primary - like Mochi used)
    console.log("SEQUENCE DEBUG: Checking Summarizer API...");
    const summarizerAvailable = await this.checkSummarizerAPI();

    // Check Translator API (secondary)
    console.log("SEQUENCE DEBUG: Checking Translator API...");
    const translatorAvailable = await this.checkTranslatorAPI();

    this.availableAPIs = {
      prompt: false, // Not using prompt API
      summarizer: summarizerAvailable,
      translator: translatorAvailable,
    };

    this.isAvailable = summarizerAvailable || translatorAvailable;

    console.log(
      "SEQUENCE DEBUG: Built-in AI API availability:",
      this.availableAPIs
    );
    console.log("SEQUENCE DEBUG: Overall availability:", this.isAvailable);

    if (!this.isAvailable) {
      console.warn("SEQUENCE DEBUG: No built-in AI APIs are available.");
      console.warn(
        "SEQUENCE DEBUG: Please enable Chrome flags and ensure Chrome Dev/Canary ≥128.0.6545.0"
      );
      console.warn(
        "SEQUENCE DEBUG: Required flags: chrome://flags/#prompt-api-for-gemini-nano"
      );
    } else {
      console.log(
        "SEQUENCE DEBUG: Built-in AI APIs ready for hackathon compliance!"
      );
    }

    return this.availableAPIs;
  }

  // Check Prompt API availability (primary API for Gemini Nano)
  async checkPromptAPI() {
    console.log("SEQUENCE DEBUG: Testing Prompt API...");
    try {
      if ("ai" in window && "prompt" in self.ai) {
        console.log("SEQUENCE DEBUG: self.ai.prompt exists, testing...");
        const testResult = await self.ai.prompt.prompt({
          prompt: "Hello, this is a test.",
        });
        console.log("SEQUENCE DEBUG: Prompt API (Gemini Nano) available!");
        console.log("SEQUENCE DEBUG: Test result:", testResult);
        return true;
      } else {
        console.log("SEQUENCE DEBUG: self.ai.prompt does not exist");
        return false;
      }
    } catch (error) {
      console.log("SEQUENCE DEBUG: Prompt API not available:", error.message);
      console.log("SEQUENCE DEBUG: Error details:", error);
    }
    return false;
  }

  // Check Summarizer API availability (primary - like Mochi used)
  async checkSummarizerAPI() {
    console.log("SEQUENCE DEBUG: Testing Summarizer API...");
    try {
      if ("summarizer" in navigator) {
        console.log("SEQUENCE DEBUG: navigator.summarizer exists, testing...");
        const testResult = await navigator.summarizer.summarize({
          text: "This is a test.",
          maxLength: 10,
        });
        console.log("SEQUENCE DEBUG: Summarizer API available!");
        console.log("SEQUENCE DEBUG: Test result:", testResult);
        return true;
      } else {
        console.log("SEQUENCE DEBUG: navigator.summarizer does not exist");
        return false;
      }
    } catch (error) {
      console.log(
        "SEQUENCE DEBUG: Summarizer API not available:",
        error.message
      );
      console.log("SEQUENCE DEBUG: Error details:", error);
    }
    return false;
  }

  // Check Translator API availability (secondary)
  async checkTranslatorAPI() {
    console.log("SEQUENCE DEBUG: Testing Translator API...");
    try {
      if ("translator" in navigator) {
        console.log("SEQUENCE DEBUG: navigator.translator exists, testing...");
        const testResult = await navigator.translator.translate({
          text: "Hello world",
          from: "en",
          to: "es",
        });
        console.log("SEQUENCE DEBUG: Translator API available!");
        console.log("SEQUENCE DEBUG: Test result:", testResult);
        return true;
      } else {
        console.log("SEQUENCE DEBUG: navigator.translator does not exist");
        return false;
      }
    } catch (error) {
      console.log(
        "SEQUENCE DEBUG: Translator API not available:",
        error.message
      );
      console.log("SEQUENCE DEBUG: Error details:", error);
    }
    return false;
  }

  // Analyze text structure using built-in AI APIs (following Mochi's pattern)
  async analyzeTextStructure(text) {
    const startTime = performance.now();

    try {
      // Use Summarizer API for content analysis (primary method like Mochi)
      if (this.availableAPIs.summarizer) {
        const analysis = await this.analyzeWithSummarizerAPI(text);
        this.performanceMetrics.promptTime += performance.now() - startTime;
        this.performanceMetrics.totalRequests++;
        return analysis;
      }

      // Fallback to heuristic analysis
      return await this.analyzeHeuristic(text);
    } catch (error) {
      console.error("Error in text structure analysis:", error);
      return await this.analyzeHeuristic(text);
    }
  }

  // Analyze text using Summarizer API (following Mochi's approach)
  async analyzeWithSummarizerAPI(text) {
    console.log("SEQUENCE DEBUG: Using Summarizer API for analysis...");

    try {
      // Use Chrome's built-in Summarizer API to get key points
      const summary = await navigator.summarizer.summarize({
        text: text,
        maxLength: 200, // Get a concise summary
      });

      console.log("SEQUENCE DEBUG: Summarizer API result:", summary);

      // Parse the summary to extract structure
      const keyPoints = summary
        .split(".")
        .filter((point) => point.trim().length > 0);

      return {
        type: "narrative", // Default to narrative for now
        mainTopic: keyPoints[0]?.substring(0, 50) || "Unknown Topic",
        keyPoints: keyPoints.slice(0, 5).map((point, index) => ({
          text: point.trim(),
          type: "concept",
          importance: 5 - index,
        })),
        relationships: [],
        structure: "linear",
        confidence: 0.8,
        source: "chrome-summarizer",
      };
    } catch (error) {
      console.error("SEQUENCE DEBUG: Summarizer API error:", error);
      throw error;
    }
  }

  // Analyze text using Prompt API (legacy method)
  async analyzeWithPromptAPI(text) {
    const prompt = `Analyze this text and extract its structure for diagram generation. Return a JSON object with:
    - "type": the content type (causal, sequential, comparative, hierarchical, narrative)
    - "mainTopic": the main subject (max 50 chars)
    - "keyPoints": array of main ideas (max 5, each max 100 chars)
    - "relationships": array of relationships between points
    - "structure": the overall organization pattern
    - "confidence": analysis confidence (0-1)

    Text: "${text.substring(0, 2000)}"

    Return only valid JSON.`;

    try {
      const result = await self.ai.prompt.prompt({
        prompt: prompt,
      });

      const analysis = JSON.parse(result);
      analysis.source = "builtin-prompt-gemini";
      console.log("Text analysis completed using Gemini Nano");
      return analysis;
    } catch (error) {
      console.error("Prompt API analysis failed:", error);
      throw error;
    }
  }

  // Generate summary using built-in AI APIs (following Mochi's pattern)
  async generateSummary(text, length = "short") {
    const startTime = performance.now();

    try {
      // Use Summarizer API for summarization (primary method like Mochi)
      if (this.availableAPIs.summarizer) {
        const summary = await this.summarizeWithSummarizerAPI(text, length);
        this.performanceMetrics.promptTime += performance.now() - startTime;
        this.performanceMetrics.totalRequests++;
        return summary;
      }

      // Fallback to Prompt API
      if (this.availableAPIs.prompt) {
        const summary = await this.summarizeWithPromptAPI(text, length);
        this.performanceMetrics.promptTime += performance.now() - startTime;
        this.performanceMetrics.totalRequests++;
        return summary;
      }

      // Fallback to heuristic summarization
      return await this.summarizeHeuristic(text, length);
    } catch (error) {
      console.error("Error in summary generation:", error);
      return await this.summarizeHeuristic(text, length);
    }
  }

  // Summarize using Summarizer API (following Mochi's approach)
  async summarizeWithSummarizerAPI(text, length) {
    console.log("SEQUENCE DEBUG: Using Summarizer API for summary...");

    const lengthMapping = {
      short: 100,
      medium: 200,
      long: 300,
    };

    const maxLength = lengthMapping[length] || 100;

    try {
      const summary = await navigator.summarizer.summarize({
        text: text,
        maxLength: maxLength,
      });

      console.log("SEQUENCE DEBUG: Summarizer API summary result:", summary);

      return {
        summary: summary,
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: summary.length / text.length,
        source: "chrome-summarizer",
      };
    } catch (error) {
      console.error("SEQUENCE DEBUG: Summarizer API error:", error);
      throw error;
    }
  }

  // Summarize using Prompt API (legacy method)
  async summarizeWithPromptAPI(text, length) {
    const lengthMapping = {
      short: "2-3 sentences",
      medium: "4-5 sentences",
      long: "6-8 sentences",
    };

    const lengthHint = lengthMapping[length] || "2-3 sentences";

    const prompt = `Summarize the following text in ${lengthHint}. Keep the key information and main points:

    Text: "${text}"

    Summary:`;

    try {
      const result = await self.ai.prompt.prompt({
        prompt: prompt,
      });

      return {
        summary: result,
        originalLength: text.length,
        summaryLength: result.length,
        compressionRatio: result.length / text.length,
        source: "builtin-prompt-gemini",
      };
    } catch (error) {
      console.error("Prompt API summarization failed:", error);
      throw error;
    }
  }

  // Summarize using built-in Summarizer API (fallback)
  async summarizeWithBuiltInAPI(text, length) {
    const lengthMapping = {
      short: 100,
      medium: 200,
      long: 300,
    };

    const maxLength = lengthMapping[length] || 150;

    try {
      const result = await self.ai.summarizer.summarize({
        text: text,
        maxLength: maxLength,
      });

      return {
        summary: result,
        originalLength: text.length,
        summaryLength: result.length,
        compressionRatio: result.length / text.length,
        source: "builtin-summarizer",
      };
    } catch (error) {
      console.error("Built-in summarizer failed:", error);
      throw error;
    }
  }

  // Generate diagram data using built-in AI APIs (following Mochi's pattern)
  async generateDiagramData(text, diagramType = "auto") {
    try {
      // First analyze the text structure
      const analysis = await this.analyzeTextStructure(text);

      // Use Prompt API to generate diagram data (primary method like Mochi)
      if (this.availableAPIs.prompt) {
        const diagramData = await this.generateDiagramWithPromptAPI(
          analysis,
          diagramType
        );
        return diagramData;
      }

      // Fallback to heuristic diagram generation
      return await this.generateDiagramHeuristic(analysis, diagramType);
    } catch (error) {
      console.error("Error in diagram generation:", error);
      return await this.generateDiagramHeuristic(
        await this.analyzeHeuristic(text),
        diagramType
      );
    }
  }

  // Generate diagram data using Prompt API (following Mochi's approach)
  async generateDiagramWithPromptAPI(analysis, diagramType) {
    const prompt = `Based on the analysis, create a diagram data structure for a ${diagramType}. 
    Return a JSON object with:
    - "nodes": array of nodes with id, label, type, and content
    - "edges": array of connections with source, target, and label
    - "layout": suggested layout type
    - "title": diagram title

    Analysis: ${JSON.stringify(analysis)}
    Diagram Type: ${diagramType}

    Return only valid JSON.`;

    try {
      const result = await self.ai.prompt.prompt({
        prompt: prompt,
      });

      const diagramData = JSON.parse(result);
      diagramData.source = "builtin-prompt-gemini";
      console.log("Diagram data generated using Gemini Nano");
      return diagramData;
    } catch (error) {
      console.error("Prompt API diagram generation failed:", error);
      throw error;
    }
  }

  // Heuristic text analysis fallback
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

  // Heuristic diagram generation fallback
  async generateDiagramHeuristic(analysis, diagramType) {
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
      source: "heuristic",
    };
  }

  // Get processor status
  getStatus() {
    return {
      available: this.isAvailable,
      availableAPIs: this.availableAPIs,
      performance: this.performanceMetrics,
      source: "builtin-apis-gemini",
    };
  }
}

// BuiltInAIProcessor class is now available

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

// Initialize AI processor immediately when service worker starts
console.log("SEQUENCE DEBUG: Service worker starting, initializing AI...");
initializeAI();

// Extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Seequence extension installed/updated:", details.reason);

  // Set default settings
  chrome.storage.sync.set({
    defaultDiagramType: "auto",
    readingLevel: "standard",
    showPrivacyNotice: true,
  });

  // Initialize AI processor (also called on install/update)
  initializeAI();
});

// Initialize AI processor
async function initializeAI() {
  console.log("SEQUENCE DEBUG: Starting AI initialization...");

  try {
    // Initialize Chrome Nano processor first
    if (ChromeNanoProcessor) {
      console.log("SEQUENCE DEBUG: ChromeNanoProcessor class is available");
      try {
        console.log("SEQUENCE DEBUG: Creating ChromeNanoProcessor instance...");
        chromeNanoProcessor = new ChromeNanoProcessor();

        console.log("SEQUENCE DEBUG: Checking Chrome Nano availability...");
        const nanoAvailable = await chromeNanoProcessor.checkAvailability();
        console.log(
          "SEQUENCE DEBUG: Chrome Nano Processor initialized:",
          nanoAvailable
        );
        console.log(
          "SEQUENCE DEBUG: chromeNanoProcessor.isAvailable:",
          chromeNanoProcessor.isAvailable
        );

        if (chromeNanoProcessor.isAvailable) {
          console.log("SEQUENCE DEBUG: Chrome Nano AI is AVAILABLE!");
          console.log(
            "SEQUENCE DEBUG: Using Chrome Nano for hackathon compliance"
          );
          return;
        } else {
          console.log("SEQUENCE DEBUG: Chrome Nano AI is NOT available");
        }
      } catch (nanoError) {
        console.error(
          "SEQUENCE DEBUG: Chrome Nano processor failed:",
          nanoError
        );
        chromeNanoProcessor = null;
      }
    } else {
      console.log("SEQUENCE DEBUG: ChromeNanoProcessor class not available");
    }

    // Try fallback AI processor
    if (FallbackAIProcessor) {
      console.log("SEQUENCE DEBUG: Trying FallbackAIProcessor...");
      try {
        fallbackAIProcessor = new FallbackAIProcessor();
        const fallbackAvailable = await fallbackAIProcessor.checkAvailability();
        console.log(
          "SEQUENCE DEBUG: Fallback AI Processor:",
          fallbackAvailable
        );

        if (fallbackAvailable) {
          console.log("SEQUENCE DEBUG: Using Fallback AI Processor");
          return;
        }
      } catch (fallbackError) {
        console.error(
          "SEQUENCE DEBUG: Fallback AI processor failed:",
          fallbackError
        );
        fallbackAIProcessor = null;
      }
    }

    console.log("SEQUENCE DEBUG: No AI processors available");
    console.log("SEQUENCE DEBUG: Extension will use heuristic fallback only");
  } catch (error) {
    console.error("SEQUENCE DEBUG: Error initializing AI processor:", error);
    console.error("SEQUENCE DEBUG: Error details:", error.stack);

    // No fallbacks - Chrome built-in AI only
    console.log(
      "SEQUENCE DEBUG: No fallback processors - Chrome built-in AI only"
    );
  }

  console.log("SEQUENCE DEBUG: AI initialization complete");
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
  console.log("SEQUENCE DEBUG: Text processing request received");
  console.log("SEQUENCE DEBUG: Request:", request);

  try {
    const { text, diagramType } = request;
    console.log("SEQUENCE DEBUG: Processing text length:", text.length);
    console.log("SEQUENCE DEBUG: Diagram type:", diagramType);

    // Delegate AI processing to content script where AI APIs are available
    console.log(
      "SEQUENCE DEBUG: Delegating AI processing to content script..."
    );

    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      sendResponse({
        success: false,
        error: "No active tab found",
        source: "no-tab-error",
      });
      return;
    }

    // Send message to content script for AI processing
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "processText",
        text: text,
        diagramType: diagramType,
      });

      if (response.success) {
        console.log("SEQUENCE DEBUG: Content script AI processing successful!");
        console.log("SEQUENCE DEBUG: Generated diagram data:", response.data);
        sendResponse({
          success: true,
          data: response.data,
          source: "content-ai",
        });
      } else {
        console.error(
          "SEQUENCE DEBUG: Content script AI processing failed:",
          response.error
        );
        sendResponse({
          success: false,
          error: response.error,
          source: "content-ai-error",
        });
      }
    } catch (messageError) {
      console.error(
        "SEQUENCE DEBUG: Failed to communicate with content script:",
        messageError
      );
      sendResponse({
        success: false,
        error:
          "Failed to communicate with content script: " + messageError.message,
        source: "communication-error",
      });
    }
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
    if (!chromeNanoProcessor) {
      await initializeAI();
    }

    // Only check Chrome Nano AI status
    const nanoStatus = chromeNanoProcessor
      ? chromeNanoProcessor.getStatus()
      : null;

    const status = {
      available: nanoStatus && nanoStatus.available,
      chromeNanoAI: nanoStatus,
      hybrid: false, // No server fallback - Chrome Nano AI only
    };

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

    // Only use Chrome's built-in Summarizer API (Gemini Nano)
    if (chromeNanoProcessor && chromeNanoProcessor.isAvailable) {
      try {
        console.log(
          "Background: Using Chrome built-in Summarizer API (Gemini Nano)..."
        );
        const summaryResult = await chromeNanoProcessor.generateSummary(
          text,
          length
        );
        console.log(
          "Background: Chrome built-in summarizer succeeded:",
          summaryResult.summary
        );
        sendResponse({
          success: true,
          summary: summaryResult.summary,
          source: "chrome-builtin-summarizer",
        });
        return;
      } catch (builtInError) {
        console.log(
          "Background: Chrome built-in summarizer failed:",
          builtInError.message
        );
        sendResponse({
          success: false,
          error:
            "Chrome built-in AI summarization failed: " + builtInError.message,
          source: "chrome-nano-error",
        });
        return;
      }
    } else {
      console.log("Background: Chrome built-in AI not available");
      sendResponse({
        success: false,
        error:
          "Chrome built-in AI APIs not available. Please ensure Chrome 127+ with AI flags enabled: chrome://flags/#prompt-api-for-gemini-nano",
        source: "chrome-nano-unavailable",
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

// Server functions removed - using only Chrome built-in AI (Gemini Nano)

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
