import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class GetBoardTool implements McpTool {
  readonly name = 'get_board';
  readonly description = 'Executes get_board via GameOrchestrator';
  readonly schema = z.object({});

  async execute(_input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.getBoard();
    return { success: true, data: result };
  }
}
