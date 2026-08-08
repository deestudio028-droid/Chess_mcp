import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  await page.waitForTimeout(2000);
  
  const fenResult = await page.evaluate(() => {
    const board = document.querySelector('cg-board');
    const wrap = document.querySelector('.cg-wrap');
    if (!board || !wrap) return null;
    
    const isWhiteBottom = !wrap.classList.contains('orientation-black');
    const boardWidth = board.getBoundingClientRect().width;
    const sqSize = boardWidth / 8;
    
    // Create an 8x8 grid: board8x8[rankIndex][fileIndex] where rankIndex 0 is rank 8, 7 is rank 1
    const grid: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    const pieceMap: Record<string, string> = {
      'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k'
    };
    
    const pieces = Array.from(board.querySelectorAll('piece'));
    for (const p of pieces) {
      const classes = p.className.split(' ');
      const color = classes.includes('white') ? 'w' : 'b';
      const typeStr = classes.find(c => ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].includes(c));
      if (!typeStr) continue;
      
      const char = color === 'w' ? pieceMap[typeStr].toUpperCase() : pieceMap[typeStr].toLowerCase();
      
      const style = p.getAttribute('style') || '';
      const match = style.match(/translate\(\s*(-?\d+(?:\.\d+)?)\s*px\s*,\s*(-?\d+(?:\.\d+)?)\s*px\s*\)/);
      if (!match) continue;
      
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      
      let col = Math.round(x / sqSize);
      let row = Math.round(y / sqSize);
      
      if (!isWhiteBottom) {
        col = 7 - col;
        row = 7 - row;
      }
      
      grid[row][col] = char;
    }
    
    // Convert 8x8 grid to FEN position string (first part of FEN)
    const fenRanks = [];
    for (let r = 0; r < 8; r++) {
      let rankStr = '';
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const cell = grid[r][c];
        if (cell === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rankStr += emptyCount;
            emptyCount = 0;
          }
          rankStr += cell;
        }
      }
      if (emptyCount > 0) rankStr += emptyCount;
      fenRanks.push(rankStr);
    }
    
    return {
      fenBoard: fenRanks.join('/'),
      isWhiteBottom
    };
  });
  
  console.log("Direct FEN Result:", fenResult);
  await browser.close();
})();
