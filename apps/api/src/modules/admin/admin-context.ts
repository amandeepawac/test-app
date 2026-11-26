import type { Request } from 'express';

export interface AdminRequest extends Request {
  user: { id: string };
}

export type AdminActionContext = {
  actorId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export function getAdminActionContext(request: AdminRequest): AdminActionContext {
  return {
    actorId: request.user.id,
    ipAddress: request.ip ?? null,
    userAgent: request.get('user-agent') ?? null,
  };
}
