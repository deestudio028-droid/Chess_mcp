import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  
  const moves = await page.evaluate(() => {
    const activeMove = document.querySelector('move.active');
    
    // If we're in a study chapter and have an active move path
    if (activeMove && activeMove.hasAttribute('p')) {
      const activeP = activeMove.getAttribute('p')!;
      const result = [];
      for (let i = 2; i <= activeP.length; i += 2) {
        const p = activeP.substring(0, i);
        const moveEl = document.querySelector(`move[p="${p}"]`);
        if (moveEl) {
          let text = moveEl.textContent;
          if (text) {
            text = text.replace(/^\d*\.+/, '').trim();
            if (text && text !== '...') result.push(text);
          }
        }
      }
      return result;
    }
    
    // Fallback
    const moveElements = document.querySelectorAll('u8, move');
    const result = [];
    for (let i = 0; i < moveElements.length; i++) {
      let text = moveElements[i].textContent;
      if (text) {
        text = text.replace(/^\d*\.+/, '').trim();
        if (text && text !== '...') {
          result.push(text);
        }
      }
    }
    return result;
  });
  
  console.log("Parsed moves:", moves);
  await browser.close();
})();
