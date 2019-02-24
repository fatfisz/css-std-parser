'use strict';

const CssSyntaxError = require('./CssSyntaxError');
const entities = require('./entities');
const InputStream = require('./InputStream');
const tokenize = require('./tokenize');
const {
  blockSubtypeByType,
  endingTokenMatcherByType,
  eof,
  isAtKeyword,
  isBlockStartingToken,
  isCdc,
  isCdo,
  isComma,
  isColon,
  isDelim,
  isFunction,
  isIdent,
  isLeftBrace,
  isRightParenthesis,
  isSemicolon,
  isWhitespace,
} = require('./tokens');

class Parser extends InputStream {
  getEof() {
    return eof();
  }

  preprocess(source) {
    return tokenize(source);
  }

  parseStylesheet() {
    return entities.stylesheet(this.consumeListOfRules(true));
  }

  parseRule() {
    this.consumeWhile(isWhitespace);
    if (this.consumeEof()) {
      throw new CssSyntaxError();
    }
    const rule = isAtKeyword(this.peek(0)) ? this.consumeAtRule() : this.consumeQualifiedRule();
    if (rule === null) {
      throw new CssSyntaxError();
    }
    this.consumeWhile(isWhitespace);
    if (!this.consumeEof()) {
      throw new CssSyntaxError();
    }
    return rule;
  }

  parseListOfRules() {
    return this.consumeListOfRules(false);
  }

  parseDeclaration() {
    this.consumeWhile(isWhitespace);
    if (!isIdent(this.peek(0))) {
      throw new CssSyntaxError();
    }
    const declaration = this.consumeDeclaration();
    if (declaration === null) {
      throw new CssSyntaxError();
    }
    return declaration;
  }

  parseListOfDeclarations() {
    return this.consumeListOfDeclarations();
  }

  parseComponentValue() {
    this.consumeWhile(isWhitespace);
    if (this.consumeEof()) {
      throw new CssSyntaxError();
    }
    const value = this.consumeComponentValue();
    this.consumeWhile(isWhitespace);
    if (!this.consumeEof()) {
      throw new CssSyntaxError();
    }
    return value;
  }

  parseListOfComponentValues() {
    const values = [];
    while (!this.consumeEof()) {
      values.push(this.consumeComponentValue());
    }
    return values;
  }

  parseCommaSeparatedListOfComponentValues() {
    const commaValues = [];
    let end = false;
    while (!end) {
      const values = [];
      while (true) {
        if (this.consumeEof()) {
          end = true;
          break;
        } else if (this.consumeIf(isComma)) {
          break;
        }
        values.push(this.consumeComponentValue());
      }
      commaValues.push(values);
    }
    return commaValues;
  }

  consumeListOfRules(topLevelFlag) {
    const rules = [];
    while (true) {
      this.consumeWhile(isWhitespace);
      if (this.consumeEof()) {
        return rules;
      } else if (this.consumeIf(isCdo) || this.consumeIf(isCdc)) {
        if (!topLevelFlag) {
          this.reconsume();
          this.pushIfReturned(rules, this.consumeQualifiedRule());
        }
        continue;
      }
      this.pushIfReturned(
        rules,
        isAtKeyword(this.peek(0)) ? this.consumeAtRule() : this.consumeQualifiedRule(),
      );
    }
  }

  consumeAtRule() {
    const name = this.consumeAny().value;
    const prelude = [];
    while (true) {
      if (this.consumeIf(isSemicolon) || this.consumeEof()) {
        return entities.atRule(name, prelude);
      } else if (this.consumeIf(isLeftBrace)) {
        return entities.atRule(name, prelude, this.consumeSimpleBlock());
      }
      prelude.push(this.consumeComponentValue());
    }
  }

  consumeQualifiedRule() {
    const prelude = [];
    while (true) {
      if (this.consumeEof()) {
        return null;
      } else if (this.consumeIf(isLeftBrace)) {
        return entities.qualifiedRule(prelude, this.consumeSimpleBlock());
      }
      prelude.push(this.consumeComponentValue());
    }
  }

  consumeListOfDeclarations() {
    const declarations = [];
    while (true) {
      this.consumeWhile(token => isWhitespace(token) || isSemicolon(token));
      if (this.consumeEof()) {
        return declarations;
      } else if (this.consumeIf(isAtKeyword)) {
        this.reconsume();
        declarations.push(this.consumeAtRule());
      } else if (this.consumeIf(isIdent)) {
        const tokens = [this.peek()];
        while (!isSemicolon(this.peek(0)) && !this.consumeEof()) {
          tokens.push(this.consumeComponentValue());
        }
        // eslint-disable-next-line no-use-before-define
        const parser = new TokenParser(tokens);
        this.pushIfReturned(declarations, parser.consumeDeclaration());
      } else {
        while (!isSemicolon(this.peek(0)) && !this.isEof(0)) {
          this.consumeComponentValue();
        }
      }
    }
  }

  consumeDeclaration() {
    const name = this.consumeAny().value;
    const value = [];
    let important = false;
    this.consumeWhile(isWhitespace);
    if (!isColon(this.peek(0))) {
      return null;
    }
    this.go();
    this.consumeWhile(isWhitespace);
    while (true) {
      if (this.consumeEof()) {
        this.removeTrailingWhitespace(value);
        if (
          value.length > 1 &&
          isDelim(value[value.length - 2], '!') &&
          isIdent(value[value.length - 1], 'important')
        ) {
          value.pop();
          value.pop();
          important = true;
        }
        this.removeTrailingWhitespace(value);
        return entities.declaration(name, value, important);
      }
      value.push(this.consumeComponentValue());
    }
  }

  consumeComponentValue() {
    if (this.consumeIf(isBlockStartingToken)) {
      return this.consumeSimpleBlock();
    } else if (this.consumeIf(isFunction)) {
      return this.consumeFunction();
    }
    return this.consumeAny();
  }

  consumeSimpleBlock() {
    const type = this.peek().type;
    const subtype = blockSubtypeByType[type];
    const isEndingToken = endingTokenMatcherByType[type];
    const value = [];
    while (true) {
      if (this.consumeIf(isEndingToken) || this.consumeEof()) {
        return entities.block(subtype, value);
      }
      value.push(this.consumeComponentValue());
    }
  }

  consumeFunction() {
    const name = this.peek().value;
    const value = [];
    while (true) {
      if (this.consumeIf(isRightParenthesis) || this.consumeEof()) {
        return entities.function(name, value);
      }
      value.push(this.consumeComponentValue());
    }
  }

  pushIfReturned(values, value) {
    if (value !== null) {
      values.push(value);
    }
  }

  removeTrailingWhitespace(value) {
    while (value.length > 0 && isWhitespace(value[value.length - 1])) {
      value.pop();
    }
  }
}

class TokenParser extends Parser {
  preprocess(tokens) {
    return tokens;
  }
}

function getParser(name) {
  return source => {
    const parser = new Parser(source);
    return parser[name]();
  };
}

exports.parseStylesheet = getParser('parseStylesheet');
exports.parseRule = getParser('parseRule');
exports.parseListOfRules = getParser('parseListOfRules');
exports.parseDeclaration = getParser('parseDeclaration');
exports.parseListOfDeclarations = getParser('parseListOfDeclarations');
exports.parseComponentValue = getParser('parseComponentValue');
exports.parseListOfComponentValues = getParser('parseListOfComponentValues');
exports.parseCommaSeparatedListOfComponentValues = getParser(
  'parseCommaSeparatedListOfComponentValues',
);
