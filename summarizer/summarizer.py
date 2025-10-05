#!/usr/bin/env python3
"""
Text Summarizer for Seequence Chrome Extension
Uses advanced NLP techniques for accurate text summarization
"""

import sys
import json
import re
from typing import List, Dict, Tuple
import argparse

# Try to import advanced NLP libraries, fallback to basic if not available
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.stem import PorterStemmer
    from nltk.probability import FreqDist
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False

class TextSummarizer:
    def __init__(self):
        self.stemmer = PorterStemmer() if NLTK_AVAILABLE else None
        self.stop_words = set()
        
        if NLTK_AVAILABLE:
            try:
                # Download required NLTK data
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                self.stop_words = set(stopwords.words('english'))
            except:
                # Fallback stop words
                self.stop_words = {
                    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
                    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
                    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
                    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
                }
        
        # Load spaCy model if available
        self.nlp = None
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                try:
                    self.nlp = spacy.load("en_core_web_md")
                except OSError:
                    self.nlp = None

    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\-()]', '', text)
        return text

    def extract_sentences(self, text: str) -> List[str]:
        """Extract sentences from text"""
        if NLTK_AVAILABLE:
            try:
                sentences = sent_tokenize(text)
            except:
                sentences = self._basic_sentence_split(text)
        else:
            sentences = self._basic_sentence_split(text)
        
        # Filter out very short sentences
        return [s.strip() for s in sentences if len(s.strip()) > 10]

    def _basic_sentence_split(self, text: str) -> List[str]:
        """Basic sentence splitting fallback"""
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]

    def extract_keywords(self, text: str) -> Dict[str, int]:
        """Extract keywords and their frequencies"""
        if NLTK_AVAILABLE:
            try:
                words = word_tokenize(text.lower())
            except:
                words = re.findall(r'\b\w+\b', text.lower())
        else:
            words = re.findall(r'\b\w+\b', text.lower())
        
        # Filter stop words and short words
        filtered_words = [
            word for word in words 
            if word not in self.stop_words and len(word) > 3
        ]
        
        # Stem words if available
        if self.stemmer:
            filtered_words = [self.stemmer.stem(word) for word in filtered_words]
        
        # Count frequencies
        word_freq = {}
        for word in filtered_words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        return word_freq

    def score_sentences(self, sentences: List[str], word_freq: Dict[str, int]) -> List[Tuple[str, float]]:
        """Score sentences based on various factors"""
        sentence_scores = []
        
        for i, sentence in enumerate(sentences):
            score = 0.0
            
            # Word frequency score
            if NLTK_AVAILABLE:
                try:
                    words = word_tokenize(sentence.lower())
                except:
                    words = re.findall(r'\b\w+\b', sentence.lower())
            else:
                words = re.findall(r'\b\w+\b', sentence.lower())
            
            for word in words:
                if self.stemmer:
                    word = self.stemmer.stem(word)
                if word in word_freq:
                    score += word_freq[word]
            
            # Position bonus (first sentences often contain main topic)
            if i == 0:
                score *= 1.5
            elif i < 3:  # First few sentences get slight bonus
                score *= 1.2
            
            # Length penalty (very long or very short sentences)
            word_count = len(words)
            if word_count < 5:
                score *= 0.5
            elif word_count > 30:
                score *= 0.8
            
            # Proper noun bonus
            proper_nouns = re.findall(r'\b[A-Z][a-z]+\b', sentence)
            score += len(proper_nouns) * 2
            
            # Named entity bonus (if spaCy is available)
            if self.nlp:
                try:
                    doc = self.nlp(sentence)
                    entities = [ent.text for ent in doc.ents if ent.label_ in ['PERSON', 'ORG', 'GPE', 'EVENT']]
                    score += len(entities) * 3
                except:
                    pass
            
            sentence_scores.append((sentence, score))
        
        return sentence_scores

    def generate_summary(self, text: str, max_length: int = 120) -> str:
        """Generate a concise summary of the text"""
        if not text or len(text.strip()) < 20:
            return text[:max_length] + "..." if len(text) > max_length else text
        
        # Preprocess text
        text = self.preprocess_text(text)
        
        # Extract sentences
        sentences = self.extract_sentences(text)
        if not sentences:
            return text[:max_length] + "..." if len(text) > max_length else text
        
        # If only one sentence, return it (truncated if needed)
        if len(sentences) == 1:
            summary = sentences[0]
            if len(summary) > max_length:
                words = summary.split()
                truncated = ""
                for word in words:
                    if len(truncated) + len(word) + 1 > max_length:
                        break
                    truncated += (" " if truncated else "") + word
                return truncated + "..."
            return summary
        
        # Extract keywords
        word_freq = self.extract_keywords(text)
        
        # Score sentences
        sentence_scores = self.score_sentences(sentences, word_freq)
        
        # Sort by score and get the best sentence
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        best_sentence = sentence_scores[0][0]
        
        # Clean up and truncate if necessary
        summary = best_sentence.strip()
        if len(summary) > max_length:
            words = summary.split()
            truncated = ""
            for word in words:
                if len(truncated) + len(word) + 1 > max_length:
                    break
                truncated += (" " if truncated else "") + word
            summary = truncated + "..."
        
        return summary

def main():
    parser = argparse.ArgumentParser(description='Text Summarizer for Seequence')
    parser.add_argument('--text', type=str, help='Text to summarize')
    parser.add_argument('--max-length', type=int, default=120, help='Maximum summary length')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    if args.text:
        summarizer = TextSummarizer()
        summary = summarizer.generate_summary(args.text, args.max_length)
        
        if args.json:
            result = {
                'summary': summary,
                'original_length': len(args.text),
                'summary_length': len(summary),
                'nltk_available': NLTK_AVAILABLE,
                'spacy_available': SPACY_AVAILABLE
            }
            print(json.dumps(result))
        else:
            print(summary)
    else:
        # Read from stdin
        text = sys.stdin.read().strip()
        if text:
            summarizer = TextSummarizer()
            summary = summarizer.generate_summary(text, args.max_length)
            
            if args.json:
                result = {
                    'summary': summary,
                    'original_length': len(text),
                    'summary_length': len(summary),
                    'nltk_available': NLTK_AVAILABLE,
                    'spacy_available': SPACY_AVAILABLE
                }
                print(json.dumps(result))
            else:
                print(summary)

if __name__ == "__main__":
    main()
