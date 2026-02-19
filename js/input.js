/**
 * Input Module
 * Handles keyboard and mouse input handling for the game
 */

/**
 * Create an input handler object
 * @returns {Object} Input handler with key states and event handlers
 */
export function createInputHandler() {
    const keys = {};

    return {
        keys,

        /**
         * Check if a key is currently pressed
         * @param {string} key - The key to check
         * @returns {boolean} True if the key is pressed
         */
        isPressed(key) {
            return !!keys[key.toLowerCase()];
        },

        /**
         * Check if any of the specified keys are pressed
         * @param {string[]} keyList - Array of keys to check
         * @returns {boolean} True if any key is pressed
         */
        isAnyPressed(keyList) {
            return keyList.some(key => this.isPressed(key));
        },

        /**
         * Get all currently pressed keys
         * @returns {string[]} Array of pressed key names
         */
        getPressedKeys() {
            return Object.keys(keys).filter(key => keys[key]);
        }
    };
}

/**
 * Create keyboard event handler
 * @param {Object} input - The input handler object
 * @returns {Object} Event handler with onKeyDown and onKeyUp methods
 */
export function createKeyboardHandler(input) {
    return {
        /**
         * Handle keydown event
         * @param {KeyboardEvent} e - The keyboard event
         * @returns {boolean} True if event should be prevented from default
         */
        onKeyDown(e) {
            // Prevent default behavior for game control keys
            const preventDefaultKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (preventDefaultKeys.includes(e.code)) {
                e.preventDefault();
            }

            input.keys[e.key.toLowerCase()] = true;
            return preventDefaultKeys.includes(e.code);
        },

        /**
         * Handle keyup event
         * @param {KeyboardEvent} e - The keyboard event
         */
        onKeyUp(e) {
            input.keys[e.key.toLowerCase()] = false;
        },

        /**
         * Attach keyboard event listeners to window
         */
        attachListeners() {
            window.addEventListener('keydown', this.onKeyDown);
            window.addEventListener('keyup', this.onKeyUp);
        },

        /**
         * Remove keyboard event listeners from window
         */
        detachListeners() {
            window.removeEventListener('keydown', this.onKeyDown);
            window.removeEventListener('keyup', this.onKeyUp);
        }
    };
}

/**
 * Create mouse handler
 * @param {Object} camera - The camera object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Object} Mouse handler with event methods
 */
export function createMouseHandler(camera, canvasWidth, canvasHeight) {
    let mouseX = 0;
    let mouseY = 0;

    return {
        /**
         * Handle mouse movement event
         * @param {MouseEvent} e - The mouse event
         */
        onMouseMove(e) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;

            // Update camera target based on mouse position
            camera.mouseX = mouseX - (canvasWidth / 2);
            camera.mouseY = mouseY - (canvasHeight / 2);
            camera.targetOffsetX = -camera.mouseX * camera.zoom;
            camera.targetOffsetY = -camera.mouseY * camera.zoom;
        },

        /**
         * Handle mouse wheel event for zooming
         * @param {WheelEvent} e - The wheel event
         * @returns {boolean} True if event should be prevented from default
         */
        onWheel(e) {
            e.preventDefault();

            if (e.deltaY < 0) {
                camera.zoom = Math.min(camera.zoom + camera.zoomStep, camera.maxZoom);
            } else {
                camera.zoom = Math.max(camera.zoom - camera.zoomStep, camera.minZoom);
            }

            return true;
        },

        /**
         * Get current mouse position
         * @returns {Object} Object with x and y coordinates
         */
        getPosition() {
            return { x: mouseX, y: mouseY };
        },

        /**
         * Get mouse position relative to canvas center
         * @returns {Object} Object with x and y relative coordinates
         */
        getRelativePosition() {
            return {
                x: mouseX - (canvasWidth / 2),
                y: mouseY - (canvasHeight / 2)
            };
        },

        /**
         * Attach mouse event listeners to element
         * @param {HTMLElement} element - The element to attach listeners to
         */
        attachListeners(element) {
            element.addEventListener('mousemove', this.onMouseMove);
            element.addEventListener('wheel', this.onWheel, { passive: false });
        },

        /**
         * Remove mouse event listeners from element
         * @param {HTMLElement} element - The element to remove listeners from
         */
        detachListeners(element) {
            element.removeEventListener('mousemove', this.onMouseMove);
            element.removeEventListener('wheel', this.onWheel);
        }
    };
}

/**
 * Create a complete input system with keyboard and mouse handlers
 * @param {Object} camera - The camera object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Object} Complete input system
 */
export function createInputSystem(camera, canvasWidth, canvasHeight) {
    const input = createInputHandler();
    const keyboard = createKeyboardHandler(input);
    const mouse = createMouseHandler(camera, canvasWidth, canvasHeight);

    return {
        input,
        keyboard,
        mouse,

        /**
         * Attach all input event listeners
         * @param {HTMLElement} canvasElement - The canvas element
         */
        attachListeners(canvasElement) {
            keyboard.attachListeners();
            mouse.attachListeners(canvasElement);
        },

        /**
         * Remove all input event listeners
         * @param {HTMLElement} canvasElement - The canvas element
         */
        detachListeners(canvasElement) {
            keyboard.detachListeners();
            mouse.detachListeners(canvasElement);
        },

        /**
         * Check if a specific key is pressed
         * @param {string} key - The key to check
         * @returns {boolean} True if key is pressed
         */
        isPressed(key) {
            return input.isPressed(key);
        },

        /**
         * Check if movement keys are pressed
         * @returns {Object} Object with directional flags
         */
        getMovement() {
            return {
                left: input.isPressed('a'),
                right: input.isPressed('d'),
                up: input.isPressed('w'),
                down: input.isPressed('s')
            };
        },

        /**
         * Check if shift key is pressed
         * @returns {boolean} True if shift is pressed
         */
        isShiftPressed() {
            return input.isPressed('Shift');
        },

        /**
         * Get current mouse position
         * @returns {Object} Mouse position
         */
        getMousePosition() {
            return mouse.getPosition();
        }
    };
}
