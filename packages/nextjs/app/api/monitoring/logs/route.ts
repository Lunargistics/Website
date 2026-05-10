import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '~~/lib/rate-limit';

interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  timestamp: string;
  component: string;
  data?: Record<string, any>;
  traceId?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, 'api', async () => {
    try {
      const { logs }: { logs: LogEvent[] } = await request.json();

      if (!Array.isArray(logs)) {
        return NextResponse.json(
          { error: 'Logs must be an array' },
          { status: 400 }
        );
      }

      // Process logs
      await processLogs(logs);

      return NextResponse.json({ 
        success: true, 
        processed: logs.length 
      });

    } catch (error) {
      console.error('Error processing logs:', error);
      return NextResponse.json(
        { error: 'Failed to process logs' },
        { status: 500 }
      );
    }
  });
}

async function processLogs(logs: LogEvent[]): Promise<void> {
  // Filter and categorize logs
  const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'critical');
  const warningLogs = logs.filter(log => log.level === 'warn');
  const infoLogs = logs.filter(log => log.level === 'info');

  // Send to appropriate logging services
  if (process.env.NODE_ENV === 'production') {
    await sendToProductionLogging(logs);
  } else {
    // Development logging with enhanced formatting
    logToDevelopmentConsole(logs);
  }

  // Alert on critical logs
  if (errorLogs.length > 0) {
    await handleCriticalLogs(errorLogs);
  }

  // Store logs for analysis
  await storeLogs(logs);
}

function logToDevelopmentConsole(logs: LogEvent[]): void {
  logs.forEach(log => {
    const emoji = getLogEmoji(log.level);
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    
    const logMethod = log.level === 'error' || log.level === 'critical' ? console.error :
                     log.level === 'warn' ? console.warn : console.log;

    logMethod(
      `${emoji} [${timestamp}] ${log.component.toUpperCase()}: ${log.message}`,
      log.data ? '\n   Data:' : '',
      log.data || '',
      log.traceId ? `\n   Trace: ${log.traceId}` : '',
      log.userId ? `\n   User: ${log.userId}` : ''
    );
  });
}

function getLogEmoji(level: LogEvent['level']): string {
  const emojis = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    critical: '🚨',
  };
  return emojis[level];
}

async function sendToProductionLogging(logs: LogEvent[]): Promise<void> {
  // Send to ELK stack, Splunk, or other logging service
  if (process.env.ELASTICSEARCH_URL) {
    try {
      await sendToElasticsearch(logs);
    } catch (error) {
      console.error('Failed to send logs to Elasticsearch:', error);
    }
  }

  // Send to Datadog logs
  if (process.env.DATADOG_API_KEY) {
    try {
      await sendToDatadogLogs(logs);
    } catch (error) {
      console.error('Failed to send logs to Datadog:', error);
    }
  }

  // Send to CloudWatch Logs
  if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) {
    try {
      await sendToCloudWatchLogs(logs);
    } catch (error) {
      console.error('Failed to send logs to CloudWatch:', error);
    }
  }
}

async function sendToElasticsearch(logs: LogEvent[]): Promise<void> {
  const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
  const indexName = `lunar-logs-${new Date().toISOString().split('T')[0]}`;

  const body = logs.flatMap(log => [
    { index: { _index: indexName, _type: '_doc' } },
    {
      ...log,
      '@timestamp': log.timestamp,
      application: 'lunar-website',
      environment: process.env.NODE_ENV,
    }
  ]);

  await fetch(`${elasticsearchUrl}/_bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.ELASTICSEARCH_AUTH ? `Basic ${process.env.ELASTICSEARCH_AUTH}` : '',
    },
    body: body.map(item => JSON.stringify(item)).join('\n') + '\n',
  });
}

async function sendToDatadogLogs(logs: LogEvent[]): Promise<void> {
  const apiKey = process.env.DATADOG_API_KEY;

  for (const log of logs) {
    await fetch('https://http-intake.logs.datadoghq.com/v1/input/' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: log.message,
        level: log.level,
        timestamp: log.timestamp,
        service: 'lunar-website',
        source: 'nodejs',
        tags: `component:${log.component},environment:${process.env.NODE_ENV}`,
        attributes: {
          ...log.data,
          traceId: log.traceId,
          userId: log.userId,
        },
      }),
    });
  }
}

async function sendToCloudWatchLogs(logs: LogEvent[]): Promise<void> {
  // AWS CloudWatch Logs implementation would go here
  console.log('Would send to CloudWatch Logs:', logs.length, 'log entries');
}

async function handleCriticalLogs(errorLogs: LogEvent[]): Promise<void> {
  const criticalErrors = errorLogs.filter(log => log.level === 'critical');
  const componentErrors = new Map<string, number>();

  // Count errors by component
  errorLogs.forEach(log => {
    const count = componentErrors.get(log.component) || 0;
    componentErrors.set(log.component, count + 1);
  });

  // Alert on high error rates
  for (const [component, count] of componentErrors) {
    if (count >= 5) { // 5 errors from same component
      console.error('🚨 HIGH ERROR RATE ALERT:', {
        component,
        errorCount: count,
        timeWindow: '5 minutes',
      });

      // Send alert to monitoring service
      await sendAlert({
        level: 'critical',
        title: `High Error Rate: ${component}`,
        description: `Component ${component} has generated ${count} errors`,
        component,
        errorCount: count,
      });
    }
  }

  // Immediate alerts for critical logs
  for (const log of criticalErrors) {
    await sendAlert({
      level: 'critical',
      title: `Critical Error: ${log.component}`,
      description: log.message,
      component: log.component,
      traceId: log.traceId,
      userId: log.userId,
      data: log.data,
    });
  }
}

async function sendAlert(alert: {
  level: string;
  title: string;
  description: string;
  component: string;
  [key: string]: any;
}): Promise<void> {
  // Send to Slack, PagerDuty, email, etc.
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.title}`,
          attachments: [{
            color: alert.level === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Component', value: alert.component, short: true },
              { title: 'Level', value: alert.level.toUpperCase(), short: true },
              { title: 'Description', value: alert.description, short: false },
            ],
            timestamp: Math.floor(Date.now() / 1000),
          }],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // Log alert locally
  console.error('📢 ALERT SENT:', alert);
}

async function storeLogs(logs: LogEvent[]): Promise<void> {
  // In a real application, store in database or file system
  // For now, just aggregate statistics
  const stats = {
    total: logs.length,
    byLevel: {} as Record<string, number>,
    byComponent: {} as Record<string, number>,
    timeRange: {
      start: logs[0]?.timestamp,
      end: logs[logs.length - 1]?.timestamp,
    },
  };

  logs.forEach(log => {
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
  });

  console.log('📋 Log Statistics:', stats);
}