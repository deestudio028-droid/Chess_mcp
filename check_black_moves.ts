import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to the study
  await page.goto('https://lichess.org/study/hTVr9GYu/pU41mwLF');
  await page.waitForSelector('cg-board');
  
  // Make a move for white
  const board = await page.$('cg-board');
  const rect = await board!.boundingBox();
  const squareWidth = rect!.width / 8;
  const squareHeight = rect!.height / 8;
  
  // d2 to d4
  await page.mouse.click(rect!.x + 3 * squareWidth + squareWidth / 2, rect!.y + 6 * squareHeight + squareHeight / 2);
  await page.waitForTimeout(200);
  await page.mouse.click(rect!.x + 3 * squareWidth + squareWidth / 2, rect!.y + 4 * squareHeight + squareHeight / 2);
  
  await page.waitForTimeout(1000);
  
  // Make a move for black
  // d7 to d5
  await page.mouse.click(rect!.x + 3 * squareWidth + squareWidth / 2, rect!.y + 1 * squareHeight + squareHeight / 2);
  await page.waitForTimeout(200);
  await page.mouse.click(rect!.x + 3 * squareWidth + squareWidth / 2, rect!.y + 3 * squareHeight + squareHeight / 2);
  
  await page.waitForTimeout(1000);

  const moves = await page.evaluate(() => {
    const moveElements = document.querySelectorAll('u8, move');
    const result = [];
    for (let i = 0; i < moveElements.length; i++) {
      result.push(moveElements[i].textContent);
    }
    return result;
  });
  
  console.log("Moves text:", moves);
  
  await browser.close();
})();
