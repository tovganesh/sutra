import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { HttpStatus } from '@sutra/core';
import apiRouter from './routes';
import { getLocale, tReq } from './helpers/i18n.helper';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Attach detected locale to request for controllers and templates
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).locale = getLocale(req);
    next();
  });

  // Mount versioned enterprise API routes
  app.use('/api/v1', apiRouter);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(HttpStatus.NOT_FOUND).json({
      error: 'NotFound',
      message: tReq(req, 'common.notFound'),
      path: req.originalUrl,
    });
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || tReq(req, 'common.internalServerError');
    res.status(status).json({
      error: err.name || 'InternalServerError',
      message,
    });
  });

  return app;
}

export const app = createApp();
export default app;
