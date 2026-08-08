import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class WaitForOpponentTool implements McpTool {
  readonly name = 'wait_for_opponent';
  readonly description = 'Executes wait_for_opponent via GameOrchestrator';
  readonly schema = z.object({ timeoutMs: z.number().optional() });

  async execute(_input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.waitForOpponent();
    return { success: true, data: result };
  }
}
