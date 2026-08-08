import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  await page.waitForTimeout(1000);
  
  const boxes = await page.evaluate(() => {
    const wrap = document.querySelector('.cg-wrap');
    const container = document.querySelector('cg-container');
    const board = document.querySelector('cg-board');
    
    return {
      wrap: wrap ? wrap.getBoundingClientRect() : null,
      container: container ? container.getBoundingClientRect() : null,
      board: board ? board.getBoundingClientRect() : null,
    };
  });
  
  console.log("Boxes:", boxes);
  await browser.close();
})();
