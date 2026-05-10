import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '~~/lib/rate-limit';

interface MetricEvent {
  name: string;
  value: number;
  timestamp: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, 'api', async () => {
    try {
      const { metrics }: { metrics: MetricEvent[] } = await request.json();

      if (!Array.isArray(metrics)) {
        return NextResponse.json(
          { error: 'Metrics must be an array' },
          { status: 400 }
        );
      }

      // Process metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Received Metrics:', {
          count: metrics.length,
          timeRange: {
            start: metrics[0]?.timestamp,
            end: metrics[metrics.length - 1]?.timestamp,
          },
          samples: metrics.slice(0, 3), // Show first 3 metrics
        });
      }

      // In production, forward to monitoring service
      if (process.env.NODE_ENV === 'production') {
        await processProductionMetrics(metrics);
      }

      // Store aggregated metrics
      await storeMetrics(metrics);

      return NextResponse.json({ 
        success: true, 
        processed: metrics.length 
      });

    } catch (error) {
      console.error('Error processing metrics:', error);
      return NextResponse.json(
        { error: 'Failed to process metrics' },
        { status: 500 }
      );
    }
  });
}

async function processProductionMetrics(metrics: MetricEvent[]): Promise<void> {
  // Send to DataDog, Prometheus, or other metrics service
  if (process.env.DATADOG_API_KEY) {
    try {
      await sendToDataDog(metrics);
    } catch (error) {
      console.error('Failed to send metrics to DataDog:', error);
    }
  }

  // Send to CloudWatch if AWS credentials are configured
  if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) {
    try {
      await sendToCloudWatch(metrics);
    } catch (error) {
      console.error('Failed to send metrics to CloudWatch:', error);
    }
  }
}

async function sendToDataDog(metrics: MetricEvent[]): Promise<void> {
  const apiKey = process.env.DATADOG_API_KEY;
  const series = metrics.map(metric => ({
    metric: metric.name,
    points: [[Math.floor(new Date(metric.timestamp).getTime() / 1000), metric.value]],
    tags: Object.entries(metric.tags).map(([key, value]) => `${key}:${value}`),
    metadata: metric.metadata,
  }));

  await fetch('https://api.datadoghq.com/api/v1/series', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': apiKey!,
    },
    body: JSON.stringify({ series }),
  });
}

async function sendToCloudWatch(metrics: MetricEvent[]): Promise<void> {
  // AWS CloudWatch implementation would go here
  console.log('Would send to CloudWatch:', metrics.length, 'metrics');
}

async function storeMetrics(metrics: MetricEvent[]): Promise<void> {
  // Aggregate and store key metrics
  const aggregations = new Map<string, { sum: number; count: number; min: number; max: number }>();

  metrics.forEach(metric => {
    const key = `${metric.name}:${JSON.stringify(metric.tags)}`;
    const existing = aggregations.get(key);

    if (existing) {
      existing.sum += metric.value;
      existing.count += 1;
      existing.min = Math.min(existing.min, metric.value);
      existing.max = Math.max(existing.max, metric.value);
    } else {
      aggregations.set(key, {
        sum: metric.value,
        count: 1,
        min: metric.value,
        max: metric.value,
      });
    }
  });

  // In a real application, store in database
  console.log('Stored metric aggregations:', aggregations.size, 'unique metrics');

  // Alert on critical metrics
  checkCriticalMetrics(metrics);
}

function checkCriticalMetrics(metrics: MetricEvent[]): void {
  metrics.forEach(metric => {
    // Check for high error rates
    if (metric.name.includes('error_rate') && metric.value > 0.1) {
      console.error('🚨 HIGH ERROR RATE ALERT:', {
        metric: metric.name,
        value: metric.value,
        tags: metric.tags,
        timestamp: metric.timestamp,
      });
    }

    // Check for slow response times
    if (metric.name.includes('response_time') && metric.value > 5000) {
      console.warn('⚠️ SLOW RESPONSE TIME:', {
        metric: metric.name,
        value: `${metric.value}ms`,
        tags: metric.tags,
      });
    }

    // Check for memory usage
    if (metric.name.includes('memory') && metric.value > 1000000000) { // 1GB
      console.warn('⚠️ HIGH MEMORY USAGE:', {
        metric: metric.name,
        value: `${Math.round(metric.value / 1024 / 1024)}MB`,
        tags: metric.tags,
      });
    }

    // Check for orbital calculation performance
    if (metric.name.includes('orbital.calculation_time') && metric.value > 10000) {
      console.warn('⚠️ SLOW ORBITAL CALCULATION:', {
        metric: metric.name,
        value: `${metric.value}ms`,
        tags: metric.tags,
      });
    }
  });
}