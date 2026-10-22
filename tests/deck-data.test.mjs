import test from 'node:test';
import assert from 'node:assert/strict';
import './test-setup.mjs';
import { validateCard } from '../src/lib/server/deck-data.ts';

test('validateCard accepts valid front and back', () => {
  const result = validateCard('Front text', 'Back text');
  assert.equal('error' in result, false);
  assert.equal(result.front, 'Front text');
  assert.equal(result.back, 'Back text');
});

test('validateCard trims front and back', () => {
  const result = validateCard('  Front  ', '  Back  ');
  assert.equal('error' in result, false);
  assert.equal(result.front, 'Front');
  assert.equal(result.back, 'Back');
});

test('validateCard rejects invalid front (empty)', () => {
  const result = validateCard('', 'Back text');
  assert.equal('error' in result, true);
  assert.equal(result.error, 'Text cannot be empty');
});

test('validateCard rejects invalid front (whitespace only)', () => {
  const result = validateCard('   ', 'Back text');
  assert.equal('error' in result, true);
  assert.equal(result.error, 'Text cannot be empty');
});

test('validateCard rejects invalid front (too long)', () => {
  const result = validateCard('x'.repeat(501), 'Back text');
  assert.equal('error' in result, true);
  assert.equal(result.error, 'Text too long (max 500 characters)');
});

test('validateCard rejects invalid front (non-string)', () => {
  for (const value of [null, undefined, 123, {}, []]) {
    const result = validateCard(value, 'Back text');
    assert.equal('error' in result, true);
    assert.equal(result.error, 'Text must be a string');
  }
});

test('validateCard rejects invalid back (empty)', () => {
  const result = validateCard('Front text', '');
  assert.equal('error' in result, true);
  assert.equal(result.error, 'Text cannot be empty');
});

test('validateCard rejects invalid back (too long)', () => {
  const result = validateCard('Front text', 'x'.repeat(501));
  assert.equal('error' in result, true);
  assert.equal(result.error, 'Text too long (max 500 characters)');
});

test('validateCard handles Unicode correctly', () => {
  const result = validateCard('😀 Café', '中文 español');
  assert.equal('error' in result, false);
  assert.equal(result.front, '😀 Café');
  assert.equal(result.back, '中文 español');
});

test('validateCard returns first error (front validated first)', () => {
  const result = validateCard('', 'x'.repeat(501));
  assert.equal('error' in result, true);
  // Front is validated first, so we get front error
  assert.equal(result.error, 'Text cannot be empty');
});