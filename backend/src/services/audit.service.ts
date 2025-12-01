import { Request } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../entities/AuditLog';

export class AuditService {
    static async logAction(
        userId: string,
        action: string,
        req: Request,
        details?: any,
        entityId?: string,
        entityType?: string) {
        try {
            const auditRepository = AppDataSource.getRepository(AuditLog);

            const auditLog = auditRepository.create({
                userId,
                action,
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
                details,
                entityId,
                entityType
            });

            await auditRepository.save(auditLog);
        } catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
}