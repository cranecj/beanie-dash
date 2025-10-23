#!/usr/bin/env python3
"""
Advanced auto-reloading development server using watchdog library
Install watchdog first: pip install watchdog
"""

import os
import sys
import time
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("⚠️  watchdog library not installed!")
    print("Install it with: pip install watchdog")
    print("Or use the basic dev_server.py instead")
    sys.exit(1)

class FileChangeHandler(FileSystemEventHandler):
    def __init__(self, server):
        self.server = server
        self.last_reload = 0
        self.reload_delay = 1  # Debounce delay in seconds

    def should_reload(self, path):
        """Check if file change should trigger reload"""
        # Check extension
        extensions = {'.html', '.js', '.css', '.json', '.md'}
        if not any(path.endswith(ext) for ext in extensions):
            return False

        # Ignore certain directories
        ignore_patterns = ['.git', 'node_modules', '.beads', '__pycache__']
        if any(pattern in path for pattern in ignore_patterns):
            return False

        return True

    def trigger_reload(self, path):
        """Trigger server reload with debouncing"""
        current_time = time.time()
        if current_time - self.last_reload > self.reload_delay:
            self.last_reload = current_time
            print(f"\n✏️  File changed: {path}")
            self.server.restart()

    def on_modified(self, event):
        if not event.is_directory and self.should_reload(event.src_path):
            self.trigger_reload(event.src_path)

    def on_created(self, event):
        if not event.is_directory and self.should_reload(event.src_path):
            self.trigger_reload(event.src_path)

class DevServerWatchdog:
    def __init__(self, port=8000):
        self.port = port
        self.server = None
        self.server_thread = None
        self.observer = None
        self.restart_lock = threading.Lock()

    def start_server(self):
        """Start the HTTP server in a separate thread"""
        print(f"\n🚀 Starting server on http://localhost:{self.port}")
        print("📁 Serving from:", os.getcwd())
        print("👀 Watching for changes (using watchdog)")
        print("🔄 Server will auto-restart on file changes")
        print("⚡ Press Ctrl+C to stop\n")

        handler = SimpleHTTPRequestHandler
        handler.log_message = lambda *args: None  # Suppress request logs for cleaner output

        self.server = HTTPServer(('', self.port), handler)
        self.server_thread = threading.Thread(target=self.server.serve_forever)
        self.server_thread.daemon = True
        self.server_thread.start()

    def stop_server(self):
        """Stop the HTTP server"""
        if self.server:
            self.server.shutdown()
            self.server_thread.join(timeout=1)
            self.server = None

    def restart(self):
        """Restart the server"""
        with self.restart_lock:
            print("🔄 Restarting server...")
            self.stop_server()
            time.sleep(0.2)
            self.start_server()

    def start_watcher(self):
        """Start the file system watcher"""
        event_handler = FileChangeHandler(self)
        self.observer = Observer()
        self.observer.schedule(event_handler, path='.', recursive=True)
        self.observer.start()

    def run(self):
        """Main loop"""
        try:
            self.start_server()
            self.start_watcher()

            # Keep running until interrupted
            while True:
                time.sleep(1)

        except KeyboardInterrupt:
            print("\n\n👋 Shutting down...")
            if self.observer:
                self.observer.stop()
                self.observer.join()
            if self.server:
                self.stop_server()
            sys.exit(0)

def main():
    # Parse port from command line if provided
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}")
            print("Usage: python dev_server_watchdog.py [port]")
            sys.exit(1)

    # Check if port is available
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()

    if result == 0:
        print(f"⚠️  Port {port} is already in use!")
        print("Try a different port: python dev_server_watchdog.py 8001")
        sys.exit(1)

    # Start the development server
    server = DevServerWatchdog(port)
    server.run()

if __name__ == "__main__":
    main()