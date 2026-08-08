import { describe, it, expect } from 'vitest';
import { Result, success, failure } from '../../src/shared/Result.js';

describe('Result Pattern', () => {
  it('should create a success result', () => {
    const res = success(42);
    expect(res.isSuccess).toBe(true);
    expect(res.isFailure).toBe(false);
    if (res.isSuccess) {
      expect(res.value).toBe(42);
    }
  });

  it('should create a failure result', () => {
    const err = new Error('Test Error');
    const res = failure(err);
    expect(res.isFailure).toBe(true);
    expect(res.isSuccess).toBe(false);
    if (res.isFailure) {
      expect(res.error).toBe(err);
    }
  });
});
