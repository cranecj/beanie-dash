# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an HTML5 web game built as a Progressive Web App (PWA). The game runs entirely in the browser and can be installed as a standalone application on desktop and mobile devices.

## Task Management

**IMPORTANT**: Use beads (bd) for task tracking instead of markdown files. Initialize and use bd commands for managing issues and tasks in this project.

## Common Development Commands

```bash
# Start local development server with auto-reload on file changes
python3 dev_server.py
# or specify a custom port
python3 dev_server.py 8001

# Alternative: Use watchdog for more robust file watching (requires: pip install watchdog)
python3 dev_server_watchdog.py

# Alternative: Use nodemon if you have Node.js installed
npx nodemon --exec "python3 -m http.server 8000" --ext html,js,css,json

# Simple server without auto-reload
python3 -m http.server 8000

# Test PWA functionality locally with HTTPS
npx serve . --ssl-cert cert.pem --ssl-key key.pem

# Build for production (if build process exists)
npm run build

# Run tests (if test suite exists)
npm test

# Audit PWA compliance
npx lighthouse <URL> --view
```

## Architecture

### Core Structure
- **index.html**: Main entry point, contains game canvas and PWA meta tags
- **manifest.json**: PWA manifest defining app metadata, icons, and display properties
- **service-worker.js**: Handles offline functionality, caching strategy, and background sync
- **game/**: Game logic and assets
  - **main.js**: Game initialization and main loop
  - **entities/**: Game objects and characters
  - **scenes/**: Different game states (menu, gameplay, game over)
  - **utils/**: Helper functions and utilities
- **assets/**: Images, audio, sprites, and other media
- **styles/**: CSS files for UI elements outside the game canvas

### PWA Requirements
1. **Service Worker**: Implement caching strategies for offline play
2. **Manifest**: Include all required fields (name, icons, start_url, display mode)
3. **HTTPS**: Required for PWA features in production
4. **Responsive**: Game should adapt to different screen sizes and orientations
5. **Installable**: Meets criteria for Add to Home Screen prompt

### Game Development Patterns
- Use requestAnimationFrame for the game loop
- Implement proper touch controls for mobile devices
- Handle visibility changes (pause when tab is hidden)
- Manage audio context for autoplay policies
- Use Canvas or WebGL for rendering

### Performance Considerations
- Lazy load non-critical assets
- Use sprite sheets for animations
- Implement object pooling for frequently created/destroyed entities
- Optimize draw calls and minimize DOM manipulation
- Cache game assets in service worker for instant loading

## Development Guidelines

### PWA Features to Implement
- Offline gameplay capability
- App install prompts
- Push notifications for game events (optional)
- Background sync for score/progress updates
- Share API for sharing achievements

### Browser APIs to Utilize
- Gamepad API for controller support
- Vibration API for haptic feedback
- Screen Wake Lock API to prevent screen sleep during gameplay
- Web Audio API for advanced sound effects
- Storage APIs (localStorage, IndexedDB) for save games

### Testing Checklist
- Test on multiple devices and screen sizes
- Verify offline functionality
- Check PWA installation process
- Test game performance on low-end devices
- Validate touch controls and gestures
- Ensure proper audio handling across browsers