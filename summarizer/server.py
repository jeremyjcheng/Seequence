#!/usr/bin/env python3
"""
Local HTTP server for Seequence Python Summarizer
Provides REST API for Chrome extension to access advanced NLP summarization
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time
from summarizer import TextSummarizer
from gemini_summarizer import GeminiSummarizer

class SummarizerHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Try Gemini first, fallback to base summarizer
        print("Initializing SummarizerHandler...")
        self.summarizer = GeminiSummarizer()
        status = self.summarizer.get_status()
        print(f"Summarizer status: {status}")
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests for health check"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            status = self.summarizer.get_status()
            response = {
                'status': 'healthy',
                'gemini_available': status.get('gemini_available', False),
                'nltk_available': status.get('nltk_available', False),
                'spacy_available': status.get('spacy_available', False)
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for text summarization and content analysis"""
        if self.path == '/summarize':
            try:
                # Get content length
                content_length = int(self.headers['Content-Length'])
                
                # Read the request body
                post_data = self.rfile.read(content_length)
                
                # Parse JSON data
                data = json.loads(post_data.decode('utf-8'))
                text = data.get('text', '')
                max_length = data.get('max_length', 120)
                
                if not text:
                    self.send_error_response(400, "No text provided")
                    return
                
                # Generate summary
                summary = self.summarizer.generate_summary(text, max_length)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                status = self.summarizer.get_status()
                response = {
                    'success': True,
                    'summary': summary,
                    'original_length': len(text),
                    'summary_length': len(summary),
                    'gemini_available': status.get('gemini_available', False),
                    'nltk_available': status.get('nltk_available', False),
                    'spacy_available': status.get('spacy_available', False)
                }
                
                self.wfile.write(json.dumps(response).encode())
                
            except json.JSONDecodeError:
                self.send_error_response(400, "Invalid JSON")
            except Exception as e:
                self.send_error_response(500, f"Internal server error: {str(e)}")
        elif self.path == '/analyze':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                text = request_data.get('text', '')
                
                if not text:
                    self.send_error_response(400, "No text provided")
                    return

                analysis = self.summarizer.analyze_content_structure(text)
                # Open intent analysis (model-driven, free-form)
                try:
                    open_intent = self.summarizer.analyze_open_intent(text)
                except Exception as e:
                    open_intent = {
                        'intent_label': 'generic',
                        'intent_explanation': f'open intent failed: {e}',
                        'visualization': 'timeline',
                        'slots': {'steps': []},
                        'confidence': 0.0,
                    }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                status = self.summarizer.get_status()
                response = {
                    'success': True,
                    'analysis': analysis,
                    'open_intent': open_intent,
                    'original_length': len(text),
                    'gemini_available': status.get('gemini_available', False),
                    'nltk_available': status.get('nltk_available', False),
                    'spacy_available': status.get('spacy_available', False)
                }
                
                self.wfile.write(json.dumps(response).encode())
                
            except json.JSONDecodeError:
                self.send_error_response(400, "Invalid JSON")
            except Exception as e:
                self.send_error_response(500, f"Internal server error: {str(e)}")
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, code, message):
        """Send error response"""
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            'success': False,
            'error': message
        }
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

def start_server(port=8080):
    """Start the HTTP server"""
    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, SummarizerHandler)
    
    print(f"Seequence Python Summarizer Server running on http://localhost:{port}")
    print("Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Invalid port number, using default 8080")
    
    start_server(port)
