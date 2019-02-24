'use strict';

const CssSyntaxError = require('./CssSyntaxError');
const { urange } = require('./entities');
const parseUrange = require('./parseUrange');

function test(source, expected) {
  it(source, () => {
    const urange = parseUrange(source);
    expect(urange).toEqual(expected);
  });
}

test.throws = source => {
  it(source, () => {
    expect(() => {
      parseUrange(source);
    }).toThrow(CssSyntaxError);
  });
};

describe('unicode range token', () => {
  test('u+0-10ffff', urange(0, 0x10ffff));
  test('U+1234-2345', urange(0x1234, 0x2345));
  test('u+000000-000000', urange(0, 0));
  test('U+CafE-d00D', urange(0xcafe, 0xd00d));
  test('U+2??', urange(0x200, 0x2ff));
  test('u+??', urange(0x00, 0xff));
  test('u+10????', urange(0x100000, 0x10ffff));

  test('', null);
  test('empty', null);
  test('uuu', null);
  test('u+', null);
  test('u+z', null);
  test('u+0+1', null);
  test('u+0000000-000000', null);
  test('u+000000-0000000', null);
  test('u+cake', null);
  test('u+1234-gggg', null);
  test('u+?-1', null);
  test('u+1??2', null);
  test('u+-0', null);

  test.throws('u+110000');
  test.throws('u+0-110000');
  test.throws('u+123456');
  test.throws('u+1-0');
  test.throws('u+10ffff-0');
  test.throws('u+??????');
  test.throws('u+11????');
});
