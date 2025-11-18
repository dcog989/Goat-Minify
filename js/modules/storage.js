/**
 * @file storage.js
 * @description Safe wrapper for localStorage operations
 */

import { UI_CONSTANTS } from './constants.js';

// Helper to create temporary status messages (circular dependency avoidance requires passing the shower function or simple console fallback)
// For simplicity in this module, we'll log errors to console, as UI feedback happens in the main controller.

export const storage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            console.warn(`Failed to read ${key} from localStorage:`, e);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, String(value));
            return true;
        } catch (e) {
            console.error(`Failed to save ${key} to localStorage:`, e);
            return false;
        }
    },
};