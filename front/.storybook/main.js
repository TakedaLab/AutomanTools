const custom = require('../webpack.dev.js')
module.exports = {
  addons: [
    '@storybook/addon-knobs/register',
    '@storybook/addon-viewport/register',
    '@storybook/addon-actions/register',
  ],
  stories: ['../app/**/*.stories.(jsx|js|mdx)'],
  webpackFinal: (config) => {
    return { ...config, resolve: custom.resolve};
  },
};
