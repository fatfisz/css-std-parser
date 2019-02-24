'use strict';

const { isHexDigit } = require('./characters');
const CssSyntaxError = require('./CssSyntaxError');
const { urange } = require('./entities');
const InputStream = require('./InputStream');
const { getCodePointsFromString, getNumberFromCodePoints, maxUnicode } = require('./unicode');

class UrangeParser extends InputStream {
  getEof() {
    return -1;
  }

  preprocess(source) {
    return getCodePointsFromString(source);
  }

  parse() {
    if (!this.consume(0x55) && !this.consume(0x75)) {
      return null;
    }
    if (!this.consume(0x2b)) {
      return null;
    }
    const start = this.consumeWhile(isHexDigit);
    const questionMarks = this.consumeWhile(codePoint => codePoint === 0x3f);
    const totalStartLength = start.length + questionMarks.length;
    if (
      totalStartLength === 0 ||
      totalStartLength > 6 ||
      (questionMarks.length > 0 && !this.isEof(0))
    ) {
      return null;
    }
    const startNumber = getNumberFromCodePoints(start);
    if (questionMarks.length > 0) {
      const shift = 4 * questionMarks.length;
      return this.tryReturnUrange(startNumber << shift, ((startNumber + 1) << shift) - 1);
    } else if (this.consumeEof()) {
      return this.tryReturnUrange(startNumber);
    }
    if (!this.consume(0x2d)) {
      return null;
    }
    const end = this.consumeWhile(isHexDigit);
    if (end.length === 0 || end.length > 6 || !this.consumeEof()) {
      return null;
    }
    const endNumber = getNumberFromCodePoints(end);
    return this.tryReturnUrange(startNumber, endNumber);
  }

  tryReturnUrange(start, end = start) {
    if (end > maxUnicode || start > end) {
      throw new CssSyntaxError();
    }
    return urange(start, end);
  }
}

module.exports = function parseUrange(source) {
  const parser = new UrangeParser(source);
  return parser.parse();
};
