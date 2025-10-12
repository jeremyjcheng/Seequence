#!/usr/bin/env python3
"""
Test script for Gemini API integration
"""

import os
import sys
sys.path.append('summarizer')

from gemini_summarizer import GeminiSummarizer

def test_gemini():
    # Check if API key is available (environment or PEM file)
    api_key = os.getenv('GEMINI_API_KEY')
    pem_exists = os.path.exists('gemini-api-key.pem')
    
    if not api_key and not pem_exists:
        print(" No API key found!")
        print("\nTo set up your API key:")
        print("1. Get a Gemini API key from https://makersuite.google.com/app/apikey")
        print("2. Run: ./setup-api-key.sh")
        print("\nOr set it as an environment variable:")
        print("   export GEMINI_API_KEY='your-api-key-here'")
        return
    
    if api_key:
        print(f" GEMINI_API_KEY found in environment: {api_key[:10]}...")
    elif pem_exists:
        print(" API key found in PEM file")
    
    # Test the summarizer
    summarizer = GeminiSummarizer()
    
    test_text = "Eric Patrick Clapton (born 30 March 1945) is an English rock and blues guitarist, singer, and songwriter. He is regarded as one of the most successful and influential guitarists in rock music. Clapton ranked second in Rolling Stone's list of the '100 Greatest Guitarists of All Time' and fourth in Gibson's 'Top 50 Guitarists of All Time'."
    
    print(f"\n📝 Original text ({len(test_text)} chars):")
    print(test_text)
    
    print(f"\n🤖 Generating summary...")
    summary = summarizer.generate_summary(test_text, max_length=120)
    
    print(f"\n✨ Summary ({len(summary)} chars):")
    print(summary)
    
    # Show status
    status = summarizer.get_status()
    print(f"\n Status:")
    print(f"  Gemini available: {status['gemini_available']}")
    print(f"  NLTK available: {status['nltk_available']}")
    print(f"  spaCy available: {status['spacy_available']}")

if __name__ == "__main__":
    test_gemini()
