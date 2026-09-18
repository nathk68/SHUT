/**
 * Patched version of react-native/jest/mockComponent.js
 * Fixes crash when RealComponent.prototype is undefined (arrow function components in RN 0.83+)
 */
'use strict';

const React = require('react');
const { createElement } = require('react');

function mockComponent(moduleName, instanceMethods, isESModule) {
  const RealComponent = isESModule
    ? jest.requireActual(moduleName).default
    : jest.requireActual(moduleName);

  // Fix: guard against undefined prototype (arrow function components)
  const SuperClass =
    typeof RealComponent === 'function' &&
    RealComponent.prototype != null &&
    RealComponent.prototype.constructor instanceof React.Component
      ? RealComponent
      : React.Component;

  const name =
    (RealComponent &&
      (RealComponent.displayName ??
        RealComponent.name ??
        (RealComponent.render == null
          ? 'Unknown'
          : RealComponent.render.displayName ?? RealComponent.render.name))) ??
    'Unknown';

  const nameWithoutPrefix = name.replace(/^(RCT|RK)/, '');

  const Component = class extends SuperClass {
    static displayName = nameWithoutPrefix;

    render() {
      const props = { ...(RealComponent && RealComponent.defaultProps) };
      if (this.props) {
        Object.keys(this.props).forEach((prop) => {
          if (this.props[prop] !== undefined) {
            props[prop] = this.props[prop];
          }
        });
      }
      return createElement(nameWithoutPrefix, props, this.props && this.props.children);
    }
  };

  if (instanceMethods) {
    Object.assign(Component.prototype, instanceMethods);
  }

  return Component;
}

module.exports = mockComponent;
module.exports.default = mockComponent;
