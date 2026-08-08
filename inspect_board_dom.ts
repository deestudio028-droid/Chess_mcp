import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  await page.waitForTimeout(2000);
  
  const boardInfo = await page.evaluate(() => {
    const board = document.querySelector('cg-board');
    if (!board) return null;
    
    const pieces = Array.from(board.querySelectorAll('piece')).map(p => ({
      className: p.className,
      style: p.getAttribute('style'),
      cgKey: p.getAttribute('cg-key') // Chessground sometimes attaches key or coords
    }));
    
    // Check if chessground instance or lichess state exists on window
    const windowKeys = Object.keys(window).filter(k => k.toLowerCase().includes('lichess') || k.toLowerCase().includes('chessground'));
    
    return {
      pieces,
      innerHTML: board.innerHTML,
      orientation: document.querySelector('.cg-wrap')?.className
    };
  });
  
  console.log("Board Info:", JSON.stringify(boardInfo, null, 2));
  await browser.close();
})();
