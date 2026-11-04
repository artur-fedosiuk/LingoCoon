import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFlashcardText } from '../src/lib/validation.ts';

test('validateFlashcardText accepts valid non-empty string', () => {
  const result = validateFlashcardText('Hello world');
  assert.equal(result.isValid, true);
  assert.equal(result.value, 'Hello world');
});

test('validateFlashcardText trims whitespace', () => {
  const result = validateFlashcardText('  Hello world  ');
  assert.equal(result.isValid, true);
  assert.equal(result.value, 'Hello world');
});

test('validateFlashcardText accepts string at max length (500)', () => {
  const result = validateFlashcardText('x'.repeat(500));
  assert.equal(result.isValid, true);
  assert.equal(result.value.length, 500);
});

test('validateFlashcardText rejects non-string input', () => {
  for (const value of [null, undefined, 123, {}, [], true, false]) {
    const result = validateFlashcardText(value);
    assert.equal(result.isValid, false);
    assert.equal(result.error, 'Text must be a string');
  }
});

test('validateFlashcardText rejects empty string', () => {
  const result = validateFlashcardText('');
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Text cannot be empty');
});

test('validateFlashcardText rejects whitespace-only string', () => {
  for (const value of [' ', '\t', '\n', '   \t\n   ']) {
    const result = validateFlashcardText(value);
    assert.equal(result.isValid, false);
    assert.equal(result.error, 'Text cannot be empty');
  }
});

test('validateFlashcardText rejects string exceeding max length', () => {
  for (const length of [501, 1000, 10000]) {
    const result = validateFlashcardText('x'.repeat(length));
    assert.equal(result.isValid, false);
    assert.equal(result.error, 'Text too long (max 500 characters)');
  }
});

test('validateFlashcardText handles Unicode correctly', () => {
  const unicodeText = '😀 Café naïve résumé 中文 español';
  const result = validateFlashcardText(unicodeText);
  assert.equal(result.isValid, true);
  assert.equal(result.value, unicodeText.trim());
});

test('validateFlashcardText handles Unicode at boundary', () => {
  // 500 Unicode characters
  const text = 'あ'.repeat(500);
  const result = validateFlashcardText(text);
  assert.equal(result.isValid, true);
  assert.equal(result.value.length, 500);

  // 501 Unicode characters
  const textLong = 'あ'.repeat(501);
  const resultLong = validateFlashcardText(textLong);
  assert.equal(resultLong.isValid, false);
});