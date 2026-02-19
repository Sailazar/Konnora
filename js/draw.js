/**
 * Draw Module
 * Handles all rendering and drawing operations for the game
 */

import { FOREST, COSTS, TURBO } from './constants.js';
import { updateLayerAnimation, getCurrentLayerImage } from './images.js';
import { drawPixelStar } from './ui.js';

/**
 * Clear the canvas with background color
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function clearCanvas(ctx, width, height) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
}

/**
 * Apply camera transformations to context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {Object} camera - Camera object
 * @param {Object} character - Character object
 */
export function applyCameraTransform(ctx, canvasWidth, canvasHeight, camera, character) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.translate(camera.offsetX, camera.offsetY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-character.x - character.width / 2, -character.y - character.height / 2);
}

/**
 * Draw a tiled layer (particles)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} layer - Layer object
 * @param {Object} character - Character object
 * @param {number} canvasHeight - Canvas height
 */
export function drawTiledLayer(ctx, layer, character, canvasHeight) {
    const img = getCurrentLayerImage(layer);
    if (!img) return;

    const tileW = img.naturalWidth * layer.scale;
    const tileH = canvasHeight;
    const worldOffset = character.x * layer.parallaxFactor;
    const offsetX = -(worldOffset % tileW);
    const startX = offsetX - tileW;
    const count = Math.ceil(ctx.canvas.width / tileW) + 2;

    for (let i = 0; i < count; i++) {
        ctx.drawImage(img, startX + (i * tileW), 0, tileW, tileH);
    }
}

/**
 * Draw a parallax layer
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} layer - Layer object
 * @param {Object} character - Character object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} scale - Display scale factor
 * @param {number} parallaxFactor - Parallax scroll factor
 */
export function drawParallaxLayer(ctx, layer, character, canvasWidth, canvasHeight, scale = 1, parallaxFactor = 1) {
    const img = getCurrentLayerImage(layer);
    if (!img) return;

    const w = canvasWidth * scale;
    const h = canvasHeight * scale;
    const offsetX = -(character.x * parallaxFactor) % w;
    const drawX = offsetX < 0 ? offsetX + w : offsetX;

    for (let dx = -2; dx <= 2; dx++) {
        ctx.drawImage(img, drawX + dx * w, 0, w, h);
    }
}

/**
 * Draw a static layer (no parallax)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} layer - Layer object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} scale - Display scale factor
 */
export function drawStaticLayer(ctx, layer, canvasWidth, canvasHeight, scale = 1) {
    const img = getCurrentLayerImage(layer);
    if (!img) return;

    const w = canvasWidth * scale;
    const h = canvasHeight * scale;
    ctx.drawImage(img, 0, 0, w, h);
}

/**
 * Draw ground platforms
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} grounds - Array of ground objects
 * @param {Object} particleLayer - Particle layer for ground texture
 * @param {Object} character - Character object
 */
export function drawGrounds(ctx, grounds, particleLayer, character) {
    grounds.forEach(g => {
        if (g.type === 'particle') {
            const img = getCurrentLayerImage(particleLayer);
            if (!img) return;

            const tileW = img.naturalWidth;
            const tileH = img.naturalHeight;

            if (g.width) {
                // Finite width ground
                const drawY = g.y - (tileH / 2);
                const startTile = Math.floor(g.x / tileW);
                const endTile = Math.ceil((g.x + g.width) / tileW);

                for (let t = startTile; t <= endTile; t++) {
                    const xPos = t * tileW;
                    ctx.drawImage(img, xPos, drawY, tileW, tileH);
                }
            } else {
                // Infinite ground
                const count = Math.ceil(ctx.canvas.width / tileW) + 2;
                const offsetX = -(character.x % tileW) - tileW;

                ctx.save();
                ctx.translate(0, g.y - (tileH / 2));
                for (let i = 0; i < count; i++) {
                    ctx.drawImage(img, offsetX + (i * tileW), 0, tileW, tileH);
                }
                ctx.restore();
            }
        }
    });
}

/**
 * Draw constellation lines between found stars
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} stars - Array of star objects
 */
export function drawConstellationLines(ctx, stars) {
    const foundStars = stars.filter(s => s.found).sort((a, b) => a.id - b.id);
    if (foundStars.length <= 1) return;

    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 15 + Math.sin(Date.now() / 200) * 5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(foundStars[0].x, foundStars[0].y);

    for (let i = 1; i < foundStars.length; i++) {
        ctx.lineTo(foundStars[i].x, foundStars[i].y);
    }
    ctx.stroke();
    ctx.restore();
}

/**
 * Draw stars in the game world
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} stars - Array of star objects
 * @param {Object} camera - Camera object
 * @param {Object} character - Character object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} visibilityRange - Star visibility range
 */
export function drawStars(ctx, stars, camera, character, canvasWidth, canvasHeight, visibilityRange) {
    const viewLeft = character.x - (canvasWidth / camera.zoom);
    const viewRight = character.x + (canvasWidth / camera.zoom);
    const viewTop = character.y - (canvasHeight / camera.zoom);
    const viewBottom = character.y + (canvasHeight / camera.zoom);
    const now = Date.now();

    stars.forEach(star => {
        // Cull stars outside view range
        if (star.x < viewLeft - 500 || star.x > viewRight + 500 ||
            star.y < viewTop - 500 || star.y > viewBottom + 500) return;

        const dist = Math.hypot(character.x - star.x, character.y - star.y);
        let alpha = 0;

        if (star.found) {
            alpha = 1;
        } else if (dist < visibilityRange) {
            alpha = 1 - (dist / visibilityRange);
        }

        if (alpha > 0) {
            const pulse = Math.sin(now / 200 + star.pulseOffset);
            const baseSize = 10 * star.sizeVariation;
            const extraGlow = star.found ? 15 : 0;

            drawPixelStar(ctx, star.x, star.y, baseSize, star.colorVar, alpha, pulse + extraGlow);

            // Draw hint for nearby stars
            if (!star.found && dist < 300 && dist > 100) {
                if (Math.floor(now / 1000) % 2 === 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.font = '12px Courier New';
                    ctx.textAlign = 'center';
                    ctx.fillText("?", star.x, star.y - 40);
                }
            }
        }
    });
}

/**
 * Draw energy orbs
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} energyOrbs - Array of energy orb objects
 * @param {Object} character - Character object
 */
export function drawEnergyOrbs(ctx, energyOrbs, character) {
    energyOrbs.forEach(orb => {
        // Draw merge line
        if (orb.mergeTarget) {
            const target = energyOrbs.find(o => o.id === orb.mergeTarget);
            if (target) {
                ctx.save();
                ctx.strokeStyle = orb.color;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(orb.x, orb.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.save();
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = orb.color;

        const jitterX = (Math.random() - 0.5) * orb.pixelJitter;
        const jitterY = (Math.random() - 0.5) * orb.pixelJitter;
        const drawSize = orb.size;

        if (orb.isAurel) {
            // Draw diamond shape for aurels
            ctx.beginPath();
            ctx.moveTo(orb.x + jitterX, orb.y + jitterY - drawSize);
            ctx.lineTo(orb.x + jitterX + drawSize, orb.y + jitterY);
            ctx.lineTo(orb.x + jitterX, orb.y + jitterY + drawSize);
            ctx.lineTo(orb.x + jitterX - drawSize, orb.y + jitterY);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFF';
            ctx.fillRect(orb.x + jitterX - 1, orb.y + jitterY - 1, 2, 2);
        } else {
            // Draw square for regular orbs
            ctx.fillRect(orb.x + jitterX - drawSize / 2, orb.y + jitterY - drawSize / 2, drawSize, drawSize);
        }

        // Draw value for merged orbs
        if (orb.value > 1) {
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(orb.value, orb.x + jitterX, orb.y + jitterY);
        }

        // Draw occasional sparkle
        if (!orb.isAurel && Math.random() > 0.7) {
            ctx.globalAlpha = 0.6;
            ctx.fillRect(orb.x + jitterX - drawSize, orb.y + jitterY - drawSize, drawSize / 2, drawSize / 2);
        }

        ctx.restore();
    });
}

/**
 * Draw ether pixels
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} etherPixels - Array of ether pixel objects
 */
export function drawEtherPixels(ctx, etherPixels) {
    etherPixels.forEach(ether => {
        // Draw merge line
        if (ether.mergeTarget) {
            const target = etherPixels.find(o => o.id === ether.mergeTarget);
            if (target) {
                ctx.save();
                ctx.strokeStyle = ether.color;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(ether.x, ether.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.save();
        ctx.shadowColor = ether.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = ether.color;

        const jitterX = (Math.random() - 0.5) * ether.pixelJitter;
        const jitterY = (Math.random() - 0.5) * ether.pixelJitter;
        const drawSize = ether.size;

        ctx.fillRect(ether.x + jitterX - drawSize / 2, ether.y + jitterY - drawSize / 2, drawSize, drawSize);

        // Draw value for merged ether
        if (ether.value > 1) {
            ctx.fillStyle = '#FFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ether.value, ether.x + jitterX, ether.y + jitterY);
        }

        // Draw occasional sparkle
        if (Math.random() > 0.8) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(ether.x + jitterX, ether.y + jitterY, 1, 1);
        }

        ctx.restore();
    });
}

/**
 * Draw geometric cores
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} geometricCores - Array of geometric core objects
 */
export function drawGeometricCores(ctx, geometricCores) {
    geometricCores.forEach(core => {
        ctx.save();
        ctx.translate(core.x, core.y);

        const scale = 1 + Math.sin(core.pulse) * 0.1;
        ctx.scale(scale, scale);

        ctx.fillStyle = core.color;
        ctx.shadowColor = core.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(-core.outerSize / 2, -core.outerSize / 2, core.outerSize, core.outerSize);

        ctx.fillStyle = core.innerColor;
        ctx.shadowBlur = 5;
        ctx.fillRect(-core.innerSize / 2, -core.innerSize / 2, core.innerSize, core.innerSize);

        ctx.restore();
    });
}

/**
 * Draw turbo boost effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} character - Character object
 */
export function drawTurboBoost(ctx, character) {
    const pivotX = character.x + character.width / 2 + TURBO.CHAR_OFFSET_X;
    const pivotY = character.y + character.height / 2 + TURBO.CHAR_OFFSET_Y;
    const facingRight = character.direction === 'right';
    const scaleX = facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.scale(scaleX, 1);

    // Draw turbo tail
    const tailImg = character.turboBoostFrames[character.turboBoostFrameIndex];
    if (tailImg && tailImg.complete && tailImg.naturalHeight !== 0) {
        const tailW = character.width * TURBO.BOOST_WIDTH_SCALE;
        const tailH = character.height * TURBO.BOOST_HEIGHT_SCALE;

        ctx.save();
        ctx.rotate(TURBO.BOOST_ROTATION_ANGLE * (Math.PI / 180));
        ctx.drawImage(tailImg, -tailW / 2 + TURBO.BOOST_OFFSET_X, -tailH / 2 + TURBO.BOOST_OFFSET_Y, tailW, tailH);
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = 'orange';
        ctx.fillRect(-100 - 303, -20, 100, 40);
    }

    // Draw turbo body
    const bodyImg = character.turboFrames[character.turboFrameIndex];
    if (bodyImg && bodyImg.complete && bodyImg.naturalHeight !== 0) {
        const bodyW = character.width * TURBO.CHAR_WIDTH_SCALE;
        const bodyH = character.height * TURBO.CHAR_HEIGHT_SCALE;

        ctx.save();
        ctx.rotate(TURBO.CHAR_ROTATION_ANGLE * (Math.PI / 180));
        ctx.drawImage(bodyImg, -bodyW / 2, -bodyH / 2, bodyW, bodyH);
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-character.width / 2, -character.height / 2, character.width, character.height);
    }

    ctx.restore();
}

/**
 * Draw the main character
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} character - Character object
 * @param {number} collectedEnergy - Collected energy amount
 */
export function drawCharacter(ctx, character, collectedEnergy) {
    let img;

    if (character.isLanding) {
        img = character.landFrames[character.landFrameIndex];
    } else if (character.isTurbo) {
        // Turbo is handled separately
        return;
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

    if (!character.isTurbo && img && img.complete && img.naturalHeight !== 0) {
        const w = character.width;
        const h = character.height;
        const x = character.x;
        const y = character.y;

        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        // Draw energy aura
        if (collectedEnergy > 0) {
            const pulse = Math.sin(Date.now() / 200) * 5;
            const auraIntensity = Math.min(collectedEnergy * 3, 80) + pulse;
            ctx.shadowColor = collectedEnergy >= COSTS.ENERGY_COST_TO_PLANT ? '#FFD700' : '#00FFFF';
            ctx.shadowBlur = Math.max(10, auraIntensity);
        }

        // Flip based on direction and state
        if (character.isBoost) {
            if (character.direction === 'left') ctx.scale(-1, 1);
        } else {
            if (character.direction === 'right') ctx.scale(-1, 1);
        }

        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
    } else {
        // Fallback placeholder
        const colors = ['#4CAF50', '#4CAF50', '#FF5722', '#FFD700', '#00BFFF', '#E91E63', '#FF6F00', '#FFFF00', '#00FF00', '#9C27B0'];
        const states = [0, character.isMoving, character.isJumping, character.isGlowing, character.isFloating, character.isFlyingUp, character.isFlyingDown, character.isBoost, character.isTurbo, character.isLanding];

        ctx.fillStyle = colors[states.indexOf(true)];
        ctx.fillRect(character.x, character.y, character.width, character.height);

        // Draw eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const eyeX = character.direction === 'left' ? character.x + 38 : character.x + 90;
        ctx.arc(eyeX, character.y + 20, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw world objects (trees, plants)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} worldObjects - Array of world objects
 * @param {Object} character - Character object
 * @param {Object} camera - Camera object
 * @param {Array<Object>} plantFrames - Plant animation frames
 * @param {Array<Object>} newTreeFrames - New tree animation frames
 * @param {Object} treeLayer - Tree layer for tree images
 * @param {Array<Object>} activeForestCenters - Active forest centers
 */
export function drawWorldObjects(ctx, worldObjects, character, camera, plantFrames, newTreeFrames, treeLayer, activeForestCenters) {
    const viewLeft = character.x - (ctx.canvas.width / 2 / camera.zoom);
    const viewRight = character.x + (ctx.canvas.width / 2 / camera.zoom);

    worldObjects.forEach(obj => {
        // Cull objects outside view
        if (obj.x <= viewLeft - 200 || obj.x >= viewRight + 200) return;

        let tImg;
        let scale;

        // Get appropriate image based on state
        if (obj.state === 'growing') {
            tImg = plantFrames[obj.frameIndex];
            scale = obj.plantScale || 1.0;
        } else if (obj.state === 'growing-new-tree') {
            tImg = newTreeFrames[obj.frameIndex];
            scale = obj.treeScale || 1.0;
        } else if (obj.state === 'grown-new-tree') {
            tImg = newTreeFrames[obj.frameIndex];
            scale = obj.treeScale || 1.0;
        } else {
            tImg = treeLayer.frames[obj.frameIndex];
            scale = obj.treeScale || 1.0;
        }

        // Check if object is in active forest
        let inActiveForest = false;
        if (activeForestCenters.length > 0 && (obj.state === 'grown' || obj.state === 'grown-new-tree')) {
            for (let c = 0; c < activeForestCenters.length; c++) {
                const distToCenter = Math.hypot(obj.x - activeForestCenters[c].x, obj.y - activeForestCenters[c].y);
                if (distToCenter < FOREST.CLUSTER_RADIUS) {
                    inActiveForest = true;
                    break;
                }
            }
        }

        if (tImg && tImg.complete && tImg.naturalHeight !== 0) {
            const scaledWidth = tImg.width * scale;
            const scaledHeight = tImg.height * scale;
            const drawX = obj.x - (scaledWidth / 2);
            const drawY = obj.y - scaledHeight;

            ctx.save();

            // Apply depth-based alpha
            if (obj.state === 'grown' || obj.state === 'grown-new-tree') {
                ctx.globalAlpha = 0.5 + (obj.depthLayer * 0.25);
            }

            // Apply forest glow effect
            if (inActiveForest) {
                const pulse = Math.sin(Date.now() / 200) * 10 + 20;
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = pulse;
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.drawImage(tImg, drawX, drawY, scaledWidth, scaledHeight);
            ctx.restore();
        } else {
            // Fallback placeholder
            if (obj.state === 'growing' || obj.state === 'growing-new-tree') {
                ctx.fillStyle = `rgba(100, 255, 100, ${obj.frameIndex / plantFrames.length})`;
                const size = (20 + (obj.frameIndex * 2)) * scale;
                ctx.fillRect(obj.x - size / 2, obj.y - size, size, size);
            } else {
                ctx.fillStyle = '#228B22';
                ctx.fillRect(obj.x - 30 * scale, obj.y - 80 * scale, 60 * scale, 80 * scale);
            }
        }
    });
}

/**
 * Main draw function that renders the entire game frame
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {Object} camera - Camera object
 * @param {Object} character - Character object
 * @param {Object} layers - All render layers (background, trees, particles, etc.)
 * @param {Array<Object>} worldObjects - World objects
 * @param {Array<Object>} stars - Stars
 * @param {Array<Object>} energyOrbs - Energy orbs
 * @param {Array<Object>} etherPixels - Ether pixels
 * @param {Array<Object>} geometricCores - Geometric cores
 * @param {Array<Object>} floatingTexts - Floating texts
 * @param {Array<Object>} activeForestCenters - Active forest centers
 * @param {number} collectedEnergy - Collected energy
 * @param {boolean} showUI - Whether to show UI
 * @param {Object} uiFunctions - UI render functions (drawMiniMap, drawGameUI)
 * @param {number} lastAutoSpawnTime - Last auto spawn time
 * @param {number} lastAurelSpawnTime - Last aurel spawn time
 */
export function draw(
    ctx,
    canvasWidth,
    canvasHeight,
    camera,
    character,
    layers,
    worldObjects,
    stars,
    energyOrbs,
    etherPixels,
    geometricCores,
    floatingTexts,
    activeForestCenters,
    collectedEnergy,
    showUI,
    uiFunctions,
    lastAutoSpawnTime,
    lastAurelSpawnTime
) {
    // Clear canvas
    clearCanvas(ctx, canvasWidth, canvasHeight);

    // Apply camera transform
    applyCameraTransform(ctx, canvasWidth, canvasHeight, camera, character);

    // Draw background layers (from back to front)
    drawTiledLayer(ctx, layers.particleLayer, character, canvasHeight);
    drawParallaxLayer(ctx, layers.background, character, canvasWidth, canvasHeight, 1, 0.05);
    drawParallaxLayer(ctx, layers.treeLayer, character, canvasWidth, canvasHeight, 1.5, 0.15);

    // Draw grounds
    drawGrounds(ctx, character.grounds, layers.particleLayer, character);

    // Draw constellation lines
    drawConstellationLines(ctx, stars);

    // Draw stars
    drawStars(ctx, stars, camera, character, canvasWidth, canvasHeight, 2000);

    // Draw collectibles
    drawEnergyOrbs(ctx, energyOrbs, character);
    drawEtherPixels(ctx, etherPixels);
    drawGeometricCores(ctx, geometricCores);

    // Draw turbo effect
    if (character.isTurbo) {
        drawTurboBoost(ctx, character);
    }

    // Draw character
    drawCharacter(ctx, character, collectedEnergy);

    // Draw foreground layers
    drawParallaxLayer(ctx, layers.newBackgroundLayer, character, canvasWidth, canvasHeight, 1, 0.3);
    drawStaticLayer(ctx, layers.newBackground2Layer, canvasWidth, canvasHeight, 1);

    // Draw world objects
    drawWorldObjects(
        ctx,
        worldObjects,
        character,
        camera,
        layers.plantFrames,
        layers.newTreeFrames,
        layers.treeLayer,
        activeForestCenters
    );

    // Draw floating texts
    if (uiFunctions.drawFloatingTexts) {
        uiFunctions.drawFloatingTexts(ctx, floatingTexts);
    }

    // Restore context before drawing UI
    ctx.restore();

    // Draw UI elements
    if (showUI) {
        if (uiFunctions.drawMiniMap) {
            uiFunctions.drawMiniMap(
                ctx,
                canvasWidth,
                canvasHeight,
                camera,
                character,
                activeForestCenters,
                stars,
                lastAutoSpawnTime,
                lastAurelSpawnTime
            );
        }

        if (uiFunctions.drawGameUI) {
            uiFunctions.drawGameUI(
                ctx,
                canvasWidth,
                character,
                camera,
                collectedEnergy,
                character.collectedEther,
                character.collectedAurels,
                geometricCores.length,
                stars,
                activeForestCenters,
                worldObjects,
                lastAutoSpawnTime,
                lastAurelSpawnTime,
                showUI
            );
        }
    } else {
        // Show hint when UI is hidden
        ctx.fillStyle = '#888';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('Press H to show controls', 20, 30);
    }
}
