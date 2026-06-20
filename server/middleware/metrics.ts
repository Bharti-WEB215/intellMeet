// server/middleware/metrics.ts — Prometheus metrics for monitoring
import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register, prefix: 'intellmeet_' });

// ─── Custom Metrics ───

// HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'intellmeet_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'intellmeet_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Active WebSocket connections gauge
export const wsConnectionsGauge = new client.Gauge({
  name: 'intellmeet_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// Active meetings gauge
export const activeMeetingsGauge = new client.Gauge({
  name: 'intellmeet_active_meetings',
  help: 'Number of currently active meetings',
  registers: [register],
});

// AI operations counter
export const aiOperationsCounter = new client.Counter({
  name: 'intellmeet_ai_operations_total',
  help: 'Total AI operations performed',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// DB operation duration
export const dbOperationDuration = new client.Histogram({
  name: 'intellmeet_db_operation_duration_seconds',
  help: 'Database operation duration in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// ─── Middleware ───

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode.toString(),
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, durationSec);
  });

  next();
};

// ─── Metrics Endpoint ───

export const metricsEndpoint = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};

export { register };
