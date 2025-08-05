import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL;
  
  // Check if worker URL is configured
  if (!workerUrl) {
    return NextResponse.json(
      { 
        error: 'NEXT_PUBLIC_LOG_WORKER_URL not configured',
        status: 'error',
        redis_connected: false 
      },
      { status: 500 }
    );
  }

  try {
    // Fetch health stats from the Worker
    const healthResponse = await fetch(`${workerUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!healthResponse.ok) {
      throw new Error(`Worker health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }

    const healthData = await healthResponse.json();

    // Transform the data to match the expected interface
    const transformedData = {
      status: healthData.status || 'healthy',
      redis_connected: healthData.components?.redis?.status === 'healthy',
      stats: {
        // The worker health endpoint doesn't provide detailed stats
        // For now, use rate limiter data as a proxy
        total_logs: healthData.components?.rate_limiter?.current_state?.global_current || 0,
        active_traces: Object.keys(healthData.components?.rate_limiter?.current_state?.trace_counts || {}).length,
        unique_users: 0, // Not available in health endpoint
        oldest_log_hours: 0, // Not available in health endpoint
      },
      system_breakdown: {
        browser: healthData.components?.rate_limiter?.current_state?.system_current?.browser || 0,
        convex: healthData.components?.rate_limiter?.current_state?.system_current?.convex || 0,
        worker: healthData.components?.rate_limiter?.current_state?.system_current?.worker || 0,
        manual: 0, // Not tracked in health endpoint
      },
      ttl_info: {
        default_ttl_hours: 1, // Standard Redis TTL
        expires_in_hours: Math.max(0, Math.floor(
          (healthData.components?.rate_limiter?.window_remaining_ms || 0) / (1000 * 60 * 60)
        )),
      }
    };

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('Failed to fetch Redis stats:', error);
    
    // Return error response with helpful information
    return NextResponse.json(
      {
        status: 'error',
        redis_connected: false,
        error: 'Failed to connect to Redis logging worker',
        details: error instanceof Error ? error.message : 'Unknown error',
        worker_url: workerUrl,
        stats: {
          total_logs: 0,
          active_traces: 0,
          unique_users: 0,
          oldest_log_hours: 0,
        },
        system_breakdown: {
          browser: 0,
          convex: 0,
          worker: 0,
          manual: 0,
        },
        ttl_info: {
          default_ttl_hours: 1,
          expires_in_hours: 0,
        }
      },
      { status: 500 }
    );
  }
}