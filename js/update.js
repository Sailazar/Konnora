/**
 * Update Module (Optimized)
 * Handles all game logic and state updates each frame
 * Performance optimizations to prevent game freezing
 */

import {
  SPAWNING,
  COSTS,
  ETHER,
  AURELS,
  MAX_ENERGY_ORBS,
  ATMOSPHERE,
  MERGE,
  FOREST,
  STARS,
} from "./constants.js";
import { updateCharacterAnimations } from "./character.js";
import { updateCamera } from "./camera.js";
import { spawnOrbs, spawnEther, limitOrbs, limitEther } from "./spawning.js";
import { addFloatingText, updateFloatingTexts } from "./ui.js";
import { detectForest } from "./world.js";

// ==========================================
// === PERFORMANCE OPTIMIZATIONS ==========
// ==========================================

// View frustum for culling
let viewFrustum = {
  left: -Infinity,
  right: Infinity,
  top: -Infinity,
  bottom: Infinity,
  padding: 500,
};

// Merge tracking to avoid O(n²) complexity
const mergeTracker = {
  energy: new Map(), // orb.id -> target orb
  ether: new Map(), // ether.id -> target ether
  lastUpdate: 0,
};

// Performance monitoring
let performanceStats = {
  frameCount: 0,
  lastStatsUpdate: Date.now(),
  energyOrbsCount: 0,
  etherPixelsCount: 0,
  floatingTextsCount: 0,
};

// ==========================================
// === VIEW FRUSTUM CULLING ========
// ==========================================

/**
 * Update view frustum for culling objects
 * @param {Object} character - Character object
 * @param {Object} camera - Camera object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function updateViewFrustum(character, camera, canvasWidth, canvasHeight) {
  const halfWidth = canvasWidth / camera.zoom / 2;
  const halfHeight = canvasHeight / camera.zoom / 2;

  viewFrustum.left = character.x - halfWidth - viewFrustum.padding;
  viewFrustum.right = character.x + halfWidth + viewFrustum.padding;
  viewFrustum.top = character.y - halfHeight - viewFrustum.padding;
  viewFrustum.bottom = character.y + halfHeight + viewFrustum.padding;
}

/**
 * Check if position is within view frustum
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} padding - Extra padding around view
 * @returns {boolean} True if visible
 */
function isInFrustum(x, y, padding = 0) {
  return (
    x >= viewFrustum.left - padding &&
    x <= viewFrustum.right + padding &&
    y >= viewFrustum.top - padding &&
    y <= viewFrustum.bottom + padding
  );
}

/**
 * Check if object should be culled
 * @param {Object} obj - Object with x, y properties
 * @param {number} padding - Extra padding
 * @returns {boolean} True if should cull
 */
function shouldCullObject(obj, padding = 200) {
  return !isInFrustum(obj.x, obj.y, padding);
}

// ==========================================
// === SPAWNING (OPTIMIZED) ========
// ==========================================

/**
 * Update forest spawning and aurel spawning
 * Only spawns if total object count is under limits
 */
export function updateSpawning(
  character,
  now,
  activeForestCenters,
  lastAutoSpawnTime,
  lastAurelSpawnTime,
  lastForestSpawnTime,
) {
  let updatedLastAutoSpawnTime = lastAutoSpawnTime;
  let updatedLastAurelSpawnTime = lastAurelSpawnTime;
  let updatedLastForestSpawnTime = lastForestSpawnTime;

  // Only spawn if we're under limits (prevent accumulation)
  const totalObjects =
    character.energyOrbs.length + character.etherPixels.length;

  if (totalObjects >= MAX_ENERGY_ORBS + ETHER.MAX_ETHER_PIXELS - 50) {
    return {
      lastAutoSpawnTime,
      lastAurelSpawnTime,
      lastForestSpawnTime,
    };
  }

  // Auto spawn orbs
  if (now - lastAutoSpawnTime > SPAWNING.AUTO_SPAWN_INTERVAL_MS) {
    const newOrbs = spawnOrbs(
      character.x,
      character.y,
      SPAWNING.AUTO_SPAWN_COUNT,
      false,
    );
    newOrbs.forEach((orb) => character.energyOrbs.push(orb));
    updatedLastAutoSpawnTime = now;
  }

  // Spawn aurel (rare)
  if (now - lastAurelSpawnTime > AURELS.SPAWN_RATE_MS) {
    const aurelOrbs = spawnOrbs(character.x, character.y, 1, true);
    aurelOrbs.forEach((orb) => character.energyOrbs.push(orb));
    updatedLastAurelSpawnTime = now;
    addFloatingText(
      character.floatingTexts,
      "AUREL APPEARED!",
      character.x,
      character.y - 100,
      "#FFD700",
    );
  }

  // Spawn orbs in active forests
  if (activeForestCenters.length > 0) {
    if (now - lastForestSpawnTime > FOREST.SPAWN_INTERVAL_MS) {
      activeForestCenters.forEach((center) => {
        if (!isInFrustum(center.x, center.y, 1000)) return; // Don't spawn off-screen

        const forestOrbs = spawnOrbs(
          center.x,
          center.y,
          FOREST.SPAWN_AMOUNT,
          false,
        );
        forestOrbs.forEach((orb) => character.energyOrbs.push(orb));
      });
      updatedLastForestSpawnTime = now;
    }
  }

  return {
    lastAutoSpawnTime: updatedLastAutoSpawnTime,
    lastAurelSpawnTime: updatedLastAurelSpawnTime,
    lastForestSpawnTime: updatedLastForestSpawnTime,
  };
}

// ==========================================
// === PARTICLE MERGE (OPTIMIZED) ========
// ==========================================

/**
 * Optimize particle merge tracking
 * Clear old merge targets periodically
 */
function optimizeMergeTracking() {
  const now = Date.now();
  if (now - mergeTracker.lastUpdate > 5000) {
    mergeTracker.energy.clear();
    mergeTracker.ether.clear();
    mergeTracker.lastUpdate = now;
  }
}

/**
 * Handle particle merging with O(n) complexity
 * Only processes visible particles
 */
function handleParticleMergeOptimized(particles, type, now) {
  const len = particles.length;
  if (len === 0) return;

  // Only process particles in view
  const visibleParticles = [];
  for (let i = 0; i < len; i++) {
    const pA = particles[i];
    if (pA.isAurel) continue;
    if (!isInFrustum(pA.x, pA.y, MERGE.DISTANCE * 2)) continue;
    visibleParticles.push(pA);
  }

  const visibleLen = visibleParticles.length;
  if (visibleLen === 0) return;

  const tracker = type === "energy" ? mergeTracker.energy : mergeTracker.ether;

  // Phase 1: Find and assign merge targets (single pass)
  for (let i = 0; i < visibleLen; i++) {
    const pA = visibleParticles[i];

    // Already has a target
    if (tracker.has(pA.id)) continue;

    // Look for nearby particle
    for (let j = i + 1; j < visibleLen; j++) {
      const pB = visibleParticles[j];
      if (pB.isAurel || tracker.has(pB.id)) continue;

      const dist = Math.hypot(pA.x - pB.x, pA.y - pB.y);
      if (dist < MERGE.DISTANCE) {
        tracker.set(pA.id, pB.id);
        pA.mergeTarget = pB.id;
        pA.mergeStartTime = now;
        break;
      }
    }
  }

  // Phase 2: Process merges (early termination when complete)
  for (let i = 0; i < visibleLen; i++) {
    const pA = visibleParticles[i];
    if (!pA.mergeTarget) continue;

    const pB = particles.find((o) => o.id === pA.mergeTarget);
    if (!pB || pB.isAurel) {
      pA.mergeTarget = null;
      pA.mergeStartTime = 0;
      tracker.delete(pA.id);
      continue;
    }

    const dist = Math.hypot(pA.x - pB.x, pA.y - pB.y);
    if (dist >= MERGE.DISTANCE) {
      pA.mergeTarget = null;
      pA.mergeStartTime = 0;
      tracker.delete(pA.id);
      continue;
    }

    if (!pA.mergeStartTime) {
      pA.mergeStartTime = now;
    }

    if (now - pA.mergeStartTime > MERGE.TIME_SEC * 1000) {
      // Merge complete!
      if (type === "ether" && pA.value >= ATMOSPHERE.THRESHOLD) {
        character.geometricCores.push({
          x: (pA.x + pB.x) / 2,
          y: (pA.y + pB.y) / 2,
          outerSize: 40,
          innerSize: 20,
          color: "#9D00FF",
          innerColor: "#D500F9",
          pulse: 0,
          floatOffset: Math.random() * Math.PI * 2,
        });

        // Remove both particles
        const idxA = particles.indexOf(pA);
        const idxB = particles.indexOf(pB);
        if (idxA !== -1) particles.splice(idxA, 1);
        if (idxB !== -1 && idxB > idxA) particles.splice(idxB - 1, 1);

        tracker.delete(pA.id);
        tracker.delete(pB.id);
        return; // Early termination
      }

      // Standard merge
      pA.value += pB.value;
      pA.size = (type === "ether" ? ETHER.SIZE_BASE : 4) + pA.value * 2;
      pA.mergeTarget = null;
      pA.mergeStartTime = 0;

      const idxB = particles.indexOf(pB);
      if (idxB !== -1) particles.splice(idxB, 1);
      tracker.delete(pB.id);

      // Adjust index if needed
      const newIdxA = particles.indexOf(pA);
      if (newIdxA !== -1 && newIdxA < i) i--;
    }
  }
}

// ==========================================
// === CHARACTER UPDATE (OPTIMIZED) ====
// ==========================================

/**
 * Update character boost and turbo states
 */
function updateCharacterBoost(character, input) {
  if (
    character.isBoost &&
    !character.isTurbo &&
    input.isShiftPressed() &&
    input.isAnyPressed(["a", "d", "w", "s"])
  ) {
    const elapsed = Date.now() - character.boostStartTime;
    if (elapsed >= character.boostDuration) {
      character.isBoost = false;
      character.isTurbo = true;
      character.turboFrameIndex = 0;
      character.turboBoostFrameIndex = 0;
    }
  }
}

/**
 * Update character vertical movement with collision
 */
function updateCharacterVerticalMovement(character) {
  let flyUpSpeed = character.flyUpSpeed;
  let flyDownSpeed = character.flyDownSpeed;

  if (character.isTurbo) {
    flyUpSpeed = character.flyUpSpeedTurbo;
    flyDownSpeed = character.flyDownSpeedTurbo;
  } else if (character.isBoost) {
    flyUpSpeed = character.flyUpSpeedBoost;
    flyDownSpeed = character.flyDownSpeedBoost;
  }

  // Jumping
  if (character.isJumping) {
    character.velocityY += character.gravity;
    character.y += character.velocityY;

    const ignoreCollision =
      character.isFlyingDown || character.isBoost || character.isTurbo;
    if (
      !ignoreCollision &&
      character.y + character.height >= character.groundY &&
      character.velocityY > 0
    ) {
      character.y = character.groundY - character.height;
      character.isJumping = false;
      character.velocityY = 0;
    }
    return;
  }

  // Flying up
  if (character.isFlyingUp) {
    character.y -= flyUpSpeed;
    return;
  }

  // Flying down
  if (character.isFlyingDown) {
    character.y += flyDownSpeed;
    return;
  }

  // Boost/turbo vertical movement
  if (
    (character.isBoost || character.isTurbo) &&
    !character.isFlyingUp &&
    !character.isFlyingDown
  ) {
    if (character.wKeyPressed) character.y -= flyUpSpeed;
    if (character.sKeyPressed) character.y += flyDownSpeed;
    return;
  }

  // Landing
  if (character.isLanding) {
    character.velocityY += character.gravity * 0.5;
    character.y += character.velocityY;

    const ignoreCollision =
      character.isFlyingDown || character.isBoost || character.isTurbo;
    if (
      !ignoreCollision &&
      character.y + character.height >= character.groundY
    ) {
      character.y = character.groundY - character.height;
      character.velocityY = 0;
    }
  }
}

/**
 * Update character horizontal movement
 */
function updateCharacterHorizontalMovement(character, input) {
  character.isMoving = false;

  if (!character.isGlowing) {
    let baseSpeed =
      character.isFloating || character.isFlyingUp || character.isFlyingDown
        ? character.floatSpeed
        : character.speed;

    const currentSpeed = character.isTurbo
      ? baseSpeed * character.turboMultiplier
      : character.isBoost
        ? baseSpeed * character.boostMultiplier
        : baseSpeed;

    if (input.isPressed("a")) {
      character.x -= currentSpeed;
      character.direction = "left";
      character.isMoving = true;
    }
    if (input.isPressed("d")) {
      character.x += currentSpeed;
      character.direction = "right";
      character.isMoving = true;
    }
  }

  // Store movement keys for vertical movement
  character.wKeyPressed = input.isPressed("w");
  character.sKeyPressed = input.isPressed("s");
}

// ==========================================
// === STAR DISCOVERY (OPTIMIZED) ======
// ==========================================

/**
 * Handle star discovery with culling
 */
function handleStarDiscovery(character) {
  const charCenterX = character.x + character.width / 2;
  const charCenterY = character.y + character.height / 2;

  for (let i = 0; i < character.stars.length; i++) {
    const star = character.stars[i];

    // Skip already found stars
    if (star.found) continue;

    // Cull stars outside visibility range
    if (!isInFrustum(star.x, star.y, STARS.VISIBILITY_RANGE)) continue;

    const dist = Math.hypot(charCenterX - star.x, charCenterY - star.y);
    if (dist < STARS.INTERACTION_RADIUS) {
      star.found = true;
      showToast(`ANCIENT STAR ${star.id + 1} FOUND!`, "star");
      addFloatingText(
        character.floatingTexts,
        `STAR DISCOVERED!`,
        star.x,
        star.y - 50,
        "#FFFFFF",
      );
      character.collectedEnergy += 100;
      character.collectedEther += 50;
    }
  }
}

// ==========================================
// === GEOMETRIC CORES (OPTIMIZED) ===
// ==========================================

/**
 * Update geometric cores with culling
 */
function updateGeometricCores(character, now) {
  const charCenterX = character.x + character.width / 2;
  const charCenterY = character.y + character.height / 2;

  for (let i = character.geometricCores.length - 1; i >= 0; i--) {
    const core = character.geometricCores[i];

    // Cull cores far away
    const dist = Math.hypot(charCenterX - core.x, charCenterY - core.y);
    if (dist > 500) {
      // Still animate but don't process attraction
      core.y += Math.sin(now / 500 + core.floatOffset) * 0.5;
      core.pulse += 0.05;
      continue;
    }

    core.y += Math.sin(now / 500 + core.floatOffset) * 0.5;
    core.pulse += 0.05;

    // Attract when closer
    if (dist < 200) {
      core.x += (charCenterX - core.x) * 0.03;
      core.y += (charCenterY - core.y) * 0.03;
    }

    // Collect when touching
    if (dist < 60) {
      character.collectedEther += 50;
      addFloatingText(
        character.floatingTexts,
        `+50 ETHER`,
        core.x,
        core.y - 20,
        "#E0B0FF",
      );
      character.geometricCores.splice(i, 1);
    }
  }
}

// ==========================================
// === PARTICLE COLLECTION (OPTIMIZED) ====
// ==========================================

/**
 * Update energy orbs with culling and attraction
 */
function updateEnergyOrbs(character) {
  const charCenterX = character.x + character.width / 2;
  const charCenterY = character.y + character.height / 2;
  const now = Date.now();

  // First, handle merges (only visible)
  handleParticleMergeOptimized(character.energyOrbs, "energy", now);

  // Then update and collect
  for (let i = character.energyOrbs.length - 1; i >= 0; i--) {
    const orb = character.energyOrbs[i];

    // Cull far-away orbs
    if (!isInFrustum(orb.x, orb.y, 600)) {
      // Still process merge but don't update position
      if (orb.mergeTarget) {
        const target = character.energyOrbs.find(
          (o) => o.id === orb.mergeTarget,
        );
        if (target) {
          orb.x += (target.x - orb.x) * 0.02;
          orb.y += (target.y - orb.y) * 0.02;
        }
      }
      continue;
    }

    // Move towards merge target
    if (orb.mergeTarget) {
      const target = character.energyOrbs.find((o) => o.id === orb.mergeTarget);
      if (target) {
        orb.x += (target.x - orb.x) * 0.02;
        orb.y += (target.y - orb.y) * 0.02;
      }
    }

    // Float movement
    orb.x += orb.vx;
    orb.angleOffset += orb.floatSpeed;
    orb.y = orb.baseY + Math.sin(orb.angleOffset) * 10;

    // Attraction to character (only if nearby)
    const dist = Math.hypot(charCenterX - orb.x, charCenterY - orb.y);
    if (dist < 100) {
      orb.x += (charCenterX - orb.x) * 0.1;
      orb.y += (charCenterY - orb.y) * 0.1;
    }

    // Collection
    if (dist < 40) {
      if (orb.isAurel) {
        character.collectedAurels += orb.value;
        addFloatingText(
          character.floatingTexts,
          `+${orb.value} AUREL`,
          orb.x,
          orb.y - 10,
          "#FFD700",
        );
      } else {
        character.collectedEnergy += orb.value;
        addFloatingText(
          character.floatingTexts,
          `+${orb.value} Energy`,
          orb.x,
          orb.y - 10,
          "#00FFFF",
        );
      }
      character.energyOrbs.splice(i, 1);
    }
  }
}

/**
 * Update ether pixels with culling and attraction
 */
function updateEtherPixels(character) {
  const charCenterX = character.x + character.width / 2;
  const charCenterY = character.y + character.height / 2;
  const now = Date.now();

  // First, handle merges (only visible)
  handleParticleMergeOptimized(character.etherPixels, "ether", now);

  // Then update and collect
  for (let i = character.etherPixels.length - 1; i >= 0; i--) {
    const ether = character.etherPixels[i];

    // Cull far-away ether
    if (!isInFrustum(ether.x, ether.y, 400)) {
      // Still process merge but don't update position
      if (ether.mergeTarget) {
        const target = character.etherPixels.find(
          (o) => o.id === ether.mergeTarget,
        );
        if (target) {
          ether.x += (target.x - ether.x) * 0.02;
          ether.y += (target.y - ether.y) * 0.02;
        }
      }
      continue;
    }

    // Move towards merge target
    if (ether.mergeTarget) {
      const target = character.etherPixels.find(
        (o) => o.id === ether.mergeTarget,
      );
      if (target) {
        ether.x += (target.x - ether.x) * 0.02;
        ether.y += (target.y - ether.y) * 0.02;
      }
    }

    // Float movement
    ether.x += ether.vx;
    ether.angleOffset += ether.floatSpeed;
    ether.y = ether.baseY + Math.sin(ether.angleOffset) * 10;

    // Attraction to character (only if nearby)
    const dist = Math.hypot(charCenterX - ether.x, charCenterY - ether.y);
    if (dist < 60) {
      ether.x += (charCenterX - ether.x) * 0.05;
      ether.y += (charCenterY - ether.y) * 0.05;
    }

    // Collection
    if (dist < 35) {
      character.collectedEther += ether.value;
      if (Math.random() > 0.7) {
        addFloatingText(
          character.floatingTexts,
          `+${ether.value} Ether`,
          ether.x,
          ether.y - 10,
          "#E0B0FF",
        );
      }
      character.etherPixels.splice(i, 1);
    }
  }
}

// ==========================================
// === FLOATING TEXTS (OPTIMIZED) ======
// ==========================================

/**
 * Update floating texts with limit
 */
function updateFloatingTextsOptimized(floatingTexts) {
  // Enforce strict limit (max 50 texts)
  const MAX_FLOATING_TEXTS = 50;

  if (floatingTexts.length > MAX_FLOATING_TEXTS) {
    floatingTexts.splice(0, floatingTexts.length - MAX_FLOATING_TEXTS);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].y -= 0.5;
    floatingTexts[i].life--;
    if (floatingTexts[i].life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

// ==========================================
// === PARALLAX LAYERS (OPTIMIZED) ==
// ==========================================

/**
 * Update parallax layers efficiently
 */
function updateParallaxLayers(layers) {
  const {
    particleLayer,
    background,
    treeLayer,
    newBackgroundLayer,
    newBackground2Layer,
  } = layers;

  // Update particle layer
  particleLayer.frameCounter++;
  if (particleLayer.frameCounter >= particleLayer.frameDelay) {
    particleLayer.frameCounter = 0;
    particleLayer.frameIndex =
      (particleLayer.frameIndex + 1) % particleLayer.frameCount;
  }

  // Update background layer
  background.frameCounter++;
  if (background.frameCounter >= background.frameDelay) {
    background.frameCounter = 0;
    background.frameIndex = (background.frameIndex + 1) % background.frameCount;
  }

  // Update tree layer
  treeLayer.frameCounter++;
  if (treeLayer.frameCounter >= treeLayer.frameDelay) {
    treeLayer.frameCounter = 0;
    treeLayer.frameIndex = (treeLayer.frameIndex + 1) % treeLayer.frameCount;
  }

  // Update new background layer 1
  newBackgroundLayer.frameCounter++;
  if (newBackgroundLayer.frameCounter >= newBackgroundLayer.frameDelay) {
    newBackgroundLayer.frameCounter = 0;
    newBackgroundLayer.frameIndex =
      (newBackgroundLayer.frameIndex + 1) % newBackgroundLayer.frameCount;
  }

  // Update new background layer 2
  newBackground2Layer.frameCounter++;
  if (newBackground2Layer.frameCounter >= newBackground2Layer.frameDelay) {
    newBackground2Layer.frameCounter = 0;
    newBackground2Layer.frameIndex =
      (newBackground2Layer.frameIndex + 1) % newBackground2Layer.frameCount;
  }
}

// ==========================================
// === PERFORMANCE MONITORING ============
// ==========================================

/**
 * Update performance stats every second
 */
function updatePerformanceStats(character) {
  const now = Date.now();
  if (now - performanceStats.lastStatsUpdate > 1000) {
    performanceStats.lastStatsUpdate = now;
    performanceStats.frameCount = 0;

    performanceStats.energyOrbsCount = character.energyOrbs.length;
    performanceStats.etherPixelsCount = character.etherPixels.length;
    performanceStats.floatingTextsCount = character.floatingTexts.length;

    console.log(
      `[Performance] Orbs: ${performanceStats.energyOrbsCount}, Ether: ${performanceStats.etherPixelsCount}, Texts: ${performanceStats.floatingTextsCount}, Cores: ${character.geometricCores.length}`,
    );
  }
  performanceStats.frameCount++;
}

// ==========================================
// === GROUND COLLISION (OPTIMIZED) ===
// ==========================================

/**
 * Handle ground collision efficiently
 */
function handleGroundCollision(character) {
  const ignoreCollision =
    character.isFlyingDown || character.isBoost || character.isTurbo;
  if (ignoreCollision) return;

  let closestGroundY = -99999;
  let foundGround = false;
  const charFeetY = character.y + character.height;
  const charCenterX = character.x + character.width / 2;

  // Only check grounds in view
  for (let i = 0; i < character.grounds.length; i++) {
    const g = character.grounds[i];

    let inHorizontalRange = true;
    if (g.width) {
      inHorizontalRange = charCenterX >= g.x && charCenterX <= g.x + g.width;
    }

    if (
      inHorizontalRange &&
      charFeetY >= g.y &&
      charFeetY - character.velocityY <= g.y + 10
    ) {
      if (g.y > closestGroundY) {
        closestGroundY = g.y;
        foundGround = true;
      }
    }
  }

  if (foundGround) {
    character.groundY = closestGroundY;
  }
}

// ==========================================
// === MAIN UPDATE FUNCTION (OPTIMIZED) ==
// ==========================================

/**
 * Main update function - called every frame
 * Optimized to prevent game freezing
 */
export function update(character, camera, input, layers) {
  if (!character.isGameRunning) return false;

  const now = Date.now();

  // Update camera
  updateCamera(camera);

  // Update view frustum for culling
  updateViewFrustum(character, camera, 1200, 800);

  // Optimize merge tracking periodically
  optimizeMergeTracking();

  // Strict particle limiting (prevent accumulation)
  limitOrbs(character.energyOrbs);
  limitEther(character.etherPixels);
  updateFloatingTextsOptimized(character.floatingTexts);

  // Detect forests
  character.activeForestCenters = detectForest(character.worldObjects);

  // Update spawning (with object count checks)
  const spawnTimes = updateSpawning(
    character,
    now,
    character.activeForestCenters,
    character.lastAutoSpawnTime,
    character.lastAurelSpawnTime,
    character.lastForestSpawnTime,
  );
  character.lastAutoSpawnTime = spawnTimes.lastAutoSpawnTime;
  character.lastAurelSpawnTime = spawnTimes.lastAurelSpawnTime;
  character.lastForestSpawnTime = spawnTimes.lastForestSpawnTime;

  // Update character boost/turbo
  updateCharacterBoost(character, input);

  // Update world objects (only visible)
  for (let i = 0; i < character.worldObjects.length; i++) {
    const obj = character.worldObjects[i];

    // Cull far-away world objects
    if (!isInFrustum(obj.x, obj.y, 300)) continue;

    obj.frameCounter++;
    if (obj.frameCounter >= obj.frameDelay) {
      obj.frameCounter = 0;

      if (obj.state === "growing") {
        obj.frameIndex++;
        if (obj.frameIndex >= character.plantFrames.length) {
          obj.state = "grown";
          obj.frameIndex = 0;
          obj.frameDelay = 3;
        }
      } else if (obj.state === "growing-new-tree") {
        obj.frameIndex++;
        if (obj.frameIndex >= character.newTreeFrames.length) {
          obj.state = "grown-new-tree";
          obj.frameIndex = 0;
          obj.frameDelay = 3;
        }
      } else if (obj.state === "grown") {
        obj.frameIndex = (obj.frameIndex + 1) % character.treeFrames.length;
      } else if (obj.state === "grown-new-tree") {
        obj.frameIndex = (obj.frameIndex + 1) % character.newTreeFrames.length;
      }
    }

    // Spawn ether from grown trees (only if in view)
    if (
      (obj.state === "grown" || obj.state === "grown-new-tree") &&
      isInFrustum(obj.x, obj.y, 200)
    ) {
      if (!obj.etherTimer) obj.etherTimer = now + 2000;

      if (now > obj.etherTimer) {
        const treeHeight = 200 * (obj.treeScale || 1);
        const ether = spawnEther(obj.x, obj.y - treeHeight + 50);
        if (ether) {
          ether.forEach((e) => character.etherPixels.push(e));
        }
        const nextSpawn =
          ETHER.SPAWN_RATE_MIN +
          Math.random() * (ETHER.SPAWN_RATE_MAX - ETHER.SPAWN_RATE_MIN);
        obj.etherTimer = now + nextSpawn;
      }
    }
  }

  // Handle ground collision
  handleGroundCollision(character);

  // Update character movement
  updateCharacterVerticalMovement(character);
  updateCharacterHorizontalMovement(character, input);

  // Handle star discovery
  handleStarDiscovery(character);

  // Update geometric cores
  updateGeometricCores(character, now);

  // Update particles (with culling)
  updateEnergyOrbs(character);
  updateEtherPixels(character);

  // Update character animations
  updateCharacterAnimations(character);

  // Update parallax layers
  updateParallaxLayers(layers);

  // Update performance monitoring (every second)
  updatePerformanceStats(character);

  return true;
}
