import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class JoinGameTool implements McpTool {
  readonly name = 'join_game';
  readonly description = 'Executes join_game via GameOrchestrator';
  readonly schema = z.object({ link: z.string().url() });

  async execute(input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.joinGame(_input.link);
    return { success: true, data: result };
  }
}
