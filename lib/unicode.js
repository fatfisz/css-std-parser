'use strict';

const { replacement } = require('./constants');

const maxUnicode = 0x10ffff;

function isHighSurrogate(code) {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code) {
  return code >= 0xdc00 && code <= 0xdfff;
}

function getCodePointFromSurrogates(high, low) {
  return (high - 0xd800) * 0x400 + low - 0xdc00 + 0x10000;
}

function getStringFromCodePoint(codePoint) {
  if (codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > maxUnicode) {
    return replacement;
  }
  if (codePoint < 0xffff) {
    return String.fromCharCode(codePoint);
  }
  const high = String.fromCharCode(Math.floor((codePoint - 0x10000) / 0x400) + 0xd800);
  const low = String.fromCharCode(((codePoint - 0x10000) % 0x400) + 0xdc00);
  return `${high}${low}`;
}

function getCodePointsFromString(string) {
  const codePoints = new Uint32Array(string.length);
  let codePointsIndex = 0;
  for (let index = 0; index < string.length; ++index) {
    if (isHighSurrogate(string.charCodeAt(index)) && isLowSurrogate(string.charCodeAt(index + 1))) {
      codePoints[codePointsIndex] = getCodePointFromSurrogates(
        string.charCodeAt(index),
        string.charCodeAt(index + 1),
      );
      index += 1;
    } else {
      codePoints[codePointsIndex] = string.charCodeAt(index);
    }
    codePointsIndex += 1;
  }
  return codePoints.slice(0, codePointsIndex);
}

function getStringFromCodePoints(codePoints) {
  let string = '';
  for (let index = 0; index < codePoints.length; ++index) {
    string += getStringFromCodePoint(codePoints[index]);
  }
  return string;
}

function getNumberFromHexCodePoint(codePoint) {
  return codePoint <= 0x39
    ? codePoint - 0x30
    : codePoint <= 0x46
    ? codePoint - 0x37
    : codePoint - 0x57;
}

function getNumberFromCodePoints(codePoints) {
  let result = 0;
  for (let index = 0; index < codePoints.length; ++index) {
    result = (result << 4) + getNumberFromHexCodePoint(codePoints[index]);
  }
  return result;
}

exports.getCodePointsFromString = getCodePointsFromString;
exports.getNumberFromCodePoints = getNumberFromCodePoints;
exports.getStringFromCodePoint = getStringFromCodePoint;
exports.getStringFromCodePoints = getStringFromCodePoints;
exports.maxUnicode = maxUnicode;
