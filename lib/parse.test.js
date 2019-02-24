'use strict';

const { createTag, source, trimResultTransformer } = require('common-tags');

const CssSyntaxError = require('./CssSyntaxError');
const {
  parseCommaSeparatedListOfComponentValues,
  parseComponentValue,
  parseDeclaration,
  parseListOfComponentValues,
  parseListOfDeclarations,
  parseListOfRules,
  parseRule,
  parseStylesheet,
} = require('./parse');

const styles = createTag(source, trimResultTransformer('end'));

function getTester(parsingFunction) {
  const fn = (name, source) => {
    it(name, () => {
      expect(parsingFunction(source)).toMatchSnapshot();
    });
  };
  fn.throws = (name, source) => {
    it(name, () => {
      expect(() => {
        parsingFunction(source);
      }).toThrow(CssSyntaxError);
    });
  };
  return fn;
}

describe('parse a stylesheet', () => {
  const test = getTester(parseStylesheet);

  test('nothing', '');
  test('whitespace', '');
  test(
    'qualified rule',
    styles`
      p > a {
        color: blue;
        background-image: url( https://example.com/background );
        content: "some text";
        transform: translate( 50% );
      }
    `,
  );
  test(
    'import rule',
    styles`
      @import 'my-styles.css';
    `,
  );
  test(
    'page rule',
    styles`
      @page :left {
        color: blue;
        background-image: url( https://example.com/background );
        content: "some text";
        transform: translate( 50% );
      }
    `,
  );
  test(
    'media rule',
    styles`
      @media print {
        body {
          color: blue;
          background-image: url( https://example.com/background );
          content: "some text";
          transform: translate( 50% );
        }
      }
    `,
  );
  test(
    'two at-rules',
    styles`
      @import 'my-styles.css';
      @import 'my-styles.css';
    `,
  );
  test(
    'two qualified rules',
    styles`
      p > a {
        color: blue;
      }
      p > a {
        color: blue;
      }
    `,
  );
  test('cdo and cdc', '<!-- whatever -->');
  test(
    'cdo and cdc in between rules',
    styles`
      @import 'my-styles.css';
      <!-- whatever -->
      p > a {
        color: blue;
      }
    `,
  );
});

describe('parse a rule', () => {
  const test = getTester(parseRule);

  test(
    'qualified rule',
    styles`
      p > a {
        color: blue;
        background-image: url( https://example.com/background );
        content: "some text";
        transform: translate( 50% );
      }
    `,
  );
  test(
    'import rule',
    styles`
      @import 'my-styles.css';
    `,
  );
  test(
    'page rule',
    styles`
      @page :left {
        color: blue;
        background-image: url( https://example.com/background );
        content: "some text";
        transform: translate( 50% );
      }
    `,
  );
  test(
    'media rule',
    styles`
      @media print {
        body {
          color: blue;
          background-image: url( https://example.com/background );
          content: "some text";
          transform: translate( 50% );
        }
      }
    `,
  );
  test('confusing collision', 'u+a{color:green;}');

  test.throws('nothing', '');
  test.throws('whitespace', '');
  test.throws(
    'two at-rules',
    styles`
      @import 'my-styles.css';
      @import 'my-styles.css';
    `,
  );
  test.throws(
    'two qualified rules',
    styles`
      p > a {
        color: blue;
      }
      p > a {
        color: blue;
      }
    `,
  );
});

describe('parse a list of rules', () => {
  const test = getTester(parseListOfRules);

  test('nothing', '');
  test('whitespace', '');
  test(
    'qualified rule',
    styles`
      p > a {
        color: blue;
        background-image: url( https://example.com/background );
        content: "some text";
        transform: translate( 50% );
      }
    `,
  );
  test(
    'import rule',
    styles`
      @import 'my-styles.css';
    `,
  );
  test(
    'page rule',
    styles`
      @page :left {
        color: blue;
        background-image: url( https://example.com/background );
        content: "some text";
        transform: translate( 50% );
      }
    `,
  );
  test(
    'media rule',
    styles`
      @media print {
        body {
          color: blue;
          background-image: url( https://example.com/background );
          content: "some text";
          transform: translate( 50% );
        }
      }
    `,
  );
  test(
    'two at-rules',
    styles`
      @import 'my-styles.css';
      @import 'my-styles.css';
    `,
  );
  test(
    'two qualified rules',
    styles`
      p > a {
        color: blue;
      }
      p > a {
        color: blue;
      }
    `,
  );
  test('cdo and cdc', '<!-- whatever -->');
  test(
    'cdo and cdc in between rules',
    styles`
      @import 'my-styles.css';
      <!-- whatever -->
      p > a {
        color: blue;
      }
    `,
  );
});

describe('parse a declaration', () => {
  const test = getTester(parseDeclaration);

  test('ident declaration', 'color: blue');
  test('url declaration', 'background-image: url( https://example.com/background )');
  test('string declaration', 'content: "some text"');
  test('func declaration', 'transform: translate( 50% )');
  test('ident declaration (important)', 'color: blue !important');
  test(
    'url declaration (important)',
    'background-image: url( https://example.com/background ) !important',
  );
  test('string declaration (important)', 'content: "some text" !important');
  test('func declaration (important)', 'transform: translate( 50% ) !important');

  test.throws('nothing', '');
  test.throws('whitespace', ' ');
  test.throws('missing colon', 'left 42px');
  test.throws('missing colon (important)', 'left 42px');
});

describe('parse a list of declarations', () => {
  const test = getTester(parseListOfDeclarations);

  test('nothing', '');
  test('whitespace', ' ');
  test('just a semicolon', ';');
  test('a single declaration', 'color: blue');
  test('a single declaration preceeded by a semicolon and whitespace', ' ; color: blue');
  test('a single declaration succeeded by a semicolon and whitespace', 'color: blue; ');
  test(
    'multiple declarations',
    styles`
      color: blue;
      background-image: url( https://example.com/background );
      content: "some text";
      transform: translate( 50% );
    `,
  );
  test('a declaration with an error', 'left 42px');
  test(
    'multiple declarations and a declaration with an error',
    styles`
      color: blue;
      background-image: url( https://example.com/background );
      left 42px;
      content: "some text";
      transform: translate( 50% );
    `,
  );
  test(
    'declarations and an at-rule',
    styles`
      color: blue;
      background-image: url( https://example.com/background );
      content: "some text";
      transform: translate( 50% );

      @media (max-width: 420px) {
        content: "other text";
        left 42px;
        right: 42px;
      }
    `,
  );
  test('a declaration with a semicolon', 'a: (;)');
  test('an unfinished declaration with a semicolon', 'a: (;');
  test('a hash token', '#deadbeef color: blue');
  test('a hash token and a declaration', '#deadbeef color: blue; border: none');
  test('an unclosed block', '{ border: none');
  test('a block', '{ border: none }');
});

describe('parse a component value', () => {
  const test = getTester(parseComponentValue);

  test('ident value', 'blue');
  test('url value', 'url( https://example.com/background )');
  test('string value', '"some text"');
  test('func value', 'translate( 50% )');

  test.throws('nothing', '');
  test.throws('whitespace', ' ');
  test.throws('extra value', 'blue red');
});

describe('parse a list of component values', () => {
  const test = getTester(parseListOfComponentValues);

  test('nothing', '');
  test('whitespace', ' ');
  test('a colon', ':');
  test('ident value', 'blue');
  test('url value', 'url( https://example.com/background )');
  test('string value', '"some text"');
  test('func value', 'translate( 50% )');
  test('extra value', 'blue red');
  test(
    'multiple values',
    'blue url( https://example.com/background ) "some text" translate( 50% )',
  );
});

describe('parse a comma-separated list of component values', () => {
  const test = getTester(parseCommaSeparatedListOfComponentValues);

  test('nothing', '');
  test('whitespace', ' ');
  test('a comma', ',');
  test('ident value', 'blue');
  test('url value', 'url( https://example.com/background )');
  test('string value', '"some text"');
  test('func value', 'translate( 50% )');
  test('extra value', 'blue red');
  test('extra value with a comma', 'blue,red');
  test('a comma at the beginning', ',blue,red');
  test('a comma at the end', 'blue,red,');
  test(
    'multiple values',
    'blue, url( https://example.com/background ), "some text", translate( 50% )',
  );
});
