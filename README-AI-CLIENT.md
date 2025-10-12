# Seequence AI Client

This document describes the AI Client implementation for the Seequence Chrome extension, which provides text rewriting, summarization, and structure detection using Chrome's built-in Gemini Nano AI.

## Architecture

The AI Client follows a modular architecture with the following components:

```
src/ai/
├── aiClient.js          # Main AI Client class
└── systemPrompts.js     # Mochi-style system prompts for text rewriting
```

## Features

### 1. Text Rewriting

The AI Client provides three categories of text rewriting, each with 5 levels of intensity:

#### Categories:

- **Text Clarity**: Simplifies complex text and improves readability
- **Text Focus**: Highlights key information and removes unnecessary details
- **Text Pattern**: Organizes information in clear structural patterns

#### Levels (1-5):

- Level 1: Basic rewriting
- Level 2: Enhanced with additional features
- Level 3: Comprehensive rewriting with examples
- Level 4: Advanced organization and flow
- Level 5: Full transformation with visual hierarchy

### 2. Text Summarization

Provides three summary styles:

- **Short**: 1-2 sentences focusing on main ideas
- **Medium**: 2-3 sentences with important details
- **Long**: 3-4 sentences with comprehensive overview

### 3. Structure Detection

Automatically classifies text into one of five structural types:

- **Sequential**: Step-by-step processes or timelines
- **Causal**: Cause-and-effect relationships
- **Comparative**: Comparing and contrasting concepts
- **Hierarchical**: Categorized or classified information
- **Narrative**: Story-based or descriptive content

## Usage

### Basic Setup

```javascript
import AIClient from "./src/ai/aiClient.js";

const aiClient = new AIClient();
await aiClient.checkAvailability();
```

### Text Rewriting

```javascript
const result = await aiClient.rewriteText(
  text, // Input text
  "textClarity", // Category: textClarity, textFocus, textPattern
  3 // Level: 1-5
);

console.log(result.rewrittenText);
console.log(result.source); // 'prompt-api', 'summarizer-api', or 'fallback'
```

### Text Summarization

```javascript
const result = await aiClient.summarizeText(
  text, // Input text
  "short" // Style: short, medium, long
);

console.log(result.summary);
console.log(result.source);
```

### Structure Detection

```javascript
const result = await aiClient.detectStructure(text);

console.log(result.structure); // 'sequential', 'causal', 'comparative', 'hierarchical', 'narrative'
console.log(result.source);
```

## API Compatibility

The AI Client is designed to work with Chrome's built-in AI APIs:

1. **Primary**: `navigator.ai.prompt` and `navigator.ai.summarizer`
2. **Alternative**: `window.ai.languageModel`
3. **Fallback**: Heuristic-based processing

## Fallback Behavior

When Chrome's built-in AI APIs are not available, the AI Client automatically falls back to:

1. **Basic Rewriting**: Simple text processing based on category and level
2. **Basic Summarization**: Sentence extraction and truncation
3. **Basic Structure Detection**: Keyword-based classification

## Chrome Flags Required

To enable Chrome's built-in AI APIs, users need to enable these flags:

```
chrome://flags/#prompt-api-for-gemini-nano
chrome://flags/#optimization-guide-on-device-model
```

## Testing

A test page is available at `test-ai-client.html` to verify functionality:

1. Open the test page in Chrome
2. Enter text to test
3. Select rewriting options
4. Test each AI Client function
5. Verify results and fallback behavior

## Integration with Popup UI

The AI Client is integrated into the Seequence popup with:

- **Rewriting Options**: Category and level selectors
- **Summary Options**: Length selection
- **Real-time Processing**: Instant AI-powered text transformation
- **Copy Functionality**: Easy copying of rewritten text
- **Diagram Integration**: Create diagrams from rewritten text

## Performance Metrics

The AI Client tracks performance metrics:

```javascript
const metrics = aiClient.getPerformanceMetrics();
console.log(metrics.totalRequests);
console.log(metrics.averageResponseTime);
console.log(metrics.isAvailable);
```

## Error Handling

All AI Client methods include comprehensive error handling:

- API availability checks
- Graceful fallbacks
- Detailed error messages
- Performance monitoring

## Future Enhancements

Potential improvements for the AI Client:

1. **Caching**: Store results for repeated requests
2. **Batch Processing**: Handle multiple texts simultaneously
3. **Custom Prompts**: User-defined system prompts
4. **Language Detection**: Automatic language identification
5. **Translation**: Multi-language text processing
