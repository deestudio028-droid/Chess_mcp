import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/tv'); // Lichess TV to see a live game
  await page.waitForSelector('cg-board');
  await page.waitForTimeout(1000);
  
  const treeHtml = await page.evaluate(() => {
    const container = document.querySelector('rm6, l4x');
    return container ? container.outerHTML : document.body.innerHTML;
  });
  
  console.log(treeHtml.substring(0, 5000));
  
  await browser.close();
})();
