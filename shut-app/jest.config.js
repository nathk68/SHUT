module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    'react-native/jest/mockComponent\\.js$': '<rootDir>/__mocks__/patchRNMockComponent.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens)',
  ],
  moduleNameMapper: {
    'react-native/jest/mockComponent$': '<rootDir>/__mocks__/rnMockComponent.js',
    '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: [
    'src/screens/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
};
