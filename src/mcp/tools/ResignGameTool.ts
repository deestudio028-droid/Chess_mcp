import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class ResignGameTool implements McpTool {
  readonly name = 'resign_game';
  readonly description = 'Executes resign_game via GameOrchestrator';
  readonly schema = z.object({});

  async execute(_input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.resign();
    return { success: true, data: result };
  }
}
