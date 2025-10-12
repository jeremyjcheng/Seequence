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
    console.log("=== AI API AVAILABILITY CHECK ===");
    console.log("Content AI Processor: Checking availability...");

    try {
      const availableAPIs = [];
      const diagnosticInfo = {
        chromeVersion: this.getChromeVersion(),
        isSecureContext: window.isSecureContext,
        userAgent: navigator.userAgent,
        deviceMemory: navigator.deviceMemory || "unknown",
        platform: navigator.platform,
      };

      console.log("Diagnostic Info:", diagnosticInfo);

      // Check for Prompt API
      if ("ai" in navigator && "prompt" in navigator.ai) {
        availableAPIs.push("prompt");
        console.log("Found Prompt API");
      } else {
        console.log("Prompt API not available");
      }

      // Check for Summarizer API
      if ("ai" in navigator && "summarizer" in navigator.ai) {
        availableAPIs.push("summarizer");
        console.log("Found Summarizer API");
      } else {
        console.log("Summarizer API not available");
      }

      // Check for Translator API
      if ("ai" in navigator && "translator" in navigator.ai) {
        availableAPIs.push("translator");
        console.log("Found Translator API");
      } else {
        console.log("Translator API not available");
      }

      // Check for Writer API
      if ("ai" in navigator && "writer" in navigator.ai) {
        availableAPIs.push("writer");
        console.log("Found Writer API");
      } else {
        console.log("Writer API not available");
      }

      // Check for window.ai (Chrome Nano)
      if ("ai" in window && "languageModel" in window.ai) {
        availableAPIs.push("window.ai");
        console.log("Found window.ai languageModel");
      } else {
        console.log("window.ai languageModel not available");
      }

      this.availableAPIs = availableAPIs;

      // Always mark as available - skip hardware checks
      this.isAvailable = true;

      console.log("Available APIs:", availableAPIs);
      console.log("Content AI Processor: Available (hardware checks bypassed)");

      // Test actual API calls if any are available
      if (availableAPIs.length > 0) {
        await this.testAPICalls(availableAPIs);
      } else {
        console.log("No AI APIs available - will use heuristic fallback");
        console.log("To enable AI APIs:");
        console.log("   1. Go to chrome://flags/");
        console.log("   2. Enable: #prompt-api-for-gemini-nano");
        console.log("   3. Enable: #optimization-guide-on-device-model");
        console.log("   4. Restart Chrome");
      }

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

  // Get Chrome version from user agent
  getChromeVersion() {
    const userAgent = navigator.userAgent;
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    return chromeMatch ? parseInt(chromeMatch[1]) : 0;
  }

  // Test actual API calls to see if they work
  async testAPICalls(availableAPIs) {
    console.log("Testing actual API calls...");

    for (const api of availableAPIs) {
      try {
        if (api === "window.ai") {
          console.log("Testing window.ai.languageModel.create...");
          const session = await window.ai.languageModel.create({
            temperature: 0.7,
            topK: 40,
          });
          console.log("window.ai test successful");
        } else if (api === "prompt") {
          console.log("Testing navigator.ai.prompt...");
          const result = await navigator.ai.prompt("Test prompt");
          console.log("navigator.ai.prompt test successful");
        } else if (api === "summarizer") {
          console.log("Testing navigator.ai.summarizer...");
          const result = await navigator.ai.summarizer.summarize({
            text: "Test text for summarization",
            maxLength: 50,
          });
          console.log("navigator.ai.summarizer test successful");
        }
      } catch (error) {
        console.log(`${api} test failed:`, error.message);
      }
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
    console.log("AI Processor: Creating heuristic analysis...");
    console.log("AI Processor: Input text length:", text.length);

    const words = text.toLowerCase().split(/\s+/);
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10) // Only meaningful sentences
      .slice(0, 8); // Limit to first 8 sentences

    console.log(
      "AI Processor: Found",
      sentences.length,
      "sentences for analysis"
    );

    // Enhanced content type detection
    let type = "narrative";
    const sequentialWords = [
      "first",
      "second",
      "third",
      "then",
      "next",
      "finally",
      "initially",
      "subsequently",
    ];
    const causalWords = [
      "because",
      "therefore",
      "causes",
      "leads to",
      "results in",
      "due to",
      "as a result",
    ];
    const comparativeWords = [
      "versus",
      "compared",
      "different",
      "similar",
      "unlike",
      "whereas",
      "however",
    ];
    const hierarchicalWords = [
      "includes",
      "contains",
      "consists",
      "comprises",
      "divided into",
      "categorized",
    ];

    if (words.some((w) => sequentialWords.includes(w))) {
      type = "sequential";
      console.log("AI Processor: Detected sequential content");
    } else if (words.some((w) => causalWords.includes(w))) {
      type = "causal";
      console.log("AI Processor: Detected causal content");
    } else if (words.some((w) => comparativeWords.includes(w))) {
      type = "comparative";
      console.log("AI Processor: Detected comparative content");
    } else if (words.some((w) => hierarchicalWords.includes(w))) {
      type = "hierarchical";
      console.log("AI Processor: Detected hierarchical content");
    } else {
      console.log("AI Processor: Defaulting to narrative content");
    }

    // Create meaningful key points (limit to 5 for better diagrams)
    const keyPoints = sentences.slice(0, 5).map((s, index) => ({
      text: s.length > 80 ? s.substring(0, 80) + "..." : s, // Truncate long sentences
      order: index + 1,
      type: "point",
    }));

    // Create relationships based on content type
    const relationships = [];
    if (type === "sequential") {
      for (let i = 0; i < keyPoints.length - 1; i++) {
        relationships.push({
          from: i,
          to: i + 1,
          type: "sequence",
          label: "→",
        });
      }
    } else if (type === "causal") {
      for (let i = 0; i < keyPoints.length - 1; i++) {
        relationships.push({
          from: i,
          to: i + 1,
          type: "causes",
          label: "→",
        });
      }
    } else {
      // Default to simple connections
      for (let i = 0; i < keyPoints.length - 1; i++) {
        relationships.push({
          from: i,
          to: i + 1,
          type: "related",
          label: "→",
        });
      }
    }

    const mainTopic = sentences[0]?.substring(0, 60) + "..." || "Main Topic";

    console.log("AI Processor: Heuristic analysis completed");
    console.log("AI Processor: Analysis result:", {
      type,
      keyPointsCount: keyPoints.length,
      relationshipsCount: relationships.length,
      mainTopic: mainTopic.substring(0, 50) + "...",
    });

    return {
      type,
      confidence: 0.6, // Slightly higher confidence for improved heuristic
      mainTopic,
      keyPoints,
      relationships,
      structure: type,
      source: "heuristic",
    };
  }

  // Generate diagram data
  async generateDiagramData(text, diagramType = "auto") {
    console.log("=== DIAGRAM GENERATION START ===");
    console.log("AI Processor: Starting generateDiagramData");
    console.log("AI Processor: Input text length:", text.length);
    console.log("AI Processor: Diagram type:", diagramType);
    console.log(
      "AI Processor: Input text preview:",
      text.substring(0, 100) + "..."
    );

    try {
      const analysis = await this.analyzeTextStructure(text);
      console.log("AI Processor: Text analysis completed");
      console.log("AI Processor: Analysis result:", {
        type: analysis.type,
        mainTopic: analysis.mainTopic,
        keyPointsCount: analysis.keyPoints?.length || 0,
        source: analysis.source,
      });

      // Add original text to analysis for summarization
      analysis.originalText = text;

      const diagramData = await this.generateDiagramFromAnalysis(
        analysis,
        diagramType
      );
      console.log("AI Processor: Diagram data generated");
      console.log("AI Processor: Diagram data:", {
        title: diagramData.title,
        layout: diagramData.layout,
        nodesCount: diagramData.nodes?.length || 0,
        edgesCount: diagramData.edges?.length || 0,
        type: diagramData.type,
        source: diagramData.source,
        originalTextLength: diagramData.originalText?.length || 0,
      });

      return diagramData;
    } catch (error) {
      console.error("AI Processor: Diagram generation failed:", error);
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
      originalText: analysis.originalText, // Add original text for summarization
    };
  }

  // Generate summary using available APIs
  async generateSummary(text, length = "short") {
    console.log("=== SUMMARY GENERATION START ===");
    console.log("AI Processor: Starting generateSummary");
    console.log("AI Processor: Input text length:", text.length);
    console.log("AI Processor: Requested length:", length);
    console.log("AI Processor: Available APIs:", this.availableAPIs);
    console.log(
      "AI Processor: Input text preview:",
      text.substring(0, 100) + "..."
    );

    const startTime = performance.now();

    try {
      // Always try AI APIs first, regardless of hardware checks
      // Try Summarizer API first
      if (this.availableAPIs.includes("summarizer")) {
        try {
          console.log("AI Processor: Trying Summarizer API...");
          const result = await this.summarizeWithSummarizerAPI(text, length);
          console.log("AI Processor: Summarizer API SUCCESS!");
          console.log(
            "AI Processor: Summary result:",
            result.summary.substring(0, 100) + "..."
          );
          return result;
        } catch (error) {
          console.log("AI Processor: Summarizer API failed:", error.message);
        }
      } else {
        console.log("AI Processor: Summarizer API not available");
      }

      // Try Prompt API
      if (this.availableAPIs.includes("prompt")) {
        try {
          console.log("AI Processor: Trying Prompt API...");
          const result = await this.summarizeWithPromptAPI(text, length);
          console.log("AI Processor: Prompt API SUCCESS!");
          console.log(
            "AI Processor: Summary result:",
            result.summary.substring(0, 100) + "..."
          );
          return result;
        } catch (error) {
          console.log("AI Processor: Prompt API failed:", error.message);
        }
      } else {
        console.log("AI Processor: Prompt API not available");
      }

      // Try window.ai if available
      if (this.availableAPIs.includes("window.ai")) {
        try {
          console.log("AI Processor: Trying window.ai...");
          const result = await this.summarizeWithWindowAI(text, length);
          console.log("AI Processor: window.ai SUCCESS!");
          console.log(
            "AI Processor: Summary result:",
            result.summary.substring(0, 100) + "..."
          );
          return result;
        } catch (error) {
          console.log("AI Processor: window.ai failed:", error.message);
        }
      } else {
        console.log("AI Processor: window.ai not available");
      }

      // Fallback to heuristic
      console.log(
        "AI Processor: All AI APIs failed or not available, using heuristic fallback"
      );
      const heuristicResult = await this.summarizeHeuristic(text, length);
      console.log("AI Processor: Heuristic summary generated");
      console.log(
        "AI Processor: Heuristic result:",
        heuristicResult.summary.substring(0, 100) + "..."
      );
      return heuristicResult;
    } catch (error) {
      console.error(
        "AI Processor: Critical error during summary generation:",
        error
      );
      const heuristicResult = await this.summarizeHeuristic(text, length);
      console.log(
        "AI Processor: Fallback heuristic result:",
        heuristicResult.summary.substring(0, 100) + "..."
      );
      return heuristicResult;
    } finally {
      const responseTime = performance.now() - startTime;
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.averageResponseTime =
        this.performanceMetrics.totalResponseTime /
        this.performanceMetrics.totalRequests;
      console.log(
        "AI Processor: Summary generation completed in",
        responseTime.toFixed(2),
        "ms"
      );
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
    console.log("AI Processor: Creating heuristic summary...");
    console.log("AI Processor: Input text length:", text.length);

    // Split into sentences and clean them up
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10) // Only sentences with more than 10 characters
      .slice(0, 10); // Limit to first 10 sentences to avoid too much text

    console.log("AI Processor: Found", sentences.length, "sentences");

    let summary;
    if (length === "short") {
      // For short summary, create a smart summary from key information
      const firstSentence = sentences[0] || "";

      if (firstSentence.length > 100) {
        // Extract key information from the first sentence
        const words = firstSentence.split(" ");

        // Find the most important words (nouns, adjectives, proper nouns)
        const importantWords = words.filter((word) => {
          const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
          return (
            cleanWord.length > 3 &&
            ![
              "that",
              "this",
              "with",
              "from",
              "they",
              "have",
              "been",
              "were",
              "said",
              "will",
              "and",
              "the",
              "are",
              "was",
              "has",
              "had",
              "his",
              "her",
              "him",
              "she",
              "he",
              "it",
              "its",
              "our",
              "their",
              "them",
              "these",
              "those",
            ].includes(cleanWord)
          );
        });

        // Take first 12-15 important words for a concise summary
        const keyWords = importantWords.slice(0, 15);
        summary = keyWords.join(" ") + "...";
        console.log("AI Processor: Short summary created (smart extraction)");
      } else {
        summary = firstSentence;
        console.log("AI Processor: Short summary created (first sentence)");
      }
    } else if (length === "medium") {
      // For medium summary, combine key parts from first 2 sentences
      const firstTwo = sentences.slice(0, 2);
      if (firstTwo.length >= 2) {
        const first =
          firstTwo[0].length > 100
            ? firstTwo[0].substring(0, 100) + "..."
            : firstTwo[0];
        const second =
          firstTwo[1].length > 80
            ? firstTwo[1].substring(0, 80) + "..."
            : firstTwo[1];
        summary = first + " " + second;
        console.log("AI Processor: Medium summary created (combined)");
      } else {
        summary = firstTwo[0] || "";
        console.log("AI Processor: Medium summary created (single sentence)");
      }
    } else {
      // For long summary, take first 3 sentences with smart truncation
      const firstThree = sentences.slice(0, 3);
      const summaryParts = firstThree.map((sentence) =>
        sentence.length > 120 ? sentence.substring(0, 120) + "..." : sentence
      );
      summary = summaryParts.join(" ");
      console.log("AI Processor: Long summary created (smart truncation)");
    }

    // Final length check
    if (summary.length > 300) {
      summary = summary.substring(0, 300) + "...";
    }

    console.log(
      "AI Processor: Final heuristic summary length:",
      summary.length
    );
    console.log(
      "AI Processor: Heuristic summary preview:",
      summary.substring(0, 100) + "..."
    );

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

  // Rewrite text using available APIs
  async rewriteText(prompt) {
    console.log("=== REWRITE TEXT START ===");
    console.log("AI Processor: Starting rewriteText");
    console.log("AI Processor: Prompt length:", prompt.length);
    console.log("AI Processor: Available APIs:", this.availableAPIs);
    console.log(
      "AI Processor: Prompt preview:",
      prompt.substring(0, 100) + "..."
    );

    const startTime = performance.now();

    try {
      // Always try AI APIs first, regardless of hardware checks
      // Try Prompt API first
      if (this.availableAPIs.includes("prompt")) {
        try {
          console.log("AI Processor: Trying Prompt API...");
          const result = await this.rewriteWithPromptAPI(prompt);
          console.log("AI Processor: Prompt API SUCCESS!");
          console.log(
            "AI Processor: Rewrite result:",
            result.rewrittenText.substring(0, 100) + "..."
          );
          return result;
        } catch (error) {
          console.log("AI Processor: Prompt API failed:", error.message);
        }
      } else {
        console.log("AI Processor: Prompt API not available");
      }

      // Try window.ai if available
      if (this.availableAPIs.includes("window.ai")) {
        try {
          console.log("AI Processor: Trying window.ai...");
          const result = await this.rewriteWithWindowAI(prompt);
          console.log("AI Processor: window.ai SUCCESS!");
          console.log(
            "AI Processor: Rewrite result:",
            result.rewrittenText.substring(0, 100) + "..."
          );
          return result;
        } catch (error) {
          console.log("AI Processor: window.ai failed:", error.message);
        }
      } else {
        console.log("AI Processor: window.ai not available");
      }

      // Try Summarizer API as fallback
      if (this.availableAPIs.includes("summarizer")) {
        try {
          console.log("AI Processor: Trying Summarizer API...");
          const result = await this.rewriteWithSummarizerAPI(prompt);
          console.log("AI Processor: Summarizer API SUCCESS!");
          console.log(
            "AI Processor: Rewrite result:",
            result.rewrittenText.substring(0, 100) + "..."
          );
          return result;
        } catch (error) {
          console.log("AI Processor: Summarizer API failed:", error.message);
        }
      } else {
        console.log("AI Processor: Summarizer API not available");
      }

      // Fallback to heuristic rewriting
      console.log(
        "AI Processor: All AI APIs failed or not available, using heuristic fallback"
      );
      const heuristicResult = await this.rewriteHeuristic(prompt);
      console.log("AI Processor: Heuristic rewrite generated");
      console.log(
        "AI Processor: Heuristic result:",
        heuristicResult.rewrittenText.substring(0, 100) + "..."
      );
      return heuristicResult;
    } catch (error) {
      console.error(
        "AI Processor: Critical error during text rewriting:",
        error
      );
      const heuristicResult = await this.rewriteHeuristic(prompt);
      console.log(
        "AI Processor: Fallback heuristic result:",
        heuristicResult.rewrittenText.substring(0, 100) + "..."
      );
      return heuristicResult;
    } finally {
      const responseTime = performance.now() - startTime;
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.averageResponseTime =
        this.performanceMetrics.totalResponseTime /
        this.performanceMetrics.totalRequests;
      console.log(
        "AI Processor: Text rewriting completed in",
        responseTime.toFixed(2),
        "ms"
      );
    }
  }

  // Rewrite using Prompt API
  async rewriteWithPromptAPI(prompt) {
    try {
      const result = await navigator.ai.prompt(prompt);
      return {
        rewrittenText: result,
        source: "prompt-api",
      };
    } catch (error) {
      console.error("Prompt API rewrite failed:", error);
      throw error;
    }
  }

  // Rewrite using window.ai
  async rewriteWithWindowAI(prompt) {
    if (!this.session) {
      this.session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });
    }

    try {
      const result = await this.session.prompt(prompt);
      return {
        rewrittenText: result,
        source: "window.ai",
      };
    } catch (error) {
      console.error("window.ai rewrite failed:", error);
      throw error;
    }
  }

  // Rewrite using Summarizer API (fallback approach)
  async rewriteWithSummarizerAPI(prompt) {
    try {
      // Extract text from prompt (everything after "Rewrite this text:")
      const textMatch = prompt.match(/Rewrite this text:\s*(.+)/s);
      const text = textMatch ? textMatch[1] : prompt;
      
      // Use summarizer to get a simplified version
      const summary = await navigator.ai.summarizer.summarize({
        text: text,
        maxLength: Math.min(text.length, 500),
      });

      return {
        rewrittenText: summary,
        source: "summarizer-api",
      };
    } catch (error) {
      console.error("Summarizer API rewrite failed:", error);
      throw error;
    }
  }

  // Heuristic rewrite fallback
  async rewriteHeuristic(prompt) {
    console.log("AI Processor: Creating heuristic rewrite...");
    console.log("AI Processor: Prompt length:", prompt.length);

    // Extract text from prompt (everything after "Rewrite this text:")
    const textMatch = prompt.match(/Rewrite this text:\s*(.+)/s);
    const text = textMatch ? textMatch[1] : prompt;

    // Simple text processing
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .slice(0, 5);

    // Basic rewriting: simplify sentences
    const rewritten = sentences.map((sentence) => {
      let simplified = sentence;
      
      // Replace complex words with simpler ones
      simplified = simplified.replace(/\b(utilize|utilise)\b/g, "use");
      simplified = simplified.replace(/\b(commence)\b/g, "start");
      simplified = simplified.replace(/\b(terminate)\b/g, "end");
      simplified = simplified.replace(/\b(consequently)\b/g, "so");
      simplified = simplified.replace(/\b(furthermore)\b/g, "also");
      simplified = simplified.replace(/\b(however)\b/g, "but");
      
      // Break down long sentences
      if (simplified.length > 100) {
        simplified = simplified.replace(/,/g, ". ");
      }
      
      return simplified;
    });

    const result = rewritten.join(". ").trim() + ".";

    console.log(
      "AI Processor: Final heuristic rewrite length:",
      result.length
    );
    console.log(
      "AI Processor: Heuristic rewrite preview:",
      result.substring(0, 100) + "..."
    );

    return {
      rewrittenText: result,
      source: "heuristic",
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

// Bridge: listen for requests from the content script (isolated world) and respond via postMessage
window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.__seequence !== true) return;

  const requestId = data.requestId;
  try {
    if (data.action === "checkAvailability") {
      await window.contentAIProcessor.checkAvailability();
      window.postMessage(
        {
          __seequence: true,
          type: "response",
          requestId,
          success: true,
          data: window.contentAIProcessor.getStatus(),
        },
        "*"
      );
    } else if (data.action === "analyze") {
      const diagramData = await window.contentAIProcessor.generateDiagramData(
        data.text,
        data.diagramType
      );
      window.postMessage(
        {
          __seequence: true,
          type: "response",
          requestId,
          success: true,
          data: diagramData,
        },
        "*"
      );
    } else if (data.action === "summarize") {
      const summary = await window.contentAIProcessor.generateSummary(
        data.text,
        data.length
      );
      window.postMessage(
        {
          __seequence: true,
          type: "response",
          requestId,
          success: true,
          data: summary,
        },
        "*"
      );
    } else if (data.action === "rewrite") {
      const rewrite = await window.contentAIProcessor.rewriteText(
        data.prompt
      );
      window.postMessage(
        {
          __seequence: true,
          type: "response",
          requestId,
          success: true,
          data: rewrite,
        },
        "*"
      );
    }
  } catch (error) {
    window.postMessage(
      {
        __seequence: true,
        type: "response",
        requestId,
        success: false,
        error: error.message,
      },
      "*"
    );
  }
});
