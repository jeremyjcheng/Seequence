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
                self.model = genai.GenerativeModel('gemini-1.5-flash-001')
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
    
    def generate_summary(self, text: str, max_length: int = 120) -> str:
        """Generate a reader-friendly summary using Gemini API with fallback"""
        
        if self.gemini_available:
            try:
                # Create a prompt for natural summarization
                prompt = f"""Please create a concise, reader-friendly summary of the following text. The summary should be:
- Natural and easy to read
- Capture the main point or essence
- Be no more than {max_length} characters
- Sound like something a human would write

Text to summarize:
{text}

Summary:"""

                response = self.model.generate_content(prompt)
                
                if response and response.text:
                    summary = response.text.strip()
                    
                    # Ensure it's within the length limit
                    if len(summary) > max_length:
                        summary = summary[:max_length-3] + "..."
                    
                    print(f"Gemini summary generated: {summary}")
                    return summary
                else:
                    print("Gemini API returned empty response, using fallback")
                    
            except Exception as e:
                print(f"Gemini API error: {e}, using fallback")
        
        # Fallback to base summarizer
        print("Using fallback summarizer")
        return self.base_summarizer.generate_summary(text, max_length)
    
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
