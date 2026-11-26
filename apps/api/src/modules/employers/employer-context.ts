import type { Request } from 'express';

export interface EmployerRequest extends Request {
  user: { id: string };
}
