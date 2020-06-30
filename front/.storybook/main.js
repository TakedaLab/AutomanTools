const custom = require('../webpack.dev.js')
module.exports = {
  stories: ['../app/**/*.stories.jsx'],
  webpackFinal: (config) => {
    return { ...config, resolve: custom.resolve};
  },
};
