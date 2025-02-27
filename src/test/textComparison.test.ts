import { compareTexts } from '../utils/textComparison';

describe('compareTexts', () => {
  it('finds common words between two texts', () => {
    const text1 = 'hello world test';
    const text2 = 'hello there test case';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['hello', 'test']));
  });

  it('handles empty texts', () => {
    expect(compareTexts('', '')).toEqual(new Set());
    expect(compareTexts('hello', '')).toEqual(new Set());
    expect(compareTexts('', 'world')).toEqual(new Set());
  });

  it('is case insensitive', () => {
    const text1 = 'Hello World';
    const text2 = 'hello there WORLD';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['hello', 'world']));
  });

  it('handles punctuation and special characters', () => {
    const text1 = 'hello, world! How are you?';
    const text2 = 'Hello... World: testing!';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['hello', 'world']));
  });

  it('handles multiple occurrences of words', () => {
    const text1 = 'hello hello world world';
    const text2 = 'hello there world';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['hello', 'world']));
  });

  it('handles whitespace correctly', () => {
    const text1 = '  hello   world  ';
    const text2 = 'hello\tworld\n';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['hello', 'world']));
  });

  it('handles non-word characters between words', () => {
    const text1 = 'hello-world test_case';
    const text2 = 'hello world testcase';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['hello', 'world']));
  });

  it('handles very large texts', () => {
    const word = 'test'.repeat(1000);
    const text1 = `hello ${word} world`;
    const text2 = `hi ${word} there`;
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['test']));
  });

  it('handles unicode characters', () => {
    const text1 = 'hello 世界 world';
    const text2 = 'hi world 世界';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['world', '世界']));
  });

  it('ignores numbers as standalone words', () => {
    const text1 = 'test 123 world';
    const text2 = '123 test 456';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['test']));
  });

  it('handles words with numbers', () => {
    const text1 = 'hello world2 test3';
    const text2 = 'hi world2 there';
    const result = compareTexts(text1, text2);
    expect(result).toEqual(new Set(['world2']));
  });
}); 