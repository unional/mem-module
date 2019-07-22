/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var Prohibited = /** @class */ (function (_super) {
    __extends(Prohibited, _super);
    function Prohibited(moduleName, action) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, "Unable to '" + action + "' on a locked store used by module '" + moduleName + "'") || this;
        _this.moduleName = moduleName;
        _this.action = action;
        Object.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return Prohibited;
}(Error));
var AccessedBeforeLock = /** @class */ (function (_super) {
    __extends(AccessedBeforeLock, _super);
    function AccessedBeforeLock(moduleName) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, "A readonly store from '" + moduleName + "' is being accessed before it is locked. Please call the approprate function in '" + moduleName + "' to lock the store.") || this;
        _this.moduleName = moduleName;
        Object.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return AccessedBeforeLock;
}(Error));

function getStoreValue(stores, id) {
    var moduleStore = getModuleStore(stores, id.moduleName);
    return moduleStore[id.key].value;
}
function initStoreValue(stores, id, initializer) {
    var moduleStore = getModuleStore(stores, id.moduleName);
    var store = moduleStore[id.key];
    var init = initializer(store && store.init || {});
    moduleStore[id.key] = { init: init, value: createStoreValue(init) };
}
function resetStoreValue(stores, id) {
    var moduleStore = getModuleStore(stores, id.moduleName);
    moduleStore[id.key].value = createStoreValue(moduleStore[id.key].init);
}
function getModuleStore(stores, moduleName) {
    return stores[moduleName] = stores[moduleName] || {};
}
function createStoreValue(initialValue) {
    return __assign({}, initialValue);
}

var readonlyStores = {};
/**
 * Creates a readonly store of type T.
 * @param id A unique identifier to the store.
 * @param initializer Initializing function for the store
 * @param mode The store mode. Defaults to 'initialize'.
 */
function createReadonlyStore(id, initializer) {
    initStoreValue(readonlyStores, id, initializer);
    var isLocked = false;
    var testing = false;
    return {
        openForTesting: function () {
            if (isLocked)
                throw new Prohibited(id.moduleName, 'enable testing');
            testing = true;
        },
        // todo: getter/setter for properties
        get: function () {
            if (!testing && !isLocked)
                throw new AccessedBeforeLock(id.moduleName);
            return getStoreValue(readonlyStores, id);
        },
        getWritable: function () {
            if (!testing && isLocked)
                throw new Prohibited(id.moduleName, 'ReadonlyStore#getWritable');
            return getStoreValue(readonlyStores, id);
        },
        lock: function (finalizer) {
            if (!isLocked) {
                if (finalizer) {
                    updateStoreValue(readonlyStores, id, finalizer);
                }
                freezeStoreValue(readonlyStores, id);
                isLocked = true;
                testing = false;
            }
            return this;
        },
        reset: function () {
            if (!testing && isLocked)
                throw new Prohibited(id.moduleName, 'ReadonlyStore#reset');
            resetStoreValue(readonlyStores, id);
        }
    };
}
function updateStoreValue(stores, id, finalizer /* Record<any, (value: any) => any> */) {
    var moduleStore = getModuleStore(stores, id.moduleName);
    var current = moduleStore[id.key].value;
    Object.keys(finalizer).forEach(function (k) { return current[k] = finalizer[k](current[k]); });
}
function freezeStoreValue(stores, id) {
    var moduleStore = getModuleStore(stores, id.moduleName);
    var store = moduleStore[id.key];
    moduleStore[id.key] = {
        init: store.init,
        value: freezeValue(store.value)
    };
}
function freezeValue(storeValue) {
    Object.keys(storeValue).forEach(function (k) { return freezeArray(storeValue, k); });
    // istanbul ignore next
    if (Object.getOwnPropertySymbols) {
        Object.getOwnPropertySymbols(storeValue).forEach(function (k) { return freezeArray(storeValue, k); });
    }
    return Object.freeze(storeValue);
}
function freezeArray(storeValue, k) {
    var value = storeValue[k];
    if (Array.isArray(value)) {
        storeValue[k] = Object.freeze(value);
    }
}

var stores = {};
/**
 * Creates a store of type T.
 * @param id A unique identifier to the store.
 * @param initializer Initializing function for the store
 */
function createStore(id, initializer) {
    initStoreValue(stores, id, initializer);
    return {
        get: function () { return getStoreValue(stores, id); },
        reset: function () { return resetStoreValue(stores, id); }
    };
}

export default createStore;
export { AccessedBeforeLock, Prohibited, createReadonlyStore, createStore };
//# sourceMappingURL=global-store.es.js.map