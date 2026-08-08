import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class GetFenTool implements McpTool {
  readonly name = 'get_fen';
  readonly description = 'Executes get_fen via GameOrchestrator';
  readonly schema = z.object({});

  async execute(_input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.getFen();
    return { success: true, data: result };
  }
}
