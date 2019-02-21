'use strict';

module.exports = class InputStream {
  constructor(data) {
    this.index = 0;
    this.data = typeof this.preprocess === 'function' ? this.preprocess(data) : data;
    this.eof = this.getEof();
  }

  isEof(offset = -1) {
    return this.index + offset >= this.data.length;
  }

  peek(offset = -1) {
    if (this.isEof(offset)) {
      return this.eof;
    }
    return this.data[this.index + offset];
  }

  go(count = 1) {
    this.index += count;
  }

  consumeAny() {
    const element = this.peek(0);
    this.go();
    return element;
  }

  reconsume() {
    this.index -= 1;
  }

  consume(expected) {
    if (this.peek(0) === expected) {
      this.go();
      return true;
    }
    return false;
  }

  consumeEof() {
    if (this.isEof(0)) {
      return true;
    }
    return false;
  }

  consumeIf(predicate) {
    if (predicate(this.peek(0))) {
      this.go();
      return true;
    }
    return false;
  }

  getConsumedAfter(fn) {
    const start = this.index;
    fn();
    return this.data.slice(start, this.index);
  }

  consumeWhile(predicate, max = Infinity) {
    const start = this.index;
    while (this.index - start < max && predicate(this.peek(0))) {
      this.go();
    }
    return this.data.slice(start, this.index);
  }
};
