const fs = require('fs');
const path = require('path');
const dir = 'src/mcp/tools';
const files = fs.readdirSync(dir);
const mapping = {
  'AnalyzePositionTool.ts': 'orchestrator.analyzePosition(input)',
  'CloseBrowserTool.ts': 'orchestrator.closeBrowser()',
  'CreateGameTool.ts': 'orchestrator.createGame()',
  'GetBoardTool.ts': 'orchestrator.getBoard()',
  'GetFenTool.ts': 'orchestrator.getFen()',
  'GetGameStatusTool.ts': 'orchestrator.getGameStatus()',
  'HealthCheckTool.ts': 'new HealthService(new ToolMetrics()).checkHealth()',
  'JoinGameTool.ts': 'orchestrator.joinGame(input.url)',
  'LaunchBrowserTool.ts': 'orchestrator.launchBrowser()',
  'MakeBestMoveTool.ts': 'orchestrator.makeBestMove()',
  'MakeMoveTool.ts': 'orchestrator.makeMove(input.move)',
  'OfferDrawTool.ts': 'orchestrator.offerDraw()',
  'ResignGameTool.ts': 'orchestrator.resign()',
  'RestartGameTool.ts': 'orchestrator.restart()',
  'ShutdownTool.ts': 'orchestrator.shutdown()',
  'WaitForOpponentTool.ts': 'orchestrator.waitForOpponent()'
};

files.forEach(f => {
  if (!mapping[f]) return;
  const fp = path.join(dir, f);
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/_orchestrator/g, 'orchestrator');
  
  if (f === 'HealthCheckTool.ts') {
    content = "import { HealthService } from '../core/HealthService.js';\nimport { ToolMetrics } from '../core/ToolMetrics.js';\n" + content;
    content = content.replace(/return \{ success: true, data: \{ status: 'mocked_health_check', input \} \};/g, 'return ' + mapping[f] + ';');
  } else {
    const methodCall = mapping[f];
    const regex = /return\s+\{\s*success:\s*true,\s*data:\s*\{\s*status:\s*'mocked_[^']+',\s*input\s*\}\s*\};/;
    content = content.replace(regex, 'const result = await ' + methodCall + ';\n    return { success: true, data: result };');
  }
  
  fs.writeFileSync(fp, content);
});
