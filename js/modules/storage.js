/**
 * @file storage.js
 * @description Safe wrapper for localStorage operations to handle quotas and disabled storage
 */

/**
 * Run a localStorage operation, delegating failures to onError.
 * Returns whatever the operation (or onError fallback) produces.
 */
function runSafely(operation, onError) {
  try {
    return operation();
  } catch (e) {
    return onError(e);
  }
}

export const storage = {
  get(key, defaultValue = null) {
    return runSafely(
      () => {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
      },
      (e) => {
        console.warn(`[Storage] Read failed for ${key}:`, e);
        return defaultValue;
      },
    );
  },

  set(key, value) {
    return runSafely(
      () => {
        localStorage.setItem(key, String(value));
        return true;
      },
      (e) => {
        if (e.name === "QuotaExceededError") {
          console.error("[Storage] Quota exceeded");
        } else {
          console.warn(`[Storage] Write failed for ${key}:`, e);
        }
        return false;
      },
    );
  },

  remove(key) {
    runSafely(
      () => {
        localStorage.removeItem(key);
      },
      (e) => {
        console.warn(`[Storage] Remove failed for ${key}:`, e);
      },
    );
  },
};
