import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class MakeBestMoveTool implements McpTool {
  readonly name = 'make_best_move';
  readonly description = 'Executes make_best_move via GameOrchestrator';
  readonly schema = z.object({});

  async execute(_input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.makeBestMove();
    return { success: true, data: result };
  }
}
