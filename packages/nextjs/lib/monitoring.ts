import { NextRequest } from 'next/server';

export interface MetricEvent {
  name: string;
  value: number;
  timestamp: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  timestamp: string;
  component: string;
  data?: Record<string, any>;
  traceId?: string;
  userId?: string;
}

export interface PerformanceMetrics {
  apiResponseTime: number;
  databaseQueryTime?: number;
  externalApiTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  errorRate?: number;
  requestCount?: number;
}

class MonitoringService {
  private metricsBuffer: MetricEvent[] = [];
  private logsBuffer: LogEvent[] = [];
  private readonly bufferSize = 100;
  private readonly flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic flush in browser environment
    if (typeof window !== 'undefined') {
      this.startPeriodicFlush();
    }
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Metrics collection
  recordMetric(name: string, value: number, tags: Record<string, string> = {}, metadata?: Record<string, any>) {
    const metric: MetricEvent = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        ...tags,
      },
      metadata,
    };

    this.metricsBuffer.push(metric);
    this.checkBuffer();

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[METRIC] ${name}: ${value}`, tags);
    }
  }

  // Structured logging
  log(level: LogEvent['level'], message: string, component: string, data?: Record<string, any>, userId?: string) {
    const logEvent: LogEvent = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component,
      data,
      traceId: this.generateTraceId(),
      userId,
    };

    this.logsBuffer.push(logEvent);
    this.checkBuffer();

    // Console output with proper formatting
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === 'error' || level === 'critical' ? console.error :
                       level === 'warn' ? console.warn : console.log;
      
      logMethod(`[${level.toUpperCase()}] ${component}: ${message}`, data || '');
    }
  }

  // Performance monitoring
  recordPerformance(operation: string, metrics: PerformanceMetrics, tags: Record<string, string> = {}) {
    // Record individual metrics
    this.recordMetric(`${operation}.response_time`, metrics.apiResponseTime, tags);
    
    if (metrics.databaseQueryTime) {
      this.recordMetric(`${operation}.db_query_time`, metrics.databaseQueryTime, tags);
    }
    
    if (metrics.externalApiTime) {
      this.recordMetric(`${operation}.external_api_time`, metrics.externalApiTime, tags);
    }
    
    if (metrics.memoryUsage) {
      this.recordMetric('system.memory_usage', metrics.memoryUsage, tags);
    }
    
    if (metrics.errorRate) {
      this.recordMetric(`${operation}.error_rate`, metrics.errorRate, tags);
    }
    
    if (metrics.requestCount) {
      this.recordMetric(`${operation}.request_count`, metrics.requestCount, tags);
    }

    // Log performance summary
    this.log('info', `Performance metrics for ${operation}`, 'monitoring', {
      operation,
      responseTime: `${metrics.apiResponseTime}ms`,
      ...metrics,
    });
  }

  // API endpoint monitoring wrapper
  async monitorApiCall<T>(
    operation: string,
    apiCall: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: Error | null = null;

    try {
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      
      this.recordPerformance(operation, { 
        apiResponseTime: responseTime,
        requestCount: 1,
        errorRate: 0
      }, { ...tags, status: 'success' });
      
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error(String(err));
      const responseTime = Date.now() - startTime;
      
      this.recordPerformance(operation, { 
        apiResponseTime: responseTime,
        requestCount: 1,
        errorRate: 1
      }, { ...tags, status: 'error' });
      
      this.log('error', `API call failed: ${operation}`, 'api', {
        error: error.message,
        stack: error.stack,
        responseTime,
      });
      
      throw error;
    }
  }

  // Track user actions
  trackUserAction(action: string, userId: string, metadata?: Record<string, any>) {
    this.recordMetric('user.action', 1, { action, userId }, metadata);
    this.log('info', `User action: ${action}`, 'user-tracking', { userId, ...metadata }, userId);
  }

  // Track business metrics
  trackBusinessMetric(metric: string, value: number, metadata?: Record<string, any>) {
    this.recordMetric(`business.${metric}`, value, { type: 'business' }, metadata);
  }

  // System health checks
  recordHealthCheck(service: string, isHealthy: boolean, responseTime?: number, details?: Record<string, any>) {
    this.recordMetric(`health.${service}`, isHealthy ? 1 : 0, { service, status: isHealthy ? 'healthy' : 'unhealthy' });
    
    if (responseTime) {
      this.recordMetric(`health.${service}.response_time`, responseTime, { service });
    }
    
    this.log(isHealthy ? 'info' : 'error', `Health check for ${service}: ${isHealthy ? 'PASS' : 'FAIL'}`, 'health', {
      service,
      isHealthy,
      responseTime,
      ...details,
    });
  }

  // Orbital mechanics specific metrics
  trackOrbitalCalculation(calculationType: string, processingTime: number, accuracy?: number, params?: Record<string, any>) {
    this.recordMetric('orbital.calculation_time', processingTime, { type: calculationType });
    
    if (accuracy) {
      this.recordMetric('orbital.accuracy', accuracy, { type: calculationType });
    }
    
    this.log('info', `Orbital calculation: ${calculationType}`, 'orbital-mechanics', {
      processingTime: `${processingTime}ms`,
      accuracy,
      ...params,
    });
  }

  // IPFS operations tracking
  trackIPFSOperation(operation: string, duration: number, success: boolean, hash?: string, size?: number) {
    this.recordMetric('ipfs.operation_time', duration, { operation, status: success ? 'success' : 'failure' });
    this.recordMetric('ipfs.operations', 1, { operation, status: success ? 'success' : 'failure' });
    
    if (size) {
      this.recordMetric('ipfs.data_size', size, { operation });
    }
    
    this.log(success ? 'info' : 'error', `IPFS ${operation}: ${success ? 'SUCCESS' : 'FAILED'}`, 'ipfs', {
      operation,
      duration: `${duration}ms`,
      hash,
      size,
    });
  }

  // WebGL/3D performance tracking
  trackVisualizationPerformance(renderer: string, fps: number, memoryUsage?: number, drawCalls?: number) {
    this.recordMetric('visualization.fps', fps, { renderer });
    
    if (memoryUsage) {
      this.recordMetric('visualization.memory', memoryUsage, { renderer });
    }
    
    if (drawCalls) {
      this.recordMetric('visualization.draw_calls', drawCalls, { renderer });
    }
    
    this.log('debug', `Visualization performance: ${renderer}`, 'visualization', {
      fps,
      memoryUsage,
      drawCalls,
    });
  }

  private checkBuffer() {
    if (this.metricsBuffer.length >= this.bufferSize || this.logsBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.metricsBuffer.length === 0 && this.logsBuffer.length === 0) {
      return;
    }

    const metricsToFlush = [...this.metricsBuffer];
    const logsToFlush = [...this.logsBuffer];
    
    this.metricsBuffer = [];
    this.logsBuffer = [];

    try {
      // Send to monitoring endpoints
      if (metricsToFlush.length > 0) {
        await this.sendMetrics(metricsToFlush);
      }
      
      if (logsToFlush.length > 0) {
        await this.sendLogs(logsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
      // Re-add to buffer on failure (with size limit)
      this.metricsBuffer.unshift(...metricsToFlush.slice(0, this.bufferSize / 2));
      this.logsBuffer.unshift(...logsToFlush.slice(0, this.bufferSize / 2));
    }
  }

  private async sendMetrics(metrics: MetricEvent[]) {
    if (typeof window === 'undefined') return; // Server-side skip
    
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
      throw error;
    }
  }

  private async sendLogs(logs: LogEvent[]) {
    if (typeof window === 'undefined') return; // Server-side skip
    
    try {
      await fetch('/api/monitoring/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      console.error('Failed to send logs:', error);
      throw error;
    }
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
  }
}

// Request monitoring middleware
export function withMonitoring(operation: string) {
  return function<T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(this: any, ...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod!.apply(this, args);
        const duration = Date.now() - startTime;
        
        monitoring.recordPerformance(operation, {
          apiResponseTime: duration,
          requestCount: 1,
          errorRate: 0
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        monitoring.recordPerformance(operation, {
          apiResponseTime: duration,
          requestCount: 1,
          errorRate: 1
        });
        
        monitoring.log('error', `Operation failed: ${operation}`, 'api', {
          error: error instanceof Error ? error.message : String(error),
          duration,
        });
        
        throw error;
      }
    } as T;
  };
}

// Singleton instance
export const monitoring = new MonitoringService();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    monitoring.destroy();
  });
}

export default monitoring;