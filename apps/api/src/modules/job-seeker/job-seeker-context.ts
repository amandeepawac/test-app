import type { Request } from 'express';

export interface JobSeekerRequest extends Request {
  user: { id: string };
}
