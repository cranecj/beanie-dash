#!/usr/bin/env python3
"""
Auto-reloading development server for Beanie Dash
Watches for file changes and automatically restarts the server
"""

import os
import sys
import time
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

class DevServer:
    def __init__(self, port=8000):
        self.port = port
        self.server = None
        self.server_thread = None
        self.watch_extensions = {'.html', '.js', '.css', '.json'}
        self.ignore_dirs = {'.git', 'node_modules', '.beads', '__pycache__'}
        self.last_modified = {}
        self.running = False

    def start_server(self):
        """Start the HTTP server in a separate thread"""
        print(f"\n🚀 Starting server on http://localhost:{self.port}")
        print("📁 Serving from:", os.getcwd())
        print("👀 Watching for changes in: .html, .js, .css, .json files")
        print("🔄 Server will auto-restart on file changes")
        print("⚡ Press Ctrl+C to stop\n")

        handler = SimpleHTTPRequestHandler
        self.server = HTTPServer(('', self.port), handler)
        self.server_thread = threading.Thread(target=self.server.serve_forever)
        self.server_thread.daemon = True
        self.server_thread.start()
        self.running = True

    def stop_server(self):
        """Stop the HTTP server"""
        if self.server:
            print("🔄 Restarting server...")
            self.server.shutdown()
            self.server_thread.join(timeout=1)
            self.running = False

    def get_files_to_watch(self):
        """Get all files that should be watched for changes"""
        files = []
        for root, dirs, filenames in os.walk('.'):
            # Remove ignored directories from dirs list (modifies in-place)
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            for filename in filenames:
                if any(filename.endswith(ext) for ext in self.watch_extensions):
                    filepath = Path(root) / filename
                    files.append(filepath)
        return files

    def check_for_changes(self):
        """Check if any watched files have been modified"""
        changed_files = []
        for filepath in self.get_files_to_watch():
            try:
                mtime = filepath.stat().st_mtime
                if str(filepath) in self.last_modified:
                    if mtime > self.last_modified[str(filepath)]:
                        changed_files.append(filepath)
                self.last_modified[str(filepath)] = mtime
            except (OSError, IOError):
                # File might have been deleted or moved
                pass
        return changed_files

    def run(self):
        """Main loop - start server and watch for changes"""
        try:
            # Initial file scan
            self.check_for_changes()

            # Start server
            self.start_server()

            while True:
                time.sleep(1)  # Check every second

                changed = self.check_for_changes()
                if changed and self.running:
                    print(f"\n✏️  Detected changes in: {', '.join(str(f) for f in changed)}")
                    self.stop_server()
                    time.sleep(0.5)  # Brief pause before restart
                    self.start_server()

        except KeyboardInterrupt:
            print("\n\n👋 Shutting down server...")
            if self.server:
                self.server.shutdown()
            sys.exit(0)

def main():
    # Parse port from command line if provided
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}")
            print("Usage: python dev_server.py [port]")
            sys.exit(1)

    # Check if another process is using the port
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()

    if result == 0:
        print(f"⚠️  Port {port} is already in use!")
        print("Try a different port: python dev_server.py 8001")
        sys.exit(1)

    # Start the development server
    server = DevServer(port)
    server.run()

if __name__ == "__main__":
    main()