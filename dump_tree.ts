import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  
  const treeHtml = await page.evaluate(() => {
    // Find the container that holds the moves.
    // Lichess usually uses <l4x> or something inside the study panel.
    const container = document.querySelector('t-wrapper, l4x, div.tview2, .study__multiboard');
    return container ? container.outerHTML : document.body.innerHTML;
  });
  
  console.log(treeHtml.substring(0, 5000));
  
  await browser.close();
})();
