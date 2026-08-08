import { chromium } from 'playwright';
import { Chess } from 'chess.js';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  await page.waitForTimeout(1000);
  
  const board = await page.$('cg-board');
  const rect = await board!.boundingBox();
  
  const isWhiteBottom = await page.evaluate(() => {
    const wrap = document.querySelector('.cg-wrap');
    return wrap ? !wrap.classList.contains('orientation-black') : true;
  });
  
  function getSquarePos(sq: string) {
    const file = sq.charCodeAt(0) - 97; // 'a' -> 0, 'h' -> 7
    const rank = sq.charCodeAt(1) - 49; // '1' -> 0, '8' -> 7
    
    const fileIndex = isWhiteBottom ? file : 7 - file;
    const rankIndex = isWhiteBottom ? 7 - rank : rank;
    
    const squareWidth = rect!.width / 8;
    const squareHeight = rect!.height / 8;
    
    const x = rect!.x + fileIndex * squareWidth + squareWidth / 2;
    const y = rect!.y + rankIndex * squareHeight + squareHeight / 2;
    return { x, y };
  }
  
  async function makeMove(from: string, to: string) {
      const fromPos = getSquarePos(from);
      const toPos = getSquarePos(to);
      
      // Move mouse to the piece and click it
      await page.mouse.move(fromPos.x, fromPos.y);
      await page.mouse.click(fromPos.x, fromPos.y, { delay: 150 });
      
      // Wait for Lichess to highlight the piece and show valid move dots
      await page.waitForTimeout(500); 
      
      // Move mouse to destination and click
      await page.mouse.move(toPos.x, toPos.y);
      await page.mouse.click(toPos.x, toPos.y, { delay: 150 });
      
      // Give Lichess a moment to process the move
      await page.waitForTimeout(200);
  }
  
  // Make some moves to reach the state: e4 e5 Nf3
  await makeMove('e2', 'e4');
  await page.waitForTimeout(500);
  await makeMove('e7', 'e5');
  await page.waitForTimeout(500);
  await makeMove('g1', 'f3');
  await page.waitForTimeout(500);
  
  // Now try the failing move: Nc6 (b8 to c6)
  await makeMove('b8', 'c6');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'scratch/click_result.png' });
  console.log("Saved click_result.png");
  
  await browser.close();
})();
