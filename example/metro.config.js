const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');
const modules = Object.keys({ ...pak.peerDependencies });

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,
  // Watch the local package source so Metro picks up edits without a reinstall.
  watchFolders: [root],
  resolver: {
    // Avoid resolving react/react-native from the library's own node_modules,
    // which would cause duplicate copies of these packages to be bundled.
    blockList: exclusionList(
      modules.map(
        (m) =>
          new RegExp(
            `^${path
              .join(root, 'node_modules', m)
              .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/.*$`
          )
      )
    ),
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
