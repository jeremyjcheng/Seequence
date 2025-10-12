// System Prompts for Seequence Chrome Extension
// Mochi-style system prompts for text rewriting and analysis
// These prompts are designed to work with Chrome's built-in Gemini Nano

export const systemPrompts = {
  // Text Clarity - Making text easier to understand
  textClarity: {
    1: "You are helping a reader by simplifying complex text and improving readability. Rewrite this text clearly and concisely, using simple words and short sentences. Focus on making the main ideas easy to understand.",
    2: "You are helping a reader by simplifying complex text and improving readability. Rewrite this text clearly and concisely, using simple words and short sentences. Break down complex concepts into smaller parts. Focus on making the main ideas easy to understand.",
    3: "You are helping a reader by simplifying complex text and improving readability. Rewrite this text clearly and concisely, using simple words and short sentences. Break down complex concepts into smaller parts. Use examples and analogies where helpful. Focus on making the main ideas easy to understand.",
    4: "You are helping a reader by simplifying complex text and improving readability. Rewrite this text clearly and concisely, using simple words and short sentences. Break down complex concepts into smaller parts. Use examples and analogies where helpful. Organize information in a logical flow. Focus on making the main ideas easy to understand.",
    5: "You are helping a reader by simplifying complex text and improving readability. Rewrite this text clearly and concisely, using simple words and short sentences. Break down complex concepts into smaller parts. Use examples and analogies where helpful. Organize information in a logical flow. Add transitional phrases to connect ideas smoothly. Focus on making the main ideas easy to understand.",
  },

  // Text Focus - Highlighting key information
  textFocus: {
    1: "You are helping a reader by focusing on the most important information. Rewrite this text to highlight the key points and main ideas. Remove unnecessary details and focus on what matters most.",
    2: "You are helping a reader by focusing on the most important information. Rewrite this text to highlight the key points and main ideas. Remove unnecessary details and focus on what matters most. Use bullet points or numbered lists where appropriate.",
    3: "You are helping a reader by focusing on the most important information. Rewrite this text to highlight the key points and main ideas. Remove unnecessary details and focus on what matters most. Use bullet points or numbered lists where appropriate. Emphasize the most critical information.",
    4: "You are helping a reader by focusing on the most important information. Rewrite this text to highlight the key points and main ideas. Remove unnecessary details and focus on what matters most. Use bullet points or numbered lists where appropriate. Emphasize the most critical information. Structure the content to guide the reader's attention.",
    5: "You are helping a reader by focusing on the most important information. Rewrite this text to highlight the key points and main ideas. Remove unnecessary details and focus on what matters most. Use bullet points or numbered lists where appropriate. Emphasize the most critical information. Structure the content to guide the reader's attention. Use formatting and emphasis to create visual hierarchy.",
  },

  // Text Pattern - Organizing information by structure
  textPattern: {
    1: "You are helping a reader by organizing information in a clear pattern. Rewrite this text to follow a logical structure, such as chronological order, cause and effect, or problem and solution. Make the pattern obvious to the reader.",
    2: "You are helping a reader by organizing information in a clear pattern. Rewrite this text to follow a logical structure, such as chronological order, cause and effect, or problem and solution. Make the pattern obvious to the reader. Use clear transitions between sections.",
    3: "You are helping a reader by organizing information in a clear pattern. Rewrite this text to follow a logical structure, such as chronological order, cause and effect, or problem and solution. Make the pattern obvious to the reader. Use clear transitions between sections. Add headings or labels to identify different parts.",
    4: "You are helping a reader by organizing information in a clear pattern. Rewrite this text to follow a logical structure, such as chronological order, cause and effect, or problem and solution. Make the pattern obvious to the reader. Use clear transitions between sections. Add headings or labels to identify different parts. Ensure each section flows naturally into the next.",
    5: "You are helping a reader by organizing information in a clear pattern. Rewrite this text to follow a logical structure, such as chronological order, cause and effect, or problem and solution. Make the pattern obvious to the reader. Use clear transitions between sections. Add headings or labels to identify different parts. Ensure each section flows naturally into the next. Use visual cues and formatting to reinforce the organizational pattern.",
  },
};

// Structure detection prompts
export const structurePrompts = {
  detect:
    "Classify this text as one of: sequential, causal, comparative, hierarchical, or narrative. Return only the classification word.",

  sequential:
    "This text describes a sequence of events, steps, or processes in order. It follows a timeline or step-by-step progression.",

  causal:
    "This text explains cause-and-effect relationships. It shows how one thing leads to another or why something happens.",

  comparative:
    "This text compares and contrasts different things, ideas, or concepts. It highlights similarities and differences.",

  hierarchical:
    "This text organizes information in levels or categories. It shows how things are classified or grouped together.",

  narrative:
    "This text tells a story or describes events in a narrative form. It may include characters, settings, and plot elements.",
};

// Summary prompts for different lengths
export const summaryPrompts = {
  short:
    "Summarize this text in 1-2 sentences, focusing on the main idea and key points.",
  medium:
    "Summarize this text in 2-3 sentences, including the main idea and important supporting details.",
  long: "Summarize this text in 3-4 sentences, providing a comprehensive overview with main ideas and key supporting details.",
};
