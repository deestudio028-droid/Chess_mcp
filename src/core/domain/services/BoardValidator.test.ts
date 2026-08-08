import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Board } from '../entities/Board.js';
import { BoardValidator } from './BoardValidator.js';
import { Square, Piece } from '../entities/Piece.js';

describe('BoardValidator', () => {
  it('should pass a valid starting board', () => {
    const state = {} as Record<Square, Piece | null>;
    for (const sq of ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1']) state[sq as Square] = { color: 'w', type: sq === 'e1' ? 'k' : 'r' };
    for (const sq of ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2']) state[sq as Square] = { color: 'w', type: 'p' };
    for (const sq of ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8']) state[sq as Square] = { color: 'b', type: sq === 'e8' ? 'k' : 'r' };
    for (const sq of ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7']) state[sq as Square] = { color: 'b', type: 'p' };
    
    // Fill empty
    const ranks = ['6', '5', '4', '3'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for(const r of ranks) {
      for(const f of files) {
        state[`${f}${r}` as Square] = null;
      }
    }

    const board = new Board(state, 'white');
    const res = BoardValidator.validate(board);
    expect(res.isSuccess).toBe(true);
  });

  it('should fail if missing kings', () => {
    const board = Board.createEmpty('white');
    const res = BoardValidator.validate(board);
    expect(res.isFailure).toBe(true);
    if(res.isFailure) {
      expect(res.error.message).toContain('Invalid number of white kings');
    }
  });

  it('should fail if pawns on 1st rank', () => {
    const state = {} as Record<Square, Piece | null>;
    for(const k in Board.createEmpty().state) state[k as Square] = null;
    state['e1'] = { color: 'w', type: 'k' };
    state['e8'] = { color: 'b', type: 'k' };
    state['a1'] = { color: 'w', type: 'p' }; // Invalid

    const board = new Board(state, 'white');
    const res = BoardValidator.validate(board);
    expect(res.isFailure).toBe(true);
    if(res.isFailure) {
      expect(res.error.message).toContain('Pawns cannot be on the 1st or 8th rank');
    }
  });
});
