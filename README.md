# capped-local-storage
Local storage access layer that allows to remove the oldest entries

## Install

~~~~
npm install Collaborne/capped-local-storage --save
~~~~

## Usage

Check the included [demo](https://github.com/Collaborne/capped-local-storage/blob/master/demo.html).

```javascript
var storage = require('capped-local-storage');

var key = 'FOO';
var value = 'BAR';

storage.save(key, value).then(function() {
    console.log('Step 1: Successfully saved ' + key);
}).then(function() {
    console.log('Step 2: Reading value for ' + key + '...');
    return storage.get(key);
}).then(function(readValue) {
    console.log('Step 3: Got "' + readValue + '"');
}).then(function(readValue) {
    console.log('Step 4: Pruning all values...');
    return storage.prune([], 0);
}).then(function() {
    console.log('Step 5: Reading value for ' + key + '...');
    return storage.get(key);
}).then(function(readValue) {
    console.log('Step 6: Got "' + readValue + '"');
});
```
