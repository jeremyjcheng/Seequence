// AI Mode Manager for Seequence - Intelligent Hybrid AI Orchestration
// Manages the intelligent switching between on-device and server-side AI

class AIModeManager {
  constructor() {
    this.modes = {
      onDevice: new EnhancedAIProcessor(),
      wasm: new WASMTextProcessor(),
      server: null, // Will be set when server is available
      heuristic: new HeuristicProcessor()
    };
    
    this.currentMode = null;
    this.availability = {
      chromeAI: false,
      webAssembly: false,
      serverAI: false,
      offline: true
    };
    
    this.performanceHistory = [];
    this.userPreferences = {
      preferOnDevice: true,
      allowServer: true,
      maxLatency: 5000, // 5 seconds
      minAccuracy: 0.7
    };
    
    this.initialized = false;
  }

  // Initialize the AI mode manager
  async initialize() {
    console.log('Initializing AI Mode Manager...');
    
    try {
      // Check availability of all AI modes
      await this.checkAllAvailability();
      
      // Initialize available processors
      await this.initializeProcessors();
      
      // Set default mode based on availability and preferences
      this.currentMode = this.selectOptimalMode();
      
      this.initialized = true;
      console.log(`AI Mode Manager initialized with mode: ${this.currentMode}`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Mode Manager:', error);
      return false;
    }
  }

  // Check availability of all AI processing modes
  async checkAllAvailability() {
    const checks = await Promise.allSettled([
      this.checkChromeAIAvailability(),
      this.checkWebAssemblyAvailability(),
      this.checkServerAvailability(),
      this.checkOfflineCapability()
    ]);

    this.availability = {
      chromeAI: checks[0].status === 'fulfilled' && checks[0].value,
      webAssembly: checks[1].status === 'fulfilled' && checks[1].value,
      serverAI: checks[2].status === 'fulfilled' && checks[2].value,
      offline: checks[3].status === 'fulfilled' && checks[3].value
    };

    console.log('AI Availability Check:', this.availability);
  }

  // Check Chrome AI API availability
  async checkChromeAIAvailability() {
    try {
      if (self.ai && self.ai.languageModel) {
        const capabilities = await self.ai.languageModel.capabilities();
        return capabilities.available !== 'no';
      }
    } catch (error) {
      console.log('Chrome AI not available:', error.message);
    }
    return false;
  }

  // Check WebAssembly availability
  async checkWebAssemblyAvailability() {
    try {
      if (typeof WebAssembly !== 'undefined') {
        // Test WebAssembly instantiation
        const wasmModule = new WebAssembly.Module(new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
        return true;
      }
    } catch (error) {
      console.log('WebAssembly not available:', error.message);
    }
    return false;
  }

  // Check server AI availability
  async checkServerAvailability() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('http://localhost:8080/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Server AI not available:', error.message);
    }
    return false;
  }

  // Check offline capability
  async checkOfflineCapability() {
    // Check if we have any offline processing capabilities
    return this.availability.chromeAI || this.availability.webAssembly;
  }

  // Initialize available processors
  async initializeProcessors() {
    const initPromises = [];

    if (this.availability.chromeAI) {
      initPromises.push(
        this.modes.onDevice.initialize().catch(error => 
          console.error('Failed to initialize on-device processor:', error)
        )
      );
    }

    if (this.availability.webAssembly) {
      initPromises.push(
        this.modes.wasm.initialize().catch(error => 
          console.error('Failed to initialize WASM processor:', error)
        )
      );
    }

    await Promise.allSettled(initPromises);
  }

  // Select optimal AI mode based on content and availability
  selectOptimalMode(content = null, taskType = 'analysis') {
    // If no content provided, use general availability
    if (!content) {
      if (this.userPreferences.preferOnDevice && this.availability.chromeAI) {
        return 'onDevice';
      } else if (this.availability.serverAI && this.userPreferences.allowServer) {
        return 'server';
      } else if (this.availability.webAssembly) {
        return 'wasm';
      } else {
        return 'heuristic';
      }
    }

    // Analyze content complexity
    const complexity = this.assessContentComplexity(content);
    const performance = this.getPerformanceHistory(taskType);

    // Decision matrix based on content complexity and performance history
    if (complexity.simple && this.availability.chromeAI && this.userPreferences.preferOnDevice) {
      return 'onDevice';
    } else if (complexity.complex && this.availability.serverAI && this.userPreferences.allowServer) {
      return 'server';
    } else if (this.availability.webAssembly && performance.wasm > performance.onDevice) {
      return 'wasm';
    } else if (this.availability.chromeAI) {
      return 'onDevice';
    } else if (this.availability.serverAI) {
      return 'server';
    } else {
      return 'heuristic';
    }
  }

  // Assess content complexity for mode selection
  assessContentComplexity(content) {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = content.split(/\n\s*\n/).length;
    
    // Complexity indicators
    const hasTechnicalTerms = /[A-Z]{2,}|[0-9]+%|[a-z]+-[a-z]+/g.test(content);
    const hasComplexStructure = /(first|second|third|then|next|finally|however|therefore|moreover)/gi.test(content);
    const hasNumbers = /[0-9]+/g.test(content);
    const hasCode = /[{}();]/g.test(content);
    
    const complexityScore = 
      (words > 500 ? 3 : words > 200 ? 2 : 1) +
      (sentences > 10 ? 2 : 1) +
      (paragraphs > 3 ? 2 : 1) +
      (hasTechnicalTerms ? 2 : 0) +
      (hasComplexStructure ? 2 : 0) +
      (hasNumbers ? 1 : 0) +
      (hasCode ? 3 : 0);

    return {
      score: complexityScore,
      simple: complexityScore <= 5,
      moderate: complexityScore > 5 && complexityScore <= 10,
      complex: complexityScore > 10,
      words,
      sentences,
      paragraphs,
      indicators: {
        technical: hasTechnicalTerms,
        structured: hasComplexStructure,
        numerical: hasNumbers,
        code: hasCode
      }
    };
  }

  // Get performance history for mode selection
  getPerformanceHistory(taskType) {
    const history = this.performanceHistory.filter(h => h.taskType === taskType);
    
    if (history.length === 0) {
      return { onDevice: 0.5, server: 0.8, wasm: 0.6, heuristic: 0.3 };
    }

    const averages = {};
    ['onDevice', 'server', 'wasm', 'heuristic'].forEach(mode => {
      const modeHistory = history.filter(h => h.mode === mode);
      if (modeHistory.length > 0) {
        averages[mode] = modeHistory.reduce((sum, h) => sum + h.accuracy, 0) / modeHistory.length;
      } else {
        averages[mode] = 0.5; // Default score
      }
    });

    return averages;
  }

  // Process text with intelligent mode selection
  async processText(text, taskType = 'analysis', options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    
    // Select optimal mode for this specific task
    const selectedMode = options.forceMode || this.selectOptimalMode(text, taskType);
    
    console.log(`Processing with mode: ${selectedMode} for task: ${taskType}`);

    try {
      let result;
      
      switch (selectedMode) {
        case 'onDevice':
          result = await this.processWithOnDevice(text, taskType);
          break;
        case 'server':
          result = await this.processWithServer(text, taskType);
          break;
        case 'wasm':
          result = await this.processWithWASM(text, taskType);
          break;
        case 'heuristic':
          result = await this.processWithHeuristic(text, taskType);
          break;
        default:
          throw new Error(`Unknown processing mode: ${selectedMode}`);
      }

      // Record performance metrics
      const processingTime = performance.now() - startTime;
      this.recordPerformance(selectedMode, taskType, processingTime, result.accuracy || 0.8);

      // Add mode information to result
      result.processingMode = selectedMode;
      result.processingTime = processingTime;
      result.availability = this.availability;

      return result;
    } catch (error) {
      console.error(`Error processing with ${selectedMode}:`, error);
      
      // Try fallback mode
      if (selectedMode !== 'heuristic') {
        console.log('Attempting fallback to heuristic mode');
        return await this.processText(text, taskType, { forceMode: 'heuristic' });
      }
      
      throw error;
    }
  }

  // Process with on-device AI
  async processWithOnDevice(text, taskType) {
    if (!this.availability.chromeAI) {
      throw new Error('On-device AI not available');
    }

    switch (taskType) {
      case 'analysis':
        return await this.modes.onDevice.analyzeTextStructure(text);
      case 'summarize':
        return await this.modes.onDevice.generateSummary(text);
      case 'diagram':
        return await this.modes.onDevice.generateDiagramData(text);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  // Process with server AI
  async processWithServer(text, taskType) {
    if (!this.availability.serverAI) {
      throw new Error('Server AI not available');
    }

    const endpoint = taskType === 'analysis' ? '/analyze' : '/summarize';
    
    const response = await fetch(`http://localhost:8080${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Server request failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Server processing failed');
    }

    return taskType === 'analysis' ? result.analysis : result.summary;
  }

  // Process with WebAssembly
  async processWithWASM(text, taskType) {
    if (!this.availability.webAssembly) {
      throw new Error('WebAssembly not available');
    }

    const operation = taskType === 'analysis' ? 'analyze' : 'summarize';
    return await this.modes.wasm.processText(text, operation);
  }

  // Process with heuristic fallback
  async processWithHeuristic(text, taskType) {
    switch (taskType) {
      case 'analysis':
        return await this.modes.heuristic.analyzeTextStructure(text);
      case 'summarize':
        return await this.modes.heuristic.generateSummary(text);
      case 'diagram':
        return await this.modes.heuristic.generateDiagramData(text);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  // Record performance metrics
  recordPerformance(mode, taskType, processingTime, accuracy) {
    this.performanceHistory.push({
      mode,
      taskType,
      processingTime,
      accuracy,
      timestamp: Date.now()
    });

    // Keep only recent history (last 100 entries)
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  // Update user preferences
  updatePreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    console.log('Updated user preferences:', this.userPreferences);
  }

  // Get current status
  getStatus() {
    return {
      initialized: this.initialized,
      currentMode: this.currentMode,
      availability: this.availability,
      preferences: this.userPreferences,
      performanceHistory: this.performanceHistory.slice(-10), // Last 10 entries
      processors: {
        onDevice: this.modes.onDevice.getStatus(),
        wasm: this.modes.wasm.getStatus(),
        heuristic: this.modes.heuristic.getStatus()
      }
    };
  }

  // Switch to a specific mode
  async switchMode(mode) {
    if (!this.availability[mode] && mode !== 'heuristic') {
      throw new Error(`Mode ${mode} not available`);
    }

    this.currentMode = mode;
    console.log(`Switched to mode: ${mode}`);
    
    return true;
  }

  // Get recommended mode for content
  getRecommendedMode(content, taskType = 'analysis') {
    return this.selectOptimalMode(content, taskType);
  }

  // Cleanup resources
  cleanup() {
    if (this.modes.wasm) {
      this.modes.wasm.cleanup();
    }
    this.performanceHistory = [];
    this.initialized = false;
  }
}

// Heuristic Processor for fallback scenarios
class HeuristicProcessor {
  constructor() {
    this.isAvailable = true;
  }

  async analyzeTextStructure(text) {
    // Simple heuristic analysis
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Basic content type detection
    let type = 'narrative';
    if (words.some(w => ['first', 'second', 'then', 'next'].includes(w))) {
      type = 'sequential';
    } else if (words.some(w => ['because', 'therefore', 'causes'].includes(w))) {
      type = 'causal';
    } else if (words.some(w => ['versus', 'compared', 'different'].includes(w))) {
      type = 'comparative';
    }

    const keyPoints = sentences.slice(0, 5).map((s, index) => ({
      text: s.trim(),
      order: index + 1,
      type: 'point'
    }));

    const relationships = [];
    for (let i = 0; i < keyPoints.length - 1; i++) {
      relationships.push({
        from: i,
        to: i + 1,
        type: 'related',
        label: '→'
      });
    }

    return {
      type,
      confidence: 0.5,
      mainTopic: sentences[0]?.substring(0, 50) + "..." || "Main Topic",
      keyPoints,
      relationships,
      structure: type,
      source: 'heuristic'
    };
  }

  async generateSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summaryLength = Math.min(3, Math.ceil(sentences.length / 3));
    const summary = sentences.slice(0, summaryLength).join('. ') + '.';
    
    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      source: 'heuristic'
    };
  }

  async generateDiagramData(text) {
    const analysis = await this.analyzeTextStructure(text);
    
    const nodes = analysis.keyPoints.map((point, index) => ({
      id: `node_${index}`,
      label: point.text.substring(0, 30) + (point.text.length > 30 ? "..." : ""),
      type: 'concept',
      content: point.text,
      order: index + 1
    }));

    const edges = analysis.relationships.map((rel, index) => ({
      id: `edge_${index}`,
      source: `node_${rel.from}`,
      target: `node_${rel.to}`,
      label: rel.label,
      type: rel.type
    }));

    return {
      title: analysis.mainTopic,
      layout: analysis.type === 'sequential' ? 'timeline' : 'flowchart',
      nodes,
      edges,
      type: analysis.type,
      originalText: text,
      source: 'heuristic'
    };
  }

  getStatus() {
    return {
      available: this.isAvailable,
      source: 'heuristic'
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIModeManager, HeuristicProcessor };
} else if (typeof self !== 'undefined') {
  self.AIModeManager = AIModeManager;
  self.HeuristicProcessor = HeuristicProcessor;
}
