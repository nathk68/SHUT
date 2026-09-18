/**
 * Custom Jest transformer that patches react-native/jest/mockComponent.js
 * to handle arrow function components (RN 0.83+ with New Architecture).
 *
 * The bug: `RealComponent.prototype.constructor instanceof React.Component`
 * throws when RealComponent is an arrow function (prototype === undefined).
 * Fix: guard with `RealComponent.prototype != null &&`
 */
'use strict';

const { createTransformer } = require('babel-jest');

const transformer = createTransformer();

const BUGGY_LINE =
  'RealComponent.prototype.constructor instanceof React.Component';
const FIXED_LINE =
  'RealComponent.prototype != null && RealComponent.prototype.constructor instanceof React.Component';

module.exports = {
  process(sourceText, sourcePath, options) {
    const patched = sourceText.replace(BUGGY_LINE, FIXED_LINE);
    return transformer.process(patched, sourcePath, options);
  },
  getCacheKey(sourceText, sourcePath, options) {
    const cacheKeyFn = transformer.getCacheKey ?? (() => sourcePath);
    return cacheKeyFn(sourceText, sourcePath, options) + '_patched';
  },
};
