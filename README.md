# Beanie Dash - Neon Runner Game

A fast-paced, neon-themed endless runner game inspired by Geometry Dash, built as a Progressive Web App (PWA).

## Features

- 🎮 **Endless Gameplay**: Single endless level with progressively increasing difficulty
- 🌟 **Neon Aesthetics**: Cyberpunk-inspired visuals with glowing effects
- 🎵 **Music Sync**: Gameplay elements pulse to the beat
- 📊 **Progress Tracking**: Death counter, best score, progress bar, and difficulty level
- 🦘 **Physics-Based Movement**: Jump over obstacles with realistic physics
- 📱 **PWA Support**: Install as an app on desktop and mobile devices
- 🎯 **Multiple Obstacles**: Spikes, blocks, rotating saws, moving platforms, and... poop!
- 📈 **Progressive Difficulty**: Game starts easy and gradually introduces new challenges

## Game Controls

- **Desktop**: Press `SPACE` to jump
- **Mobile**: Tap anywhere on the screen to jump
- **Jump Height**: Designed to clear 2 obstacles in a single jump
- **Quick Retry**: Press `SPACE` after game over to instantly retry

## Quick Start

1. **Generate Assets**:
   - Open `generate_assets.html` in a browser
   - Right-click and save each canvas as directed
   - Save icons to `assets/icons/` folder
   - Save screenshots to `assets/screenshots/` folder

2. **Add Audio Files** (Optional):
   Create or download simple audio files and place them in `assets/audio/`:
   - `background.mp3` or `background.ogg` - Background music
   - `jump.mp3` or `jump.ogg` - Jump sound effect
   - `death.mp3` or `death.ogg` - Death sound effect

3. **Start Local Server**:
   ```bash
   # Using Python
   python3 -m http.server 8000

   # Or using Node.js
   npx serve .
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:8000`

## PWA Installation

The game can be installed as a Progressive Web App:

1. Visit the game in a supported browser (Chrome, Edge, Safari)
2. Look for the install button (📥) or browser prompt
3. Click to install the app to your device
4. The game will work offline once installed

## Testing PWA Features

```bash
# Test with HTTPS locally (required for service worker)
npx serve . --ssl-cert cert.pem --ssl-key key.pem

# Audit PWA compliance
npx lighthouse http://localhost:8000 --view
```

## Project Structure

```
beanie-dash/
├── index.html           # Main game HTML
├── manifest.json        # PWA manifest
├── service-worker.js    # Offline functionality
├── js/
│   └── game.js         # Game logic and physics
├── styles/
│   └── main.css        # Neon theme styling
├── assets/
│   ├── icons/          # PWA icons
│   ├── screenshots/    # PWA screenshots
│   └── audio/          # Sound effects and music
└── generate_assets.html # Asset generator utility
```

## Gameplay Tips

- Time your jumps carefully - you can clear 2 obstacles with one jump
- Watch for patterns in obstacle placement
- Moving platforms are safe to land on
- The game speeds up gradually - stay focused!
- Your best score is saved locally

## Difficulty Progression

The game now features an extremely gentle learning curve:

- **0-40m (Learning)**: Only simple spikes, very slow speed, huge spacing (500px)
- **40-80m (Easy)**: Still just spikes, slightly faster
- **80-120m (Normal)**: Blocks introduced, moderate speed
- **240-320m (Medium)**: Moving platforms appear
- **320-400m (Hard)**: Rotating saws added, challenging speed
- **400m+ (INSANE!)**: All obstacles including poop, maximum challenge

Key Features:
- Obstacles start 800px away (plenty of reaction time)
- Spacing decreases by only 5px per level (very gradual)
- No moving objects until 240m (level 6)
- Minimum spacing is 250px (always manageable)

## Customization

### Adjusting Difficulty
Edit these values in `js/game.js`:
- `jumpPower`: Jump height (default: -14)
- `gravity`: Fall speed (default: 0.8)
- `speed`: Initial game speed (default: 3.5)
- `maxSpeed`: Maximum speed (default: 12)
- `obstacleSpacing`: Initial distance between obstacles (default: 500px)
- `minObstacleSpacing`: Minimum spacing at high difficulty (default: 250px)
- `speedIncrement`: Rate of speed increase (default: 0.0004)
- `lastObstacleX`: First obstacle distance (default: 800px)

### Adding New Obstacles
Add new obstacle types in the `generateObstacle()` method in `js/game.js`.

## Browser Compatibility

- ✅ Chrome/Edge (Full PWA support)
- ✅ Firefox (No PWA install)
- ✅ Safari (Limited PWA support)
- ✅ Mobile browsers (Touch controls)

## License

MIT License - See LICENSE file for details

## Credits

Created by Chris Crane (2025)

---

**Note**: This is a demo game created for educational purposes. For production use, consider adding:
- Actual audio assets
- Server-side high score tracking
- Multiple levels or themes
- Power-ups and achievements
- Social sharing features