import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class MakeMoveTool implements McpTool {
  readonly name = 'make_move';
  readonly description = 'Executes make_move via GameOrchestrator';
  readonly schema = z.object({ move: z.string() });

  async execute(input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.makeMove(_input.move);
    return { success: true, data: result };
  }
}
