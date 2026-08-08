
import { chromium } from 'playwright';

async function run() {
  const b1 = await chromium.launch({ headless: true });
  const p1 = await b1.newPage();
  await p1.goto('https://plainchess.timwoelfle.de');
  await p1.fill('#hostGameName', 'e2e-test-game-1');
  await p1.click('#hostGame input[type=button]');
  await p1.waitForTimeout(2000);
  const link = await p1.evaluate(() => {
    const el = document.querySelector('#link input[type=text]') as HTMLInputElement;
    return el ? el.value : 'no link found';
  });
  console.log('Player 1 link:', link);
  
  const b2 = await chromium.launch({ headless: true });
  const p2 = await b2.newPage();
  await p2.goto(link !== 'no link found' ? link : 'https://plainchess.timwoelfle.de');
  if (link === 'no link found') {
    await p2.fill('#joinGameName', 'e2e-test-game-1');
    await p2.click('#joinGame input[type=button]');
  }
  await p2.waitForTimeout(2000);
  const board = await p2.evaluate(() => !!document.querySelector('table#board'));
  console.log('Player 2 board:', board);
  await b1.close();
  await b2.close();
}

run();

