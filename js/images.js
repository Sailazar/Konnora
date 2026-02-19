/**
 * Images Module
 * Handles loading and managing all game assets/images
 */

import { FRAME_COUNTS, FOLDERS, FILE_PREFIXES, ANIMATION_DELAYS } from './constants.js';

/**
 * Generate an array of image file paths
 * @param {string} prefix - The file prefix (e.g., 'walk_right')
 * @param {number} count - The number of frames
 * @param {string} folder - The folder path
 * @returns {string[]} Array of image file paths
 */
export function generateImageArray(prefix, count, folder) {
    const arr = [];
    for (let i = 1; i <= count; i++) {
        arr.push(`${folder}${prefix}_${i.toString().padStart(3, '0')}.png`);
    }
    return arr;
}

/**
 * Load a set of images from source array to target array
 * @param {string[]} srcArray - Array of source image paths
 * @param {HTMLImageElement[]} targetArray - Target array to load images into
 */
export function loadImageSet(srcArray, targetArray) {
    srcArray.forEach(src => {
        const img = new Image();
        img.src = src;
        targetArray.push(img);
    });
}

/**
 * Create a background layer object
 * @param {number} frameCount - Number of frames in the animation
 * @param {number} parallaxSpeed - Horizontal parallax speed
 * @param {number} verticalParallaxSpeed - Vertical parallax speed
 * @returns {Object} Background layer object
 */
export function createBackgroundLayer(frameCount, parallaxSpeed, verticalParallaxSpeed) {
    return {
        frames: [],
        frameIndex: 0,
        frameDelay: ANIMATION_DELAYS.BACKGROUND,
        frameCounter: 0,
        frameCount: frameCount,
        x: 0,
        y: 0,
        parallaxSpeed: parallaxSpeed,
        verticalParallaxSpeed: verticalParallaxSpeed
    };
}

/**
 * Create a particle layer object
 * @returns {Object} Particle layer object
 */
export function createParticleLayer() {
    return {
        frames: [],
        frameIndex: 0,
        frameDelay: ANIMATION_DELAYS.PARTICLE,
        frameCounter: 0,
        frameCount: FRAME_COUNTS.PARTICLE,
        parallaxFactor: 0.01,
        scale: 4.0
    };
}

/**
 * Generate all image source paths
 * @returns {Object} Object containing all image source arrays
 */
export function generateImageSources() {
    return {
        walk: generateImageArray(FILE_PREFIXES.WALK, FRAME_COUNTS.WALK, FOLDERS.WALK),
        idle: generateImageArray(FILE_PREFIXES.IDLE, FRAME_COUNTS.IDLE, FOLDERS.IDLE),
        jump: generateImageArray(FILE_PREFIXES.JUMP, FRAME_COUNTS.JUMP, FOLDERS.JUMP),
        glowing: generateImageArray(FILE_PREFIXES.GLOWING, FRAME_COUNTS.GLOWING, FOLDERS.GLOWING),
        float: generateImageArray(FILE_PREFIXES.FLOAT, FRAME_COUNTS.FLOAT, FOLDERS.FLOAT),
        flyUp: generateImageArray(FILE_PREFIXES.FLY_UP, FRAME_COUNTS.FLY_UP, FOLDERS.FLY_UP),
        flyDown: generateImageArray(FILE_PREFIXES.FLY_DOWN, FRAME_COUNTS.FLY_DOWN, FOLDERS.FLY_DOWN),
        land: generateImageArray(FILE_PREFIXES.LAND, FRAME_COUNTS.LAND, FOLDERS.LAND),
        boost: generateImageArray(FILE_PREFIXES.BOOST, FRAME_COUNTS.BOOST, FOLDERS.BOOST),
        turbo: generateImageArray(FILE_PREFIXES.TURBO, FRAME_COUNTS.TURBO, FOLDERS.TURBO),
        turboBoost: generateImageArray(FILE_PREFIXES.TURBO_BOOST, FRAME_COUNTS.TURBO_BOOST, FOLDERS.TURBO_BOOST),
        bg: generateImageArray(FILE_PREFIXES.BACKGROUND, FRAME_COUNTS.BACKGROUND, FOLDERS.BACKGROUND),
        tree: generateImageArray(FILE_PREFIXES.TREE, FRAME_COUNTS.TREE, FOLDERS.TREE),
        newBackground: generateImageArray(FILE_PREFIXES.NEW_BACKGROUND, FRAME_COUNTS.NEW_BACKGROUND, FOLDERS.NEW_BACKGROUND),
        plant: generateImageArray(FILE_PREFIXES.PLANT, FRAME_COUNTS.PLANT, FOLDERS.PLANT),
        newTree: generateImageArray(FILE_PREFIXES.NEW_TREE, FRAME_COUNTS.NEW_TREE, FOLDERS.NEW_TREE),
        particle: generateImageArray(FILE_PREFIXES.PARTICLE, FRAME_COUNTS.PARTICLE, FOLDERS.PARTICLE)
    };
}

/**
 * Initialize and load all game images
 * @param {Object} character - The character object
 * @returns {Object} Object containing all loaded image layers
 */
export function loadAllImages(character) {
    const srcs = generateImageSources();

    // Load character animation frames
    loadImageSet(srcs.walk, character.walkFrames);
    loadImageSet(srcs.idle, character.idleFrames);
    loadImageSet(srcs.jump, character.jumpFrames);
    loadImageSet(srcs.glowing, character.glowingFrames);
    loadImageSet(srcs.float, character.floatFrames);
    loadImageSet(srcs.flyUp, character.flyUpFrames);
    loadImageSet(srcs.flyDown, character.flyDownFrames);
    loadImageSet(srcs.land, character.landFrames);
    loadImageSet(srcs.boost, character.boostFrames);
    loadImageSet(srcs.turbo, character.turboFrames);
    loadImageSet(srcs.turboBoost, character.turboBoostFrames);

    // Create and load background layers
    const background = createBackgroundLayer(FRAME_COUNTS.BACKGROUND, 15, 8);
    loadImageSet(srcs.bg, background.frames);

    const treeLayer = createBackgroundLayer(FRAME_COUNTS.TREE, 25, 12);
    loadImageSet(srcs.tree, treeLayer.frames);

    const newBackgroundLayer = createBackgroundLayer(FRAME_COUNTS.NEW_BACKGROUND, 35, 16);
    loadImageSet(srcs.newBackground, newBackgroundLayer.frames);

    const newBackground2Layer = createBackgroundLayer(FRAME_COUNTS.NEW_BACKGROUND, 35, 16);
    loadImageSet(srcs.newBackground, newBackground2Layer.frames);

    // Create and load particle layer
    const particleLayer = createParticleLayer();
    loadImageSet(srcs.particle, particleLayer.frames);

    // Create plant and new tree frame arrays
    const plantFrames = [];
    loadImageSet(srcs.plant, plantFrames);

    const newTreeFrames = [];
    loadImageSet(srcs.newTree, newTreeFrames);

    return {
        background,
        treeLayer,
        newBackgroundLayer,
        newBackground2Layer,
        particleLayer,
        plantFrames,
        newTreeFrames
    };
}

/**
 * Update animation frame for a layer
 * @param {Object} layer - The layer object to update
 */
export function updateLayerAnimation(layer) {
    layer.frameCounter++;
    if (layer.frameCounter >= layer.frameDelay) {
        layer.frameCounter = 0;
        layer.frameIndex = (layer.frameIndex + 1) % layer.frameCount;
    }
}

/**
 * Get the current frame image from a layer
 * @param {Object} layer - The layer object
 * @returns {Image|null} The current frame image or null if not loaded
 */
export function getCurrentLayerImage(layer) {
    const img = layer.frames[layer.frameIndex];
    if (img && img.complete && img.naturalHeight !== 0) {
        return img;
    }
    return null;
}
