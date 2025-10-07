import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL;

  // Check if worker URL is configured
  if (!workerUrl) {
    return NextResponse.json(
      {
        error: 'NEXT_PUBLIC_LOG_WORKER_URL not configured',
        status: 'error',
        redis_connected: false,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
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
      throw new Error(
        `Worker health check failed: ${healthResponse.status} ${healthResponse.statusText}`
      );
    }

    const healthData = await healthResponse.json();

    // Get actual Redis statistics by calling traces/recent to count logs
    let redisStats = {
      total_logs: 0,
      active_traces: 0,
      unique_users: 0,
      oldest_log_hours: 0,
      system_breakdown: { browser: 0, convex: 0, worker: 0, manual: 0 },
    };

    try {
      // Fetch recent traces to get actual Redis stats (add cache busting)
      const tracesResponse = await fetch(
        `${workerUrl}/traces/recent?limit=50&t=${Date.now()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          signal:
            typeof AbortSignal !== 'undefined' && AbortSignal.timeout
              ? AbortSignal.timeout(5000)
              : undefined, // 5 second timeout
        }
      );

      if (tracesResponse.ok) {
        const tracesData = await tracesResponse.json();
        const traces = tracesData.traces || [];

        redisStats.active_traces = traces.length;
        redisStats.total_logs = traces.reduce(
          (sum: number, trace: any) => sum + (trace.logCount || 0),
          0
        );

        // Calculate system breakdown and unique users
        const uniqueUsers = new Set();
        const systemCounts = { browser: 0, convex: 0, worker: 0, manual: 0 };
        let oldestTimestamp = Date.now();

        for (const trace of traces) {
          if (trace.systems) {
            trace.systems.forEach((system: string) => {
              if (system in systemCounts) {
                systemCounts[system as keyof typeof systemCounts] +=
                  trace.logCount || 1;
              }
            });
          }
          if (trace.timestamp && trace.timestamp < oldestTimestamp) {
            oldestTimestamp = trace.timestamp;
          }
        }

        redisStats.system_breakdown = systemCounts;
        redisStats.unique_users = uniqueUsers.size;
        redisStats.oldest_log_hours = Math.floor(
          (Date.now() - oldestTimestamp) / (1000 * 60 * 60)
        );
      }
    } catch (tracesError) {
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to fetch detailed Redis stats, using basic health data:',
        tracesError
      );
      // Fallback to rate limiter data if available
      redisStats = {
        total_logs:
          healthData.components?.rate_limiter?.current_state?.global_current ||
          0,
        active_traces: Object.keys(
          healthData.components?.rate_limiter?.current_state?.trace_counts || {}
        ).length,
        unique_users: 0,
        oldest_log_hours: 0,
        system_breakdown: {
          browser:
            healthData.components?.rate_limiter?.current_state?.system_current
              ?.browser || 0,
          convex:
            healthData.components?.rate_limiter?.current_state?.system_current
              ?.convex || 0,
          worker:
            healthData.components?.rate_limiter?.current_state?.system_current
              ?.worker || 0,
          manual: 0,
        },
      };
    }

    // Transform the data to match the expected interface
    const transformedData = {
      status: healthData.status || 'healthy',
      redis_connected:
        healthData.components?.redis?.status === 'healthy' ||
        healthData.components?.redis?.status === undefined, // Assume healthy if not reported
      stats: redisStats,
      system_breakdown: redisStats.system_breakdown,
      ttl_info: {
        default_ttl_hours: 1, // Standard Redis TTL
        expires_in_hours: Math.max(
          0,
          Math.floor(
            (healthData.components?.rate_limiter?.window_remaining_ms ||
              3600000) /
              (1000 * 60 * 60)
          )
        ),
      },
    };

    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
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
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
