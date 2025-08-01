import type { StorybookConfig } from '@storybook/react-vite';

import { join, dirname } from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import tailwindcssPostcss = require('@tailwindcss/postcss');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import autoprefixer = require('autoprefixer');

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../../ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath("@storybook/addon-docs")
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  viteFinal: async config => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui': join(dirname(require.resolve('../../ui/package.json')), 'src'),
    };

    // Configure PostCSS for Tailwind CSS
    config.css = config.css || {};
    config.css.postcss = {
      plugins: [tailwindcssPostcss, autoprefixer],
    };

    return config;
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
};
export default config;
