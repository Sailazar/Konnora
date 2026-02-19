/**
 * Character Module
 * Handles the main character's state, animations, and movement
 */

import { CHARACTER_CONFIG, ANIMATION_DELAYS, FRAME_COUNTS } from './constants.js';

/**
 * Create and initialize the character object
 * @returns {Object} The character object with all properties initialized
 */
export function createCharacter() {
    return {
        // Position and dimensions
        x: 400,
        y: 600,
        groundY: 600,
        width: CHARACTER_CONFIG.WIDTH,
        height: CHARACTER_CONFIG.HEIGHT,

        // Movement speeds
        speed: CHARACTER_CONFIG.SPEED,
        floatSpeed: CHARACTER_CONFIG.FLOAT_SPEED,
        boostMultiplier: CHARACTER_CONFIG.BOOST_MULTIPLIER,
        turboMultiplier: CHARACTER_CONFIG.TURBO_MULTIPLIER,

        // Direction and state
        direction: 'right',
        isMoving: false,

        // Jumping and gravity
        isJumping: false,
        velocityY: 0,
        jumpPower: CHARACTER_CONFIG.JUMP_POWER,
        gravity: CHARACTER_CONFIG.GRAVITY,

        // Character states
        isGlowing: false,
        isFloating: false,
        isFlyingUp: false,
        isFlyingDown: false,
        isLanding: false,
        isBoost: false,
        isTurbo: false,

        // Boost timing
        boostStartTime: 0,
        boostDuration: CHARACTER_CONFIG.BOOST_DURATION,

        // Flying speeds
        flyUpSpeed: CHARACTER_CONFIG.FLY_UP_SPEED,
        flyDownSpeed: CHARACTER_CONFIG.FLY_DOWN_SPEED,
        flyUpSpeedBoost: CHARACTER_CONFIG.FLY_UP_SPEED_BOOST,
        flyDownSpeedBoost: CHARACTER_CONFIG.FLY_DOWN_SPEED_BOOST,
        flyUpSpeedTurbo: CHARACTER_CONFIG.FLY_UP_SPEED_TURBO,
        flyDownSpeedTurbo: CHARACTER_CONFIG.FLY_DOWN_SPEED_TURBO,

        // Animation frame indices
        walkFrameIndex: 0,
        idleFrameIndex: 0,
        jumpFrameIndex: 0,
        glowingFrameIndex: 0,
        floatFrameIndex: 0,
        flyUpFrameIndex: 0,
        flyDownFrameIndex: 0,
        landFrameIndex: 0,
        boostFrameIndex: 0,
        turboFrameIndex: 0,
        turboBoostFrameIndex: 0,

        // Animation frame counters
        walkFrameCounter: 0,
        idleFrameCounter: 0,
        jumpFrameCounter: 0,
        glowingFrameCounter: 0,
        floatFrameCounter: 0,
        flyUpFrameCounter: 0,
        flyDownFrameCounter: 0,
        landFrameCounter: 0,
        boostFrameCounter: 0,
        turboFrameCounter: 0,
        turboBoostCounter: 0,

        // Animation frame arrays (to be populated by image loader)
        walkFrames: [],
        idleFrames: [],
        jumpFrames: [],
        glowingFrames: [],
        floatFrames: [],
        flyUpFrames: [],
        flyDownFrames: [],
        landFrames: [],
        boostFrames: [],
        turboFrames: [],
        turboBoostFrames: [],

        // Animation frame counts
        walkFrameCount: 0,
        idleFrameCount: 0,
        jumpFrameCount: 0,
        glowingFrameCount: 0,
        floatFrameCount: 0,
        flyUpFrameCount: 0,
        flyDownFrameCount: 0,
        landFrameCount: 0,
        boostFrameCount: 0,
        turboFrameCount: 0,
        turboBoostFrameCount: 0
    };
}

/**
 * Initialize character animation frame counts
 * @param {Object} character - The character object
 */
export function initializeCharacterFrameCounts(character) {
    character.walkFrameCount = FRAME_COUNTS.WALK;
    character.idleFrameCount = FRAME_COUNTS.IDLE;
    character.jumpFrameCount = FRAME_COUNTS.JUMP;
    character.glowingFrameCount = FRAME_COUNTS.GLOWING;
    character.floatFrameCount = FRAME_COUNTS.FLOAT;
    character.flyUpFrameCount = FRAME_COUNTS.FLY_UP;
    character.flyDownFrameCount = FRAME_COUNTS.FLY_DOWN;
    character.landFrameCount = FRAME_COUNTS.LAND;
    character.boostFrameCount = FRAME_COUNTS.BOOST;
    character.turboFrameCount = FRAME_COUNTS.TURBO;
    character.turboBoostFrameCount = FRAME_COUNTS.TURBO_BOOST;
}

/**
 * Update character animation frames
 * @param {Object} character - The character object
 */
export function updateCharacterAnimations(character) {
    // Landing animation
    if (character.isLanding) {
        character.landFrameCounter++;
        if (character.landFrameCounter >= ANIMATION_DELAYS.LAND) {
            character.landFrameCounter = 0;
            character.landFrameIndex++;
            if (character.landFrameIndex >= character.landFrameCount) {
                character.isLanding = false;
                character.landFrameIndex = 0;
                character.velocityY = 0;
                character.idleFrameIndex = 0;
            }
        }
    }
    // Turbo animation
    else if (character.isTurbo) {
        character.turboFrameCounter++;
        if (character.turboFrameCounter >= ANIMATION_DELAYS.TURBO) {
            character.turboFrameCounter = 0;
            character.turboFrameIndex = (character.turboFrameIndex + 1) % character.turboFrameCount;
        }
        character.turboBoostCounter++;
        if (character.turboBoostCounter >= ANIMATION_DELAYS.TURBO_BOOST) {
            character.turboBoostCounter = 0;
            character.turboBoostFrameIndex = (character.turboBoostFrameIndex + 1) % character.turboBoostFrameCount;
        }
    }
    // Boost animation
    else if (character.isBoost) {
        character.boostFrameCounter++;
        if (character.boostFrameCounter >= ANIMATION_DELAYS.BOOST) {
            character.boostFrameCounter = 0;
            character.boostFrameIndex = (character.boostFrameIndex + 1) % character.boostFrameCount;
        }
    }
    // Fly down animation
    else if (character.isFlyingDown) {
        character.flyDownFrameCounter++;
        if (character.flyDownFrameCounter >= ANIMATION_DELAYS.FLY_DOWN) {
            character.flyDownFrameCounter = 0;
            character.flyDownFrameIndex = (character.flyDownFrameIndex + 1) % character.flyDownFrameCount;
        }
    }
    // Fly up animation
    else if (character.isFlyingUp) {
        character.flyUpFrameCounter++;
        if (character.flyUpFrameCounter >= ANIMATION_DELAYS.FLY_UP) {
            character.flyUpFrameCounter = 0;
            character.flyUpFrameIndex = (character.flyUpFrameIndex + 1) % character.flyUpFrameCount;
        }
    }
    // Floating animation
    else if (character.isFloating) {
        character.floatFrameCounter++;
        if (character.floatFrameCounter >= ANIMATION_DELAYS.FLOAT) {
            character.floatFrameCounter = 0;
            character.floatFrameIndex = (character.floatFrameIndex + 1) % character.floatFrameCount;
        }
    }
    // Glowing animation
    else if (character.isGlowing) {
        character.glowingFrameCounter++;
        if (character.glowingFrameCounter >= ANIMATION_DELAYS.GLOWING) {
            character.glowingFrameCounter = 0;
            character.glowingFrameIndex++;
            if (character.glowingFrameIndex >= character.glowingFrameCount) {
                character.isGlowing = false;
                character.glowingFrameIndex = 0;
                character.idleFrameIndex = 0;
                character.idleFrameCounter = 0;
            }
        }
    }
    // Jumping animation
    else if (character.isJumping) {
        character.jumpFrameCounter++;
        if (character.jumpFrameCounter >= ANIMATION_DELAYS.JUMP) {
            character.jumpFrameCounter = 0;
            if (character.jumpFrameIndex < character.jumpFrameCount - 1) {
                character.jumpFrameIndex++;
            }
        }
    }
    // Walking animation
    else if (character.isMoving) {
        character.walkFrameCounter++;
        if (character.walkFrameCounter >= ANIMATION_DELAYS.WALK) {
            character.walkFrameCounter = 0;
            character.walkFrameIndex = (character.walkFrameIndex + 1) % character.walkFrameCount;
        }
    }
    // Idle animation
    else {
        character.idleFrameCounter++;
        if (character.idleFrameCounter >= ANIMATION_DELAYS.IDLE) {
            character.idleFrameCounter = 0;
            character.idleFrameIndex = (character.idleFrameIndex + 1) % character.idleFrameCount;
        }
    }
}

/**
 * Reset character to initial state
 * @param {Object} character - The character object
 */
export function resetCharacter(character) {
    character.x = 400;
    character.y = 600;
    character.groundY = 600;
    character.velocityY = 0;
    character.isJumping = false;
    character.isFloating = false;
    character.isLanding = false;
    character.isFlyingUp = false;
    character.isFlyingDown = false;
    character.isBoost = false;
    character.isTurbo = false;
    character.direction = 'right';
}

/**
 * Get current character image based on state
 * @param {Object} character - The character object
 * @returns {Image|null} The current animation frame image
 */
export function getCurrentCharacterImage(character) {
    let img;
    if (character.isLanding) {
        img = character.landFrames[character.landFrameIndex];
    } else if (character.isTurbo) {
        // Turbo is handled separately
        return null;
    } else if (character.isBoost) {
        img = character.boostFrames[character.boostFrameIndex];
    } else if (character.isFlyingDown) {
        img = character.flyDownFrames[character.flyDownFrameIndex];
    } else if (character.isFlyingUp) {
        img = character.flyUpFrames[character.flyUpFrameIndex];
    } else if (character.isFloating) {
        img = character.floatFrames[character.floatFrameIndex];
    } else if (character.isGlowing) {
        img = character.glowingFrames[character.glowingFrameIndex];
    } else if (character.isJumping) {
        img = character.jumpFrames[character.jumpFrameIndex];
    } else if (character.isMoving) {
        img = character.walkFrames[character.walkFrameIndex];
    } else {
        img = character.idleFrames[character.idleFrameIndex];
    }
    return img;
}

/**
 * Get character state for UI display
 * @param {Object} character - The character object
 * @returns {string} The current character state name
 */
export function getCharacterStateName(character) {
    const stateNames = [
        'Idle',
        'Walking',
        'Jumping',
        'Glowing',
        'Floating',
        'Flying Up',
        'Flying Down',
        'BOOST!',
        'TURBO!',
        'Landing'
    ];

    const states = [
        0,
        character.isMoving,
        character.isJumping,
        character.isGlowing,
        character.isFloating,
        character.isFlyingUp,
        character.isFlyingDown,
        character.isBoost,
        character.isTurbo,
        character.isLanding
    ];

    return stateNames[states.lastIndexOf(true)];
}

/**
 * Get character state color for UI display
 * @param {Object} character - The character object
 * @returns {string} The color for the current state
 */
export function getCharacterStateColor(character) {
    const stateColors = [
        '#FFC107',
        '#4CAF50',
        '#FF5722',
        '#FFD700',
        '#00BFFF',
        '#E91E63',
        '#FF6F00',
        '#FFFF00',
        '#00FF00',
        '#9C27B0'
    ];

    const states = [
        0,
        character.isMoving,
        character.isJumping,
        character.isGlowing,
        character.isFloating,
        character.isFlyingUp,
        character.isFlyingDown,
        character.isBoost,
        character.isTurbo,
        character.isLanding
    ];

    return stateColors[states.lastIndexOf(true)];
}
