const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// mp3を明示的に許可
config.resolver.assetExts.push('mp3');

module.exports = config;