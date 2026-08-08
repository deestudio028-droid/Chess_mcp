import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  
  // Make a few moves for white and black
  const board = await page.$('cg-board');
  const rect = await board!.boundingBox();
  const squareWidth = rect!.width / 8;
  const squareHeight = rect!.height / 8;
  
  const clickSquare = async (file: number, rank: number) => { // rank 0=1, 7=8
    await page.mouse.click(rect!.x + file * squareWidth + squareWidth / 2, rect!.y + (7 - rank) * squareHeight + squareHeight / 2);
    await page.waitForTimeout(200);
  };
  
  // White d2 to d4
  await clickSquare(3, 1);
  await clickSquare(3, 3);
  await page.waitForTimeout(500);
  
  // Black d7 to d5
  await clickSquare(3, 6);
  await clickSquare(3, 4);
  await page.waitForTimeout(500);
  
  // White e2 to e4 (Gambit)
  await clickSquare(4, 1);
  await clickSquare(4, 3);
  await page.waitForTimeout(500);

  // Black d5xe4
  await clickSquare(3, 4);
  await clickSquare(4, 3);
  await page.waitForTimeout(500);

  const movesHtml = await page.evaluate(() => {
    return document.querySelector('rm6, t-wrapper, l4x')?.outerHTML || "No wrapper found";
  });
  
  const moveNodes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('u8, move')).map(el => ({
      tag: el.tagName,
      text: el.textContent,
      html: el.innerHTML
    }));
  });
  
  console.log("HTML:", movesHtml);
  console.log("Nodes:", moveNodes);
  
  await browser.close();
})();
