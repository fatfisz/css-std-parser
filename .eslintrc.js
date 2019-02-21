/* eslint-disable strict */

'use strict';

module.exports = {
  extends: ['@codility/eslint-config-codility'],

  parserOptions: {
    sourceType: 'script',
  },

  overrides: {
    files: '**/*.test.js',
    env: {
      jest: true,
    },
  },
};
