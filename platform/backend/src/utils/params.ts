import { Request } from 'express';

/**
 * Safely extract a route parameter as a string.
 * Express v5 types params as string | string[].
 */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
