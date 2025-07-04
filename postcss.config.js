const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: [
        // Be more specific about which files to process
        './src/**/*.{js,jsx,ts,tsx}',
        // Exclude test files and other non-relevant files
        '!./src/**/*.test.{js,jsx,ts,tsx}',
        '!./src/**/*.spec.{js,jsx,ts,tsx}',
        '!./src/**/*.stories.{js,jsx,ts,tsx}',
        // Only include node_modules that actually use StyleX
        // './node_modules/some-package-using-stylex/**/*.js',
      ],
      useCSSLayers: true,
      // Add development optimizations
      ...(isDev && {
        // Skip source map generation in development for speed
        sourceMap: false,
        // Use faster parsing in development
        asyncLoader: true,
      }),
    },
    // Only run autoprefixer in production or when explicitly needed
    ...(isDev ? {} : { autoprefixer: {} }),
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
