const { createConfig } = require('@edx/frontend-build');

const config = createConfig('webpack-dev');

config.experiments = {
  topLevelAwait: true
}

config.cache = { type: 'filesystem' }; // This isn't needed but really speeds up rebuilds!

config.devServer.allowedHosts = [
  'apps.local.overhang.io',
];

module.exports = config;
