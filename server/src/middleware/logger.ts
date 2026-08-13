import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
  });
  
  next();
}
