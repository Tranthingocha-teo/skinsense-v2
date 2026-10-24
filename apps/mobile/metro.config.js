const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
// react-native-fast-tflite loads bundled models via require().
config.resolver.assetExts.push('tflite');

module.exports = withNativeWind(config, { input: './src/global.css' });
