#!/usr/bin/env python3
"""
Enhanced Summarizer using Google Gemini API for Seequence Chrome Extension
Provides more natural, reader-friendly summaries
"""

import json
import sys
import os
from typing import Optional
import argparse

# Try to import Gemini API
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Import the base summarizer as fallback
from summarizer import TextSummarizer

class GeminiSummarizer:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or self._load_api_key()
        self.gemini_available = False
        self.base_summarizer = TextSummarizer()
        
        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash')
                self.gemini_available = True
                print("Gemini API initialized successfully")
            except Exception as e:
                print(f"Failed to initialize Gemini API: {e}")
                self.gemini_available = False
        else:
            if not GEMINI_AVAILABLE:
                print("Google Generative AI library not available")
            if not self.api_key:
                print("GEMINI_API_KEY not found in environment or PEM file")
    
    def _load_api_key(self) -> Optional[str]:
        """Load API key from environment variable or PEM file"""
        # Try environment variable first
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            return api_key
        
        # Try to load from PEM file
        pem_paths = [
            'gemini-api-key.pem',
            '../gemini-api-key.pem',
            os.path.join(os.path.dirname(__file__), '..', 'gemini-api-key.pem')
        ]
        
        for pem_path in pem_paths:
            if os.path.exists(pem_path):
                try:
                    with open(pem_path, 'r') as f:
                        lines = f.readlines()
                        if len(lines) >= 2:
                            return lines[1].strip()
                except Exception as e:
                    print(f"Error reading PEM file {pem_path}: {e}")
        
        return None
    
    def generate_summary(self, text: str, max_length: int = 120, length_label: str | None = None) -> str:
        """Generate a reader-friendly summary using Gemini API with fallback.
        length_label controls style rather than just truncation:
          - short: headline-style (8–12 words), punchy, no ellipsis
          - medium: one sentence (18–28 words)
          - long: two sentences (35–60 words), include an extra concrete detail
        """
        
        print(f"🔍 GeminiSummarizer.generate_summary called with text length: {len(text)}")
        print(f"🔍 Gemini available: {self.gemini_available}")
        print(f"🔍 Max length: {max_length}")
        print(f"🔍 Text preview: {text[:100]}...")
        
        if self.gemini_available:
            try:
                print("🤖 Attempting Gemini API call...")
                # Style instructions based on length_label
                mode = (length_label or "medium").lower()
                if mode == "short":
                    style = (
                        "Write a headline-style summary (8–12 words). "
                        "Punchy, noun phrase if possible. No ellipsis."
                    )
                elif mode == "long":
                    style = (
                        "Write two concise sentences (35–60 words total). "
                        "Include one concrete detail beyond a headline. No ellipsis."
                    )
                else:  # medium
                    style = (
                        "Write one complete sentence (18–28 words). "
                        "Cover the main point and context. No ellipsis."
                    )

                prompt = (
                    f"You are a helpful summarizer. {style}\n"
                    f"Keep within {max_length} characters if possible.\n\n"
                    f"Text to summarize:\n{text}\n\nSummary:"
                )

                print(f"Prompt length: {len(prompt)}")
                response = self.model.generate_content(prompt)
                print(f"Gemini response received: {type(response)}")
                
                if response and response.text:
                    summary = response.text.strip()
                    print(f"Raw Gemini response: {summary}")
                    
                    # Ensure it's within the length limit
                    if len(summary) > max_length:
                        summary = summary[:max_length-3] + "..."
                        print(f"Summary truncated to {max_length} chars")
                    
                    print(f"Generated Gemini summary: {summary}")
                    return summary
                else:
                    print("Gemini API returned empty response, using fallback")
                    
            except Exception as e:
                print(f"Gemini API error: {e}")
                print(f"Error type: {type(e)}")
                print("Using fallback summarizer due to Gemini error")
        else:
            print("Gemini not available, using fallback summarizer")
        
        # Fallback to base summarizer
        print("Using fallback summarizer")
        fallback_summary = self.base_summarizer.generate_summary(text, max_length=max_length)
        print(f"Fallback summary: {fallback_summary}")
        return fallback_summary

    def analyze_content_structure(self, text: str) -> dict:
        """Use Gemini to analyze content structure and create diagram data"""
        
        print(f"GeminiSummarizer.analyze_content_structure called with text length: {len(text)}")
        
        if self.gemini_available:
            try:
                print("Attempting Gemini content analysis...")
                prompt = f"""Analyze the following text and create a structured diagram representation. Return a JSON object with:

1. "contentType": the type of content (choose the most appropriate):
   - "sequential": if text contains step-by-step processes, instructions with "first/then/next/finally", or ordered procedures
   - "narrative": if text tells a story about a person's life, historical events, or biographical content
   - "comparative": if text compares two or more things using "versus", "compared to", "different", "similar"
   - "hierarchical": if text organizes information into categories, types, or levels
   - "causal": if text explains cause-and-effect relationships using "because", "therefore", "leads to"

2. "mainTopic": a concise title for the content
3. "keyPoints": array of 3-6 key points, each with:
   - "text": the point content (max 50 chars)
   - "type": the point type (step, comparison, category, concept, event)
   - "importance": importance score 1-5
4. "relationships": array of relationships between points with:
   - "from": source point index
   - "to": target point index  
   - "type": relationship type (sequence, causal, comparison, hierarchy, related)
   - "label": short description of the relationship
5. "suggestedLayout": recommended diagram layout (timeline, flowchart, mindmap, compare)

Text to analyze:
{text}

Return only valid JSON, no additional text:"""

                print(f"Analysis prompt length: {len(prompt)}")
                response = self.model.generate_content(prompt)
                print(f"Gemini analysis response received: {type(response)}")
                
                if response and response.text:
                    try:
                        import json
                        import re
                        
                        # Clean the response text - remove markdown code blocks if present
                        response_text = response.text.strip()
                        if response_text.startswith('```json'):
                            response_text = response_text[7:]  # Remove ```json
                        if response_text.endswith('```'):
                            response_text = response_text[:-3]  # Remove ```
                        response_text = response_text.strip()
                        
                        analysis = json.loads(response_text)
                        print(f"Raw Gemini analysis: {analysis}")
                        
                        # Validate and clean the analysis
                        cleaned_analysis = self._clean_analysis(analysis)
                        print(f"Generated Gemini analysis: {cleaned_analysis}")
                        return cleaned_analysis
                    except json.JSONDecodeError as e:
                        print(f" Failed to parse Gemini JSON response: {e}")
                        print(f" Raw response: {response.text}")
                        return self._fallback_analysis(text)
                else:
                    print("Gemini API returned empty response for analysis")
                    return self._fallback_analysis(text)
                    
            except Exception as e:
                print(f"Gemini API error during analysis: {e}")
                print(f"Error type: {type(e)}")
                return self._fallback_analysis(text)
        else:
            print("Gemini not available for analysis, using fallback")
            return self._fallback_analysis(text)

    def _clean_analysis(self, analysis: dict) -> dict:
        """Clean and validate the Gemini analysis"""
        # Ensure required fields exist
        cleaned = {
            "contentType": analysis.get("contentType", "narrative"),
            "mainTopic": analysis.get("mainTopic", "Main Topic"),
            "keyPoints": [],
            "relationships": [],
            "suggestedLayout": analysis.get("suggestedLayout", "flowchart")
        }
        
        # Clean key points
        key_points = analysis.get("keyPoints", [])
        for i, point in enumerate(key_points[:6]):  # Limit to 6 points
            if isinstance(point, dict):
                cleaned["keyPoints"].append({
                    "text": str(point.get("text", f"Point {i+1}"))[:50],
                    "type": point.get("type", "concept"),
                    "importance": min(5, max(1, int(point.get("importance", 3))))
                })
            else:
                cleaned["keyPoints"].append({
                    "text": str(point)[:50],
                    "type": "concept",
                    "importance": 3
                })
        
        # Clean relationships
        relationships = analysis.get("relationships", [])
        for rel in relationships:
            if isinstance(rel, dict) and "from" in rel and "to" in rel:
                cleaned["relationships"].append({
                    "from": int(rel["from"]),
                    "to": int(rel["to"]),
                    "type": rel.get("type", "related"),
                    "label": rel.get("label", "")
                })
        
        return cleaned

    def _fallback_analysis(self, text: str) -> dict:
        """Fallback analysis when Gemini is not available"""
        print("Using fallback content analysis")
        
        import re
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 10]
        key_points = []
        for i, sentence in enumerate(sentences[:5]):
            key_points.append({
                "text": sentence[:50],
                "type": "concept",
                "importance": 3
            })
        
        relationships = []
        for i in range(len(key_points) - 1):
            relationships.append({
                "from": i,
                "to": i + 1,
                "type": "related",
                "label": ""
            })
        
        return {
            "contentType": "narrative",
            "mainTopic": sentences[0][:50] + "..." if sentences[0] else "Main Topic",
            "keyPoints": key_points,
            "relationships": relationships,
            "suggestedLayout": "flowchart"
        }

    # -------------------- Open Intent Analysis (contract for step 1) --------------------
    def analyze_open_intent(self, text: str) -> dict:
        """Model-driven, open intent contract. Returns free-form intent and visualization suggestion.

        Response keys:
        - intent_label: free-form string
        - intent_explanation: short natural-language rationale
        - visualization: free-form string suggestion (e.g., freytag_pyramid, step_flow, timeline, compare_2col, cause_chain, custom_radial)
        - slots: object with the fields your visualization needs
        - confidence: float 0–1
        - graph: optional { nodes: [], edges: [] }
        """

        if self.gemini_available:
            try:
                prompt = (
                    "You are a visual teaching assistant. Analyze the input text and produce a JSON object with these keys only:\n"
                    "- intent_label: a short free-form label (no taxonomy).\n"
                    "- intent_explanation: one concise sentence explaining why.\n"
                    "- visualization: a free-form diagram suggestion (examples but not limited to: freytag_pyramid, step_flow, timeline, compare_2col, cause_chain, custom_radial).\n"
                    "- slots: an object containing the data fields that your visualization needs. Keep 3-7 simple items, child-friendly labels.\n"
                    "- confidence: a number 0 to 1.\n"
                    "- graph (optional): { nodes: [{id,label}], edges: [{source,target}] } if useful.\n\n"
                    f"Text:\n{text}\n\n"
                    "Return JSON only, no markdown fences, no commentary."
                )

                response = self.model.generate_content(prompt)
                if response and response.text:
                    import json
                    raw = response.text.strip()
                    # Remove accidental markdown fences if present
                    if raw.startswith('```json'):
                        raw = raw[7:]
                    if raw.endswith('```'):
                        raw = raw[:-3]
                    parsed = json.loads(raw)
                    # Minimal sanitation
                    if "intent_label" not in parsed:
                        parsed["intent_label"] = "generic"
                    if "visualization" not in parsed:
                        parsed["visualization"] = "timeline"
                    if "slots" not in parsed or not isinstance(parsed["slots"], dict):
                        parsed["slots"] = {"steps": self._simple_steps_from_text(text)}
                    if "confidence" not in parsed:
                        parsed["confidence"] = 0.5
                    return parsed
            except Exception as e:
                print(f"Open intent analysis failed: {e}")

        # Fallback (no Gemini)
        return {
            "intent_label": "generic",
            "intent_explanation": "Fallback simple reading of the text.",
            "visualization": "timeline",
            "slots": {"steps": self._simple_steps_from_text(text)},
            "confidence": 0.3,
        }

    def _simple_steps_from_text(self, text: str):
        import re
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 3]
        steps = sentences[:5]
        if not steps:
            steps = [text[:60] + ("…" if len(text) > 60 else "")]
        return steps
    
    def get_status(self) -> dict:
        """Get the status of available summarizers"""
        return {
            'gemini_available': self.gemini_available,
            'base_summarizer_available': True,
            'nltk_available': hasattr(self.base_summarizer, 'stemmer') and self.base_summarizer.stemmer is not None,
            'spacy_available': self.base_summarizer.nlp is not None
        }

def main():
    parser = argparse.ArgumentParser(description='Enhanced Summarizer with Gemini API')
    parser.add_argument('--text', type=str, help='Text to summarize')
    parser.add_argument('--max-length', type=int, default=120, help='Maximum summary length')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    parser.add_argument('--api-key', type=str, help='Gemini API key (or set GEMINI_API_KEY env var)')
    
    args = parser.parse_args()
    
    # Initialize summarizer
    summarizer = GeminiSummarizer(api_key=args.api_key)
    
    if args.text:
        text = args.text
    else:
        # Read from stdin
        text = sys.stdin.read().strip()
    
    if not text:
        if args.json:
            print(json.dumps({'success': False, 'error': 'No text provided'}))
        else:
            print("No text provided")
        return
    
    # Generate summary
    summary = summarizer.generate_summary(text, args.max_length)
    status = summarizer.get_status()
    
    if args.json:
        result = {
            'success': True,
            'summary': summary,
            'original_length': len(text),
            'summary_length': len(summary),
            'gemini_available': status['gemini_available'],
            'nltk_available': status['nltk_available'],
            'spacy_available': status['spacy_available']
        }
        print(json.dumps(result))
    else:
        print(summary)

if __name__ == "__main__":
    main()
