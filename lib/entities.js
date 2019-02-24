'use strict';

exports.stylesheet = value => ({ type: 'pStylesheet', value });

exports.atRule = (name, prelude, value = null) => ({
  type: 'pAtRule',
  name,
  prelude,
  value,
});

exports.qualifiedRule = (prelude, value) => ({
  type: 'pQualifiedRule',
  prelude,
  value,
});

exports.declaration = (name, value, important = false) => ({
  type: 'pDeclaration',
  name,
  value,
  important,
});

exports.block = (subtype, value) => ({
  type: 'pBlock',
  subtype,
  value,
});

exports.function = (name, value) => ({
  type: 'pFunction',
  name,
  value,
});

exports.urange = (start, end = start) => ({
  type: 'pUrange',
  start,
  end,
});
