// Built-in AI Processor for Seequence - Using Chrome's Built-in AI APIs
// Implements the proper Chrome 138+ built-in AI APIs for hackathon compliance

class BuiltInAIProcessor {
  constructor() {
    this.isAvailable = false;
    this.availableAPIs = {
      summarizer: false,
      prompt: false,
      translator: false,
      languageDetector: false,
      writer: false,
      rewriter: false,
      proofreader: false,
    };
    this.performanceMetrics = {
      summarizerTime: 0,
      promptTime: 0,
      totalRequests: 0,
    };
  }

  // Check availability of built-in AI APIs
  async checkAvailability() {
    console.log("Checking built-in AI API availability...");
    console.log("Chrome version:", navigator.userAgent);
    console.log("Window.ai exists:", "ai" in window);

    // First check if window.ai exists at all (Chrome Nano API)
    if (!("ai" in window)) {
      console.warn(
        "window.ai is not available - Chrome Nano AI APIs not supported"
      );
      this.availableAPIs = {
        summarizer: false,
        prompt: false,
        translator: false,
        languageDetector: false,
        writer: false,
        rewriter: false,
        proofreader: false,
      };
      this.isAvailable = false;
      return this.availableAPIs;
    }

    console.log("window.ai is available, checking individual APIs...");
    console.log("Available AI APIs:", Object.keys(window.ai));

    const checks = await Promise.allSettled([
      this.checkSummarizerAPI(),
      this.checkPromptAPI(),
      this.checkTranslatorAPI(),
      this.checkLanguageDetectorAPI(),
      this.checkWriterAPI(),
      this.checkRewriterAPI(),
      this.checkProofreaderAPI(),
    ]);

    this.availableAPIs = {
      summarizer: checks[0].status === "fulfilled" && checks[0].value,
      prompt: checks[1].status === "fulfilled" && checks[1].value,
      translator: checks[2].status === "fulfilled" && checks[2].value,
      languageDetector: checks[3].status === "fulfilled" && checks[3].value,
      writer: checks[4].status === "fulfilled" && checks[4].value,
      rewriter: checks[5].status === "fulfilled" && checks[5].value,
      proofreader: checks[6].status === "fulfilled" && checks[6].value,
    };

    this.isAvailable = Object.values(this.availableAPIs).some(
      (available) => available
    );

    console.log("Built-in AI API availability:", this.availableAPIs);
    console.log("Overall availability:", this.isAvailable);

    if (!this.isAvailable) {
      console.warn(
        "No built-in AI APIs are available. Extension will use fallback methods."
      );
    }

    return this.availableAPIs;
  }

  // Check Summarizer API availability
  async checkSummarizerAPI() {
    try {
      if ("ai" in window && "summarizer" in window.ai) {
        // Test the API with a simple request
        const testResult = await window.ai.summarizer.summarize({
          text: "This is a test.",
          maxLength: 10,
        });
        console.log("Summarizer API available");
        return true;
      }
    } catch (error) {
      console.log("Summarizer API not available:", error.message);
    }
    return false;
  }

  // Check Prompt API availability (Chrome Extensions only)
  async checkPromptAPI() {
    try {
      if ("ai" in window && "prompt" in window.ai) {
        // Test the API with a simple request
        const testResult = await window.ai.prompt.prompt({
          prompt: "Hello, this is a test.",
        });
        console.log("Prompt API available");
        return true;
      }
    } catch (error) {
      console.log("Prompt API not available:", error.message);
    }
    return false;
  }

  // Check Translator API availability
  async checkTranslatorAPI() {
    try {
      if ("ai" in window && "translator" in window.ai) {
        // Test the API with a simple request
        const testResult = await window.ai.translator.translate({
          text: "Hello",
          targetLanguage: "es",
        });
        console.log("Translator API available");
        return true;
      }
    } catch (error) {
      console.log("Translator API not available:", error.message);
    }
    return false;
  }

  // Check Language Detector API availability
  async checkLanguageDetectorAPI() {
    try {
      if ("ai" in window && "languageDetector" in window.ai) {
        // Test the API with a simple request
        const testResult = await window.ai.languageDetector.detect({
          text: "Hello world",
        });
        console.log("Language Detector API available");
        return true;
      }
    } catch (error) {
      console.log("Language Detector API not available:", error.message);
    }
    return false;
  }

  // Check Writer API availability (Origin trial)
  async checkWriterAPI() {
    try {
      if ("ai" in window && "writer" in window.ai) {
        console.log("Writer API available");
        return true;
      }
    } catch (error) {
      console.log("Writer API not available:", error.message);
    }
    return false;
  }

  // Check Rewriter API availability (Origin trial)
  async checkRewriterAPI() {
    try {
      if ("ai" in window && "rewriter" in window.ai) {
        console.log("Rewriter API available");
        return true;
      }
    } catch (error) {
      console.log("Rewriter API not available:", error.message);
    }
    return false;
  }

  // Check Proofreader API availability (Origin trial)
  async checkProofreaderAPI() {
    try {
      if ("ai" in window && "proofreader" in window.ai) {
        console.log("Proofreader API available");
        return true;
      }
    } catch (error) {
      console.log("Proofreader API not available:", error.message);
    }
    return false;
  }

  // Analyze text structure using built-in AI APIs
  async analyzeTextStructure(text) {
    const startTime = performance.now();

    try {
      // Use Prompt API for content analysis if available
      if (this.availableAPIs.prompt) {
        const analysis = await this.analyzeWithPromptAPI(text);
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

  // Analyze text using Prompt API
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
      const result = await window.ai.prompt.prompt({
        prompt: prompt,
      });

      const analysis = JSON.parse(result);
      analysis.source = "builtin-prompt";
      return analysis;
    } catch (error) {
      console.error("Prompt API analysis failed:", error);
      throw error;
    }
  }

  // Generate summary using built-in Summarizer API
  async generateSummary(text, length = "short") {
    const startTime = performance.now();

    try {
      if (this.availableAPIs.summarizer) {
        const summary = await this.summarizeWithBuiltInAPI(text, length);
        this.performanceMetrics.summarizerTime += performance.now() - startTime;
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

  // Summarize using built-in Summarizer API
  async summarizeWithBuiltInAPI(text, length) {
    // Map length to maxLength
    const lengthMapping = {
      short: 100,
      medium: 200,
      long: 300,
    };

    const maxLength = lengthMapping[length] || 150;

    try {
      const result = await window.ai.summarizer.summarize({
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

  // Generate diagram data using built-in AI APIs
  async generateDiagramData(text, diagramType = "auto") {
    try {
      // First analyze the text structure
      const analysis = await this.analyzeTextStructure(text);

      // Use Prompt API to generate diagram data if available
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

  // Generate diagram data using Prompt API
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
      const result = await window.ai.prompt.prompt({
        prompt: prompt,
      });

      const diagramData = JSON.parse(result);
      diagramData.source = "builtin-prompt";
      return diagramData;
    } catch (error) {
      console.error("Prompt API diagram generation failed:", error);
      throw error;
    }
  }

  // Detect language using built-in Language Detector API
  async detectLanguage(text) {
    try {
      if (this.availableAPIs.languageDetector) {
        const result = await window.ai.languageDetector.detect({
          text: text,
        });
        return {
          language: result.language,
          confidence: result.confidence,
          source: "builtin-language-detector",
        };
      }

      // Fallback to simple heuristic detection
      return this.detectLanguageHeuristic(text);
    } catch (error) {
      console.error("Language detection failed:", error);
      return this.detectLanguageHeuristic(text);
    }
  }

  // Translate text using built-in Translator API
  async translateText(text, targetLanguage) {
    try {
      if (this.availableAPIs.translator) {
        const result = await window.ai.translator.translate({
          text: text,
          targetLanguage: targetLanguage,
        });
        return {
          translatedText: result,
          sourceLanguage: "auto-detected",
          targetLanguage: targetLanguage,
          source: "builtin-translator",
        };
      }

      throw new Error("Translator API not available");
    } catch (error) {
      console.error("Translation failed:", error);
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

  // Simple heuristic language detection
  detectLanguageHeuristic(text) {
    // Very basic language detection based on common words
    const englishWords = [
      "the",
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
    ];
    const spanishWords = [
      "el",
      "la",
      "de",
      "que",
      "y",
      "a",
      "en",
      "un",
      "es",
      "se",
      "no",
      "te",
      "lo",
      "le",
    ];
    const frenchWords = [
      "le",
      "la",
      "de",
      "et",
      "à",
      "un",
      "il",
      "que",
      "ne",
      "se",
      "ce",
      "pas",
      "tout",
    ];

    const words = text.toLowerCase().split(/\s+/);
    const englishCount = words.filter((w) => englishWords.includes(w)).length;
    const spanishCount = words.filter((w) => spanishWords.includes(w)).length;
    const frenchCount = words.filter((w) => frenchWords.includes(w)).length;

    let language = "en";
    let confidence = 0.3;

    if (spanishCount > englishCount && spanishCount > frenchCount) {
      language = "es";
      confidence = Math.min(0.8, (spanishCount / words.length) * 10);
    } else if (frenchCount > englishCount && frenchCount > spanishCount) {
      language = "fr";
      confidence = Math.min(0.8, (frenchCount / words.length) * 10);
    } else if (englishCount > 0) {
      confidence = Math.min(0.8, (englishCount / words.length) * 10);
    }

    return {
      language,
      confidence,
      source: "heuristic",
    };
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      averageSummarizerTime:
        this.performanceMetrics.totalRequests > 0
          ? this.performanceMetrics.summarizerTime /
            this.performanceMetrics.totalRequests
          : 0,
      averagePromptTime:
        this.performanceMetrics.totalRequests > 0
          ? this.performanceMetrics.promptTime /
            this.performanceMetrics.totalRequests
          : 0,
    };
  }

  // Get processor status
  getStatus() {
    return {
      available: this.isAvailable,
      availableAPIs: this.availableAPIs,
      performance: this.performanceMetrics,
      source: "builtin-apis",
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = BuiltInAIProcessor;
} else if (typeof self !== "undefined") {
  self.BuiltInAIProcessor = BuiltInAIProcessor;
}
