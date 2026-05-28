import type { Request, Response } from 'express'
import z from 'zod';

const SignInBody = z.object({
  email: z.email(),
  password: z.string()
})

export function signin(req: Request, res: Response) {
  const body = SignInBody.parse(req.body)
  res.json(body);
}
