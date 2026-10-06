import express from 'express';
import { customersRouter } from './routes/customers.js';

/**
 * Build the Express app. The repository is injected so tests can use an
 * in-memory database per test case.
 */
export function createApp({ repo, logRequests = false }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  if (logRequests) {
    app.use((req, res, next) => {
      const start = process.hrtime.bigint();
      res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        console.log(
          JSON.stringify({
            time: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Math.round(ms * 10) / 10,
          }),
        );
      });
      next();
    });
  }

  // Liveness/readiness probe for Docker / orchestrators.
  app.get('/health', async (_req, res) => {
    try {
      const dbOk = await repo.ping();
      res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'ok' : 'degraded', database: dbOk });
    } catch {
      res.status(503).json({ status: 'degraded', database: false });
    }
  });

  app.use('/api/customers', customersRouter(repo));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
