'use strict';

const get = (key) => {
	if (!window.localStorage) {
		// Ignore caching if local storage is not available
		return Promise.resolve();
	}
	if (!key) {
		return Promise.resolve();
	}

	try {
		const cacheEntryStr = window.localStorage.getItem(key);
		try {
			const cacheEntry = JSON.parse(cacheEntryStr);
			const value = cacheEntry ? cacheEntry.data : null;
			return Promise.resolve(value);
		} catch (e) {
			console.log(`Failed to parse storage value for "${key}": "${cacheEntryStr}"`);
			return Promise.resolve();
		}
	} catch (e) {
		return Promise.reject(e);
	}
};

const save = (key, data) => {
	if (!window.localStorage) {
		// Ignore caching if local storage is not available
		return Promise.resolve();
	}
	if (!key || data === null || data === undefined) {
		// Don't save empty data
		return Promise.resolve();
	}

	const cacheEntry = {
		data: data,
		timestamp: Date.now()
	};

	try {
		window.localStorage.setItem(key, JSON.stringify(cacheEntry));
	} catch (e) {
		return Promise.reject(e);
	}

	return Promise.resolve();
};

/**
 * Removes all old entries in local cache to avoid it overflowing
 *
 * @param {Array} [preservedKeys] array of strings or predicate functions to retain keys
 * @param {Number} [maxEntriesInLocalStorage]
 */
const prune = (preservedKeys = [], maxEntriesInLocalStorage = 50) => {
	if (!window.localStorage) {
		// Ignore caching if local storage is not available
		return Promise.resolve();
	}
	if (window.localStorage.length <= maxEntriesInLocalStorage) {
		// Preformance optimization: leave if there is nothing to be done
		return Promise.resolve();
	}
	function preserveKey(key) {
		return Array.isArray(preservedKeys) && preservedKeys.filter(function(preservedKey) {
			return typeof preservedKey === 'function' ? preservedKey(key) : key === preservedKey;
		}).length > 0;
	}
	// Collect all local storage entries with their timestamp (to detect
	// afterwards the oldest ones)
	const entries = [];
	for (let i = 0; i < window.localStorage.length; i++){
		const key = window.localStorage.key(i);
		// Preserve whitelisted keys
		if (preserveKey(key)) {
			continue;
		}
		const valueStr = window.localStorage.getItem(key);
		try {
			const value = JSON.parse(valueStr);
			const timestamp = value.timestamp;
			// Remove all (legacy) entries without a timestamp
			// XXX: Use parameter `preservedKeys` to protect entries from
			// being cleaned up.
			if (!timestamp) {
				window.localStorage.removeItem(key);
			} else {
				entries.push({ key: key, timestamp: timestamp });
			}
		} catch (e) {
			window.localStorage.removeItem(key);
			console.log(`Remove invalid local storage entry "${key}" ("${valueStr}"): ${e.message}`);
		}
	}
	// Check if there is anything to be done. This can't be checked earlier
	// because (legacy) entries without a timestamp might have been deleted
	// in the last step.
	if (entries.length > maxEntriesInLocalStorage) {
		// Sort newest first (we want to keep the first newest)
		entries.sort((entry1, entry2) => {
			return entry1.timestamp < entry2.timestamp;
		});
		// Remove oldest entries (expect the ones that we keep)
		for (let i = maxEntriesInLocalStorage; i < entries.length; i++) {
			window.localStorage.removeItem(entries[i].key);
		}
	}
	return Promise.resolve();
};

module.exports = {
	get,
	save,
	prune
};
