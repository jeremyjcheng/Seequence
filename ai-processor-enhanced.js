// Enhanced AI Processor for Seequence - Hybrid On-Device + Server-Side AI
// Optimized for hackathon requirements with enhanced on-device capabilities

class EnhancedAIProcessor {
  constructor() {
    this.session = null;
    this.isAvailable = false;
    this.offlineMode = false;
    this.modelCache = new Map();
    this.processingQueue = [];
    this.performanceMetrics = {
      onDeviceTime: 0,
      serverTime: 0,
      hybridTime: 0,
      accuracy: 0
    };
  }

  // Enhanced availability check with multiple AI sources
  async checkAvailability() {
    const availability = {
      chromeAI: false,
      webAssembly: false,
      serverAI: false,
      offline: true
    };

    // Check Chrome AI API
    try {
      if (self.ai && self.ai.languageModel) {
        const capabilities = await self.ai.languageModel.capabilities();
        availability.chromeAI = capabilities.available !== "no";
        console.log("Chrome AI API available:", availability.chromeAI);
      }
    } catch (error) {
      console.log("Chrome AI API not available:", error.message);
    }

    // Check WebAssembly support for on-device models
    try {
      availability.webAssembly = typeof WebAssembly !== 'undefined';
      if (availability.webAssembly) {
        // Test WebAssembly instantiation
        const wasmModule = new WebAssembly.Module(new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
        console.log("WebAssembly support confirmed");
      }
    } catch (error) {
      console.log("WebAssembly not available:", error.message);
    }

    // Check server AI availability
    try {
      const response = await fetch('http://localhost:8080/health', {
        method: 'GET',
        timeout: 2000
      });
      availability.serverAI = response.ok;
      console.log("Server AI available:", availability.serverAI);
    } catch (error) {
      console.log("Server AI not available:", error.message);
    }

    this.isAvailable = availability.chromeAI || availability.webAssembly || availability.serverAI;
    this.offlineMode = !availability.serverAI && (availability.chromeAI || availability.webAssembly);
    
    return availability;
  }

  // Intelligent AI mode selection based on content complexity and availability
  async selectAIMode(text, taskType = 'analysis') {
    const availability = await this.checkAvailability();
    const textComplexity = this.assessTextComplexity(text);
    
    // Decision matrix for AI mode selection
    if (textComplexity.simple && availability.chromeAI) {
      return { mode: 'onDevice', reason: 'Simple content, Chrome AI available' };
    } else if (textComplexity.complex && availability.serverAI) {
      return { mode: 'hybrid', reason: 'Complex content, server AI available' };
    } else if (availability.chromeAI) {
      return { mode: 'onDevice', reason: 'Chrome AI available, fallback to on-device' };
    } else if (availability.webAssembly) {
      return { mode: 'webAssembly', reason: 'WebAssembly models available' };
    } else {
      return { mode: 'heuristic', reason: 'No AI available, using heuristic fallback' };
    }
  }

  // Assess text complexity for intelligent processing decisions
  assessTextComplexity(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).length;
    
    // Complexity indicators
    const hasTechnicalTerms = /[A-Z]{2,}|[0-9]+%|[a-z]+-[a-z]+/g.test(text);
    const hasComplexStructure = /(first|second|third|then|next|finally|however|therefore|moreover)/gi.test(text);
    const hasNumbers = /[0-9]+/g.test(text);
    
    const complexityScore = 
      (words > 500 ? 3 : words > 200 ? 2 : 1) +
      (sentences > 10 ? 2 : 1) +
      (paragraphs > 3 ? 2 : 1) +
      (hasTechnicalTerms ? 2 : 0) +
      (hasComplexStructure ? 2 : 0) +
      (hasNumbers ? 1 : 0);

    return {
      score: complexityScore,
      simple: complexityScore <= 5,
      moderate: complexityScore > 5 && complexityScore <= 10,
      complex: complexityScore > 10,
      words,
      sentences,
      paragraphs
    };
  }

  // Enhanced text analysis with hybrid approach
  async analyzeTextStructure(text) {
    const startTime = performance.now();
    const aiMode = await this.selectAIMode(text, 'analysis');
    
    console.log(`Using AI mode: ${aiMode.mode} - ${aiMode.reason}`);

    let analysis;
    try {
      switch (aiMode.mode) {
        case 'onDevice':
          analysis = await this.analyzeOnDevice(text);
          this.performanceMetrics.onDeviceTime += performance.now() - startTime;
          break;
        case 'hybrid':
          analysis = await this.analyzeHybrid(text);
          this.performanceMetrics.hybridTime += performance.now() - startTime;
          break;
        case 'webAssembly':
          analysis = await this.analyzeWithWebAssembly(text);
          this.performanceMetrics.onDeviceTime += performance.now() - startTime;
          break;
        default:
          analysis = await this.analyzeHeuristic(text);
          this.performanceMetrics.onDeviceTime += performance.now() - startTime;
      }
    } catch (error) {
      console.error(`Error in ${aiMode.mode} analysis:`, error);
      // Fallback to heuristic analysis
      analysis = await this.analyzeHeuristic(text);
    }

    // Cache results for similar content
    this.cacheAnalysis(text, analysis);
    
    return analysis;
  }

  // On-device analysis using Chrome AI API
  async analyzeOnDevice(text) {
    if (!this.session) {
      await this.initializeChromeAI();
    }

    const prompt = `Analyze this text and extract its structure. Return JSON with:
    - "type": content type (causal, sequential, comparative, hierarchical, narrative)
    - "mainTopic": main subject (max 50 chars)
    - "keyPoints": array of main ideas (max 5, each max 100 chars)
    - "relationships": array of relationships between points
    - "structure": overall organization pattern
    - "confidence": analysis confidence (0-1)

    Text: "${text.substring(0, 2000)}"

    Return only valid JSON.`;

    const result = await this.session.prompt(prompt);
    const analysis = JSON.parse(result);
    analysis.source = 'chromeAI';
    return analysis;
  }

  // Hybrid analysis combining on-device and server-side processing
  async analyzeHybrid(text) {
    // Start with on-device preprocessing
    const onDeviceAnalysis = await this.analyzeOnDevice(text);
    
    // Enhance with server-side analysis for complex content
    try {
      const serverResponse = await fetch('http://localhost:8080/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (serverResponse.ok) {
        const serverAnalysis = await serverResponse.json();
        if (serverAnalysis.success) {
          // Merge on-device and server analysis
          const hybridAnalysis = this.mergeAnalyses(onDeviceAnalysis, serverAnalysis.analysis);
          hybridAnalysis.source = 'hybrid';
          return hybridAnalysis;
        }
      }
    } catch (error) {
      console.log("Server analysis failed, using on-device result:", error.message);
    }

    return onDeviceAnalysis;
  }

  // WebAssembly-based analysis (placeholder for future implementation)
  async analyzeWithWebAssembly(text) {
    // This would use WebAssembly-compiled models for on-device processing
    // For now, fallback to heuristic analysis
    console.log("WebAssembly analysis not yet implemented, using heuristic fallback");
    return await this.analyzeHeuristic(text);
  }

  // Enhanced heuristic analysis with improved algorithms
  async analyzeHeuristic(text) {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Enhanced content type detection
    const typeScores = {
      causal: this.calculateCausalScore(words),
      sequential: this.calculateSequentialScore(words),
      comparative: this.calculateComparativeScore(words),
      hierarchical: this.calculateHierarchicalScore(words),
      narrative: this.calculateNarrativeScore(words)
    };

    const detectedType = Object.keys(typeScores).reduce((a, b) => 
      typeScores[a] > typeScores[b] ? a : b
    );

    // Enhanced key point extraction
    const keyPoints = this.extractKeyPoints(sentences, detectedType);
    
    // Generate relationships based on content type
    const relationships = this.generateRelationships(keyPoints, detectedType);

    return {
      type: detectedType,
      confidence: Math.min(0.9, typeScores[detectedType] / 10),
      mainTopic: sentences[0]?.substring(0, 50) + "..." || "Main Topic",
      keyPoints,
      relationships,
      structure: detectedType,
      source: 'heuristic'
    };
  }

  // Enhanced scoring algorithms for content type detection
  calculateCausalScore(words) {
    const causalKeywords = [
      'because', 'therefore', 'causes', 'leads to', 'results in', 'due to',
      'as a result', 'consequently', 'hence', 'thus', 'so', 'if', 'then'
    ];
    return words.filter(w => causalKeywords.includes(w)).length;
  }

  calculateSequentialScore(words) {
    const sequentialKeywords = [
      'first', 'second', 'third', 'then', 'next', 'finally', 'step',
      'stage', 'phase', 'after', 'before', 'initially', 'subsequently',
      'meanwhile', 'during', 'while', 'until', 'once'
    ];
    return words.filter(w => sequentialKeywords.includes(w)).length;
  }

  calculateComparativeScore(words) {
    const comparativeKeywords = [
      'versus', 'compared to', 'different', 'similar', 'contrast',
      'however', 'whereas', 'unlike', 'like', 'both', 'either',
      'neither', 'on the other hand', 'in contrast', 'similarly'
    ];
    return words.filter(w => comparativeKeywords.includes(w)).length;
  }

  calculateHierarchicalScore(words) {
    const hierarchicalKeywords = [
      'includes', 'contains', 'categories', 'types', 'levels',
      'class', 'group', 'category', 'kind', 'sort', 'variety',
      'subcategory', 'main', 'primary', 'secondary', 'tertiary'
    ];
    return words.filter(w => hierarchicalKeywords.includes(w)).length;
  }

  calculateNarrativeScore(words) {
    const narrativeKeywords = [
      'born', 'died', 'started', 'ended', 'began', 'finished',
      'year', 'decade', 'century', 'era', 'period', 'time',
      'story', 'tale', 'narrative', 'account', 'history'
    ];
    return words.filter(w => narrativeKeywords.includes(w)).length;
  }

  // Enhanced key point extraction
  extractKeyPoints(sentences, contentType) {
    return sentences
      .slice(0, 6)
      .map(s => s.trim())
      .filter(s => s.length > 15)
      .map((s, index) => ({
        text: s,
        order: index + 1,
        type: this.getPointType(contentType),
        importance: this.calculateImportance(s, contentType)
      }));
  }

  getPointType(contentType) {
    const typeMapping = {
      sequential: 'step',
      causal: 'cause',
      comparative: 'comparison',
      hierarchical: 'category',
      narrative: 'event'
    };
    return typeMapping[contentType] || 'point';
  }

  calculateImportance(sentence, contentType) {
    // Simple importance scoring based on sentence characteristics
    let score = 1;
    if (sentence.length > 50) score += 1;
    if (/[A-Z]{2,}/.test(sentence)) score += 1; // Contains acronyms
    if (/[0-9]+/.test(sentence)) score += 1; // Contains numbers
    if (sentence.includes('important') || sentence.includes('key') || sentence.includes('main')) score += 2;
    return Math.min(5, score);
  }

  // Generate relationships between key points
  generateRelationships(keyPoints, contentType) {
    const relationships = [];
    for (let i = 0; i < keyPoints.length - 1; i++) {
      let relationshipType = 'related';
      let label = '→';
      
      switch (contentType) {
        case 'sequential':
          relationshipType = 'sequence';
          label = '→';
          break;
        case 'causal':
          relationshipType = 'causal';
          label = '→';
          break;
        case 'comparative':
          relationshipType = 'comparison';
          label = '↔';
          break;
        case 'hierarchical':
          relationshipType = 'hierarchy';
          label = '↓';
          break;
        default:
          relationshipType = 'related';
          label = '—';
      }

      relationships.push({
        from: i,
        to: i + 1,
        type: relationshipType,
        label
      });
    }
    return relationships;
  }

  // Merge on-device and server analysis results
  mergeAnalyses(onDevice, server) {
    return {
      type: server.contentType || onDevice.type,
      confidence: Math.max(onDevice.confidence || 0, server.confidence || 0),
      mainTopic: server.mainTopic || onDevice.mainTopic,
      keyPoints: this.mergeKeyPoints(onDevice.keyPoints, server.keyPoints),
      relationships: this.mergeRelationships(onDevice.relationships, server.relationships),
      structure: server.suggestedLayout || onDevice.structure,
      source: 'hybrid'
    };
  }

  mergeKeyPoints(onDevice, server) {
    // Combine and deduplicate key points
    const combined = [...(onDevice || []), ...(server || [])];
    return combined
      .filter((point, index, arr) => 
        arr.findIndex(p => p.text === point.text) === index
      )
      .slice(0, 6)
      .sort((a, b) => (a.importance || 3) - (b.importance || 3));
  }

  mergeRelationships(onDevice, server) {
    // Use server relationships if available, otherwise use on-device
    return server && server.length > 0 ? server : onDevice;
  }

  // Initialize Chrome AI session
  async initializeChromeAI() {
    try {
      this.session = await self.ai.languageModel.create({
        temperature: 0.7,
        topK: 40,
      });
      console.log("Chrome AI session initialized");
    } catch (error) {
      console.error("Failed to initialize Chrome AI session:", error);
      throw error;
    }
  }

  // Cache analysis results for performance
  cacheAnalysis(text, analysis) {
    const textHash = this.hashText(text);
    this.modelCache.set(textHash, {
      analysis,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.modelCache.size > 50) {
      const oldestKey = this.modelCache.keys().next().value;
      this.modelCache.delete(oldestKey);
    }
  }

  // Simple text hashing for cache keys
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheSize: this.modelCache.size,
      offlineMode: this.offlineMode
    };
  }

  // Get processor status
  getStatus() {
    return {
      available: this.isAvailable,
      sessionActive: this.session !== null,
      offlineMode: this.offlineMode,
      cacheSize: this.modelCache.size,
      performance: this.performanceMetrics
    };
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedAIProcessor;
} else if (typeof self !== 'undefined') {
  self.EnhancedAIProcessor = EnhancedAIProcessor;
}
