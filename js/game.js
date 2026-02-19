/**
 * Game Module
 * Handles game initialization, game loop, and main entry point
 */

import { CANVAS } from './constants.js';
import { createCharacter, initializeCharacterFrameCounts, resetCharacter } from './character.js';
import { createCamera, resetCamera } from './camera.js';
import { createInputSystem } from './input.js';
import { createGameState, startNewGame, saveGame, loadGame, toggleMenu } from './state.js';
import { initStars } from './spawning.js';
import { addFloatingText, showToast, drawMiniMap, drawGameUI, drawPixelStar } from './ui.js';
import { plantTree, createNewGround, detectForest } from './world.js';
import { update } from './update.js';
import { draw } from './draw.js';
import { loadAllImages } from './images.js';

/**
 * Game class that manages the entire game instance
 */
class Game {
    constructor() {
        // Canvas and context
        this.canvas = null;
        this.ctx = null;
        this.canvasWidth = CANVAS.WIDTH;
        this.canvasHeight = CANVAS.HEIGHT;

        // Game state
        this.isGameRunning = false;
        this.showUI = true;

        // Core game objects
        this.character = null;
        this.camera = null;
        this.input = null;

        // World state
        this.worldObjects = [];
        this.grounds = [];
        this.stars = [];
        this.energyOrbs = [];
        this.etherPixels = [];
        this.geometricCores = [];
        this.floatingTexts = [];
        this.activeForestCenters = [];

        // Currency tracking
        this.collectedEnergy = 0;
        this.collectedEther = 0;
        this.collectedAurels = 0;

        // Spawn timers
        this.lastAutoSpawnTime = Date.now();
        this.lastAurelSpawnTime = Date.now();
        this.lastForestSpawnTime = Date.now();
        this.lastPlantTime = 0;

        // Animation and rendering layers
        this.layers = {};

        // UI functions reference
        this.uiFunctions = {
            drawFloatingTexts: (ctx, floatingTexts) => {
                floatingTexts.forEach(ft => {
                    ctx.save();
                    ctx.font = 'bold 16px Arial';
                    ctx.fillStyle = ft.color;
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 4;
                    ctx.fillText(ft.text, ft.x, ft.y);
                    ctx.restore();
                });
            },
            drawMiniMap,
            drawGameUI
        };

        // Animation frame ID
        this.animationFrameId = null;
    }

    /**
     * Initialize the game
     */
    init() {
        // Setup canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // Create game objects
        this.character = createCharacter();
        this.camera = createCamera();
        this.input = createInputSystem(this.camera, this.canvasWidth, this.canvasHeight);

        // Initialize ground with default platform
        this.grounds.push({ y: 600, type: 'default' });

        // Initialize stars
        this.stars = initStars();

        // Load images and layers
        this.layers = loadAllImages(this.character);
        initializeCharacterFrameCounts(this.character);

        // Attach input listeners
        this.input.attachListeners(this.canvas);

        // Attach menu toggle listener
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleMenu();
            }
        });

        // Setup menu button handlers
        this.setupMenuHandlers();

        console.log('Game initialized successfully');
        return true;
    }

    /**
     * Setup menu button handlers
     */
    setupMenuHandlers() {
        // Save game handler
        window.saveGame = () => {
            const gameState = this.createSaveState();
            const success = saveGame(this.character, gameState);
            if (success) {
                showToast('GAME SAVED!', 'gold');
                addFloatingText(this.floatingTexts, "GAME SAVED!", this.character.x, this.character.y - 50, '#FFD700');
            }
        };

        // Load game handler
        window.loadGame = (inputElement) => {
            const file = inputElement.files[0];
            if (!file) return;

            loadGame(file, this.character, this.camera, (text, x, y, color) => {
                addFloatingText(this.floatingTexts, text, x, y, color);
            }).then(() => {
                this.toggleMenu(false);
            }).catch(err => {
                console.error('Failed to load game:', err);
            });
        };

        // New game handler
        window.startNewGame = () => {
            this.startNewGame();
        };
    }

    /**
     * Start a new game
     */
    startNewGame() {
        console.log('Starting New Game...');

        // Reset character
        resetCharacter(this.character);

        // Reset camera
        resetCamera(this.camera);

        // Reset currencies
        this.collectedEnergy = 0;
        this.collectedEther = 0;
        this.collectedAurels = 0;

        // Reset world objects
        this.worldObjects = [];
        this.energyOrbs = [];
        this.etherPixels = [];
        this.geometricCores = [];
        this.floatingTexts = [];

        // Keep default ground
        this.grounds = [{ y: 600, type: 'default' }];

        // Reset active forest centers
        this.activeForestCenters = [];

        // Reinitialize stars
        this.stars = initStars();

        // Reset spawn timers
        this.lastAutoSpawnTime = Date.now();
        this.lastAurelSpawnTime = Date.now();
        this.lastForestSpawnTime = Date.now();
        this.lastPlantTime = 0;

        // Toggle menu
        this.toggleMenu(false);

        // Show notification
        addFloatingText(this.floatingTexts, "NEW GAME!", this.character.x, this.character.y - 50, '#FFD700');
    }

    /**
     * Create current game state for saving
     */
    createSaveState() {
        return {
            character: {
                x: this.character.x,
                y: this.character.y,
                groundY: this.character.groundY,
                direction: this.character.direction,
                velocityY: this.character.velocityY,
                isMoving: this.character.isMoving,
                isJumping: this.character.isJumping,
                isFloating: this.character.isFloating,
                isFlyingUp: this.character.isFlyingUp,
                isFlyingDown: this.character.isFlyingDown,
                isLanding: this.character.isLanding,
                isBoost: this.character.isBoost,
                isTurbo: this.character.isTurbo
            },
            currencies: {
                energy: this.collectedEnergy,
                ether: this.collectedEther,
                aurels: this.collectedAurels
            },
            world: {
                objects: this.worldObjects,
                energyOrbs: this.energyOrbs,
                etherPixels: this.etherPixels,
                grounds: this.grounds,
                cores: this.geometricCores,
                stars: this.stars
            },
            systems: {
                activeForests: this.activeForestCenters,
                lastAutoSpawn: this.lastAutoSpawnTime,
                lastAurelSpawn: this.lastAurelSpawnTime,
                lastForestSpawn: this.lastForestSpawnTime
            }
        };
    }

    /**
     * Toggle menu visibility
     */
    toggleMenu(show = null) {
        if (show === null) {
            show = this.isGameRunning;
        }

        this.isGameRunning = toggleMenu(show);

        if (this.isGameRunning) {
            this.startGameLoop();
        } else {
            this.stopGameLoop();
        }
    }

    /**
     * Handle game input and actions
     */
    handleInput() {
        if (!this.isGameRunning) return;

        // Plant trees (P and O keys)
        if (this.input.isPressed('p')) {
            this.handlePlanting('P');
        }
        if (this.input.isPressed('o')) {
            this.handlePlanting('O');
        }

        // Build ground platform (B key)
        if (this.input.isPressed('b')) {
            this.handleBuildingGround();
        }

        // Zoom controls
        if (this.input.isPressed('+') || this.input.isPressed('=')) {
            this.camera.zoom = Math.min(this.camera.zoom + this.camera.zoomStep, this.camera.maxZoom);
        }
        if (this.input.isPressed('-') || this.input.isPressed('_')) {
            this.camera.zoom = Math.max(this.camera.zoom - this.camera.zoomStep, this.camera.minZoom);
        }
        if (this.input.isPressed('0')) {
            this.camera.zoom = 1;
        }

        // Toggle UI (H key)
        if (this.input.isPressed('h')) {
            this.showUI = !this.showUI;
        }

        // Character state inputs
        this.handleCharacterInput();
    }

    /**
     * Handle character-specific input
     */
    handleCharacterInput() {
        const now = Date.now();

        // Jump/Float/Land (Space key)
        if (this.input.isPressed(' ') && !this.character.isGlowing) {
            if (this.character.isLanding) {
                this.character.isLanding = false;
                this.character.velocityY = 0;
                this.character.isFloating = true;
                this.character.floatFrameIndex = 0;
            } else if (!this.character.isJumping && !this.character.isFloating && !this.character.isFlyingUp && !this.character.isFlyingDown) {
                this.character.isJumping = true;
                this.character.velocityY = -this.character.jumpPower;
                this.character.jumpFrameIndex = 0;
            } else if (this.character.isJumping) {
                this.character.isJumping = false;
                this.character.velocityY = 0;
                this.character.isFloating = true;
                this.character.floatFrameIndex = 0;
            } else if (this.character.isFloating || this.character.isFlyingUp || this.character.isFlyingDown || this.character.isBoost || this.character.isTurbo) {
                this.findNearestGround();
                this.character.isFloating = false;
                this.character.isFlyingUp = false;
                this.character.isFlyingDown = false;
                this.character.isLanding = true;
                this.character.landFrameIndex = 0;
            }
        }

        // Glowing (G key)
        if (this.input.isPressed('g') && !this.character.isGlowing && !this.character.isJumping && !this.character.isFloating && !this.character.isLanding) {
            this.character.isGlowing = true;
            this.character.glowingFrameIndex = 0;
        }

        // Fly Up (W key)
        if (this.input.isPressed('w')) {
            if (!this.character.isFlyingUp && !this.character.isFlyingDown && !this.character.isLanding) {
                if (this.character.isFloating) {
                    this.character.isFloating = false;
                    this.character.isFlyingUp = true;
                    this.character.flyUpFrameIndex = 0;
                } else if (!this.character.isJumping && !this.character.isBoost && !this.character.isTurbo) {
                    this.character.isFloating = true;
                    this.character.isFlyingUp = true;
                    this.character.floatFrameIndex = 0;
                }
            }
        }

        // Fly Down (S key)
        if (this.input.isPressed('s')) {
            if (!this.character.isFlyingUp && !this.character.isFlyingDown && !this.character.isLanding) {
                if (this.character.isFloating) {
                    this.character.isFloating = false;
                    this.character.isFlyingDown = true;
                    this.character.flyDownFrameIndex = 0;
                } else if (!this.character.isJumping && !this.character.isBoost && !this.character.isTurbo) {
                    this.character.isFloating = true;
                    this.character.isFlyingDown = true;
                    this.character.floatFrameIndex = 0;
                }
            }
        }

        // Boost (Shift key)
        if (this.input.isShiftPressed() && (this.character.isFloating || this.character.isFlyingUp || this.character.isFlyingDown) && !this.character.isBoost && !this.character.isTurbo && (this.input.isAnyPressed(['a', 'd', 'w', 's']))) {
            this.character.isBoost = true;
            this.character.boostStartTime = now;
            this.character.boostFrameIndex = 0;
        }

        // Release boost on Shift up (handled in keyup, tracked separately)
        this.character.wKeyPressed = this.input.isPressed('w');
        this.character.sKeyPressed = this.input.isPressed('s');
    }

    /**
     * Find nearest ground for landing
     */
    findNearestGround() {
        const charFeetX = this.character.x + this.character.width / 2;
        const charFeetY = this.character.y + this.character.height;

        let bestGroundY = 99999;
        let foundTarget = false;

        this.grounds.forEach(g => {
            const left = g.x !== undefined ? g.x : -Infinity;
            const right = g.width !== undefined ? g.x + g.width : Infinity;

            if (g.y >= charFeetY - 10 && charFeetX >= left && charFeetX <= right) {
                if (!foundTarget || g.y < bestGroundY) {
                    bestGroundY = g.y;
                    foundTarget = true;
                }
            }
        });

        if (foundTarget) {
            this.character.groundY = bestGroundY;
        }
    }

    /**
     * Handle planting trees
     */
    handlePlanting(treeType) {
        const now = Date.now();

        // Check cooldown
        if (now - this.lastPlantTime < 2000) {
            const cooldownLeft = ((2000 - (now - this.lastPlantTime)) / 1000).toFixed(1);
            addFloatingText(this.floatingTexts, `Wait ${cooldownLeft}s`, this.character.x, this.character.y - 50, '#FF8888');
            return;
        }

        // Check if enough energy
        if (this.collectedEnergy < 10) {
            addFloatingText(this.floatingTexts, "Need Energy!", this.character.x, this.character.y - 50, '#FF0000');
            return;
        }

        // Deduct energy
        this.collectedEnergy -= 10;
        addFloatingText(this.floatingTexts, `-10 Energy`, this.character.x, this.character.y - 50, '#FF4444');
        this.lastPlantTime = now;

        // Create tree
        const tree = plantTree(this.character, this.collectedEnergy, this.lastPlantTime, (text, x, y, color) => {
            addFloatingText(this.floatingTexts, text, x, y, color);
        }, treeType === 'P' ? 'animated-tree' : 'new-tree');

        if (tree) {
            this.worldObjects.push(tree);
        }
    }

    /**
     * Handle building ground platforms
     */
    handleBuildingGround() {
        const now = Date.now();

        // Check cooldown
        if (now - this.lastPlantTime < 1000) {
            addFloatingText(this.floatingTexts, "Wait 1s", this.character.x, this.character.y - 50, '#FF8888');
            return;
        }

        // Check if enough ether
        if (this.collectedEther < 100) {
            addFloatingText(this.floatingTexts, "Need 100 Ether!", this.character.x, this.character.y - 50, '#FF00FF');
            return;
        }

        // Create ground
        const ground = createNewGround(this.character, this.lastPlantTime, this.collectedEther, (text, x, y, color) => {
            addFloatingText(this.floatingTexts, text, x, y, color);
        });

        if (ground) {
            this.collectedEther -= 100;
            this.lastPlantTime = now;
            this.grounds.push(ground);
        }
    }

    /**
     * Update game state
     */
    update() {
        if (!this.isGameRunning) return;

        // Sync character with game state
        this.character.isGameRunning = this.isGameRunning;
        this.character.worldObjects = this.worldObjects;
        this.character.grounds = this.grounds;
        this.character.stars = this.stars;
        this.character.energyOrbs = this.energyOrbs;
        this.character.etherPixels = this.etherPixels;
        this.character.geometricCores = this.geometricCores;
        this.character.floatingTexts = this.floatingTexts;
        this.character.activeForestCenters = this.activeForestCenters;
        this.character.collectedEnergy = this.collectedEnergy;
        this.character.collectedEther = this.collectedEther;
        this.character.collectedAurels = this.collectedAurels;
        this.character.lastAutoSpawnTime = this.lastAutoSpawnTime;
        this.character.lastAurelSpawnTime = this.lastAurelSpawnTime;
        this.character.lastForestSpawnTime = this.lastForestSpawnTime;

        // Sync character animation frames
        this.character.plantFrames = this.layers.plantFrames;
        this.character.newTreeFrames = this.layers.newTreeFrames;
        this.character.particleLayer = this.layers.particleLayer;
        this.character.background = this.layers.background;
        this.character.treeLayer = this.layers.treeLayer;
        this.character.newBackgroundLayer = this.layers.newBackgroundLayer;
        this.character.newBackground2Layer = this.layers.newBackground2Layer;

        // Update input
        this.handleInput();

        // Run main update
        update(this.character, this.camera, this.input, this.layers);

        // Sync back from character
        this.collectedEnergy = this.character.collectedEnergy;
        this.collectedEther = this.character.collectedEther;
        this.collectedAurels = this.character.collectedAurels;
        this.lastAutoSpawnTime = this.character.lastAutoSpawnTime;
        this.lastAurelSpawnTime = this.character.lastAurelSpawnTime;
        this.lastForestSpawnTime = this.character.lastForestSpawnTime;
    }

    /**
     * Render game frame
     */
    draw() {
        if (!this.ctx) return;

        draw(
            this.ctx,
            this.canvasWidth,
            this.canvasHeight,
            this.camera,
            this.character,
            this.layers,
            this.worldObjects,
            this.stars,
            this.energyOrbs,
            this.etherPixels,
            this.geometricCores,
            this.floatingTexts,
            this.activeForestCenters,
            this.collectedEnergy,
            this.showUI,
            this.uiFunctions,
            this.lastAutoSpawnTime,
            this.lastAurelSpawnTime
        );
    }

    /**
     * Main game loop
     */
    gameLoop() {
        try {
            this.update();
            this.draw();
        } catch (e) {
            console.error('Game Loop Error:', e);
        }

        if (this.isGameRunning) {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.gameLoop();
    }

    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Cleanup and destroy game instance
     */
    destroy() {
        this.stopGameLoop();
        if (this.input && this.canvas) {
            this.input.detachListeners(this.canvas);
        }
        console.log('Game destroyed');
    }
}

/**
 * Global game instance
 */
let gameInstance = null;

/**
 * Initialize and start the game
 */
export function initGame() {
    if (gameInstance) {
        console.warn('Game already initialized');
        return gameInstance;
    }

    gameInstance = new Game();
    const success = gameInstance.init();

    if (!success) {
        console.error('Failed to initialize game');
        return null;
    }

    return gameInstance;
}

/**
 * Get the current game instance
 */
export function getGame() {
    return gameInstance;
}

/**
 * Destroy the current game instance
 */
export function destroyGame() {
    if (gameInstance) {
        gameInstance.destroy();
        gameInstance = null;
    }
}
