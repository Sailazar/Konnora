/**
 * Spawning Module
 * Handles spawning of game objects like orbs, ether, and stars
 */

import {
    SPAWNING,
    ETHER,
    AURELS,
    MAX_ENERGY_ORBS,
    STARS
} from './constants.js';

/**
 * Generate an array of image file paths for an animation set
 * @param {string} prefix - The file prefix (e.g., 'walk_right')
 * @param {number} count - The number of frames
 * @param {string} folder - The folder path (e.g., 'walk/')
 * @returns {Array<string>} Array of file paths
 */
export function generateImageArray(prefix, count, folder) {
    const arr = [];
    for (let i = 1; i <= count; i++) {
        arr.push(`${folder}${prefix}_${i.toString().padStart(3, '0')}.png`);
    }
    return arr;
}

/**
 * Initialize constellation stars using the golden angle algorithm
 * @returns {Array<Object>} Array of star objects
 */
export function initStars() {
    const stars = [];
    const centerX = 400;
    const centerY = 600;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const spacing = 1800;

    for (let i = 0; i < STARS.COUNT; i++) {
        const r = spacing * Math.sqrt(i + 1);
        const theta = i * goldenAngle;

        const x = centerX + r * Math.cos(theta);
        const y = centerY + r * Math.sin(theta);

        stars.push({
            id: i,
            x: x,
            y: y,
            found: false,
            pulseOffset: Math.random() * Math.PI * 2,
            sizeVariation: 0.8 + Math.random() * 0.5,
            colorVar: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF'
        });
    }

    return stars;
}

/**
 * Spawn energy orbs or aurels at a location
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @param {number} count - The number of orbs to spawn
 * @param {boolean} isAurel - Whether to spawn aurels (golden particles)
 * @returns {Array<Object>} Array of spawned orb objects
 */
export function spawnOrbs(x, y, count, isAurel = false) {
    const spawnCount = count || SPAWNING.ORBS_DROPPED_PER_TREE;
    const orbs = [];

    for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 50 + Math.random() * 300;
        const spawnX = x + Math.cos(angle) * radius;
        const spawnY = y + Math.sin(angle) * radius;

        const orbColor = isAurel ? '#FFD700' : (Math.random() > 0.9 ? '#FFD700' : '#00FFFF');
        const orbSize = isAurel ? 8 : (4 + Math.random() * 4);
        const orbValue = isAurel ? AURELS.VALUE : 1;

        orbs.push({
            id: Date.now() + Math.random(),
            x: spawnX,
            y: spawnY,
            baseY: spawnY,
            vx: (Math.random() - 0.5) * SPAWNING.ORB_DRIFT_SPEED,
            floatSpeed: 0.02 + Math.random() * 0.04,
            angleOffset: Math.random() * Math.PI * 2,
            color: orbColor,
            size: orbSize,
            pixelJitter: 2,
            value: orbValue,
            mergeTarget: null,
            mergeStartTime: 0,
            isAurel: isAurel
        });
    }

    return orbs;
}

/**
 * Spawn ether pixels at a location
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @param {number} count - The number of ether pixels to spawn (optional)
 * @param {number} maxEtherPixels - Maximum number of ether pixels allowed
 * @returns {Array<Object>|null} Array of spawned ether objects, or null if limit reached
 */
export function spawnEther(x, y, count = null, maxEtherPixels = ETHER.MAX_ETHER_PIXELS) {
    const spawnCount = count || ETHER.SPAWN_AMOUNT;
    const ethers = [];

    for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 100;
        const spawnX = x + Math.cos(angle) * radius;
        const spawnY = y + Math.sin(angle) * radius;

        ethers.push({
            id: Date.now() + Math.random() + 10000,
            x: spawnX,
            y: spawnY,
            baseY: spawnY,
            vx: (Math.random() - 0.5) * 0.2,
            floatSpeed: 0.01 + Math.random() * 0.02,
            angleOffset: Math.random() * Math.PI * 2,
            color: '#9D00FF',
            size: ETHER.SIZE_BASE + Math.random() * ETHER.SIZE_VARIANCE,
            pixelJitter: 1.5,
            value: 1,
            mergeTarget: null,
            mergeStartTime: 0
        });
    }

    return ethers.length > 0 ? ethers : null;
}

/**
 * Limit the number of orbs in the array to prevent performance issues
 * @param {Array<Object>} orbs - The array of orbs to limit
 * @param {number} maxCount - The maximum number of orbs allowed
 * @returns {Array<Object>} The limited array of orbs
 */
export function limitOrbs(orbs, maxCount = MAX_ENERGY_ORBS) {
    if (orbs.length > maxCount) {
        orbs.splice(0, orbs.length - maxCount);
    }
    return orbs;
}

/**
 * Limit the number of ether pixels in the array to prevent performance issues
 * @param {Array<Object>} ethers - The array of ether pixels to limit
 * @param {number} maxCount - The maximum number of ether pixels allowed
 * @returns {Array<Object>} The limited array of ether pixels
 */
export function limitEther(ethers, maxCount = ETHER.MAX_ETHER_PIXELS) {
    if (ethers.length > maxCount) {
        ethers.splice(0, ethers.length - maxCount);
    }
    return ethers;
}
