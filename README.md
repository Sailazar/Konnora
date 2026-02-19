# Konno - Astral Energy Collector

A modular, maintainable 2D adventure game built with vanilla JavaScript and ES6 modules.

## 🎮 Game Overview

Konno is a space-themed exploration game where you control a character that can:
- Walk, jump, float, and fly
- Collect energy orbs and ether pixels
- Plant trees that grow and spawn more resources
- Discover ancient stars to form constellations
- Merge particles to create geometric cores
- Build ground platforms to explore further
- Boost and turbo for fast travel

## 📁 Project Structure

```
Konnora01/
├── index.html              # Main HTML entry point
├── css/
│   └── styles.css         # All game styles
├── js/
│   ├── main.js            # Entry point, imports all modules
│   ├── constants.js        # Game configuration and constants
│   ├── character.js        # Character state and animations
│   ├── camera.js          # Camera, zoom, and parallax
│   ├── input.js           # Keyboard and mouse input handling
│   ├── images.js          # Image loading and management
│   ├── spawning.js        # Spawn functions (orbs, ether, stars)
│   ├── world.js           # World objects (trees, grounds, forest)
│   ├── ui.js              # UI elements (toast, floating text, minimap)
│   ├── state.js           # Save/load functionality
│   ├── update.js          # Game logic and state updates
│   ├── draw.js            # Rendering and drawing functions
│   └── game.js            # Game class and initialization
├── Idle/                  # Idle animation frames
├── walk/                  # Walk animation frames
├── jump/                  # Jump animation frames
├── glowing/               # Glowing animation frames
├── float/                 # Float animation frames
├── higher/                # Fly up animation frames
├── fly_down/              # Fly down animation frames
├── land/                  # Landing animation frames
├── boost_speed/           # Boost animation frames
├── turbo/                 # Turbo animation frames
├── turbo_boost/           # Turbo boost effect frames
├── background/            # Background animation frames
├── tree/                  # Tree animation frames
├── newBackground/         # New background frames
├── plant/                 # Plant growth frames
├── new_tree/             # New tree frames
└── particles/             # Particle effect frames
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser with ES6 module support (Chrome 61+, Firefox 60+, Safari 11+, Edge 16+)
- Local web server (for CORS - required for image loading)

### Running the Game

1. **Using a local web server (Recommended):**

   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

   Then open `http://localhost:8000` in your browser.

2. **Direct file opening:**

   Open `index.html` directly in your browser.
   ⚠️ **Note:** Some browsers may block image loading due to CORS. A local server is recommended.

## 🎮 Controls

| Key | Action |
|-----|---------|
| A / D | Move Left / Right |
| Space (1x) | Jump |
| Space (2x - Air) | Float |
| Space (3x) | Land |
| W | Fly Up / Takeoff |
| S | Fly Down / Phase Through |
| G | Glowing |
| P / O | Plant Tree (Cost: 10 Energy) |
| Shift + A/D | Boost |
| Hold Shift 3s | Turbo |
| B | Build Ground Platform (Cost: 100 Ether) |
| Scroll | Zoom In/Out |
| H | Toggle UI |
| ESC | Toggle Menu |

## 🏗️ Module Descriptions

### `constants.js`
- Contains all game configuration values
- Spawning timings, costs, limits
- Animation frame counts
- File paths and prefixes
- Easy to tune game balance

### `character.js`
- Character state management
- Animation frame handling
- Movement state transitions
- Character properties and speeds

### `camera.js`
- Camera position and zoom
- Parallax layer management
- Mouse tracking for camera movement
- View culling for performance

### `input.js`
- Keyboard and mouse event handling
- Input state tracking
- Movement and action detection
- Prevents default browser actions for game keys

### `images.js`
- Image asset loading
- Animation frame management
- Parallax layer creation
- Efficient image preloading

### `spawning.js`
- Energy orb spawning
- Ether pixel spawning
- Star generation (golden angle algorithm)
- Particle limiting for performance

### `world.js`
- Tree planting and growth
- Ground platform creation
- Forest detection and clustering
- Geometric core creation
- Collision detection

### `ui.js`
- Toast notifications
- Floating text effects
- Minimap rendering
- Game HUD display
- Pixel star drawing

### `state.js`
- Game save to JSON file
- Game load from JSON file
- New game initialization
- State serialization

### `update.js`
- Main game loop logic
- Character movement physics
- Particle merging
- Star discovery
- Collectible updates
- Animation state updates

### `draw.js`
- Canvas rendering pipeline
- Parallax layer drawing
- Character and object rendering
- Visual effects (glow, particles)
- UI overlay rendering

### `game.js`
- Game class managing entire game instance
- Initialization and cleanup
- Event handler setup
- Game loop management

### `main.js`
- Application entry point
- Module imports
- System initialization
- Bootstrap logic

## 🔧 Customization

### Adjusting Game Balance

Edit values in `js/constants.js`:

```javascript
// Change spawn rates
export const SPAWNING = {
    AUTO_SPAWN_INTERVAL_MS: 6000,  // Energy orb spawn rate
    AUREL_SPAWN_RATE_MS: 15000,  // Aurel spawn rate
    // ...
};

// Change costs
export const COSTS = {
    ENERGY_COST_TO_PLANT: 10,    // Energy needed to plant
    NEW_GROUND_COST_ETHER: 100,   // Ether needed for ground
    // ...
};
```

### Adding New Animations

1. Create a new folder for your animation frames
2. Add the folder name to `FOLDERS` in `constants.js`
3. Add frame count to `FRAME_COUNTS`
4. Load images in `images.js`

## 📊 Performance Optimizations

- **View Culling**: Only renders objects visible on screen
- **Particle Limiting**: Caps max orbs and ether pixels
- **Image Preloading**: All images loaded at startup
- **Efficient Rendering**: Batch draw operations
- **Animation Optimization**: Frame counters prevent redundant calculations

## 🐛 Debugging

The game includes debug features:
- Console logging for initialization
- Error handling in game loop
- State indicators in HUD
- Position display

To enable more debugging, modify the logging in individual modules.

## 💾 Save/Load System

The game saves to JSON files containing:
- Character position and state
- Collected currencies (energy, ether, aurels)
- World objects (trees, grounds, stars)
- System timers and spawn data

**Save Location:** Downloads as `.json` file
**Load:** Use the "LOAD FILE" button in menu

## 🎨 Visual Effects

- **Parallax Backgrounds**: Multiple depth layers
- **Glow Effects**: Energy aura, star halos
- **Particle Systems**: Floating orbs and ether
- **Forest Glows**: Trees pulse when in active forest
- **Turbo Trail**: Visual effect during turbo mode
- **Floating Text**: Shows collection feedback

## 🔮 Game Mechanics

### Tree Planting
- Costs 10 energy
- Has 2 second cooldown
- Trees grow over time (animation frames)
- Grown trees spawn ether periodically

### Forests
- 10+ trees clustered together form a forest
- Forests spawn extra energy orbs
- Forest trees have golden glow effect

### Particle Merging
- Orbs/ether near each other merge after 21 seconds
- Merged ether of value 10+ creates a geometric core
- Geometric cores are rare collectibles worth 50 ether

### Star Discovery
- 7 stars placed in spiral pattern
- Stars become visible when close
- Discovered stars connect with constellation lines
- Each star gives 100 energy + 50 ether

## 🛠️ Development

### Adding New Features

1. Create a new module in `js/`
2. Import and export as needed
3. Add functionality to appropriate system (update, draw, input, etc.)
4. Import in `main.js` if needed at initialization

### Code Style

- ES6 modules with import/export
- JSDoc comments for functions
- Consistent naming conventions
- Separation of concerns
- Modular architecture

## 📝 Notes

- Original file backed up as `index.html.backup`
- Refactored from single 1946-line file to 12 modules
- Maintains all original functionality
- Improved maintainability and extensibility
- Better code organization and readability

## 🙏 Credits

Original game concept and assets preserved in refactoring.
Refactored for improved maintainability and extensibility.

---

**Enjoy exploring the cosmos!** 🚀✨