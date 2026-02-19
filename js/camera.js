/**
 * Camera Module
 * Handles camera positioning, zoom, parallax, and tracking
 */

import { CAMERA } from './constants.js';

/**
 * Create and initialize the camera object
 * @returns {Object} The camera object with all properties initialized
 */
export function createCamera() {
    return {
        zoom: 1,
        minZoom: CAMERA.MIN_ZOOM,
        maxZoom: CAMERA.MAX_ZOOM,
        zoomStep: CAMERA.ZOOM_STEP,
        offsetX: 0,
        offsetY: 0,
        targetOffsetX: 0,
        targetOffsetY: 0,
        mouseX: 0,
        mouseY: 0
    };
}

/**
 * Update camera position towards target
 * @param {Object} camera - The camera object
 */
export function updateCamera(camera) {
    camera.offsetX += (camera.targetOffsetX - camera.offsetX) * 0.1;
    camera.offsetY += (camera.targetOffsetY - camera.offsetY) * 0.1;
}

/**
 * Set zoom level
 * @param {Object} camera - The camera object
 * @param {number} zoomLevel - The new zoom level
 */
export function setZoom(camera, zoomLevel) {
    camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, zoomLevel));
}

/**
 * Increase zoom level
 * @param {Object} camera - The camera object
 */
export function zoomIn(camera) {
    camera.zoom = Math.min(camera.zoom + camera.zoomStep, camera.maxZoom);
}

/**
 * Decrease zoom level
 * @param {Object} camera - The camera object
 */
export function zoomOut(camera) {
    camera.zoom = Math.max(camera.zoom - camera.zoomStep, camera.minZoom);
}

/**
 * Reset zoom to default
 * @param {Object} camera - The camera object
 */
export function resetZoom(camera) {
    camera.zoom = 1;
}

/**
 * Handle mouse movement for camera tracking
 * @param {Object} camera - The camera object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} mouseX - Mouse X position relative to canvas
 * @param {number} mouseY - Mouse Y position relative to canvas
 */
export function handleMouseMove(camera, canvasWidth, canvasHeight, mouseX, mouseY) {
    camera.mouseX = mouseX - (canvasWidth / 2);
    camera.mouseY = mouseY - (canvasHeight / 2);
    camera.targetOffsetX = -camera.mouseX * camera.zoom;
    camera.targetOffsetY = -camera.mouseY * camera.zoom;
}

/**
 * Handle mouse wheel for zooming
 * @param {Object} camera - The camera object
 * @param {number} deltaY - Mouse wheel delta
 */
export function handleWheel(camera, deltaY) {
    if (deltaY < 0) {
        zoomIn(camera);
    } else {
        zoomOut(camera);
    }
}

/**
 * Create a parallax layer
 * @param {number} frameDelay - Animation frame delay
 * @param {number} parallaxFactor - Parallax scroll factor
 * @param {number} parallaxSpeed - Horizontal parallax speed
 * @param {number} verticalParallaxSpeed - Vertical parallax speed
 * @returns {Object} Parallax layer object
 */
export function createParallaxLayer(frameDelay = 3, parallaxFactor = 0, parallaxSpeed = 0, verticalParallaxSpeed = 0) {
    return {
        frames: [],
        frameIndex: 0,
        frameDelay: frameDelay,
        frameCounter: 0,
        parallaxFactor: parallaxFactor,
        parallaxSpeed: parallaxSpeed,
        verticalParallaxSpeed: verticalParallaxSpeed
    };
}

/**
 * Update parallax layer animation
 * @param {Object} layer - Parallax layer object
 * @param {number} frameCount - Total frame count for animation
 */
export function updateParallaxLayer(layer, frameCount) {
    layer.frameCounter++;
    if (layer.frameCounter >= layer.frameDelay) {
        layer.frameCounter = 0;
        layer.frameIndex = (layer.frameIndex + 1) % frameCount;
    }
}

/**
 * Get world offset for parallax layer
 * @param {Object} camera - The camera object
 * @param {Object} layer - Parallax layer object
 * @param {number} characterX - Character X position
 * @returns {number} The world offset for the layer
 */
export function getParallaxOffset(camera, layer, characterX) {
    return -(characterX * layer.parallaxFactor);
}

/**
 * Get parallax position based on layer settings
 * @param {Object} camera - The camera object
 * @param {Object} layer - Parallax layer object
 * @param {number} characterX - Character X position
 * @param {number} characterY - Character Y position
 * @returns {Object} Object with x and y parallax positions
 */
export function getParallaxPosition(camera, layer, characterX, characterY) {
    return {
        x: layer.x || getParallaxOffset(camera, layer, characterX),
        y: layer.y || 0
    };
}

/**
 * Check if object is within camera view
 * @param {Object} camera - The camera object
 * @param {number} characterX - Character X position
 * @param {number} characterY - Character Y position
 * @param {number} objX - Object X position
 * @param {number} objY - Object Y position
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} padding - Extra padding around view
 * @returns {boolean} True if object is within view
 */
export function isInView(camera, characterX, characterY, objX, objY, canvasWidth, canvasHeight, padding = 200) {
    const viewLeft = characterX - (canvasWidth / camera.zoom) - padding;
    const viewRight = characterX + (canvasWidth / camera.zoom) + padding;
    const viewTop = characterY - (canvasHeight / camera.zoom) - padding;
    const viewBottom = characterY + (canvasHeight / camera.zoom) + padding;

    return objX >= viewLeft && objX <= viewRight &&
           objY >= viewTop && objY <= viewBottom;
}

/**
 * Reset camera to default position
 * @param {Object} camera - The camera object
 */
export function resetCamera(camera) {
    camera.offsetX = 0;
    camera.offsetY = 0;
    camera.targetOffsetX = 0;
    camera.targetOffsetY = 0;
    camera.mouseX = 0;
    camera.mouseY = 0;
    resetZoom(camera);
}
