const path = require('path');
const { createConfig } = require('@edx/frontend-build');

const config = createConfig('webpack-prod');

config.resolve = {
  alias: {
    '@edx/frontend-component-footer': path.resolve(__dirname, '../frontend-component-footer/src'),
    '@edx/frontend-component-header': path.resolve(__dirname, '../frontend-component-header/src'),
    'env.config': path.resolve(process.cwd(), './env.config'),
  },
  fallback: {
    // This causes the system to return an empty object if it can't find an env.config.js file in
    // the application being built.
    'env.config': false,
  },
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.config'],
  preferRelative: true,
  symlinks: true,
};

config.stats = {
  children: true,
}

module.exports = config;
