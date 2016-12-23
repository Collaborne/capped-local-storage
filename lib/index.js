'use strict';

var get = function get(key) {
	if (!window.localStorage) {
		// Ignore caching if local storage is not available
		return Promise.resolve();
	}
	if (!key) {
		return Promise.resolve();
	}

	try {
		var cacheEntryStr = window.localStorage.getItem(key);
		try {
			var cacheEntry = JSON.parse(cacheEntryStr);
			var value = cacheEntry ? cacheEntry.data : null;
			return Promise.resolve(value);
		} catch (e) {
			console.log('Failed to parse storage value for "' + key + '": "' + cacheEntryStr + '"');
			return Promise.resolve();
		}
	} catch (e) {
		return Promise.reject(e);
	}
};

var save = function save(key, data) {
	if (!window.localStorage) {
		// Ignore caching if local storage is not available
		return Promise.resolve();
	}
	if (!key || data === null || data === undefined) {
		// Don't save empty data
		return Promise.resolve();
	}

	var cacheEntry = {
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
var prune = function prune() {
	var preservedKeys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	var maxEntriesInLocalStorage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;

	if (!window.localStorage) {
		// Ignore caching if local storage is not available
		return Promise.resolve();
	}
	if (window.localStorage.length <= maxEntriesInLocalStorage) {
		// Preformance optimization: leave if there is nothing to be done
		return Promise.resolve();
	}
	function preserveKey(key) {
		return Array.isArray(preservedKeys) && preservedKeys.filter(function (preservedKey) {
			return typeof preservedKey === 'function' ? preservedKey(key) : key === preservedKey;
		}).length > 0;
	}
	// Collect all local storage entries with their timestamp (to detect
	// afterwards the oldest ones)
	var entries = [];
	for (var i = 0; i < window.localStorage.length; i++) {
		var key = window.localStorage.key(i);
		// Preserve whitelisted keys
		if (preserveKey(key)) {
			continue;
		}
		var valueStr = window.localStorage.getItem(key);
		try {
			var value = JSON.parse(valueStr);
			var timestamp = value.timestamp;
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
			console.log('Remove invalid local storage entry "' + key + '" ("' + valueStr + '"): ' + e.message);
		}
	}
	// Check if there is anything to be done. This can't be checked earlier
	// because (legacy) entries without a timestamp might have been deleted
	// in the last step.
	if (entries.length > maxEntriesInLocalStorage) {
		// Sort newest first (we want to keep the first newest)
		entries.sort(function (entry1, entry2) {
			return entry1.timestamp < entry2.timestamp;
		});
		// Remove oldest entries (expect the ones that we keep)
		for (var _i = maxEntriesInLocalStorage; _i < entries.length; _i++) {
			window.localStorage.removeItem(entries[_i].key);
		}
	}
	return Promise.resolve();
};

module.exports = {
	get: get,
	save: save,
	prune: prune
};