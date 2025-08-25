/**
 * Audit Log Utility
 * Basic implementation for testing purposes
 */

export const auditLog = {
  record: (data) => {
    if (process.env.NODE_ENV === 'test') {
      // During tests, just store in memory or log
      console.log('[AUDIT]', data);
      return;
    }
    
    // In production, this would send to audit service
    const entry = {
      ...data,
      timestamp: new Date().toISOString(),
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    console.log('[AUDIT LOG]', entry);
  }
};
