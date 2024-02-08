const { createConfig } = require('@edx/frontend-build');

const config = createConfig('webpack-prod');

config.experiments = {
  topLevelAwait: true
}

module.exports = config;
