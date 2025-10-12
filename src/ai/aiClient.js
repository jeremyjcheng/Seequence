// AI Client for Seequence Chrome Extension
// Provides a unified interface for Chrome's built-in Gemini Nano AI APIs
// Implements rewrite, summarize, and structure detection functions

import {
  systemPrompts,
  structurePrompts,
  summaryPrompts,
} from "./systemPrompts.js";

class AIClient {
  constructor() {
    this.isAvailable = false;
    this.availableAPIs = {
      prompt: false,
      summarizer: false,
    };
    this.performanceMetrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  // Check if Chrome's built-in AI APIs are available
  async checkAvailability() {
    console.log("AIClient: Checking availability...");

    try {
      // Check for navigator.ai APIs
      if ("ai" in navigator) {
        // Check for Prompt API
        if ("prompt" in navigator.ai) {
          this.availableAPIs.prompt = true;
          console.log("AIClient: Prompt API available");
        }

        // Check for Summarizer API
        if ("summarizer" in navigator.ai) {
          this.availableAPIs.summarizer = true;
          console.log("AIClient: Summarizer API available");
        }
      }

      // Check for window.ai (alternative API)
      if ("ai" in window && "languageModel" in window.ai) {
        this.availableAPIs.prompt = true;
        console.log("AIClient: window.ai languageModel available");
      }

      this.isAvailable =
        this.availableAPIs.prompt || this.availableAPIs.summarizer;

      console.log("AIClient: Available APIs:", this.availableAPIs);
      console.log("AIClient: Overall availability:", this.isAvailable);

      return this.isAvailable;
    } catch (error) {
      console.error("AIClient: Error checking availability:", error);
      this.isAvailable = false;
      return false;
    }
  }

  // Rewrite text using system prompts (Mochi-style approach)
  async rewriteText(text, category = "textClarity", level = 3) {
    console.log(
      `AIClient: Rewriting text with category: ${category}, level: ${level}`
    );

    const startTime = performance.now();

    try {
      // Get the appropriate system prompt
      const promptInstruction = systemPrompts[category]?.[level];
      if (!promptInstruction) {
        throw new Error(`Invalid category or level: ${category}, ${level}`);
      }

      const fullPrompt = `${promptInstruction}\n\nRewrite this text:\n${text}`;

      // Try different AI APIs
      if (this.availableAPIs.prompt) {
        try {
          const result = await this.rewriteWithPromptAPI(fullPrompt);
          this.updateMetrics(startTime);
          return result;
        } catch (error) {
          console.log(
            "AIClient: Prompt API failed, trying fallback:",
            error.message
          );
        }
      }

      if (this.availableAPIs.summarizer) {
        try {
          const result = await this.rewriteWithSummarizerAPI(
            text,
            category,
            level
          );
          this.updateMetrics(startTime);
          return result;
        } catch (error) {
          console.log(
            "AIClient: Summarizer API failed, trying fallback:",
            error.message
          );
        }
      }

      // Fallback to basic rewriting
      console.log("AIClient: Using fallback rewriting");
      const result = this.basicRewrite(text, category, level);
      this.updateMetrics(startTime);
      return result;
    } catch (error) {
      console.error("AIClient: Error rewriting text:", error);
      this.updateMetrics(startTime);
      return this.basicRewrite(text, category, level);
    }
  }

  // Rewrite using Prompt API
  async rewriteWithPromptAPI(prompt) {
    if ("ai" in navigator && "prompt" in navigator.ai) {
      const result = await navigator.ai.prompt(prompt);
      return {
        rewrittenText: result,
        source: "prompt-api",
      };
    } else if ("ai" in window && "languageModel" in window.ai) {
      const session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });
      const result = await session.prompt(prompt);
      return {
        rewrittenText: result,
        source: "window.ai",
      };
    } else {
      throw new Error("Prompt API not available");
    }
  }

  // Rewrite using Summarizer API (fallback approach)
  async rewriteWithSummarizerAPI(text, category, level) {
    // Use summarizer to get a simplified version, then apply basic rewriting
    const summary = await navigator.ai.summarizer.summarize({
      text: text,
      maxLength: Math.min(text.length, 500),
    });

    const rewrittenText = this.basicRewrite(
      summary,
      category,
      level
    ).rewrittenText;

    return {
      rewrittenText: rewrittenText,
      source: "summarizer-api",
    };
  }

  // Basic rewriting fallback
  basicRewrite(text, category, level) {
    console.log("AIClient: Using basic rewriting fallback");

    // Simple text processing based on category and level
    let processedText = text;

    if (category === "textClarity") {
      // Simplify sentences
      processedText = this.simplifySentences(text, level);
    } else if (category === "textFocus") {
      // Extract key points
      processedText = this.extractKeyPoints(text, level);
    } else if (category === "textPattern") {
      // Organize by structure
      processedText = this.organizeByStructure(text, level);
    }

    return {
      rewrittenText: processedText,
      source: "fallback",
    };
  }

  // Simplify sentences for clarity
  simplifySentences(text, level) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const simplified = sentences.map((sentence) => {
      let simplified = sentence.trim();

      if (level >= 2) {
        // Break down complex sentences
        simplified = simplified.replace(/,/g, ". ");
      }

      if (level >= 3) {
        // Use simpler words (basic implementation)
        simplified = simplified.replace(/\b(utilize|utilize)\b/g, "use");
        simplified = simplified.replace(/\b(commence)\b/g, "start");
        simplified = simplified.replace(/\b(terminate)\b/g, "end");
      }

      return simplified;
    });

    return simplified.join(". ").trim() + ".";
  }

  // Extract key points for focus
  extractKeyPoints(text, level) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    if (level >= 2) {
      // Use bullet points
      return sentences.map((s) => `• ${s.trim()}`).join("\n");
    } else {
      // Just return first few sentences
      return sentences.slice(0, Math.min(3, sentences.length)).join(". ") + ".";
    }
  }

  // Organize by structure for pattern
  organizeByStructure(text, level) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    if (level >= 2) {
      // Add structure indicators
      return sentences
        .map((s, index) => {
          if (index === 0) return `1. ${s.trim()}`;
          if (index === 1) return `2. ${s.trim()}`;
          if (index === 2) return `3. ${s.trim()}`;
          return `${index + 1}. ${s.trim()}`;
        })
        .join("\n");
    } else {
      return sentences.join(". ") + ".";
    }
  }

  // Summarize text using Chrome's built-in APIs
  async summarizeText(text, style = "short") {
    console.log(`AIClient: Summarizing text with style: ${style}`);

    const startTime = performance.now();

    try {
      // Try Summarizer API first
      if (this.availableAPIs.summarizer) {
        try {
          const result = await this.summarizeWithSummarizerAPI(text, style);
          this.updateMetrics(startTime);
          return result;
        } catch (error) {
          console.log(
            "AIClient: Summarizer API failed, trying fallback:",
            error.message
          );
        }
      }

      // Try Prompt API
      if (this.availableAPIs.prompt) {
        try {
          const result = await this.summarizeWithPromptAPI(text, style);
          this.updateMetrics(startTime);
          return result;
        } catch (error) {
          console.log(
            "AIClient: Prompt API failed, trying fallback:",
            error.message
          );
        }
      }

      // Fallback to basic summarization
      console.log("AIClient: Using fallback summarization");
      const result = this.basicSummarize(text, style);
      this.updateMetrics(startTime);
      return result;
    } catch (error) {
      console.error("AIClient: Error summarizing text:", error);
      this.updateMetrics(startTime);
      return this.basicSummarize(text, style);
    }
  }

  // Summarize using Summarizer API
  async summarizeWithSummarizerAPI(text, style) {
    const maxLength = style === "short" ? 100 : style === "medium" ? 200 : 300;

    const summary = await navigator.ai.summarizer.summarize({
      text: text,
      maxLength: maxLength,
    });

    return {
      summary: summary,
      source: "summarizer-api",
    };
  }

  // Summarize using Prompt API
  async summarizeWithPromptAPI(text, style) {
    const prompt = `${summaryPrompts[style]}\n\n${text}`;

    if ("ai" in navigator && "prompt" in navigator.ai) {
      const result = await navigator.ai.prompt(prompt);
      return {
        summary: result,
        source: "prompt-api",
      };
    } else if ("ai" in window && "languageModel" in window.ai) {
      const session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });
      const result = await session.prompt(prompt);
      return {
        summary: result,
        source: "window.ai",
      };
    } else {
      throw new Error("Prompt API not available");
    }
  }

  // Basic summarization fallback
  basicSummarize(text, style) {
    console.log("AIClient: Using basic summarization fallback");

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    let summaryLength;

    switch (style) {
      case "short":
        summaryLength = 1;
        break;
      case "medium":
        summaryLength = 2;
        break;
      case "long":
        summaryLength = 3;
        break;
      default:
        summaryLength = 2;
    }

    const summary = sentences.slice(0, summaryLength).join(". ").trim();
    return {
      summary: summary + (summary.endsWith(".") ? "" : "."),
      source: "fallback",
    };
  }

  // Detect text structure using AI
  async detectStructure(text) {
    console.log("AIClient: Detecting text structure");

    const startTime = performance.now();

    try {
      // Try Prompt API first
      if (this.availableAPIs.prompt) {
        try {
          const result = await this.detectStructureWithPromptAPI(text);
          this.updateMetrics(startTime);
          return result;
        } catch (error) {
          console.log(
            "AIClient: Prompt API failed, trying fallback:",
            error.message
          );
        }
      }

      // Fallback to heuristic detection
      console.log("AIClient: Using fallback structure detection");
      const result = this.basicStructureDetection(text);
      this.updateMetrics(startTime);
      return result;
    } catch (error) {
      console.error("AIClient: Error detecting structure:", error);
      this.updateMetrics(startTime);
      return this.basicStructureDetection(text);
    }
  }

  // Detect structure using Prompt API
  async detectStructureWithPromptAPI(text) {
    const prompt = `${structurePrompts.detect}\n\n${text}`;

    if ("ai" in navigator && "prompt" in navigator.ai) {
      const result = await navigator.ai.prompt(prompt);
      return {
        structure: result.trim().toLowerCase(),
        source: "prompt-api",
      };
    } else if ("ai" in window && "languageModel" in window.ai) {
      const session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });
      const result = await session.prompt(prompt);
      return {
        structure: result.trim().toLowerCase(),
        source: "window.ai",
      };
    } else {
      throw new Error("Prompt API not available");
    }
  }

  // Basic structure detection fallback
  basicStructureDetection(text) {
    console.log("AIClient: Using basic structure detection fallback");

    const words = text.toLowerCase().split(/\s+/);

    // Check for sequential indicators
    const sequentialWords = [
      "first",
      "second",
      "then",
      "next",
      "finally",
      "step",
      "stage",
    ];
    if (words.some((w) => sequentialWords.includes(w))) {
      return { structure: "sequential", source: "fallback" };
    }

    // Check for causal indicators
    const causalWords = [
      "because",
      "therefore",
      "causes",
      "leads to",
      "results in",
    ];
    if (words.some((w) => causalWords.includes(w))) {
      return { structure: "causal", source: "fallback" };
    }

    // Check for comparative indicators
    const comparativeWords = [
      "versus",
      "compared",
      "different",
      "similar",
      "however",
    ];
    if (words.some((w) => comparativeWords.includes(w))) {
      return { structure: "comparative", source: "fallback" };
    }

    // Check for hierarchical indicators
    const hierarchicalWords = [
      "includes",
      "contains",
      "categories",
      "types",
      "levels",
    ];
    if (words.some((w) => hierarchicalWords.includes(w))) {
      return { structure: "hierarchical", source: "fallback" };
    }

    // Default to narrative
    return { structure: "narrative", source: "fallback" };
  }

  // Update performance metrics
  updateMetrics(startTime) {
    const responseTime = performance.now() - startTime;
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.totalResponseTime += responseTime;
    this.performanceMetrics.averageResponseTime =
      this.performanceMetrics.totalResponseTime /
      this.performanceMetrics.totalRequests;
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      isAvailable: this.isAvailable,
      availableAPIs: this.availableAPIs,
    };
  }

  // Get client status
  getStatus() {
    return {
      available: this.isAvailable,
      availableAPIs: this.availableAPIs,
      performance: this.performanceMetrics,
      source: "ai-client",
    };
  }
}

// Export for use in other modules
export default AIClient;
