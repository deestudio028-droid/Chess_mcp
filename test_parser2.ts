import { chromium } from 'playwright';

(async () => {
  const html = `
    <html>
      <body>
        <div class="analyse__moves areplay">
          <div>
            <div class="tview2 tview2-column">
              <index>1</index>
              <move p=".6"><san>d3</san></move>
              <move class="empty">...</move>
              <interrupt class="anchor">
                <lines>
                  <line>
                    <branch></branch>
                    <move class="active" p="/?"><index>1.</index><san>e4</san></move>
                  </line>
                </lines>
              </interrupt>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  
  const moves = await page.evaluate(() => {
    const activeMove = document.querySelector('move.active');
    
    // If we're in a study chapter and have an active move path
    if (activeMove && activeMove.hasAttribute('p')) {
      const activeP = activeMove.getAttribute('p')!;
      const result = [];
      // Lichess paths are chunks of 2 characters (e.g. '.>', '.>VF', '.>VF/?')
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
    
    // Fallback for live games or simple move lists without paths
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
