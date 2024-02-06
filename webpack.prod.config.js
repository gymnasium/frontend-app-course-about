const path = require('path');
const { createConfig } = require('@edx/frontend-build');

const config = createConfig('webpack-prod');

config.experiments = {
  topLevelAwait: true
}

config.resolve.modules = [
  path.resolve(__dirname, './node_modules'),
  path.resolve(__dirname, './src'),
  'node_modules',
];

module.exports = config;
