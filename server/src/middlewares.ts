import type { NextFunction, Response, Request } from "express";
import { ZodError, z } from "zod";

export function zodBadRequest(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ errors: z.treeifyError(err) });
  }
  console.error(err)

  res.status(500).json({ error: 'Internal error' });
}
