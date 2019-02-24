'use strict';

module.exports = class CssSyntaxError extends Error {
  constructor() {
    super();
    this.name = 'CssSyntaxError';
  }
};
