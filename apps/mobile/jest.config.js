/** @type {import('jest').Config} */
module.exports = {
  // Android-only app (AGENTS.md); also keeps dropdown-menu off iOS's FullWindowOverlay, which jest lacks.
  preset: 'jest-expo/android',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup-after-env.js'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  // NativeWind's global.css is a Metro-only import; jest has no CSS transform.
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/style-mock.js',
    // lucide's "react-native" export condition is untransformed ESM; jest wants the CJS build.
    '^lucide-react-native$': require.resolve('lucide-react-native'),
  },
  // @rn-primitives ships untranspiled JSX; the rest are jest-expo's defaults.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@rn-primitives|nativewind|lucide-react-native))',
  ],
};
