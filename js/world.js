/**
 * World Module
 * Handles world objects including trees, grounds, stars, and forest mechanics
 */

import {
    COSTS,
    ETHER,
    FOREST,
    STARS,
    ANIMATION_DELAYS,
    FRAME_COUNTS
} from './constants.js';

/**
 * Create a ground platform object
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width of the ground platform
 * @param {string} type - Type of ground ('default' or 'particle')
 * @returns {Object} Ground object
 */
export function createGround(x, y, width = null, type = 'default') {
    const ground = {
        x: x,
        y: y,
        type: type
    };

    if (width !== null) {
        ground.width = width;
    }

    return ground;
}

/**
 * Create a new ground platform at character position
 * @param {Object} character - The character object
 * @param {number} lastPlantTime - Last planting action timestamp
 * @param {number} collectedEther - Collected ether amount
 * @param {Function} addFloatingText - Function to add floating text
 * @returns {Object|null} New ground object or null if can't create
 */
export function createNewGround(character, lastPlantTime, collectedEther, addFloatingText) {
    const now = Date.now();

    // Check cooldown
    if (now - lastPlantTime < 1000) {
        addFloatingText("Wait 1s", character.x, character.y - 50, '#FF8888');
        return null;
    }

    // Check if enough ether
    if (collectedEther < COSTS.NEW_GROUND_COST_ETHER) {
        addFloatingText(`Need ${COSTS.NEW_GROUND_COST_ETHER} Ether!`, character.x, character.y - 50, '#FF00FF');
        return null;
    }

    // Create ground
    const spawnY = character.y + character.height;
    const spawnX = character.x + (character.width / 2) - (COSTS.NEW_GROUND_WIDTH / 2);

    return createGround(spawnX, spawnY, COSTS.NEW_GROUND_WIDTH, 'particle');
}

/**
 * Create a tree object
 * @param {Object} character - The character object
 * @param {string} treeType - Type of tree ('animated-tree' or 'new-tree')
 * @returns {Object} Tree object
 */
export function createTree(character, treeType) {
    const depthLayer = Math.floor(Math.random() * 3);
    const scales = [0.4, 0.7, 1.0, 1.3, 1.6];
    const treeScale = scales[Math.floor(Math.random() * scales.length)];
    const yOffsets = [-150, -50, 0];
    const yOffset = yOffsets[depthLayer];
    const xVariance = (Math.random() - 0.5) * 100;
    const spawnX = character.x + character.width / 2 + xVariance;
    const spawnY = character.groundY + yOffset;

    return {
        x: spawnX,
        y: spawnY,
        state: treeType === 'animated-tree' ? 'growing' : 'growing-new-tree',
        type: treeType,
        frameIndex: 0,
        frameCounter: 0,
        frameDelay: treeType === 'animated-tree' ? ANIMATION_DELAYS.PLANT_GROWING : ANIMATION_DELAYS.NEW_TREE_GROWING,
        plantScale: 1.0,
        treeScale: treeScale,
        depthLayer: depthLayer,
        parallaxMultiplier: 1 - (depthLayer * 0.3),
        etherTimer: Date.now() + 2000
    };
}

/**
 * Handle planting a tree
 * @param {Object} character - The character object
 * @param {number} collectedEnergy - Collected energy amount
 * @param {number} lastPlantTime - Last planting action timestamp
 * @param {Function} addFloatingText - Function to add floating text
 * @param {string} treeType - Type of tree to plant
 * @returns {Object|null} New tree object or null if can't plant
 */
export function plantTree(character, collectedEnergy, lastPlantTime, addFloatingText, treeType) {
    const now = Date.now();

    // Check cooldown
    if (now - lastPlantTime < COSTS.PLANTING_COOLDOWN_MS) {
        const cooldownLeft = ((COSTS.PLANTING_COOLDOWN_MS - (now - lastPlantTime)) / 1000).toFixed(1);
        addFloatingText(`Wait ${cooldownLeft}s`, character.x, character.y - 50, '#FF8888');
        return null;
    }

    // Check if enough energy
    if (collectedEnergy < COSTS.ENERGY_COST_TO_PLANT) {
        addFloatingText("Need Energy!", character.x, character.y - 50, '#FF0000');
        return null;
    }

    // Create and return tree
    return createTree(character, treeType);
}

/**
 * Detect forest clusters among grown trees
 * @param {Array<Object>} worldObjects - Array of world objects
 * @returns {Array<Object>} Array of forest center points
 */
export function detectForest(worldObjects) {
    const trees = worldObjects.filter(obj => obj.state === 'grown' || obj.state === 'grown-new-tree');
    const activeForestCenters = [];

    if (trees.length < FOREST.SIZE_THRESHOLD) {
        return activeForestCenters;
    }

    const assignedTreeIndices = new Set();
    trees.sort((a, b) => a.x - b.x);

    for (let i = 0; i < trees.length; i++) {
        let t = trees[i];
        if (assignedTreeIndices.has(i)) continue;

        let currentCluster = [t];
        assignedTreeIndices.add(i);

        for (let j = i + 1; j < trees.length; j++) {
            let other = trees[j];
            if (assignedTreeIndices.has(j)) continue;
            if (other.x - t.x > FOREST.CLUSTER_RADIUS) break;

            let inCluster = false;
            for (let k = 0; k < currentCluster.length; k++) {
                if (Math.hypot(other.x - currentCluster[k].x, other.y - currentCluster[k].y) < FOREST.CLUSTER_RADIUS) {
                    inCluster = true;
                    break;
                }
            }

            if (inCluster) {
                currentCluster.push(other);
                assignedTreeIndices.add(j);
            }
        }

        if (currentCluster.length >= FOREST.SIZE_THRESHOLD) {
            let sumX = 0, sumY = 0;
            currentCluster.forEach(t => {
                sumX += t.x;
                sumY += t.y;
            });
            activeForestCenters.push({
                x: sumX / currentCluster.length,
                y: sumY / currentCluster.length
            });
        }
    }

    return activeForestCenters;
}

/**
 * Check if tree is within an active forest
 * @param {Object} tree - Tree object
 * @param {Array<Object>} activeForestCenters - Array of forest center points
 * @returns {boolean} True if tree is in active forest
 */
export function isTreeInActiveForest(tree, activeForestCenters) {
    if (activeForestCenters.length === 0) return false;

    if (tree.state !== 'grown' && tree.state !== 'grown-new-tree') return false;

    for (let c = 0; c < activeForestCenters.length; c++) {
        const distToCenter = Math.hypot(tree.x - activeForestCenters[c].x, tree.y - activeForestCenters[c].y);
        if (distToCenter < FOREST.CLUSTER_RADIUS) {
            return true;
        }
    }

    return false;
}

/**
 * Update world object animations
 * @param {Array<Object>} worldObjects - Array of world objects
 * @param {number} now - Current timestamp
 * @param {Function} spawnEther - Function to spawn ether
 */
export function updateWorldObjects(worldObjects, now, spawnEther) {
    for (let i = 0; i < worldObjects.length; i++) {
        let obj = worldObjects[i];
        obj.frameCounter++;

        if (obj.frameCounter >= obj.frameDelay) {
            obj.frameCounter = 0;

            if (obj.state === 'growing') {
                obj.frameIndex++;
                if (obj.frameIndex >= FRAME_COUNTS.PLANT) {
                    obj.state = 'grown';
                    obj.frameIndex = 0;
                    obj.frameDelay = ANIMATION_DELAYS.TREE;
                }
            } else if (obj.state === 'growing-new-tree') {
                obj.frameIndex++;
                if (obj.frameIndex >= FRAME_COUNTS.NEW_TREE) {
                    obj.state = 'grown-new-tree';
                    obj.frameIndex = 0;
                    obj.frameDelay = ANIMATION_DELAYS.NEW_TREE;
                }
            } else if (obj.state === 'grown') {
                obj.frameIndex = (obj.frameIndex + 1) % FRAME_COUNTS.TREE;
            } else if (obj.state === 'grown-new-tree') {
                obj.frameIndex = (obj.frameIndex + 1) % FRAME_COUNTS.NEW_TREE;
            }
        }

        // Spawn ether from grown trees
        if (obj.state === 'grown' || obj.state === 'grown-new-tree') {
            if (!obj.etherTimer) obj.etherTimer = now + 2000;

            if (now > obj.etherTimer) {
                const treeHeight = 200 * (obj.treeScale || 1);
                spawnEther(obj.x, obj.y - treeHeight + 50);
                const nextSpawn = ETHER.SPAWN_RATE_MIN + Math.random() * (ETHER.SPAWN_RATE_MAX - ETHER.SPAWN_RATE_MIN);
                obj.etherTimer = now + nextSpawn;
            }
        }
    }
}

/**
 * Find ground for character collision
 * @param {Object} character - The character object
 * @param {Array<Object>} grounds - Array of ground objects
 * @param {boolean} ignoreCollision - Whether to ignore ground collision
 * @returns {number} The Y position of the closest ground
 */
export function findGroundForCharacter(character, grounds, ignoreCollision) {
    if (ignoreCollision) {
        return character.groundY;
    }

    let closestGroundY = -99999;
    let foundGround = false;
    const charFeetY = character.y + character.height;
    const charCenterX = character.x + character.width / 2;

    grounds.forEach(g => {
        let inHorizontalRange = true;
        if (g.width) {
            inHorizontalRange = (charCenterX >= g.x && charCenterX <= g.x + g.width);
        }

        if (inHorizontalRange && charFeetY >= g.y && charFeetY - character.velocityY <= g.y + 10) {
            if (g.y > closestGroundY) {
                closestGroundY = g.y;
                foundGround = true;
            }
        }
    });

    if (foundGround) {
        return closestGroundY;
    }

    return character.groundY;
}

/**
 * Create a geometric core from merged ether
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Object} Geometric core object
 */
export function createGeometricCore(x, y) {
    return {
        x: x,
        y: y,
        outerSize: 40,
        innerSize: 20,
        color: '#9D00FF',
        innerColor: '#D500F9',
        pulse: 0,
        floatOffset: Math.random() * Math.PI * 2
    };
}

/**
 * Update geometric cores
 * @param {Array<Object>} geometricCores - Array of geometric cores
 * @param {Object} character - Character object
 * @param {number} now - Current timestamp
 * @param {number} collectedEther - Collected ether amount
 * @param {Function} addFloatingText - Function to add floating text
 * @returns {number} Updated collected ether amount
 */
export function updateGeometricCores(geometricCores, character, now, collectedEther, addFloatingText) {
    const charCenterX = character.x + character.width / 2;
    const charCenterY = character.y + character.height / 2;

    for (let i = geometricCores.length - 1; i >= 0; i--) {
        let core = geometricCores[i];

        // Animate core
        core.y += Math.sin(now / 500 + core.floatOffset) * 0.5;
        core.pulse += 0.05;

        // Move towards character if close
        const dist = Math.hypot(charCenterX - core.x, charCenterY - core.y);
        if (dist < 200) {
            core.x += (charCenterX - core.x) * 0.03;
            core.y += (charCenterY - core.y) * 0.03;
        }

        // Collect core if touching character
        if (dist < 60) {
            collectedEther += 50;
            addFloatingText(`+50 ETHER`, core.x, core.y - 20, '#E0B0FF');
            geometricCores.splice(i, 1);
        }
    }

    return collectedEther;
}

/**
 * Sort world objects by depth layer for proper rendering order
 * @param {Array<Object>} worldObjects - Array of world objects
 */
export function sortWorldObjectsByDepth(worldObjects) {
    worldObjects.sort((a, b) => a.depthLayer - b.depthLayer);
}
