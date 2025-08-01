import { httpAction } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Convex Log Streams webhook types (based on Convex documentation)
interface ConvexLogEntry {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context: {
    functionName: string;
    functionId: string;
    requestId: string;
    environmentName: string;
    deploymentId: string;
  };
  metadata?: Record<string, unknown>;
}

interface LogStreamsPayload {
  logs: ConvexLogEntry[];
  source: 'convex';
  endpoint: string;
  timestamp: number;
}

// Webhook endpoint to receive Convex backend function execution logs
export const receiveLogStreams = httpAction(async (ctx, request) => {
  // Verify webhook source (basic security)
  const origin = request.headers.get('origin') || request.headers.get('user-agent') || '';
  if (!origin.includes('convex')) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload: LogStreamsPayload = await request.json();
    
    if (!payload.logs || !Array.isArray(payload.logs)) {
      return new Response('Invalid payload: logs array required', { status: 400 });
    }

    // Process each log entry
    const results = [];
    for (const logEntry of payload.logs) {
      try {
        const processedEntry = await processConvexLogEntry(ctx, logEntry);
        results.push(processedEntry);
      } catch (error) {
        console.error('Failed to process log entry:', logEntry.id, error);
        // Continue processing other entries even if one fails
        results.push({ 
          id: logEntry.id, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results: results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Log Streams webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// Process individual Convex log entry
async function processConvexLogEntry(ctx: any, logEntry: ConvexLogEntry) {
  // Extract or generate trace ID from context
  // Convex requestId can serve as trace correlation
  const traceId = extractTraceIdFromContext(logEntry) || `convex_${logEntry.context.requestId}`;
  
  // Parse log message to extract potential correlation data
  const correlationData = parseLogMessageForCorrelation(logEntry.message);
  
  // Map Convex log levels to our standard levels
  const mappedLevel = mapConvexLogLevel(logEntry.level);
  
  // Prepare log entry for storage
  const processedLog = {
    level: mappedLevel,
    message: logEntry.message,
    trace_id: traceId,
    user_id: correlationData.userId || 'system', // Backend logs are typically system-level
    system_area: 'convex',
    timestamp: logEntry.timestamp,
    raw_args: [
      logEntry.message,
      JSON.stringify({
        functionName: logEntry.context.functionName,
        functionId: logEntry.context.functionId,
        requestId: logEntry.context.requestId,
        environmentName: logEntry.context.environmentName,
        deploymentId: logEntry.context.deploymentId,
        originalLevel: logEntry.level,
        ...logEntry.metadata,
      })
    ],
    stack_trace: logEntry.metadata?.stack as string || undefined,
  };

  // Store using existing logging infrastructure
  const result = await ctx.runMutation(api.loggingAction.createLogEntry, processedLog);
  
  return {
    id: logEntry.id,
    success: true,
    logQueueId: result.logQueueId,
    recentLogId: result.recentLogId,
    extractedTraceId: traceId,
  };
}

// Extract trace ID from log context or message
function extractTraceIdFromContext(logEntry: ConvexLogEntry): string | null {
  // Check if trace ID is in the log message (common pattern)
  const traceIdMatch = logEntry.message.match(/trace[_-]id[:\s]+([a-zA-Z0-9_-]+)/i);
  if (traceIdMatch) {
    return traceIdMatch[1];
  }

  // Check metadata for trace information
  if (logEntry.metadata?.traceId) {
    return String(logEntry.metadata.traceId);
  }

  if (logEntry.metadata?.trace_id) {
    return String(logEntry.metadata.trace_id);
  }

  // Use request ID as fallback correlation mechanism
  return `convex_req_${logEntry.context.requestId}`;
}

// Parse log message for correlation data (user IDs, etc.)
function parseLogMessageForCorrelation(message: string): { userId?: string } {
  // Look for user ID patterns in log messages
  const userIdMatch = message.match(/user[_-]?id[:\s]+([a-zA-Z0-9_-]+)/i);
  
  return {
    userId: userIdMatch ? userIdMatch[1] : undefined,
  };
}

// Map Convex log levels to our standard levels
function mapConvexLogLevel(convexLevel: ConvexLogEntry['level']): string {
  switch (convexLevel) {
    case 'DEBUG':
      return 'debug';
    case 'INFO':
      return 'info';
    case 'WARN':
      return 'warn';  
    case 'ERROR':
      return 'error';
    default:
      return 'info';
  }
}

// Health check endpoint for webhook verification
export const logStreamsHealth = httpAction(async (ctx, request) => {
  return new Response(JSON.stringify({
    status: 'healthy',
    endpoint: 'logStreamsWebhook',
    timestamp: Date.now(),
    version: '1.0.0',
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

// Configuration endpoint to get webhook URL for Convex Log Streams setup
export const getWebhookConfig = httpAction(async (ctx, request) => {
  // This would typically be configured via environment variables
  const baseUrl = process.env.CONVEX_SITE_URL || 'https://your-deployment.convex.site';
  
  return new Response(JSON.stringify({
    webhookUrl: `${baseUrl}/api/actions/logStreamsWebhook/receiveLogStreams`,
    healthCheckUrl: `${baseUrl}/api/actions/logStreamsWebhook/logStreamsHealth`,
    supportedSources: ['convex'],
    configuration: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      expectedPayload: {
        logs: 'Array<ConvexLogEntry>',
        source: 'string',
        endpoint: 'string', 
        timestamp: 'number',
      },
    },
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});