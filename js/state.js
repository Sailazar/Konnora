/**
 * State Module
 * Handles game state management including save/load functionality
 */

import { MAX_ENERGY_ORBS, ETHER } from './constants.js';
import { resetCharacter } from './character.js';
import { initStars } from './spawning.js';
import { resetCamera } from './camera.js';
import { showToast } from './ui.js';

/**
 * Create initial game state
 * @param {Object} character - The character object
 * @param {Object} camera - The camera object
 * @returns {Object} Initial game state object
 */
export function createGameState(character, camera) {
    return {
        character: {
            x: character.x,
            y: character.y,
            groundY: character.groundY,
            direction: character.direction,
            velocityY: character.velocityY,
            isMoving: character.isMoving,
            isJumping: character.isJumping,
            isFloating: character.isFloating,
            isFlyingUp: character.isFlyingUp,
            isFlyingDown: character.isFlyingDown,
            isLanding: character.isLanding,
            isBoost: character.isBoost,
            isTurbo: character.isTurbo
        },
        currencies: {
            energy: 0,
            ether: 0,
            aurels: 0
        },
        world: {
            objects: [],
            energyOrbs: [],
            etherPixels: [],
            grounds: [],
            cores: [],
            stars: []
        },
        systems: {
            activeForests: [],
            lastAutoSpawn: Date.now(),
            lastAurelSpawn: Date.now(),
            lastForestSpawn: Date.now()
        }
    };
}

/**
 * Save current game state to a JSON file
 * @param {Object} character - The character object
 * @param {Object} gameState - The current game state
 * @returns {boolean} True if save was successful
 */
export function saveGame(character, gameState) {
    const nameInput = document.getElementById('save-name-input');
    let fileName = "Konno_Save";

    if (nameInput && nameInput.value.trim() !== "") {
        fileName = nameInput.value.trim().replace(/[^a-z0-9_\-]/gi, '_');
    }

    const saveData = {
        character: {
            x: character.x,
            y: character.y,
            groundY: character.groundY,
            direction: character.direction,
            velocityY: character.velocityY,
            isMoving: character.isMoving,
            isJumping: character.isJumping,
            isFloating: character.isFloating,
            isFlyingUp: character.isFlyingUp,
            isFlyingDown: character.isFlyingDown,
            isLanding: character.isLanding,
            isBoost: character.isBoost,
            isTurbo: character.isTurbo
        },
        currencies: {
            energy: gameState.currencies.energy,
            ether: gameState.currencies.ether,
            aurels: gameState.currencies.aurels
        },
        world: {
            objects: gameState.world.objects,
            energyOrbs: gameState.world.energyOrbs,
            etherPixels: gameState.world.etherPixels,
            grounds: gameState.world.grounds,
            cores: gameState.world.cores,
            stars: gameState.world.stars
        },
        systems: {
            activeForests: gameState.systems.activeForests,
            lastAutoSpawn: gameState.systems.lastAutoSpawn,
            lastAurelSpawn: gameState.systems.lastAurelSpawn,
            lastForestSpawn: gameState.systems.lastForestSpawn
        }
    };

    const dataStr = JSON.stringify(saveData);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return true;
}

/**
 * Load game state from a JSON file
 * @param {File} file - The save file to load
 * @param {Object} character - The character object
 * @param {Object} camera - The camera object
 * @param {Function} addFloatingText - Function to add floating text
 * @returns {Promise<boolean>} Promise that resolves to true if load was successful
 */
export function loadGame(file, character, camera, addFloatingText) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file provided"));
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                if (data.character) {
                    character.x = data.character.x;
                    character.y = data.character.y;
                    character.groundY = data.character.groundY;
                    character.direction = data.character.direction;
                    character.velocityY = data.character.velocityY;
                    character.isMoving = data.character.isMoving;
                    character.isJumping = data.character.isJumping;
                    character.isFloating = data.character.isFloating;
                    character.isFlyingUp = data.character.isFlyingUp;
                    character.isFlyingDown = data.character.isFlyingDown;
                    character.isLanding = data.character.isLanding;
                    character.isBoost = data.character.isBoost;
                    character.isTurbo = data.character.isTurbo;
                }

                // Update game state from loaded data
                if (data.currencies) {
                    character.collectedEnergy = data.currencies.energy;
                    character.collectedEther = data.currencies.ether;
                    character.collectedAurels = data.currencies.aurels;
                }

                if (data.world) {
                    character.worldObjects = data.world.objects || [];
                    character.energyOrbs = data.world.energyOrbs || [];
                    character.etherPixels = data.world.etherPixels || [];
                    character.grounds = data.world.grounds || [];
                    character.geometricCores = data.world.cores || [];
                    character.stars = data.world.stars || [];

                    // Limit orbs and ether for performance
                    if (character.energyOrbs.length > MAX_ENERGY_ORBS) {
                        character.energyOrbs.splice(0, character.energyOrbs.length - MAX_ENERGY_ORBS);
                    }
                    if (character.etherPixels.length > ETHER.MAX_ETHER_PIXELS) {
                        character.etherPixels.splice(0, character.etherPixels.length - ETHER.MAX_ETHER_PIXELS);
                    }
                }

                if (data.systems) {
                    character.activeForestCenters = data.systems.activeForests || [];
                    character.lastAutoSpawnTime = data.systems.lastAutoSpawn || Date.now();
                    character.lastAurelSpawnTime = data.systems.lastAurelSpawn || Date.now();
                    character.lastForestSpawnTime = data.systems.lastForestSpawn || Date.now();
                }

                if (addFloatingText) {
                    addFloatingText("GAME LOADED!", character.x, character.y - 50, '#00FFFF');
                }

                resolve(true);
            } catch (err) {
                console.error("Save load error:", err);
                showToast("Error loading save file: " + err, 'ether');
                reject(err);
            }
        };

        reader.onerror = function() {
            reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
    });
}

/**
 * Start a new game
 * @param {Object} character - The character object
 * @param {Object} camera - The camera object
 * @param {Object} gameState - The game state object
 * @param {Function} addFloatingText - Function to add floating text
 */
export function startNewGame(character, camera, gameState, addFloatingText) {
    console.log("Starting New Game...");

    // Reset character
    resetCharacter(character);

    // Reset camera
    resetCamera(camera);

    // Reset currencies
    character.collectedEnergy = 0;
    character.collectedEther = 0;
    character.collectedAurels = 0;

    // Reset world objects
    character.worldObjects = [];
    character.energyOrbs = [];
    character.etherPixels = [];
    character.geometricCores = [];

    // Keep at least the default ground
    if (character.grounds.length > 1) {
        character.grounds = [{ y: 600, type: 'default' }];
    }

    // Reset active forest centers
    character.activeForestCenters = [];

    // Initialize stars
    character.stars = initStars();

    // Reset spawn timers
    character.lastAutoSpawnTime = Date.now();
    character.lastAurelSpawnTime = Date.now();
    character.lastForestSpawnTime = Date.now();

    // Show notification
    if (addFloatingText) {
        addFloatingText("NEW GAME!", character.x, character.y - 50, '#FFD700');
    }
}

/**
 * Toggle game menu visibility
 * @param {boolean} show - Whether to show the menu
 * @returns {boolean} The new game running state
 */
export function toggleMenu(show) {
    const menu = document.getElementById('start-screen');
    const isGameRunning = !show;
    menu.style.display = show ? 'flex' : 'none';
    console.log("Menu toggled. Game Running:", isGameRunning);
    return isGameRunning;
}
