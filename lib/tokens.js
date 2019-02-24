'use strict';

const types = {
  ident: 'tIdent',
  function: 'tFunction',
  atKeyword: 'tAtKeyword',
  hash: 'tHash',
  string: 'tString',
  badString: 'tBadString',
  url: 'tUrl',
  badUrl: 'tBadUrl',
  delim: 'tDelim',
  number: 'tNumber',
  percentage: 'tPercentage',
  dimension: 'tDimension',
  whitespace: 'tWhitespace',
  cdo: 'tCdo',
  cdc: 'tCdc',
  colon: 'tColon',
  semicolon: 'tSemicolon',
  comma: 'tComma',
  leftBracket: 'tLeftBracket',
  rightBracket: 'tRightBracket',
  leftParenthesis: 'tLeftParenthesis',
  rightParenthesis: 'tRightParenthesis',
  leftBrace: 'tLeftBrace',
  rightBrace: 'tRightBrace',
  eof: 'tEof',
};

exports.ident = value => ({ type: types.ident, value });
exports.function = value => ({ type: types.function, value });
exports.atKeyword = value => ({ type: types.atKeyword, value });
exports.hash = (subtype, value) => ({ type: types.hash, subtype, value });
exports.string = value => ({ type: types.string, value });
exports.badString = () => ({ type: types.badString });
exports.url = value => ({ type: types.url, value });
exports.badUrl = () => ({ type: types.badUrl });
exports.delim = value => ({ type: types.delim, value });
exports.number = (subtype, value, sign) => ({ type: types.number, subtype, value, sign });
exports.percentage = (subtype, value) => ({ type: types.percentage, subtype, value });
exports.dimension = (subtype, value, unit) => ({ type: types.dimension, subtype, value, unit });
exports.whitespace = () => ({ type: types.whitespace });
exports.cdo = () => ({ type: types.cdo });
exports.cdc = () => ({ type: types.cdc });
exports.colon = () => ({ type: types.colon });
exports.semicolon = () => ({ type: types.semicolon });
exports.comma = () => ({ type: types.comma });
exports.leftBracket = () => ({ type: types.leftBracket });
exports.rightBracket = () => ({ type: types.rightBracket });
exports.leftParenthesis = () => ({ type: types.leftParenthesis });
exports.rightParenthesis = () => ({ type: types.rightParenthesis });
exports.leftBrace = () => ({ type: types.leftBrace });
exports.rightBrace = () => ({ type: types.rightBrace });
exports.eof = () => ({ type: types.eof });

exports.isIdent = (token, value = null) =>
  token.type === types.ident && (value === null || value === token.value.toLowerCase());
exports.isFunction = token => token.type === types.function;
exports.isAtKeyword = token => token.type === types.atKeyword;
exports.isHash = token => token.type === types.hash;
exports.isString = token => token.type === types.string;
exports.isBadString = token => token.type === types.badString;
exports.isUrl = token => token.type === types.url;
exports.isBadUrl = token => token.type === types.badUrl;
exports.isDelim = (token, value = null) =>
  token.type === types.delim && (value === null || value === token.value);
exports.isNumber = token => token.type === types.number;
exports.isPercentage = token => token.type === types.percentage;
exports.isDimension = token => token.type === types.dimension;
exports.isWhitespace = token => token.type === types.whitespace;
exports.isCdo = token => token.type === types.cdo;
exports.isCdc = token => token.type === types.cdc;
exports.isColon = token => token.type === types.colon;
exports.isSemicolon = token => token.type === types.semicolon;
exports.isComma = token => token.type === types.comma;
exports.isLeftBracket = token => token.type === types.leftBracket;
exports.isRightBracket = token => token.type === types.rightBracket;
exports.isLeftParenthesis = token => token.type === types.leftParenthesis;
exports.isRightParenthesis = token => token.type === types.rightParenthesis;
exports.isLeftBrace = token => token.type === types.leftBrace;
exports.isRightBrace = token => token.type === types.rightBrace;
exports.isEof = token => token.type === types.eof;

exports.isBlockStartingToken = token =>
  token.type === types.leftBrace ||
  token.type === types.leftBracket ||
  token.type === types.leftParenthesis;

exports.blockSubtypeByType = {
  [types.leftBrace]: '{',
  [types.leftBracket]: '[',
  [types.leftParenthesis]: '(',
};

exports.endingTokenMatcherByType = {
  [types.leftBrace]: exports.isRightBrace,
  [types.leftBracket]: exports.isRightBracket,
  [types.leftParenthesis]: exports.isRightParenthesis,
};
