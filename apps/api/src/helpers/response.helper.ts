import { Response, Request } from 'express';
import { HttpStatus } from '@sutra/core';
import { tReq } from './i18n.helper';

export function sendSuccess(res: Response, data: any, statusCode: number = HttpStatus.OK) {
  return res.status(statusCode).json(data);
}

export function sendError(
  req: Request,
  res: Response,
  statusCode: number,
  errorName: string,
  messageKeyOrText: string,
  params?: Record<string, string | number>,
  extra?: Record<string, any>
) {
  // If messageKeyOrText contains dot, translate it; otherwise use as-is
  const message = messageKeyOrText.includes('.')
    ? tReq(req, messageKeyOrText, params)
    : messageKeyOrText;

  return res.status(statusCode).json({
    error: errorName,
    message,
    ...extra,
  });
}
