/**
 * UI Module
 * Handles UI elements including toast messages, floating text, and minimap
 */

import {
    SPAWNING,
    AURELS,
    COSTS,
    FOREST,
    STARS,
    CAMERA
} from './constants.js';

/**
 * Show a toast message on screen
 * @param {string} msg - The message to display
 * @param {string} type - The type of toast (gold, ether, star)
 */
export function showToast(msg, type = '') {
    const el = document.getElementById('toast-msg');
    const overlay = document.getElementById('message-overlay');

    if (!el || !overlay) {
        console.error('Toast elements not found');
        return;
    }

    el.innerText = msg;
    el.className = 'toast ' + type;
    overlay.style.opacity = 1;

    if (overlay.hideTimeout) {
        clearTimeout(overlay.hideTimeout);
    }

    overlay.hideTimeout = setTimeout(() => {
        overlay.style.opacity = 0;
    }, 3000);
}

/**
 * Add floating text at a specific location
 * @param {Array<Object>} floatingTexts - Array of floating text objects
 * @param {string} text - The text to display
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} color - Text color
 */
export function addFloatingText(floatingTexts, text, x, y, color) {
    floatingTexts.push({
        text: text,
        x: x,
        y: y,
        life: 60,
        color: color
    });
}

/**
 * Update all floating texts
 * @param {Array<Object>} floatingTexts - Array of floating text objects
 */
export function updateFloatingTexts(floatingTexts) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y -= 0.5;
        floatingTexts[i].life--;
        if (floatingTexts[i].life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

/**
 * Draw all floating texts on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} floatingTexts - Array of floating text objects
 */
export function drawFloatingTexts(ctx, floatingTexts) {
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });
}

/**
 * Draw a pixel star (for minimap or constellation display)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Star size
 * @param {string} color - Star color
 * @param {number} alpha - Transparency (0-1)
 * @param {number} pulse - Pulse amount
 */
export function drawPixelStar(ctx, x, y, size, color, alpha, pulse) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    ctx.shadowColor = color;
    ctx.shadowBlur = 15 + pulse * 10;

    ctx.fillRect(-size / 2, -size / 2, size, size);

    const tipLen = size * 2;
    const tipW = size * 0.4;

    ctx.fillRect(-tipLen / 2, -tipW / 2, tipLen, tipW);
    ctx.fillRect(-tipW / 2, -tipLen / 2, tipW, tipLen);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-2, -2, 4, 4);

    ctx.restore();
}

/**
 * Draw the minimap radar
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {Object} camera - Camera object
 * @param {Object} character - Character object
 * @param {Array<Object>} activeForestCenters - Active forest centers
 * @param {Array<Object>} stars - Star objects
 * @param {number} lastAutoSpawnTime - Last auto spawn timestamp
 * @param {number} lastAurelSpawnTime - Last aurel spawn timestamp
 */
export function drawMiniMap(
    ctx,
    canvasWidth,
    canvasHeight,
    camera,
    character,
    activeForestCenters,
    stars,
    lastAutoSpawnTime,
    lastAurelSpawnTime
) {
    const mapX = canvasWidth - 210;
    const mapY = 20;
    const mapW = 200;
    const mapH = 200;
    const scale = 0.05;

    ctx.save();

    // Draw minimap background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Translate to minimap center
    ctx.translate(mapX + mapW / 2, mapY + mapH / 2);

    // Draw forest centers
    activeForestCenters.forEach(center => {
        const relX = center.x - character.x;
        const relY = center.y - character.y;
        const drawX = relX * scale;
        const drawY = relY * scale;
        const radius = Math.sqrt((drawX * drawX) + (drawY * drawY));
        const maxRadius = (mapW / 2) - 10;

        if (radius < maxRadius) {
            // Draw forest glow
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 20, 0, Math.PI * 2);
            ctx.fill();
            // Draw forest center
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw direction arrow
            const angle = Math.atan2(relY, relX);
            const arrowLen = maxRadius - 5;
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(arrowLen, 0);
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-5, -5);
            ctx.lineTo(-5, 5);
            ctx.fill();
            ctx.restore();
        }
    });

    // Draw constellation lines between found stars
    const foundStars = stars.filter(s => s.found).sort((a, b) => a.id - b.id);
    if (foundStars.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 5;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        const startX = (foundStars[0].x - character.x) * scale;
        const startY = (foundStars[0].y - character.y) * scale;
        ctx.moveTo(startX, startY);
        for (let i = 1; i < foundStars.length; i++) {
            const drawX = (foundStars[i].x - character.x) * scale;
            const drawY = (foundStars[i].y - character.y) * scale;
            ctx.lineTo(drawX, drawY);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Draw found stars
    stars.forEach(star => {
        if (star.found) {
            const relX = star.x - character.x;
            const relY = star.y - character.y;
            const drawX = relX * scale;
            const drawY = relY * scale;
            const radius = Math.sqrt((drawX * drawX) + (drawY * drawY));
            const maxRadius = (mapW / 2) - 5;

            if (radius < maxRadius) {
                // Draw star on minimap
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(drawX - 4, drawY);
                ctx.lineTo(drawX + 4, drawY);
                ctx.moveTo(drawX, drawY - 4);
                ctx.lineTo(drawX, drawY + 4);
                ctx.stroke();

                ctx.shadowColor = '#FFFFFF';
                ctx.shadowBlur = 5;
                ctx.fillRect(drawX - 2, drawY - 2, 4, 4);
            } else {
                // Draw direction arrow
                const angle = Math.atan2(relY, relX);
                const arrowLen = maxRadius - 2;
                ctx.save();
                ctx.rotate(angle);
                ctx.translate(arrowLen, 0);
                ctx.strokeStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-3, -3);
                ctx.lineTo(-3, 3);
                ctx.fill();
                ctx.restore();
            }
        }
    });

    // Draw player position
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw player direction
    ctx.save();
    if (character.direction === 'left') {
        ctx.rotate(Math.PI);
    } else {
        ctx.rotate(0);
    }

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fillStyle = '#00FFFF';
    ctx.fill();
    ctx.restore();

    // Draw label
    ctx.fillStyle = '#AAA';
    ctx.font = 'bold 12px Courier New';
    ctx.fillText("RADAR", -20, -mapH / 2 + 15);

    ctx.restore();
}

/**
 * Draw the game UI (controls, stats, etc.)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} canvasWidth - Canvas width
 * @param {Object} character - Character object
 * @param {Object} camera - Camera object
 * @param {number} collectedEnergy - Collected energy amount
 * @param {number} collectedEther - Collected ether amount
 * @param {number} collectedAurels - Collected aurels amount
 * @param {number} geometricCoresCount - Number of geometric cores
 * @param {Array<Object>} stars - Star objects
 * @param {Array<Object>} activeForestCenters - Active forest centers
 * @param {Array<Object>} worldObjects - World objects
 * @param {number} lastAutoSpawnTime - Last auto spawn timestamp
 * @param {number} lastAurelSpawnTime - Last aurel spawn timestamp
 * @param {boolean} showUI - Whether to show UI
 */
export function drawGameUI(
    ctx,
    canvasWidth,
    character,
    camera,
    collectedEnergy,
    collectedEther,
    collectedAurels,
    geometricCoresCount,
    stars,
    activeForestCenters,
    worldObjects,
    lastAutoSpawnTime,
    lastAurelSpawnTime,
    showUI
) {
    if (!showUI) {
        ctx.fillStyle = '#888';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('Press H to show controls', 20, 30);
        return;
    }

    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'left';

    // Draw controls
    const controls = [
        'A / D : Move Left/Right',
        'SPACE (x1) : Jump',
        'SPACE (x2 - Air) : Float',
        'SPACE (x3) : Land',
        'W : Fly Up / Takeoff',
        'S : Fly Down / Phase Through',
        'G : Glowing',
        `P / O : Plant Tree (Cost: ${COSTS.ENERGY_COST_TO_PLANT} Energy)`,
        'Forest: Cluster Trees',
        'SHIFT + A/D : Boost',
        'Hold SHIFT 3s : Turbo',
        `B : Build Ground Platform (Cost: ${COSTS.NEW_GROUND_COST_ETHER} Ether)`,
        'Scroll : Zoom (' + camera.zoom.toFixed(1) + 'x)',
        'H : Hide UI',
        'ESC : Menu'
    ];

    controls.forEach((text, i) => {
        ctx.fillText(text, 20, 30 + i * 20);
    });

    // Draw character state
    const stateNames = ['Idle', 'Walking', 'Jumping', 'Glowing', 'Floating', 'Flying Up', 'Flying Down', 'BOOST!', 'TURBO!', 'Landing'];
    const stateColors = ['#FFC107', '#4CAF50', '#FF5722', '#FFD700', '#00BFFF', '#E91E63', '#FF6F00', '#FFFF00', '#00FF00', '#9C27B0'];
    const states = [0, character.isMoving, character.isJumping, character.isGlowing, character.isFloating, character.isFlyingUp, character.isFlyingDown, character.isBoost, character.isTurbo, character.isLanding];
    const stateIdx = states.lastIndexOf(true);

    ctx.fillStyle = stateColors[stateIdx];
    ctx.fillText('State: ' + stateNames[stateIdx], 20, 330);

    // Draw spawn timers
    const timeUntilWave = ((SPAWNING.AUTO_SPAWN_INTERVAL_MS - (Date.now() - lastAutoSpawnTime)) / 1000).toFixed(0);
    const timeUntilAurel = ((AURELS.SPAWN_RATE_MS - (Date.now() - lastAurelSpawnTime)) / 1000).toFixed(0);

    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(`Next Wave: ${timeUntilWave}s`, 20, 350);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Next Aurel: ${timeUntilAurel}s`, 20, 370);

    // Draw forest status
    if (activeForestCenters.length > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`FORESTS ACTIVE: ${activeForestCenters.length}`, 20, 390);
    } else {
        ctx.fillStyle = '#555';
        ctx.fillText("Forest: Inactive (Need cluster)", 20, 390);
    }

    // Draw star count
    const foundCount = stars.filter(s => s.found).length;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.fillText(`ANCIENT STARS: ${foundCount} / ${STARS.COUNT}`, 20, 410);
    ctx.shadowBlur = 0;

    // Draw turbo timer
    if (character.isBoost) {
        const remaining = ((character.boostDuration - (Date.now() - character.boostStartTime)) / 1000).toFixed(1);
        ctx.fillStyle = '#FFFF00';
        ctx.fillText(`Turbo in: ${remaining}s`, 20, 430);
    }

    // Draw world objects count
    ctx.fillStyle = '#888';
    ctx.fillText(`World Objects (Trees): ${worldObjects.length}`, 20, 450);

    // Draw collected energy
    ctx.fillStyle = '#00FFFF';
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.fillText(`Energy: ${collectedEnergy} / ${COSTS.ENERGY_COST_TO_PLANT}`, 20, 470);

    // Draw collected aurels
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText(`Aurels: ${collectedAurels}`, 20, 490);

    // Draw collected ether
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#9D00FF';
    ctx.shadowColor = '#9D00FF';
    ctx.shadowBlur = 10;
    ctx.fillText(`Ether: ${collectedEther}`, 20, 510);

    // Draw geometric cores and position
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#555';
    ctx.font = '12px Courier New';
    ctx.fillText(`Geometric Cores: ${geometricCoresCount}`, 20, 530);
    ctx.fillText(`Position: X=${Math.round(character.x)}, Y=${Math.round(character.y)}`, 20, 550);
}
