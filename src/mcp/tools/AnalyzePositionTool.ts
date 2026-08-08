import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class AnalyzePositionTool implements McpTool {
  readonly name = 'analyze_position';
  readonly description = 'Executes analyze_position via GameOrchestrator';
  readonly schema = z.object({ fen: z.string().optional(), moveTimeMs: z.number().optional() });

  async execute(_input: z.infer<typeof this.schema>, orchestrator: GameOrchestrator): Promise<McpResponse> {
    const result = await orchestrator.analyzePosition(_input);
    return { success: true, data: result };
  }
}
