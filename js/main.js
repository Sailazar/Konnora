/**
 * Main Entry Point
 * Initializes and runs Konno game
 */

import { CANVAS } from "./constants.js";
import {
  createCharacter,
  initializeCharacterFrameCounts,
} from "./character.js";
import { createCamera } from "./camera.js";
import { createInputSystem } from "./input.js";
import { loadAllImages } from "./images.js";
import { initStars, spawnOrbs, spawnEther } from "./spawning.js";
import {
  createGameState,
  saveGame as saveGameState,
  loadGame as loadGameState,
  startNewGame as startNewGameState,
  toggleMenu,
} from "./state.js";
import { showToast, addFloatingText, drawMiniMap, drawGameUI } from "./ui.js";
import { createGround, createNewGround, plantTree } from "./world.js";
import { update } from "./update.js";
import { draw } from "./draw.js";

// ==========================================
// === GLOBAL GAME INSTANCE =================
// ==========================================

let gameInstance = null;
let isInitialized = false;

// ==========================================
// === GAME INITIALIZATION ===================
// ==========================================

/**
 * Initialize the game and return all systems
 */
function initGame() {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) {
    console.error("Canvas element not found!");
    return null;
  }

  const ctx = canvas.getContext("2d");
  canvas.width = CANVAS.WIDTH;
  canvas.height = CANVAS.HEIGHT;

  // Create core game objects
  const character = createCharacter();
  const camera = createCamera();
  const input = createInputSystem(camera, canvas.width, canvas.height);

  // Load all game images
  const layers = loadAllImages(character);

  // Initialize character frame counts
  initializeCharacterFrameCounts(character);

  // Initialize game state
  character.isGameRunning = false;
  character.floatingTexts = [];
  character.energyOrbs = [];
  character.etherPixels = [];
  character.grounds = [createGround(null, 600, null, "default")];
  character.worldObjects = [];
  character.geometricCores = [];
  character.stars = initStars();

  // Initialize spawn timers
  character.lastAutoSpawnTime = Date.now();
  character.lastAurelSpawnTime = Date.now();
  character.lastForestSpawnTime = Date.now();
  character.lastPlantTime = 0;

  // Initialize currencies
  character.collectedEnergy = 0;
  character.collectedEther = 0;
  character.collectedAurels = 0;

  // Initialize UI state
  character.showUI = true;

  // Store references to layers on character for easier access
  character.particleLayer = layers.particleLayer;
  character.background = layers.background;
  character.treeLayer = layers.treeLayer;
  character.newBackgroundLayer = layers.newBackgroundLayer;
  character.newBackground2Layer = layers.newBackground2Layer;
  character.plantFrames = layers.plantFrames;
  character.newTreeFrames = layers.newTreeFrames;

  // Initialize forest centers
  character.activeForestCenters = [];

  const systems = {
    canvas,
    ctx,
    character,
    camera,
    input,
    layers,
  };

  // Mark as initialized
  isInitialized = true;
  gameInstance = systems;

  return systems;
}

// ==========================================
// === MENU HANDLERS (GLOBAL) ===========
// ==========================================

/**
 * Save game handler
 */
function saveGameHandler() {
  if (!gameInstance) {
    console.warn("Game not initialized yet");
    showToast("Game not ready yet...", "ether");
    return;
  }

  const gameState = {
    character: {
      x: gameInstance.character.x,
      y: gameInstance.character.y,
      groundY: gameInstance.character.groundY,
      direction: gameInstance.character.direction,
      velocityY: gameInstance.character.velocityY,
      isMoving: gameInstance.character.isMoving,
      isJumping: gameInstance.character.isJumping,
      isFloating: gameInstance.character.isFloating,
      isFlyingUp: gameInstance.character.isFlyingUp,
      isFlyingDown: gameInstance.character.isFlyingDown,
      isLanding: gameInstance.character.isLanding,
      isBoost: gameInstance.character.isBoost,
      isTurbo: gameInstance.character.isTurbo,
    },
    currencies: {
      energy: gameInstance.character.collectedEnergy,
      ether: gameInstance.character.collectedEther,
      aurels: gameInstance.character.collectedAurels,
    },
    world: {
      objects: gameInstance.character.worldObjects,
      energyOrbs: gameInstance.character.energyOrbs,
      etherPixels: gameInstance.character.etherPixels,
      grounds: gameInstance.character.grounds,
      cores: gameInstance.character.geometricCores,
      stars: gameInstance.character.stars,
    },
    systems: {
      activeForests: gameInstance.character.activeForestCenters,
      lastAutoSpawn: gameInstance.character.lastAutoSpawnTime,
      lastAurelSpawn: gameInstance.character.lastAurelSpawnTime,
      lastForestSpawn: gameInstance.character.lastForestSpawnTime,
    },
  };

  saveGameState(gameInstance.character, gameState);
  addFloatingText(
    gameInstance.character.floatingTexts,
    "GAME SAVED!",
    gameInstance.character.x,
    gameInstance.character.y - 50,
    "#FFD700",
  );
}

/**
 * Load game handler
 */
function loadGameHandler(inputElement) {
  if (!gameInstance) {
    console.warn("Game not initialized yet");
    showToast("Game not ready yet...", "ether");
    return;
  }

  const file = inputElement.files[0];
  if (!file) {
    console.warn("No file selected");
    return;
  }

  loadGameState(
    file,
    gameInstance.character,
    gameInstance.camera,
    (text, x, y, color) => {
      addFloatingText(gameInstance.character.floatingTexts, text, x, y, color);
    },
  )
    .then(() => {
      gameInstance.character.isGameRunning = toggleMenu(false);
      showToast("GAME LOADED!", "gold");
    })
    .catch((err) => {
      console.error("Failed to load game:", err);
      showToast("Failed to load save!", "ether");
    });
}

/**
 * Start new game handler
 */
function startNewGameHandler() {
  if (!gameInstance) {
    console.warn("Game not initialized yet");
    return;
  }

  startNewGameState(
    gameInstance.character,
    gameInstance.camera,
    {},
    (text, x, y, color) =>
      addFloatingText(gameInstance.character.floatingTexts, text, x, y, color),
  );

  showToast("NEW GAME STARTED!", "gold");
}

// ==========================================
// === ATTACH GLOBAL FUNCTIONS ===============
// ==========================================

// Attach to window immediately for HTML onclick handlers
window.saveGame = saveGameHandler;
window.loadGame = loadGameHandler;
window.startNewGame = startNewGameHandler;

// ==========================================
// === EVENT HANDLERS =======================
// ==========================================

/**
 * Setup all event listeners
 */
function setupEventListeners(systems) {
  const { canvas, character, camera, input } = systems;

  // Attach input listeners
  input.attachListeners(canvas);

  // Escape key to toggle menu
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const newState = !character.isGameRunning;
      character.isGameRunning = toggleMenu(newState);

      if (newState) {
        // Restart game loop when menu is closed
        if (!isLoopRunning) {
          startGameLoop();
        }
      }
    }
  });

  // Keyboard shortcuts for UI
  window.addEventListener("keydown", (e) => {
    if (!character.isGameRunning) return;

    // Zoom controls
    if (e.key === "+" || e.key === "=") {
      camera.zoom = Math.min(camera.zoom + camera.zoomStep, camera.maxZoom);
    }
    if (e.key === "-" || e.key === "_") {
      camera.zoom = Math.max(camera.zoom - camera.zoomStep, camera.minZoom);
    }
    if (e.key === "0") {
      camera.zoom = 1;
    }

    // Toggle UI
    if (e.key.toLowerCase() === "h") {
      character.showUI = !character.showUI;
    }

    // Jump/Float/Land (Space key)
    if (e.key === " " && !character.isGlowing) {
      if (character.isLanding) {
        character.isLanding = false;
        character.velocityY = 0;
        character.isFloating = true;
        character.floatFrameIndex = 0;
      } else if (
        !character.isJumping &&
        !character.isFloating &&
        !character.isFlyingUp &&
        !character.isFlyingDown
      ) {
        character.isJumping = true;
        character.velocityY = -character.jumpPower;
        character.jumpFrameIndex = 0;
      } else if (character.isJumping) {
        character.isJumping = false;
        character.velocityY = 0;
        character.isFloating = true;
        character.floatFrameIndex = 0;
      } else if (
        character.isFloating ||
        character.isFlyingUp ||
        character.isFlyingDown ||
        character.isBoost ||
        character.isTurbo
      ) {
        const charFeetX = character.x + character.width / 2;
        const charFeetY = character.y + character.height;
        let bestGroundY = 99999;
        let foundTarget = false;

        character.grounds.forEach((g) => {
          const left = g.x !== undefined ? g.x : -Infinity;
          const right = g.width !== undefined ? g.x + g.width : Infinity;
          if (
            g.y >= charFeetY - 10 &&
            charFeetX >= left &&
            charFeetX <= right
          ) {
            if (!foundTarget || g.y < bestGroundY) {
              bestGroundY = g.y;
              foundTarget = true;
            }
          }
        });

        if (foundTarget) {
          character.groundY = bestGroundY;
        }

        character.isFloating = false;
        character.isFlyingUp = false;
        character.isFlyingDown = false;
        character.isLanding = true;
        character.landFrameIndex = 0;
      }
    }

    // Glowing (G key)
    if (
      e.key.toLowerCase() === "g" &&
      !character.isGlowing &&
      !character.isJumping &&
      !character.isFloating &&
      !character.isLanding
    ) {
      character.isGlowing = true;
      character.glowingFrameIndex = 0;
    }

    // Fly Up (W key)
    if (e.key.toLowerCase() === "w") {
      if (
        !character.isFlyingUp &&
        !character.isFlyingDown &&
        !character.isLanding
      ) {
        if (character.isFloating) {
          character.isFloating = false;
          character.isFlyingUp = true;
          character.flyUpFrameIndex = 0;
        } else if (
          !character.isJumping &&
          !character.isBoost &&
          !character.isTurbo
        ) {
          character.isFloating = true;
          character.isFlyingUp = true;
          character.floatFrameIndex = 0;
        }
      }
    }

    // Fly Down (S key)
    if (e.key.toLowerCase() === "s") {
      if (
        !character.isFlyingUp &&
        !character.isFlyingDown &&
        !character.isLanding
      ) {
        if (character.isFloating) {
          character.isFloating = false;
          character.isFlyingDown = true;
          character.flyDownFrameIndex = 0;
        } else if (
          !character.isJumping &&
          !character.isBoost &&
          !character.isTurbo
        ) {
          character.isFloating = true;
          character.isFlyingDown = true;
          character.floatFrameIndex = 0;
        }
      }
    }

    // Boost (Shift key)
    if (
      e.key === "Shift" &&
      (character.isFloating ||
        character.isFlyingUp ||
        character.isFlyingDown) &&
      !character.isBoost &&
      !character.isTurbo &&
      input.isAnyPressed(["a", "d", "w", "s"])
    ) {
      character.isBoost = true;
      character.boostStartTime = Date.now();
      character.boostFrameIndex = 0;
    }

    // Plant trees (P/O keys)
    const handlePlanting = (treeType) => {
      const tree = plantTree(
        character,
        character.collectedEnergy,
        character.lastPlantTime,
        (text, x, y, color) =>
          addFloatingText(character.floatingTexts, text, x, y, color),
        treeType,
      );
      if (tree) {
        character.collectedEnergy -= 10;
        addFloatingText(
          character.floatingTexts,
          `-10 Energy`,
          character.x,
          character.y - 50,
          "#FF4444",
        );
        character.lastPlantTime = Date.now();
        character.worldObjects.push(tree);
        spawnOrbs(tree.x, tree.y, 4, false).forEach((orb) =>
          character.energyOrbs.push(orb),
        );
      }
    };

    if (e.key.toLowerCase() === "p") handlePlanting("animated-tree");
    if (e.key.toLowerCase() === "o") handlePlanting("new-tree");

    // Build ground (B key)
    if (e.key.toLowerCase() === "b") {
      const ground = createNewGround(
        character,
        character.lastPlantTime,
        character.collectedEther,
        (text, x, y, color) =>
          addFloatingText(character.floatingTexts, text, x, y, color),
      );
      if (ground) {
        character.collectedEther -= 100;
        addFloatingText(
          character.floatingTexts,
          `-100 Ether`,
          character.x,
          character.y - 50,
          "#9D00FF",
        );
        character.lastPlantTime = Date.now();
        character.grounds.push(ground);
      }
    }
  });

  // Keyup events
  window.addEventListener("keyup", (e) => {
    if (!character.isGameRunning) return;

    input.keys[e.key.toLowerCase()] = false;

    // Release boost/turbo
    if (e.key === "Shift" && (character.isBoost || character.isTurbo)) {
      character.isBoost = false;
      character.isTurbo = false;
      character.isFloating = false;
      character.isFlyingUp = false;
      character.isFlyingDown = false;
      character.isLanding = true;
      character.landFrameIndex = 0;
      character.boostStartTime = 0;
    }

    // Release fly up
    if (e.key.toLowerCase() === "w" && character.isFlyingUp) {
      character.isFlyingUp = false;
      character.isFloating = true;
      character.floatFrameIndex = 0;
    }

    // Release fly down
    if (e.key.toLowerCase() === "s" && character.isFlyingDown) {
      character.isFlyingDown = false;
      character.isFloating = true;
      character.floatFrameIndex = 0;
    }
  });
}

// ==========================================
// === GAME LOOP =============================
// ==========================================

let isLoopRunning = false;
let animationFrameId = null;

/**
 * Main game loop
 */
function gameLoop() {
  if (!gameInstance) {
    console.warn("Game not initialized");
    return;
  }

  try {
    // Update game state
    const shouldContinue = update(
      gameInstance.character,
      gameInstance.camera,
      gameInstance.input,
      gameInstance.layers,
    );

    // Render game
    draw(
      gameInstance.ctx,
      gameInstance.canvas.width,
      gameInstance.canvas.height,
      gameInstance.camera,
      gameInstance.character,
      gameInstance.layers,
      gameInstance.character.worldObjects,
      gameInstance.character.stars,
      gameInstance.character.energyOrbs,
      gameInstance.character.etherPixels,
      gameInstance.character.geometricCores,
      gameInstance.character.floatingTexts,
      gameInstance.character.activeForestCenters,
      gameInstance.character.collectedEnergy,
      gameInstance.character.showUI,
      {
        drawFloatingTexts: (ctx, floatingTexts) => {
          floatingTexts.forEach((ft) => {
            ctx.save();
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = ft.color;
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          });
        },
        drawMiniMap,
        drawGameUI,
      },
      gameInstance.character.lastAutoSpawnTime,
      gameInstance.character.lastAurelSpawnTime,
    );
  } catch (e) {
    console.error("Game Loop Error:", e);
  }

  if (gameInstance.character.isGameRunning) {
    animationFrameId = requestAnimationFrame(gameLoop);
  } else {
    isLoopRunning = false;
  }
}

/**
 * Start the game loop
 */
function startGameLoop() {
  if (isLoopRunning) {
    console.log("Game loop already running");
    return;
  }

  isLoopRunning = true;
  gameLoop();
}

// ==========================================
// === BOOTSTRAP ============================
// ==========================================

/**
 * Initialize and start the game
 */
function init() {
  console.log("========================================");
  console.log("Initializing Konno Game...");
  console.log("========================================");

  try {
    // Initialize game systems
    const systems = initGame();

    if (!systems) {
      console.error("Failed to initialize game systems");
      return;
    }

    console.log("✓ Game systems initialized");
    console.log("✓ Character created");
    console.log("✓ Camera initialized");
    console.log("✓ Input system ready");
    console.log("✓ Images loaded");
    console.log("✓ Global functions attached to window");

    // Setup event listeners
    setupEventListeners(systems);
    console.log("✓ Event listeners attached");

    // Start game loop (paused initially - menu is shown)
    isLoopRunning = false;
    gameLoop();
    console.log("✓ Game loop started (paused)");

    console.log("========================================");
    console.log("GAME READY!");
    console.log("========================================");
  } catch (e) {
    console.error("Failed to initialize game:", e);
    console.error(e.stack);
  }
}

// Start game when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  // DOM is already loaded, initialize immediately
  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
}

// Export for external access if needed
export {
  init,
  initGame,
  gameLoop,
  startGameLoop,
  saveGameHandler,
  loadGameHandler,
  startNewGameHandler,
};
