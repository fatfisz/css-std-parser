'use strict';

const { minusSign, noSign, plusSign } = require('./constants');

const isWhitespace = codePoint => codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x20;
const isDigit = codePoint => codePoint >= 0x30 && codePoint <= 0x39;
const isSign = codePoint => codePoint === 0x2b || codePoint === 0x2d;
const isHexDigit = codePoint =>
  isDigit(codePoint) ||
  (codePoint >= 0x41 && codePoint <= 0x46) ||
  (codePoint >= 0x61 && codePoint <= 0x66);
const isLetter = codePoint =>
  (codePoint >= 0x41 && codePoint <= 0x5a) || (codePoint >= 0x61 && codePoint <= 0x7a);
const isNonAsciiCodePoint = codePoint => codePoint >= 0x80 && codePoint <= 0x10ffff;
const isNameStartCodePoint = codePoint =>
  isLetter(codePoint) || isNonAsciiCodePoint(codePoint) || codePoint === 0x5f;
const isNameCodePoint = codePoint =>
  isNameStartCodePoint(codePoint) || isDigit(codePoint) || codePoint === 0x2d;
const isNonPrintableCodePoint = codePoint =>
  (codePoint >= 0x00 && codePoint <= 0x08) ||
  codePoint === 0x0b ||
  (codePoint >= 0x0e && codePoint <= 0x1f) ||
  codePoint === 0x7f;

const getSign = codePoint =>
  codePoint === 0x2b ? plusSign : codePoint === 0x2d ? minusSign : noSign;

exports.getSign = getSign;
exports.isDigit = isDigit;
exports.isHexDigit = isHexDigit;
exports.isNameCodePoint = isNameCodePoint;
exports.isNameStartCodePoint = isNameStartCodePoint;
exports.isNonPrintableCodePoint = isNonPrintableCodePoint;
exports.isSign = isSign;
exports.isWhitespace = isWhitespace;
