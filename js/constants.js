/**
 * Game Constants and Configuration
 * This module contains all configurable values for the Konno game
 */

// ==========================================
// === CANVAS SETTINGS =====================
// ==========================================
export const CANVAS = {
    WIDTH: 1200,
    HEIGHT: 800
};

// ==========================================
// === SPAWNING TIMINGS =====================
// ==========================================
export const SPAWNING = {
    AUTO_SPAWN_INTERVAL_MS: 6000,
    AUTO_SPAWN_COUNT: 2,
    STARTING_ORBS: 0,
    ORB_DRIFT_SPEED: 0.5
};

// ==========================================
// === COST & RARITY =======================
// ==========================================
export const COSTS = {
    ENERGY_COST_TO_PLANT: 10,
    ORBS_DROPPED_PER_TREE: 4,
    PLANTING_COOLDOWN_MS: 2000,
    NEW_GROUND_COST_ETHER: 100,
    NEW_GROUND_WIDTH: 600
};

// ==========================================
// === ETHER CONTROLS =======================
// ==========================================
export const ETHER = {
    SPAWN_AMOUNT: 1,
    SIZE_BASE: 8,
    SIZE_VARIANCE: 2,
    SPAWN_RATE_MIN: 3000,
    SPAWN_RATE_MAX: 8000,
    MAX_ETHER_PIXELS: 150
};

// ==========================================
// === ENERGY ORBS LIMIT ===================
// ==========================================
export const MAX_ENERGY_ORBS = 200;

// ==========================================
// === AURELS CONFIGURATION ================
// ==========================================
export const AURELS = {
    SPAWN_RATE_MS: 15000,
    VALUE: 1
};

// ==========================================
// === ATMOSPHERE MECHANIC ==================
// ==========================================
export const ATMOSPHERE = {
    THRESHOLD: 10
};

// ==========================================
// === MERGE MECHANICS ======================
// ==========================================
export const MERGE = {
    TIME_SEC: 21,
    DISTANCE: 60
};

// ==========================================
// === FOREST MECHANICS =====================
// ==========================================
export const FOREST = {
    SIZE_THRESHOLD: 10,
    CLUSTER_RADIUS: 450,
    SPAWN_INTERVAL_MS: 2000,
    SPAWN_AMOUNT: 2
};

// ==========================================
// === EXPLORATION STARS MECHANIC ==========
// ==========================================
export const STARS = {
    COUNT: 7,
    VISIBILITY_RANGE: 2000,
    INTERACTION_RADIUS: 80
};

// ==========================================
// === CAMERA SETTINGS ======================
// ==========================================
export const CAMERA = {
    MIN_ZOOM: 0.2,
    MAX_ZOOM: 4.0,
    ZOOM_STEP: 0.1
};

// ==========================================
// === TURBO BOOST CONTROLS =================
// ==========================================
export const TURBO = {
    BOOST_WIDTH_SCALE: 4.6,
    BOOST_HEIGHT_SCALE: 0.55,
    BOOST_OFFSET_X: -303,
    BOOST_OFFSET_Y: 13,
    BOOST_ROTATION_ANGLE: -8,

    CHAR_WIDTH_SCALE: 1.0,
    CHAR_HEIGHT_SCALE: 1.0,
    CHAR_OFFSET_X: 0,
    CHAR_OFFSET_Y: -15,
    CHAR_ROTATION_ANGLE: 24
};

// ==========================================
// === ANIMATION FRAME COUNTS ==============
// ==========================================
export const FRAME_COUNTS = {
    PLANT: 214,
    TREE: 122,
    NEW_TREE: 122,
    TURBO_BOOST: 80,
    PARTICLE: 1022,

    WALK: 126,
    IDLE: 126,
    JUMP: 50,
    GLOWING: 50,
    FLOAT: 42,
    FLY_UP: 30,
    FLY_DOWN: 30,
    LAND: 110,
    BOOST: 96,
    TURBO: 77,
    BACKGROUND: 122,
    NEW_BACKGROUND: 122
};

// ==========================================
// === FOLDER PATHS =========================
// ==========================================
export const FOLDERS = {
    WALK: 'walk/',
    IDLE: 'idle/',
    JUMP: 'jump/',
    GLOWING: 'glowing/',
    FLOAT: 'float/',
    FLY_UP: 'higher/',
    FLY_DOWN: 'fly_down/',
    LAND: 'land/',
    BOOST: 'boost_speed/',
    TURBO: 'turbo/',
    TURBO_BOOST: 'turbo_boost/',
    BACKGROUND: 'background/',
    TREE: 'tree/',
    NEW_BACKGROUND: 'newBackground/',
    PLANT: 'plant/',
    NEW_TREE: 'new_tree/',
    PARTICLE: 'particles/'
};

// ==========================================
// === FILE PREFIXES =======================
// ==========================================
export const FILE_PREFIXES = {
    WALK: 'walk_right',
    IDLE: 'Idle',
    JUMP: 'jmp',
    GLOWING: 'glowing',
    FLOAT: 'float',
    FLY_UP: 'higher',
    FLY_DOWN: 'fly_down',
    LAND: 'land',
    BOOST: 'boost_speed',
    TURBO: 'turbo',
    TURBO_BOOST: 'turbo_boost',
    BACKGROUND: 'bg',
    TREE: 'tree',
    NEW_BACKGROUND: 'newBackground',
    PLANT: 'plant',
    NEW_TREE: 'new_tree',
    PARTICLE: 'particle'
};

// ==========================================
// === CHARACTER BASE CONFIG ===============
// ==========================================
export const CHARACTER_CONFIG = {
    WIDTH: 128,
    HEIGHT: 128,
    SPEED: 6,
    FLOAT_SPEED: 10,
    BOOST_MULTIPLIER: 1,
    TURBO_MULTIPLIER: 7,
    JUMP_POWER: 10,
    GRAVITY: 0.3,
    BOOST_DURATION: 1500,

    FLY_UP_SPEED: 4,
    FLY_DOWN_SPEED: 4,
    FLY_UP_SPEED_BOOST: 10,
    FLY_DOWN_SPEED_BOOST: 11,
    FLY_UP_SPEED_TURBO: 19,
    FLY_DOWN_SPEED_TURBO: 19
};

// ==========================================
// === ANIMATION DELAYS =====================
// ==========================================
export const ANIMATION_DELAYS = {
    WALK: 3,
    IDLE: 3,
    JUMP: 3,
    GLOWING: 2,
    FLOAT: 0.7,
    FLY_UP: 0.5,
    FLY_DOWN: 0.5,
    LAND: 0.5,
    BOOST: 1,
    TURBO: 3,
    TURBO_BOOST: 1,
    BACKGROUND: 3,
    TREE: 3,
    NEW_BACKGROUND: 3,
    PARTICLE: 3,
    PLANT_GROWING: 7,
    NEW_TREE_GROWING: 7
};
