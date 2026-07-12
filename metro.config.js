const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter ogg et wav dans les extensions d'assets pour metro
config.resolver.assetExts.push('ogg');
config.resolver.assetExts.push('wav');

module.exports = config;
