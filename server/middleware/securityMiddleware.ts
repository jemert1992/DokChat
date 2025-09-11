import { type RequestHandler } from 'express';
import { AdvancedSecurityService } from '../services/advancedSecurityService';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

export interface SecurityRequest extends Request {
  user?: any;
  securityContext?: {
    userId: string;
    industry: string;
    roles: string[];
    permissions: string[];
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    mfaVerified?: boolean;
  };
}

export class SecurityMiddleware {
  private securityService: AdvancedSecurityService;

  constructor(securityService: AdvancedSecurityService) {
    this.securityService = securityService;
  }

  /**
   * Enhanced authentication middleware with security logging
   */
  enhancedAuth(): RequestHandler {
    return async (req: any, res, next) => {
      try {
        // Check if user is authenticated
        if (!req.isAuthenticated() || !req.user?.claims?.sub) {
          await this.logSecurityEvent({
            eventType: 'authentication_failed',
            action: 'access_attempt',
            resource: req.path,
            outcome: 'failure',
            severity: 'warning',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });

          return res.status(401).json({ 
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        const userId = req.user.claims.sub;
        
        // Build security context
        const userRoles = await storage.getUserRoles(userId);
        const user = await storage.getUser(userId);
        
        req.securityContext = {
          userId,
          industry: user?.industry || 'general',
          roles: userRoles.map(r => r.roleId?.toString() || ''),
          permissions: [], // Will be populated by permission checks
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          mfaVerified: false // TODO: Check MFA status
        };

        // Log successful authentication
        await this.logSecurityEvent({
          userId,
          eventType: 'authentication_success',
          action: 'access_granted',
          resource: req.path,
          outcome: 'success',
          severity: 'info',
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({ 
          message: 'Authentication error',
          code: 'AUTH_ERROR'
        });
      }
    };
  }

  /**
   * Permission-based authorization middleware
   */
  requirePermission(resource: string, action: string): RequestHandler {
    return async (req: any, res, next) => {
      try {
        const userId = req.securityContext?.userId;
        if (!userId) {
          return res.status(401).json({ 
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        // Check permission
        const accessResult = await this.securityService.checkPermission(
          userId,
          resource,
          action,
          {
            documentId: req.params.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path
          }
        );

        if (!accessResult.allowed) {
          await this.logSecurityEvent({
            userId,
            eventType: 'access_denied',
            action,
            resource,
            outcome: 'failure',
            severity: 'warning',
            riskScore: accessResult.riskScore,
            eventData: {
              reason: accessResult.reason,
              requiredPermissions: accessResult.requiredPermissions,
              complianceFlags: accessResult.complianceFlags
            },
            sessionId: req.sessionID,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });

          return res.status(403).json({
            message: 'Insufficient permissions',
            code: 'PERMISSION_DENIED',
            required: accessResult.requiredPermissions,
            reason: accessResult.reason
          });
        }

        // Log successful authorization
        await this.logSecurityEvent({
          userId,
          eventType: 'access_authorized',
          action,
          resource,
          outcome: 'success',
          severity: 'info',
          riskScore: accessResult.riskScore,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        next();
      } catch (error) {
        console.error('Authorization middleware error:', error);
        res.status(500).json({ 
          message: 'Authorization error',
          code: 'AUTHZ_ERROR'
        });
      }
    };
  }

  /**
   * Industry-specific compliance middleware
   */
  requireCompliance(industry?: string): RequestHandler {
    return async (req: any, res, next) => {
      try {
        const userId = req.securityContext?.userId;
        const userIndustry = req.securityContext?.industry || industry;
        
        if (!userId || !userIndustry) {
          return res.status(400).json({ 
            message: 'Industry context required',
            code: 'INDUSTRY_REQUIRED'
          });
        }

        // Evaluate compliance for the action
        const complianceResult = await this.securityService.evaluateCompliance(
          userIndustry,
          req.params.id ? parseInt(req.params.id) : undefined,
          userId,
          req.method.toLowerCase()
        );

        if (!complianceResult.isCompliant) {
          await this.logSecurityEvent({
            userId,
            eventType: 'compliance_violation',
            action: req.method.toLowerCase(),
            resource: req.path,
            outcome: 'failure',
            severity: 'high',
            complianceRelevant: true,
            industry: userIndustry,
            eventData: {
              violations: complianceResult.violations,
              riskScore: complianceResult.riskScore,
              complianceScore: complianceResult.complianceScore
            },
            sessionId: req.sessionID,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });

          return res.status(409).json({
            message: 'Compliance violation detected',
            code: 'COMPLIANCE_VIOLATION',
            violations: complianceResult.violations,
            complianceScore: complianceResult.complianceScore
          });
        }

        // Store compliance result for audit
        req.complianceResult = complianceResult;
        next();
      } catch (error) {
        console.error('Compliance middleware error:', error);
        res.status(500).json({ 
          message: 'Compliance check error',
          code: 'COMPLIANCE_ERROR'
        });
      }
    };
  }

  /**
   * Document access logging middleware
   */
  logDocumentAccess(accessType: string): RequestHandler {
    return async (req: any, res, next) => {
      try {
        const userId = req.securityContext?.userId;
        const documentId = req.params.id ? parseInt(req.params.id) : undefined;

        if (userId && documentId) {
          const startTime = Date.now();
          
          // Override res.end to capture duration
          const originalEnd = res.end;
          res.end = function(...args: any[]) {
            const duration = Math.round((Date.now() - startTime) / 1000);
            
            // Log document access
            storage.logDocumentAccess({
              documentId,
              userId,
              accessType,
              accessMethod: 'web',
              duration,
              ipAddress: req.ip,
              location: {}, // TODO: Implement geo-location
              deviceInfo: {
                userAgent: req.headers['user-agent'],
                platform: req.headers['sec-ch-ua-platform']
              },
              wasAuthorized: res.statusCode < 400,
              authorizationMethod: 'rbac',
              complianceFlags: req.complianceResult?.violations?.map((v: any) => v.violationType) || [],
              sensitiveDataAccessed: false, // TODO: Implement sensitive data detection
              redactionApplied: false,
              watermarkApplied: false,
              accessedAt: new Date()
            }).catch(error => {
              console.error('Failed to log document access:', error);
            });

            originalEnd.apply(this, args);
          };
        }

        next();
      } catch (error) {
        console.error('Document access logging error:', error);
        next(); // Continue despite logging error
      }
    };
  }

  /**
   * API security monitoring middleware
   */
  monitorAPIAccess(): RequestHandler {
    return async (req: any, res, next) => {
      const startTime = Date.now();
      const requestSize = parseInt(req.headers['content-length'] || '0');

      // Override res.end to capture response data
      const originalEnd = res.end;
      res.end = function(chunk: any, ...args: any[]) {
        const responseTime = Date.now() - startTime;
        const responseSize = chunk ? Buffer.byteLength(chunk) : 0;

        // Log API access
        storage.logAPIAccess({
          apiKeyId: req.headers['x-api-key'] as string,
          userId: req.securityContext?.userId,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          requestSize,
          responseSize,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          rateLimitHit: false, // TODO: Implement rate limiting
          suspiciousActivity: this.detectSuspiciousActivity(req, res),
          securityFlags: this.getSecurityFlags(req, res),
          requestPayload: req.method === 'POST' ? req.body : undefined,
          errorDetails: res.statusCode >= 400 ? { statusCode: res.statusCode } : undefined
        }).catch(error => {
          console.error('Failed to log API access:', error);
        });

        originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(maxRequests: number = 100, windowMs: number = 60000): RequestHandler {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return async (req: any, res, next) => {
      const key = req.ip + ':' + (req.securityContext?.userId || 'anonymous');
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [k, v] of requests.entries()) {
        if (v.resetTime < windowStart) {
          requests.delete(k);
        }
      }

      const userRequests = requests.get(key) || { count: 0, resetTime: now + windowMs };

      if (userRequests.count >= maxRequests) {
        await this.logSecurityEvent({
          userId: req.securityContext?.userId,
          eventType: 'rate_limit_exceeded',
          action: 'api_access',
          resource: req.path,
          outcome: 'failure',
          severity: 'warning',
          eventData: {
            requestCount: userRequests.count,
            maxRequests,
            windowMs
          },
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.status(429).json({
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        });
      }

      userRequests.count++;
      requests.set(key, userRequests);
      next();
    };
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(req: any, res: any): boolean {
    const flags = [];

    // High error rate
    if (res.statusCode >= 400) {
      flags.push('error_response');
    }

    // Suspicious user agent
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      flags.push('bot_activity');
    }

    // Multiple rapid requests from same IP
    if (req.headers['x-forwarded-for']) {
      flags.push('proxy_request');
    }

    // Off-hours access
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      flags.push('off_hours');
    }

    return flags.length > 1;
  }

  /**
   * Get security flags for request
   */
  private getSecurityFlags(req: any, res: any): string[] {
    const flags = [];

    if (res.statusCode === 401) flags.push('auth_failure');
    if (res.statusCode === 403) flags.push('access_denied');
    if (res.statusCode >= 500) flags.push('server_error');
    if (req.headers['x-forwarded-for']) flags.push('proxy');
    if (!req.headers['user-agent']) flags.push('no_user_agent');

    return flags;
  }

  /**
   * Log security event helper
   */
  private async logSecurityEvent(event: any): Promise<void> {
    try {
      await this.securityService.logSecurityEvent({
        eventId: randomUUID(),
        ...event
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Export middleware factory
export function createSecurityMiddleware(securityService: AdvancedSecurityService) {
  return new SecurityMiddleware(securityService);
}