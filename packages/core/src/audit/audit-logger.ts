import { Pool } from 'pg';

export interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'APPROVE' | 'REVERT' | 'AUTH_LOGIN';
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  constructor(private pool: Pool) {}

  /**
   * Records an immutable entry into the tenant's audit trail.
   */
  public async log(entry: AuditLogEntry): Promise<void> {
    const diff = this.calculateDiff(entry.previousState, entry.newState);

    const query = `
      INSERT INTO audit_logs (
        tenant_id, user_id, action, entity_type, entity_id,
        previous_state, new_state, diff, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `;

    try {
      await this.pool.query(query, [
        entry.tenantId,
        entry.userId || null,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.previousState ? JSON.stringify(entry.previousState) : null,
        entry.newState ? JSON.stringify(entry.newState) : null,
        diff ? JSON.stringify(diff) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
      ]);
    } catch (err) {
      // In enterprise systems, audit failures must be logged or raised to prevent silent un-audited mutations
      console.error('[Sutra Audit Logger] Failed to write audit record:', err);
      throw new Error('Audit trail write failure');
    }
  }

  /**
   * Computes a structured JSON diff of changed fields.
   */
  private calculateDiff(
    prev: Record<string, unknown> | null | undefined,
    next: Record<string, unknown> | null | undefined
  ): Record<string, { from: unknown; to: unknown }> | null {
    if (!prev || !next) return null;

    const diff: Record<string, { from: unknown; to: unknown }> = {};
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

    for (const key of allKeys) {
      if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
        diff[key] = { from: prev[key], to: next[key] };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }
}
