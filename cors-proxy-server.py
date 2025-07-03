#!/usr/bin/env python3
"""
CORS Proxy Server for Space Invaders Flash Stream
Handles CORS issues and provides fallback endpoint functionality
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import re
from urllib.error import URLError

class CORSProxyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        if self.path.startswith('/api/primary'):
            # Proxy primary API requests
            self.proxy_primary_api()
        elif self.path.startswith('/api/fallback'):
            # Proxy fallback HTML requests and extract JSON
            self.proxy_fallback_html()
        else:
            # Serve static files
            super().do_GET()
    
    def proxy_primary_api(self):
        """Proxy requests to the primary JSON API"""
        api_url = 'https://api.space-invaders.com/flashinvaders/flashes/'
        
        try:
            print(f"🌐 Proxying primary API request to: {api_url}")
            
            # Create request with browser-like headers
            req = urllib.request.Request(api_url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            req.add_header('Accept', 'application/json, text/plain, */*')
            req.add_header('Accept-Language', 'en-US,en;q=0.9')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = response.read()
                
            print("✅ Primary API request successful")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(data)
            
        except URLError as e:
            print(f"❌ Primary API failed: {str(e)}")
            self.send_error(500, f"Primary API error: {str(e)}")
        except Exception as e:
            print(f"❌ Unexpected error in primary API: {str(e)}")
            self.send_error(500, f"Unexpected error: {str(e)}")
    
    def proxy_fallback_html(self):
        """Proxy requests to the fallback HTML page and extract JSON"""
        html_url = 'https://www.space-invaders.com/flashinvaders/'
        
        try:
            print(f"🔄 Proxying fallback HTML request to: {html_url}")
            
            # Create request with browser-like headers
            req = urllib.request.Request(html_url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            req.add_header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
            req.add_header('Accept-Language', 'en-US,en;q=0.9')
            
            with urllib.request.urlopen(req, timeout=15) as response:
                html_data = response.read().decode('utf-8')
            
            # Extract JSON from HTML
            json_match = re.search(r"var flashData = JSON\.parse\('(.+?)'\);", html_data)
            if not json_match:
                raise Exception("Could not find flashData in HTML")
            
            # Decode the JSON string
            json_string = json_match.group(1)
            
            # Unescape the JSON string
            json_string = (json_string
                .replace('\\u0022', '"')
                .replace('\\u002F', '/')
                .replace('\\u003C', '<')
                .replace('\\u003E', '>')
                .replace('\\u0026', '&')
                .replace('\\u0027', "'")
                .replace('\\u003D', '=')
                .replace('\\u003A', ':')
                .replace('\\u002C', ',')
                .replace('\\u007B', '{')
                .replace('\\u007D', '}')
                .replace('\\u005B', '[')
                .replace('\\u005D', ']'))
            
            # Parse and validate JSON
            try:
                parsed_data = json.loads(json_string)
                print("✅ Successfully extracted and parsed JSON from HTML")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(parsed_data).encode('utf-8'))
                
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse extracted JSON: {str(e)}")
                self.send_error(500, f"JSON parse error: {str(e)}")
                
        except URLError as e:
            print(f"❌ Fallback HTML failed: {str(e)}")
            self.send_error(500, f"Fallback HTML error: {str(e)}")
        except Exception as e:
            print(f"❌ Unexpected error in fallback HTML: {str(e)}")
            self.send_error(500, f"Unexpected error: {str(e)}")

def run_server(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSProxyHandler)
    print(f"🚀 CORS Proxy Server running on http://localhost:{port}")
    print(f"📖 Open http://localhost:{port} in your browser")
    print("🔗 Endpoints:")
    print(f"   - Primary API: http://localhost:{port}/api/primary")
    print(f"   - Fallback API: http://localhost:{port}/api/fallback")
    print("⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    import sys
    import os
    
    # Use Railway's PORT environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    
    # Allow command line override
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    
    run_server(port)