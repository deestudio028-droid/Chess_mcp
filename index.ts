import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Chess } from "chess.js";
import { chromium, Browser, Page } from "playwright";

let browser: Browser | null = null;
let page: Page | null = null;
let game = new Chess();

async function updateInternalBoard() {
  if (!page) throw new Error("Browser is not launched. Call launch_lichess first.");
  
  const fenResult = await page.evaluate(() => {
    const board = document.querySelector('cg-board');
    const wrap = document.querySelector('.cg-wrap');
    if (!board || !wrap) return null;
    
    const isWhiteBottom = !wrap.classList.contains('orientation-black');
    const boardWidth = board.getBoundingClientRect().width;
    const sqSize = boardWidth / 8;
    
    // Create an 8x8 grid: board8x8[rankIndex][fileIndex] where rankIndex 0 is rank 8, 7 is rank 1
    const grid: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    const pieceMap: Record<string, string> = {
      'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k'
    };
    
    const pieces = Array.from(board.querySelectorAll('piece'));
    for (const p of pieces) {
      const classes = p.className.split(' ');
      const color = classes.includes('white') ? 'w' : 'b';
      const typeStr = classes.find(c => ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].includes(c));
      if (!typeStr) continue;
      
      const char = color === 'w' ? pieceMap[typeStr].toUpperCase() : pieceMap[typeStr].toLowerCase();
      
      const style = p.getAttribute('style') || '';
      const match = style.match(/translate\(\s*(-?\d+(?:\.\d+)?)\s*px\s*,\s*(-?\d+(?:\.\d+)?)\s*px\s*\)/);
      if (!match) continue;
      
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      
      let col = Math.round(x / sqSize);
      let row = Math.round(y / sqSize);
      
      if (!isWhiteBottom) {
        col = 7 - col;
        row = 7 - row;
      }
      
      if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        grid[row][col] = char;
      }
    }
    
    // Convert 8x8 grid to FEN position string (first part of FEN)
    const fenRanks = [];
    for (let r = 0; r < 8; r++) {
      let rankStr = '';
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const cell = grid[r][c];
        if (cell === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rankStr += emptyCount;
            emptyCount = 0;
          }
          rankStr += cell;
        }
      }
      if (emptyCount > 0) rankStr += emptyCount;
      fenRanks.push(rankStr);
    }
    
    // Determine active turn by checking active move element or move list
    const activeMove = document.querySelector('move.active');
    let activeMoveCount = 0;
    if (activeMove && activeMove.hasAttribute('p')) {
      const activeP = activeMove.getAttribute('p')!;
      activeMoveCount = Math.floor(activeP.length / 2);
    } else {
      const moveElements = document.querySelectorAll('u8, move');
      activeMoveCount = Array.from(moveElements).filter(el => {
        const txt = el.textContent?.trim() || '';
        return txt && !txt.startsWith('...') && !/^\d+\./.test(txt);
      }).length;
    }
    
    const turn = (activeMoveCount % 2 === 1) ? 'b' : 'w';
    
    return {
      fenBoard: fenRanks.join('/'),
      turn,
      isWhiteBottom,
      activeMoveCount
    };
  });

  if (!fenResult) {
    throw new Error("Failed to locate Lichess board or pieces in the DOM.");
  }

  // Load exact FEN board position into chess.js
  const fullFen = `${fenResult.fenBoard} ${fenResult.turn} - - 0 1`;
  
  try {
    game.load(fullFen);
  } catch (e: any) {
    console.error(`Failed to load FEN ${fullFen}: ${e.message}`);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Real-time Board Synchronized via DOM Piece Analysis:\nFEN: ${game.fen()}\nTurn: ${game.turn() === 'w' ? 'White' : 'Black'}\nActive Move Count: ${fenResult.activeMoveCount}`
      }
    ]
  };
}

function createMcpServer() {
  const server = new McpServer({
    name: "LichessMCP",
    version: "1.0.0",
  });

  server.tool(
    "launch_lichess",
    "Launch the Playwright browser and open the Lichess study URL.",
    {
      url: z.string().url().describe("The Lichess study URL (e.g., https://lichess.org/study/...)")
    },
    async ({ url }) => {
      if (!browser) {
        const isHeadless = process.env.HEADLESS !== 'false';
        browser = await chromium.launch({ headless: isHeadless });
        page = await browser.newPage();
      }
      await page!.goto(url);
      
      // Wait for the chess board to appear
      await page!.waitForSelector('cg-board');
      
      return {
        content: [
          {
            type: "text" as const,
            text: `Browser launched successfully and navigated to ${url}. The human can now play in the browser!`
          }
        ]
      };
    }
  );

  server.tool(
    "get_board",
    "Get the current chess board state from the active Lichess browser window.",
    {},
    async () => {
      if (!page) {
        return {
          content: [{ type: "text" as const, text: "Error: Browser not launched yet." }],
          isError: true,
        };
      }
      
      const debugInfo = await updateInternalBoard();
      
      return {
        content: [
          debugInfo.content[0],
          {
            type: "text" as const,
            text: `Current Turn: ${game.turn() === 'w' ? 'White' : 'Black'}
Game Over: ${game.isGameOver()}
Checkmate: ${game.isCheckmate()}
Draw: ${game.isDraw()}
In Check: ${game.inCheck()}

Board:
${game.ascii()}

FEN: ${game.fen()}
Legal moves: ${game.moves().join(", ")}
`
          }
        ]
      };
    }
  );

  server.tool(
    "make_move",
    "Make a chess move in the Lichess browser window using standard algebraic notation (SAN) or UCI (e.g., 'e4', 'Nf3', 'e2e4').",
    {
      move: z.string().describe("The move to play in SAN or UCI format."),
    },
    async ({ move }) => {
      if (!page) {
        return {
          content: [{ type: "text" as const, text: "Error: Browser not launched yet." }],
          isError: true,
        };
      }
      
      await updateInternalBoard();
      
      let moveObj;
      try {
        moveObj = game.move(move);
      } catch (e: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Invalid move '${move}'. Error: ${e.message}\nPlease check the legal moves or board state and try again.\nLegal moves: ${game.moves().join(", ")}`
            }
          ],
          isError: true,
        };
      }

      // Calculate square coordinates for clicking
      const from = moveObj.from;
      const to = moveObj.to;
      const promotion = moveObj.promotion;

      const boardElement = await page.$('cg-board');
      if (!boardElement) {
        return {
          content: [{ type: "text" as const, text: "Error: Board element 'cg-board' not found on the page." }],
          isError: true,
        };
      }
      
      const rect = await boardElement.boundingBox();
      if (!rect) {
        return {
          content: [{ type: "text" as const, text: "Error: Board bounding box not found." }],
          isError: true,
        };
      }

      const isWhiteBottom = await page.evaluate(() => {
        const wrap = document.querySelector('.cg-wrap');
        return wrap ? !wrap.classList.contains('orientation-black') : true;
      });
      
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
      
      const fromPos = getSquarePos(from);
      const toPos = getSquarePos(to);
      
      // Move mouse to the piece and click it
      await page.mouse.move(fromPos.x, fromPos.y);
      await page.mouse.click(fromPos.x, fromPos.y, { delay: 150 });
      
      // Wait for Lichess to highlight the piece and show valid move dots
      await page.waitForTimeout(500); 
      
      // Move mouse to destination and click
      await page.mouse.move(toPos.x, toPos.y);
      await page.mouse.click(toPos.x, toPos.y, { delay: 150 });
      
      // Give Lichess ample time to process the move over WebSocket and update the DOM
      // Without this, the AI might instantly read the board and see the old state!
      await page.waitForTimeout(2000);

      // Handle promotion UI if needed
      if (promotion) {
        await page.waitForTimeout(500);
        await page.evaluate((promoPiece) => {
          const pieces = document.querySelectorAll('#promotion-choice piece, cg-board piece.promotion-choice');
          const targetName = promoPiece === 'q' ? 'queen' : promoPiece === 'r' ? 'rook' : promoPiece === 'b' ? 'bishop' : 'knight';
          for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].className.indexOf(targetName) !== -1) {
              (pieces[i] as HTMLElement).click();
              break;
            }
          }
        }, promotion);
      }

      await updateInternalBoard();

      return {
        content: [
          {
            type: "text" as const,
            text: `Move '${move}' played successfully on Lichess!
Piece moved: ${moveObj.piece} from ${from} to ${to}

Board:
${game.ascii()}

Game Over: ${game.isGameOver()}
FEN: ${game.fen()}`
          }
        ]
      };
    }
  );

  // Add a tool to take a screenshot of the board
  server.tool(
    "take_screenshot",
    "Takes a screenshot of the current Lichess browser window and returns it as base64",
    {},
    async () => {
      if (!page) throw new Error("Browser is not launched. Call launch_lichess first.");
      const buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
      return {
        content: [
          {
            type: "text" as const,
            text: "Screenshot captured successfully."
          },
          {
            type: "image" as const,
            data: buffer.toString('base64'),
            mimeType: "image/jpeg"
          }
        ]
      };
    }
  );

  return server;
}

// Support both SSE and Stdio
const app = express();

// Enable JSON body parsing for MCP POST requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

const activeTransports = new Map<string, SSEServerTransport>();

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DeeChess MCP Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 3rem; background: #0f172a; color: #f8fafc; line-height: 1.6; }
          .card { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1fr solid #334155; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #38bdf8; margin-top: 0; }
          code { background: #0284c7; color: #fff; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; }
          ul { padding-left: 1.2rem; }
          li { margin-bottom: 0.5rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>♟️ DeeChess MCP Server</h1>
          <p>Status: <span style="color:#4ade80; font-weight:bold;">ONLINE</span></p>
          <h3>How to Connect:</h3>
          <ul>
            <li><strong>SSE Connection URL:</strong> <code>https://${req.headers.host}/sse</code></li>
            <li><strong>Post Messages Endpoint:</strong> <code>https://${req.headers.host}/messages</code> (POST)</li>
          </ul>
          <p>For ChatGPT, Claude, or custom MCP clients, point your SSE transport URL to <code>https://${req.headers.host}/sse</code>.</p>
        </div>
      </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", server: "DeeChess MCP", timestamp: new Date().toISOString() });
});

app.get("/sse", async (req, res) => {
  const activeServer = createMcpServer();
  const transport = new SSEServerTransport("/messages", res);
  
  activeTransports.set(transport.sessionId, transport);
  
  transport.onclose = () => {
    activeTransports.delete(transport.sessionId);
  };

  await activeServer.connect(transport);
});

app.get("/messages", (req, res) => {
  res.status(405).json({
    error: "Method Not Allowed",
    message: "The /messages endpoint accepts HTTP POST requests from MCP clients. Connect via GET /sse first."
  });
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = sessionId ? activeTransports.get(sessionId) : Array.from(activeTransports.values()).pop();
  
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).json({
      error: "No active SSE connection",
      message: "Please establish an SSE stream via GET /sse before sending messages."
    });
  }
});

const PORT = Number(process.env.PORT) || 3001;

// If a command line flag like --stdio is passed, use stdio instead of express
if (process.argv.includes("--stdio")) {
  const stdioTransport = new StdioServerTransport();
  const server = createMcpServer();
  server.connect(stdioTransport).then(() => {
    console.error("Chess MCP Stdio Server running");
  });
} else {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Chess MCP SSE Server running on port ${PORT}`);
    console.log(`SSE Endpoint: http://0.0.0.0:${PORT}/sse`);
    console.log(`To run via Stdio for ChatGPT Desktop, run: pnpm exec tsx index.ts --stdio`);
  });
}
