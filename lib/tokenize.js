'use strict';

const {
  getSign,
  isDigit,
  isHexDigit,
  isNameCodePoint,
  isNameStartCodePoint,
  isNonPrintableCodePoint,
  isSign,
  isWhitespace,
} = require('./characters');
const {
  idType,
  integerType,
  noSign,
  numberType,
  replacementCodePoint,
  unrestrictedType,
} = require('./constants');
const InputStream = require('./InputStream');
const tokens = require('./tokens');
const {
  getCodePointsFromString,
  getNumberFromCodePoints,
  getStringFromCodePoint,
  getStringFromCodePoints,
} = require('./unicode');

class Lexer extends InputStream {
  getEof() {
    return -1;
  }

  preprocess(source) {
    const codePoints = getCodePointsFromString(source);
    const result = new Uint32Array(codePoints.length);
    let resultIndex = 0;
    for (let index = 0; index < codePoints.length; ++index) {
      switch (codePoints[index]) {
        case 0:
          result[resultIndex] = replacementCodePoint;
          break;
        case 0x0c:
          result[resultIndex] = 0x0a;
          break;
        case 0x0d:
          result[resultIndex] = 0x0a;
          if (index + 1 < codePoints.length && codePoints[index + 1] === 0x0a) {
            index += 1;
          }
          break;
        default:
          result[resultIndex] = codePoints[index];
      }
      resultIndex += 1;
    }
    return result.slice(0, resultIndex);
  }

  tokenize() {
    const result = [];
    while (true) {
      const token = this.consumeToken();
      if (tokens.isEof(token)) {
        return result;
      }
      result.push(token);
    }
  }

  // eslint-disable-next-line complexity
  consumeToken() {
    this.consumeComment();
    if (this.consumeEof()) {
      return tokens.eof();
    } else if (this.consumeIf(isWhitespace)) {
      return this.consumeWhitespace();
    } else if (this.consumeIf(isDigit)) {
      this.reconsume();
      return this.consumeNumericToken();
    } else if (this.consumeIf(isNameStartCodePoint)) {
      this.reconsume();
      return this.consumeIdent();
    }
    switch (this.consumeAny()) {
      case 0x22:
      case 0x27:
        return this.consumeString(this.peek());
      case 0x23:
        if (isNameCodePoint(this.peek(0)) || this.startsWithValidEscape(0)) {
          // if (this.startsWithName(0)) {
          const type = this.startsWithIdentifier(0) ? idType : unrestrictedType;
          return tokens.hash(type, this.consumeName());
        }
        break;
      case 0x28:
        return tokens.leftParenthesis();
      case 0x29:
        return tokens.rightParenthesis();
      case 0x2b:
        if (this.startsWithNumber()) {
          this.reconsume();
          return this.consumeNumericToken();
        }
        break;
      case 0x2c:
        return tokens.comma();
      case 0x2d:
        if (this.startsWithNumber()) {
          this.reconsume();
          return this.consumeNumericToken();
        } else if (this.peek(0) === 0x2d && this.peek(1) === 0x3e) {
          this.go(2);
          return tokens.cdc();
        } else if (this.startsWithIdentifier()) {
          this.reconsume();
          return this.consumeIdent();
        }
        break;
      case 0x2e:
        if (this.startsWithNumber()) {
          this.reconsume();
          return this.consumeNumericToken();
        }
        break;
      case 0x3a:
        return tokens.colon();
      case 0x3b:
        return tokens.semicolon();
      case 0x3c:
        if (this.peek(0) === 0x21 && this.peek(1) === 0x2d && this.peek(2) === 0x2d) {
          this.go(3);
          return tokens.cdo();
        }
        break;
      case 0x40:
        if (this.startsWithIdentifier(0)) {
          const value = this.consumeName();
          return tokens.atKeyword(value);
        }
        break;
      case 0x5b:
        return tokens.leftBracket();
      case 0x5c:
        if (this.startsWithValidEscape()) {
          this.reconsume();
          return this.consumeIdent();
        }
        break;
      case 0x5d:
        return tokens.rightBracket();
      case 0x7b:
        return tokens.leftBrace();
      case 0x7d:
        return tokens.rightBrace();
    }
    return tokens.delim(getStringFromCodePoint(this.peek()));
  }

  consumeNumericToken() {
    const number = this.consumeNumber();
    if (this.consume(0x25)) {
      return tokens.percentage(number.subtype, number.value);
    } else if (this.startsWithIdentifier(0)) {
      return tokens.dimension(number.subtype, number.value, this.consumeName());
    }
    return number;
  }

  consumeIdent() {
    const name = this.consumeName();
    if (this.consume(0x28)) {
      if (name.toLowerCase() === 'url') {
        return this.consumeUrl();
      }
      return tokens.function(name);
    }
    return tokens.ident(name);
  }

  consumeString(endingCodePoint) {
    const result = [];
    while (true) {
      if (this.consume(endingCodePoint) || this.consumeEof()) {
        break;
      } else if (this.consume(0x0a)) {
        this.reconsume();
        return tokens.badString();
      } else if (this.consume(0x5c)) {
        if (this.consumeEof() || this.consume(0x0a)) {
          continue;
        } else if (this.startsWithValidEscape()) {
          result.push(this.consumeEscapedCodePoint());
          continue;
        }
      } else {
        result.push(this.consumeAny());
      }
    }
    return tokens.string(getStringFromCodePoints(result));
  }

  consumeUrl() {
    this.consumeWhitespace();
    if (this.consumeEof()) {
      return tokens.url('');
    } else if (this.peek(0) === 0x22 || this.peek(0) === 0x27) {
      return tokens.function('url');
    }
    const result = [];
    while (true) {
      const codePoint = this.consumeAny();
      if (codePoint === 0x29 || this.isEof()) {
        break;
      } else if (isWhitespace(codePoint)) {
        this.consumeWhitespace();
        if (this.consume(0x29) || this.consumeEof()) {
          break;
        }
        return this.nextBadUrl();
      } else if (
        codePoint === 0x22 ||
        codePoint === 0x27 ||
        codePoint === 0x28 ||
        isNonPrintableCodePoint(codePoint)
      ) {
        return this.nextBadUrl();
      } else if (codePoint === 0x5c) {
        if (this.startsWithValidEscape()) {
          result.push(this.consumeEscapedCodePoint());
          continue;
        }
        return this.nextBadUrl();
      }
      result.push(codePoint);
    }
    return tokens.url(getStringFromCodePoints(result));
  }

  consumeEscapedCodePoint() {
    const number = this.consumeWhile(isHexDigit, 6);
    if (number.length > 0) {
      this.consumeIf(isWhitespace);
      return getNumberFromCodePoints(number);
    }
    if (this.consumeEof()) {
      return replacementCodePoint;
    }
    return this.consumeAny();
  }

  startsWithValidEscape(offset = -1) {
    return this.peek(offset) === 0x5c && this.peek(offset + 1) !== 0x0a;
  }

  startsWithName(offset = -1) {
    return isNameStartCodePoint(this.peek(offset)) || this.startsWithValidEscape(offset);
  }

  startsWithIdentifier(offset = -1) {
    return (
      this.startsWithName(offset) ||
      (this.peek(offset) === 0x2d &&
        (this.startsWithName(offset + 1) || this.peek(offset + 1) === 0x2d))
    );
  }

  startsWithSignlessNumber(offset = -1) {
    return (
      isDigit(this.peek(offset)) || (this.peek(offset) === 0x2e && isDigit(this.peek(offset + 1)))
    );
  }

  startsWithNumber(offset = -1) {
    return (
      this.startsWithSignlessNumber(offset) ||
      (isSign(this.peek(offset)) && this.startsWithSignlessNumber(offset + 1))
    );
  }

  consumeName() {
    const name = [];
    while (true) {
      const codePoint = this.consumeAny();
      if (isNameCodePoint(codePoint)) {
        name.push(codePoint);
      } else if (this.startsWithValidEscape()) {
        name.push(this.consumeEscapedCodePoint());
      } else {
        this.reconsume();
        return getStringFromCodePoints(name);
      }
    }
  }

  consumeNumber() {
    let type = integerType;
    let sign = noSign;
    const codePoints = this.getConsumedAfter(() => {
      let stage = 0;
      if (this.consumeIf(isSign)) {
        sign = getSign(this.peek(-1));
      }
      while (true) {
        if (this.consumeIf(isDigit)) {
          // Do nothing
        } else if (stage < 1 && (this.peek(0) === 0x2e && isDigit(this.peek(1)))) {
          this.go(2);
          type = numberType;
          stage = 1;
        } else if (
          stage < 2 &&
          (this.peek(0) === 0x45 || this.peek(0) === 0x65) &&
          (isDigit(this.peek(1)) || (isSign(this.peek(1)) && isDigit(this.peek(2))))
        ) {
          this.go(isSign(this.peek(1)) ? 3 : 2);
          type = numberType;
          stage = 2;
        } else {
          break;
        }
      }
    });
    const number = Number(getStringFromCodePoints(codePoints));
    return tokens.number(type, number, sign);
  }

  nextBadUrl() {
    while (true) {
      const codePoint = this.consumeAny();
      if (codePoint === 0x29 || this.isEof()) {
        return tokens.badUrl();
      } else if (this.startsWithValidEscape()) {
        this.consumeEscapedCodePoint();
      }
    }
  }

  consumeWhitespace() {
    this.consumeWhile(isWhitespace);
    return tokens.whitespace();
  }

  consumeComment() {
    if (this.peek(0) !== 0x2f || this.peek(1) !== 0x2a) {
      return;
    }
    this.go(2);
    while (true) {
      this.consumeWhile(codePoint => !this.isEof(0) && codePoint !== 0x2a);
      if (this.consumeEof() || (this.consume(0x2a) && this.consume(0x2f))) {
        return;
      }
    }
  }
}

module.exports = function tokenize(source) {
  const lexer = new Lexer(source);
  return lexer.tokenize();
};
