import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  
  const moves = await page.evaluate(() => {
    const moveElements = document.querySelectorAll('u8, move');
    const result = [];
    for (let i = 0; i < moveElements.length; i++) {
      result.push(moveElements[i].outerHTML);
    }
    return result;
  });
  
  console.log("Raw Move Elements:");
  console.log(moves);
  
  await browser.close();
})();
