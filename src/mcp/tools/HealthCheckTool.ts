import { HealthService } from '../core/HealthService.js';
import { ToolMetrics } from '../core/ToolMetrics.js';
import { z } from 'zod';
import { McpTool } from '../core/McpTool.js';
import { McpResponse } from '../core/McpResponse.js';
import { GameOrchestrator } from '../../application/orchestration/GameOrchestrator.js';

export class HealthCheckTool implements McpTool {
  readonly name = 'health_check';
  readonly description = 'Executes health_check via GameOrchestrator';
  readonly schema = z.object({});

  async execute(_input: z.infer<typeof this.schema>, _orchestrator: GameOrchestrator): Promise<McpResponse> {
    return new HealthService(new ToolMetrics()).checkHealth();
  }
}
