/**
 * @file storage.js
 * @description Safe wrapper for localStorage operations to handle quotas and disabled storage
 */

export const storage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            // Storage might be disabled (e.g. private mode) or restricted
            console.warn(`[Storage] Read failed for ${key}:`, e);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, String(value));
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('[Storage] Quota exceeded');
            } else {
                console.error(`[Storage] Write failed for ${key}:`, e);
            }
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`[Storage] Remove failed for ${key}:`, e);
        }
    }
};