const withTranspileModules = require('next-transpile-modules');
const withProgressBar = require('next-progressbar');
const withPlugins = require('next-compose-plugins');
const { BannerPlugin } = require('webpack');
const { readdirSync } = require('fs');
const { resolve } = require('path');

const packagesDirNames = readdirSync(resolve(__dirname, '../../packages'));
const monorepoPackages = packagesDirNames.map(name => `@universal-form/${name}`);

module.exports = withPlugins([withTranspileModules(monorepoPackages), withProgressBar], {
  reactStrictMode: true,
  webpack(config, { isServer, dev }) {
    if (dev && isServer) {
      config.plugins.push(
        new BannerPlugin({
          banner: 'require("source-map-support").install();',
          raw: true,
          entryOnly: false
        })
      );
    }

    return config;
  }
});
