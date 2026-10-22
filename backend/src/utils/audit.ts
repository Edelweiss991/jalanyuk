import { PrismaClient, Prisma } from '@prisma/client';

interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
}

export const logAudit = async (prisma: PrismaClient, data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details ? (data.details as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
