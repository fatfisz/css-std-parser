'use strict';

/**
 * Source: https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/css/parser/css_tokenizer_test.cc
 * A few tests were added to make the test suite more complete.
 */

const {
  idType,
  integerType,
  minusSign,
  noSign,
  numberType,
  plusSign,
  replacement,
  unrestrictedType,
} = require('./constants');
const tokenize = require('./tokenize');
const tokens = require('./tokens');

function test(css, ...expected) {
  it(`tokenize ${css}`, () => {
    const tokens = tokenize(css);
    expect(tokens).toEqual(expected);
  });
}

describe('single-character tokens', () => {
  test('(', tokens.leftParenthesis());
  test(')', tokens.rightParenthesis());
  test('[', tokens.leftBracket());
  test(']', tokens.rightBracket());
  test(',', tokens.comma());
  test(':', tokens.colon());
  test(';', tokens.semicolon());
  test(')[', tokens.rightParenthesis(), tokens.leftBracket());
  test('[)', tokens.leftBracket(), tokens.rightParenthesis());
  test('{}', tokens.leftBrace(), tokens.rightBrace());
  test(',,', tokens.comma(), tokens.comma());
});

describe('legacy multiple-character tokens, now as delims', () => {
  test('~=', tokens.delim('~'), tokens.delim('='));
  test('|=', tokens.delim('|'), tokens.delim('='));
  test('^=', tokens.delim('^'), tokens.delim('='));
  test('$=', tokens.delim('$'), tokens.delim('='));
  test('*=', tokens.delim('*'), tokens.delim('='));
  test('||', tokens.delim('|'), tokens.delim('|'));
  test('|||', tokens.delim('|'), tokens.delim('|'), tokens.delim('|'));
});

describe('multiple-character tokens', () => {
  test('<!--', tokens.cdo());
  test('<!---', tokens.cdo(), tokens.delim('-'));
  test('-->', tokens.cdc());
});

describe('delimiter tokens', () => {
  test('^', tokens.delim('^'));
  test('*', tokens.delim('*'));
  test('%', tokens.delim('%'));
  test('~', tokens.delim('~'));
  test('&', tokens.delim('&'));
  test('|', tokens.delim('|'));
  test('\u{7f}', tokens.delim('\u{7f}'));
  test('\u{1}', tokens.delim('\u{1}'));
  test('~-', tokens.delim('~'), tokens.delim('-'));
  test('^|', tokens.delim('^'), tokens.delim('|'));
  test('$~', tokens.delim('$'), tokens.delim('~'));
  test('*^', tokens.delim('*'), tokens.delim('^'));
});

describe('whitespace tokens', () => {
  test('   ', tokens.whitespace());
  test('\n\rS', tokens.whitespace(), tokens.ident('S'));
  test('   *', tokens.whitespace(), tokens.delim('*'));
  test('\r\n\f\t2', tokens.whitespace(), tokens.number(integerType, 2, noSign));
});

describe('escapes', () => {
  test('hel\\6Co', tokens.ident('hello'));
  test('\\26 B', tokens.ident('&B'));
  test("'hel\\6c o'", tokens.string('hello'));
  test("'spac\\65\r\ns'", tokens.string('spaces'));
  test('spac\\65\r\ns', tokens.ident('spaces'));
  test('spac\\65\n\rs', tokens.ident('space'), tokens.whitespace(), tokens.ident('s'));
  test('sp\\61\tc\\65\fs', tokens.ident('spaces'));
  test('hel\\6c  o', tokens.ident('hell'), tokens.whitespace(), tokens.ident('o'));
  test('test\\\n', tokens.ident('test'), tokens.delim('\\'), tokens.whitespace());
  test('test\\D799', tokens.ident('test\u{d799}'));
  test('\\E000', tokens.ident('\u{e000}'));
  test('te\\s\\t', tokens.ident('test'));
  test('spaces\\ in\\\tident', tokens.ident('spaces in\tident'));
  test('\\.\\,\\:\\!', tokens.ident('.,:!'));
  test('\\\r', tokens.delim('\\'), tokens.whitespace());
  test('\\\f', tokens.delim('\\'), tokens.whitespace());
  test('\\\r\n', tokens.delim('\\'), tokens.whitespace());
  test('null\\\0', tokens.ident('null' + replacement));
  test('null\\\0\0', tokens.ident('null' + replacement + replacement));
  test('null\\0', tokens.ident('null' + replacement));
  test('null\\0000', tokens.ident('null' + replacement));
  test('large\\110000', tokens.ident('large' + replacement));
  test('large\\23456a', tokens.ident('large' + replacement));
  test('surrogate\\D800', tokens.ident('surrogate' + replacement));
  test('surrogate\\0DABC', tokens.ident('surrogate' + replacement));
  test('\\00DFFFsurrogate', tokens.ident(replacement + 'surrogate'));
  test('\\10fFfF', tokens.ident('\u{10ffff}'));
  test('\\10fFfF0', tokens.ident('\u{10ffff}0'));
  test('\\10000000', tokens.ident('\u{100000}00'));
  test('eof\\', tokens.ident('eof' + replacement));
});

describe('ident token', () => {
  test('simple-ident', tokens.ident('simple-ident'));
  test('testing123', tokens.ident('testing123'));
  test('hello!', tokens.ident('hello'), tokens.delim('!'));
  test('world\u{5}', tokens.ident('world'), tokens.delim('\u{5}'));
  test('_under score', tokens.ident('_under'), tokens.whitespace(), tokens.ident('score'));
  test('-_underscore', tokens.ident('-_underscore'));
  test('-text', tokens.ident('-text'));
  test('-\\6d', tokens.ident('-m'));
  test('--abc', tokens.ident('--abc'));
  test('--', tokens.ident('--'));
  test('--11', tokens.ident('--11'));
  test('---', tokens.ident('---'));
  test('\u{2003}', tokens.ident('\u{2003}')); // em-space
  test('\u{a0}', tokens.ident('\u{a0}')); // non-breaking space
  test('\u{1234}', tokens.ident('\u{1234}'));
  test('\u{12345}', tokens.ident('\u{12345}'));
  test('\0', tokens.ident(replacement));
  test('ab\0c', tokens.ident('ab' + replacement + 'c'));
  test('ab\0c', tokens.ident('ab' + replacement + 'c'));
});

describe('function token', () => {
  test(
    'scale(2)',
    tokens.function('scale'),
    tokens.number(integerType, 2, noSign),
    tokens.rightParenthesis(),
  );
  test('foo-bar\\ baz(', tokens.function('foo-bar baz'));
  test('fun\\(ction(', tokens.function('fun(ction'));
  test('-foo(', tokens.function('-foo'));
  test('url("foo.gif"', tokens.function('url'), tokens.string('foo.gif'));
  test("foo(  'bar.gif'", tokens.function('foo'), tokens.whitespace(), tokens.string('bar.gif'));
  test("url(  'bar.gif'", tokens.function('url'), tokens.string('bar.gif'));
});

describe('at-keyword token', () => {
  test('@at-keyword', tokens.atKeyword('at-keyword'));
  test('@testing123', tokens.atKeyword('testing123'));
  test('@hello!', tokens.atKeyword('hello'), tokens.delim('!'));
  test('@-text', tokens.atKeyword('-text'));
  test('@--abc', tokens.atKeyword('--abc'));
  test('@--', tokens.atKeyword('--'));
  test('@--11', tokens.atKeyword('--11'));
  test('@---', tokens.atKeyword('---'));
  test('@\\ ', tokens.atKeyword(' '));
  test('@-\\ ', tokens.atKeyword('- '));
  test('@@', tokens.delim('@'), tokens.delim('@'));
  test('@2', tokens.delim('@'), tokens.number(integerType, 2, noSign));
  test('@-1', tokens.delim('@'), tokens.number(integerType, -1, minusSign));
});

describe('url token', () => {
  test('url(foo.gif)', tokens.url('foo.gif'));
  test('urL(https://example.com/cats.png)', tokens.url('https://example.com/cats.png'));
  test('uRl(what-a.crazy^URL~this\\ is!)', tokens.url('what-a.crazy^URL~this is!'));
  test('uRL(123#test)', tokens.url('123#test'));
  test('Url(escapes\\ \\"\\\'\\)\\()', tokens.url('escapes "\')('));
  test('UrL(   whitespace   )', tokens.url('whitespace'));
  test('URl( whitespace-eof ', tokens.url('whitespace-eof'));
  test('url(', tokens.url(''));
  test('URL(eof', tokens.url('eof'));
  test('url(not/*a*/comment)', tokens.url('not/*a*/comment'));
  test('urL()', tokens.url(''));
  test('uRl(white space),', tokens.badUrl(), tokens.comma());
  test('Url(b(ad),', tokens.badUrl(), tokens.comma());
  test("uRl(ba'd):", tokens.badUrl(), tokens.colon());
  test('urL(b"ad):', tokens.badUrl(), tokens.colon());
  test('uRl(b"ad):', tokens.badUrl(), tokens.colon());
  test('Url(b\\\rad):', tokens.badUrl(), tokens.colon());
  test('url(b\\\nad):', tokens.badUrl(), tokens.colon());
  test("url(/*'bad')*/", tokens.badUrl(), tokens.delim('*'), tokens.delim('/'));
  test("url(ba'd\\\\))", tokens.badUrl(), tokens.rightParenthesis());
  test("url(ba'd\\)),", tokens.badUrl(), tokens.comma());

  describe('non-printables', () => {
    test('url(ba\x08d),', tokens.badUrl(), tokens.comma());
    test('url(ba\x0bd),', tokens.badUrl(), tokens.comma());
    test('url(ba\x0ed),', tokens.badUrl(), tokens.comma());
    test('url(ba\x1fd),', tokens.badUrl(), tokens.comma());
    test('url(ba\x7fd),', tokens.badUrl(), tokens.comma());
  });
});

describe('string token', () => {
  test("'text'", tokens.string('text'));
  test('"text"', tokens.string('text'));
  test("'testing, 123!'", tokens.string('testing, 123!'));
  test("'es\\'ca\\\"pe'", tokens.string('es\'ca"pe'));
  test('\'"quotes"\'', tokens.string('"quotes"'));
  test('"\'quotes\'"', tokens.string("'quotes'"));
  test('"mismatch\'', tokens.string("mismatch'"));
  test("'text\u{5}\t\u{13}'", tokens.string('text\u{5}\t\u{13}'));
  test('"end on eof', tokens.string('end on eof'));
  test('"end on eof\\', tokens.string('end on eof'));
  test("'esca\\\nped'", tokens.string('escaped'));
  test('"esc\\\faped"', tokens.string('escaped'));
  test("'new\\\rline'", tokens.string('newline'));
  test('"new\\\r\nline"', tokens.string('newline'));
  test("'bad\nstring", tokens.badString(), tokens.whitespace(), tokens.ident('string'));
  test("'bad\rstring", tokens.badString(), tokens.whitespace(), tokens.ident('string'));
  test("'bad\r\nstring", tokens.badString(), tokens.whitespace(), tokens.ident('string'));
  test("'bad\fstring", tokens.badString(), tokens.whitespace(), tokens.ident('string'));
  test("'\0'", tokens.string(replacement));
  test("'hel\0lo'", tokens.string('hel' + replacement + 'lo'));
  test("'h\\65l\0lo'", tokens.string('hel' + replacement + 'lo'));
});

describe('hash token', () => {
  test('#id-selector', tokens.hash(idType, 'id-selector'));
  test('#FF7700', tokens.hash(idType, 'FF7700'));
  test('#3377FF', tokens.hash(unrestrictedType, '3377FF'));
  test('#\\ ', tokens.hash(idType, ' '));
  test('# ', tokens.delim('#'), tokens.whitespace());
  test('#\\\n', tokens.delim('#'), tokens.delim('\\'), tokens.whitespace());
  test('#\\\r\n', tokens.delim('#'), tokens.delim('\\'), tokens.whitespace());
  test('#!', tokens.delim('#'), tokens.delim('!'));
});

describe('number token', () => {
  test('10', tokens.number(integerType, 10, noSign));
  test('12.0', tokens.number(numberType, 12, noSign));
  test('+45.6', tokens.number(numberType, 45.6, plusSign));
  test('-7', tokens.number(integerType, -7, minusSign));
  test('010', tokens.number(integerType, 10, noSign));
  test('10e0', tokens.number(numberType, 10, noSign));
  test('12e3', tokens.number(numberType, 12000, noSign));
  test('3e+1', tokens.number(numberType, 30, noSign));
  test('12E-1', tokens.number(numberType, 1.2, noSign));
  test('.7', tokens.number(numberType, 0.7, noSign));
  test('-.3', tokens.number(numberType, -0.3, minusSign));
  test('+637.54e-2', tokens.number(numberType, 6.3754, plusSign));
  test('-12.34E+2', tokens.number(numberType, -1234, minusSign));
  test('+ 5', tokens.delim('+'), tokens.whitespace(), tokens.number(integerType, 5, noSign));
  test('-+12', tokens.delim('-'), tokens.number(integerType, 12, plusSign));
  test('+-21', tokens.delim('+'), tokens.number(integerType, -21, minusSign));
  test('++22', tokens.delim('+'), tokens.number(integerType, 22, plusSign));
  test('13.', tokens.number(integerType, 13, noSign), tokens.delim('.'));
  test('1.e2', tokens.number(integerType, 1, noSign), tokens.delim('.'), tokens.ident('e2'));
  test('2e3.5', tokens.number(numberType, 2000, noSign), tokens.number(numberType, 0.5, noSign));
  test('2e3.', tokens.number(numberType, 2000, noSign), tokens.delim('.'));
  test('1000000000000000000000000', tokens.number(integerType, 1e24, noSign));
});

describe('dimension token', () => {
  test('10px', tokens.dimension(integerType, 10, 'px'));
  test('12.0em', tokens.dimension(numberType, 12, 'em'));
  test('-12.0em', tokens.dimension(numberType, -12, 'em'));
  test('+45.6__qem', tokens.dimension(numberType, 45.6, '__qem'));
  test('5e', tokens.dimension(integerType, 5, 'e'));
  test('5px-2px', tokens.dimension(integerType, 5, 'px-2px'));
  test('5e-', tokens.dimension(integerType, 5, 'e-'));
  test('5\\ ', tokens.dimension(integerType, 5, ' '));
  test('40\\70\\78', tokens.dimension(integerType, 40, 'px'));
  test('4e3e2', tokens.dimension(numberType, 4000, 'e2'));
  test('0x10px', tokens.dimension(integerType, 0, 'x10px'));
  test('4unit ', tokens.dimension(integerType, 4, 'unit'), tokens.whitespace());
  test('4unit(', tokens.dimension(integerType, 4, 'unit'), tokens.leftParenthesis());
  test('5e+', tokens.dimension(integerType, 5, 'e'), tokens.delim('+'));
  test('2e.5', tokens.dimension(integerType, 2, 'e'), tokens.number(numberType, 0.5, noSign));
  test('2e+.5', tokens.dimension(integerType, 2, 'e'), tokens.number(numberType, 0.5, plusSign));
});

describe('percentage token', () => {
  test('10%', tokens.percentage(integerType, 10));
  test('+12.0%', tokens.percentage(numberType, 12));
  test('-48.99%', tokens.percentage(numberType, -48.99));
  test('6e-1%', tokens.percentage(numberType, 0.6));
  test('5%%', tokens.percentage(integerType, 5), tokens.delim('%'));
});

describe('comment token', () => {
  test('/*comment*/a', tokens.ident('a'));
  test('/**\\2f**//', tokens.delim('/'));
  test('/**y*a*y**/ ', tokens.whitespace());
  test(',/* \n :) \n */)', tokens.comma(), tokens.rightParenthesis());
  test(':/*/*/', tokens.colon());
  test('/**/*', tokens.delim('*'));
  test(';/******', tokens.semicolon());
});
