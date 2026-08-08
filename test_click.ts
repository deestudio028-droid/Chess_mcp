import { chromium } from 'playwright';

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
  
  console.log("Is White Bottom?", isWhiteBottom);
  
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
  
  const b8 = getSquarePos('b8');
  const c6 = getSquarePos('c6');
  
  console.log(`b8: x=${b8.x}, y=${b8.y}`);
  console.log(`c6: x=${c6.x}, y=${c6.y}`);
  
  // Inject red dots at these coordinates to visualize where Playwright will click
  await page.evaluate(({ b8, c6 }) => {
    const d1 = document.createElement('div');
    d1.style.position = 'absolute';
    d1.style.left = b8.x + 'px';
    d1.style.top = b8.y + 'px';
    d1.style.width = '10px';
    d1.style.height = '10px';
    d1.style.backgroundColor = 'red';
    d1.style.borderRadius = '50%';
    d1.style.zIndex = '999999';
    d1.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(d1);
    
    const d2 = document.createElement('div');
    d2.style.position = 'absolute';
    d2.style.left = c6.x + 'px';
    d2.style.top = c6.y + 'px';
    d2.style.width = '10px';
    d2.style.height = '10px';
    d2.style.backgroundColor = 'blue';
    d2.style.borderRadius = '50%';
    d2.style.zIndex = '999999';
    d2.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(d2);
  }, { b8, c6 });
  
  await page.screenshot({ path: 'scratch/click_debug.png' });
  console.log("Saved click_debug.png");
  
  await browser.close();
})();
