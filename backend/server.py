import http.server
import socketserver
import json
import sys
import traceback

# Import your Lambda function directly
try:
    import lambda_function
except ImportError:
    print("Error: Could not import lambda_function.py. Ensure you are running this in the same directory.")
    sys.exit(1)

PORT = 3001

class LambdaHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read the incoming payload
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')

            # Mock a standard API Gateway event structure
            event = {
                'httpMethod': 'POST',
                'path': self.path,
                'headers': dict(self.headers),
                'body': post_data,
                'isBase64Encoded': False
            }
            
            # Context is an object in AWS Lambda; mocking an empty one here
            class MockContext:
                pass
            context = MockContext()

            # Execute the Lambda handler
            response = lambda_function.lambda_handler(event, context)

            # Extract status code and body from Lambda response
            status_code = response.get('statusCode', 200)
            body = response.get('body', '')
            response_headers = response.get('headers', {'Content-Type': 'application/json'})

            # Send HTTP response
            self.send_response(status_code)
            for key, value in response_headers.items():
                self.send_header(key, value)
            self.end_headers()
            
            self.wfile.write(body.encode('utf-8'))

        except Exception as e:
            # Handle server-side errors gracefully
            print(f"Internal Server Error: {traceback.format_exc()}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({'error': str(e)})
            self.wfile.write(error_response.encode('utf-8'))

# Allow address reuse so you don't get "Address already in use" errors on restart
class QuietServer(socketserver.TCPServer):
    allow_reuse_address = True

with QuietServer(("", PORT), LambdaHandler) as httpd:
    print(f"Local Lambda HTTP server running on port {PORT}...")
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")