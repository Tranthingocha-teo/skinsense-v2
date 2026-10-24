const { View } = require('react-native');

require('react-native-reanimated').setUpTests();

// RN's jest host mock assigns `measure = jest.fn()` per instance, which never
// calls back, so @rn-primitives menus (which portal only after measuring their
// trigger) would never open in tests. Intercept the field with a prototype
// accessor and answer with a fixed 44x44 box.
Object.defineProperty(View.prototype, 'measure', {
  configurable: true,
  get: () => (cb) => cb(0, 0, 44, 44, 300, 200),
  set() {},
});
