import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class LaunchBrowserTool implements McpTool {
  readonly name = 'launch_browser';
  readonly description = 'Executes launch_browser via GameOrchestrator';
  readonly schema = z.object({ url: z.string().url() });

  async execute(_input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.launchBrowser();
    return { success: true, data: result };
  }
}
