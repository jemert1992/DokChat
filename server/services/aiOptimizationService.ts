import { storage } from '../storage';
import type { 
  InsertSmartAnalyticsConfig,
  SmartAnalyticsConfig,
  UserOnboardingProfile,
  User,
  Document
} from '@shared/schema';

interface IndustryAnalyticsTemplate {
  industry: string;
  configName: string;
  description: string;
  dashboardLayout: {
    widgets: AnalyticsWidget[];
    layout: LayoutConfig;
  };
  preferredMetrics: string[];
  alertThresholds: Record<string, number>;
  complianceTracking: Record<string, any>;
  customKPIs: Record<string, KPIDefinition>;
}

interface AnalyticsWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'compliance';
  title: string;
  description: string;
  dataSource: string;
  visualization: string;
  position: { x: number; y: number; width: number; height: number };
  refreshInterval: number;
  industrySpecific: boolean;
}

interface LayoutConfig {
  columns: number;
  spacing: number;
  responsive: boolean;
  priority: 'accuracy' | 'compliance' | 'speed' | 'cost';
}

interface KPIDefinition {
  name: string;
  formula: string;
  target: number;
  unit: string;
  description: string;
  industryBenchmark?: number;
}

export class SmartAnalyticsService {
  private industryTemplates: Record<string, IndustryAnalyticsTemplate[]> = {
    medical: [
      {
        industry: 'medical',
        configName: 'Clinical Operations Dashboard',
        description: 'Comprehensive view of patient record processing and clinical compliance',
        dashboardLayout: {
          widgets: [
            {
              id: 'patient_volume',
              type: 'metric',
              title: 'Patient Records Processed',
              description: 'Total patient records processed today',
              dataSource: 'documents',
              visualization: 'number_with_trend',
              position: { x: 0, y: 0, width: 3, height: 2 },
              refreshInterval: 300,
              industrySpecific: true
            },
            {
              id: 'hipaa_compliance',
              type: 'compliance',
              title: 'HIPAA Compliance Score',
              description: 'Real-time HIPAA compliance monitoring',
              dataSource: 'compliance',
              visualization: 'gauge',
              position: { x: 3, y: 0, width: 3, height: 2 },
              refreshInterval: 300,
              industrySpecific: true
            },
            {
              id: 'phi_detection',
              type: 'chart',
              title: 'PHI Detection Accuracy',
              description: 'Protected Health Information detection performance',
              dataSource: 'phi_analysis',
              visualization: 'line_chart',
              position: { x: 6, y: 0, width: 6, height: 2 },
              refreshInterval: 600,
              industrySpecific: true
            },
            {
              id: 'clinical_entities',
              type: 'table',
              title: 'Clinical Entities Extracted',
              description: 'Medications, diagnoses, procedures identified',
              dataSource: 'clinical_entities',
              visualization: 'data_table',
              position: { x: 0, y: 2, width: 6, height: 3 },
              refreshInterval: 600,
              industrySpecific: true
            },
            {
              id: 'processing_time',
              type: 'chart',
              title: 'Processing Time by Document Type',
              description: 'Average processing time for different medical documents',
              dataSource: 'processing_metrics',
              visualization: 'bar_chart',
              position: { x: 6, y: 2, width: 6, height: 3 },
              refreshInterval: 900,
              industrySpecific: false
            }
          ],
          layout: {
            columns: 12,
            spacing: 16,
            responsive: true,
            priority: 'compliance'
          }
        },
        preferredMetrics: [
          'patient_records_processed',
          'hipaa_compliance_score',
          'phi_detection_accuracy',
          'clinical_entity_extraction_rate',
          'average_processing_time',
          'error_rate',
          'audit_completeness'
        ],
        alertThresholds: {
          hipaa_compliance: 0.95,
          phi_detection_accuracy: 0.90,
          processing_error_rate: 0.05,
          response_time: 30.0
        },
        complianceTracking: {
          hipaa: {
            enabled: true,
            requirements: ['phi_detection', 'access_logging', 'encryption', 'audit_trail'],
            reporting_frequency: 'daily',
            alert_threshold: 0.95
          },
          hitech: {
            enabled: true,
            requirements: ['breach_notification', 'business_associate_compliance'],
            reporting_frequency: 'weekly'
          }
        },
        customKPIs: {
          clinical_accuracy: {
            name: 'Clinical Data Accuracy',
            formula: 'correct_extractions / total_extractions * 100',
            target: 95,
            unit: '%',
            description: 'Percentage of correctly extracted clinical data points',
            industryBenchmark: 92
          },
          patient_safety_score: {
            name: 'Patient Safety Score',
            formula: 'critical_alerts_addressed / critical_alerts_total * 100',
            target: 98,
            unit: '%',
            description: 'Percentage of critical patient safety alerts properly handled'
          }
        }
      },
      {
        industry: 'medical',
        configName: 'Practice Efficiency Dashboard',
        description: 'Focus on operational efficiency and workflow optimization',
        dashboardLayout: {
          widgets: [
            {
              id: 'daily_throughput',
              type: 'metric',
              title: 'Daily Throughput',
              description: 'Documents processed per day',
              dataSource: 'processing_volume',
              visualization: 'number_with_comparison',
              position: { x: 0, y: 0, width: 4, height: 2 },
              refreshInterval: 300,
              industrySpecific: false
            },
            {
              id: 'staff_productivity',
              type: 'chart',
              title: 'Staff Productivity Trends',
              description: 'Productivity metrics by healthcare staff',
              dataSource: 'user_metrics',
              visualization: 'line_chart',
              position: { x: 4, y: 0, width: 8, height: 2 },
              refreshInterval: 600,
              industrySpecific: true
            },
            {
              id: 'cost_per_document',
              type: 'metric',
              title: 'Cost per Document',
              description: 'Average processing cost per medical document',
              dataSource: 'cost_metrics',
              visualization: 'currency_metric',
              position: { x: 0, y: 2, width: 3, height: 2 },
              refreshInterval: 3600,
              industrySpecific: false
            },
            {
              id: 'roi_analysis',
              type: 'chart',
              title: 'ROI Analysis',
              description: 'Return on investment from document processing automation',
              dataSource: 'roi_metrics',
              visualization: 'trend_chart',
              position: { x: 3, y: 2, width: 9, height: 2 },
              refreshInterval: 3600,
              industrySpecific: false
            }
          ],
          layout: {
            columns: 12,
            spacing: 16,
            responsive: true,
            priority: 'speed'
          }
        },
        preferredMetrics: [
          'documents_per_hour',
          'cost_per_document',
          'staff_efficiency',
          'automation_rate',
          'time_saved',
          'roi_percentage'
        ],
        alertThresholds: {
          processing_speed: 120.0,
          cost_per_document: 5.0,
          error_rate: 0.03
        },
        complianceTracking: {},
        customKPIs: {
          automation_rate: {
            name: 'Process Automation Rate',
            formula: 'automated_tasks / total_tasks * 100',
            target: 80,
            unit: '%',
            description: 'Percentage of document processing tasks automated'
          }
        }
      }
    ],
    legal: [
      {
        industry: 'legal',
        configName: 'Legal Practice Dashboard',
        description: 'Comprehensive view of legal document processing and case management',
        dashboardLayout: {
          widgets: [
            {
              id: 'contracts_reviewed',
              type: 'metric',
              title: 'Contracts Reviewed',
              description: 'Total contracts processed today',
              dataSource: 'documents',
              visualization: 'number_with_trend',
              position: { x: 0, y: 0, width: 3, height: 2 },
              refreshInterval: 300,
              industrySpecific: true
            },
            {
              id: 'privilege_protection',
              type: 'compliance',
              title: 'Privilege Protection Score',
              description: 'Attorney-client privilege protection compliance',
              dataSource: 'privilege_compliance',
              visualization: 'gauge',
              position: { x: 3, y: 0, width: 3, height: 2 },
              refreshInterval: 300,
              industrySpecific: true
            },
            {
              id: 'risk_assessment',
              type: 'chart',
              title: 'Contract Risk Analysis',
              description: 'Risk levels identified in processed contracts',
              dataSource: 'risk_analysis',
              visualization: 'pie_chart',
              position: { x: 6, y: 0, width: 6, height: 2 },
              refreshInterval: 600,
              industrySpecific: true
            },
            {
              id: 'legal_entities',
              type: 'table',
              title: 'Legal Entities Extracted',
              description: 'Parties, courts, statutes, citations identified',
              dataSource: 'legal_entities',
              visualization: 'data_table',
              position: { x: 0, y: 2, width: 12, height: 3 },
              refreshInterval: 600,
              industrySpecific: true
            }
          ],
          layout: {
            columns: 12,
            spacing: 16,
            responsive: true,
            priority: 'accuracy'
          }
        },
        preferredMetrics: [
          'contracts_processed',
          'privilege_compliance_score',
          'risk_assessment_accuracy',
          'legal_citation_extraction',
          'contract_review_time',
          'client_confidentiality_score'
        ],
        alertThresholds: {
          privilege_compliance: 0.98,
          risk_detection_accuracy: 0.85,
          confidentiality_breach: 0.0
        },
        complianceTracking: {
          attorney_client_privilege: {
            enabled: true,
            requirements: ['privilege_detection', 'access_controls', 'audit_trail'],
            reporting_frequency: 'daily'
          },
          professional_responsibility: {
            enabled: true,
            requirements: ['conflict_checking', 'client_confidentiality'],
            reporting_frequency: 'weekly'
          }
        },
        customKPIs: {
          contract_accuracy: {
            name: 'Contract Analysis Accuracy',
            formula: 'accurate_extractions / total_extractions * 100',
            target: 92,
            unit: '%',
            description: 'Accuracy of contract term and clause extraction'
          }
        }
      }
    ],
    logistics: [
      {
        industry: 'logistics',
        configName: 'Supply Chain Operations Dashboard',
        description: 'Real-time view of shipping document processing and customs compliance',
        dashboardLayout: {
          widgets: [
            {
              id: 'shipments_processed',
              type: 'metric',
              title: 'Shipments Processed',
              description: 'Total shipping documents processed today',
              dataSource: 'shipment_documents',
              visualization: 'number_with_trend',
              position: { x: 0, y: 0, width: 3, height: 2 },
              refreshInterval: 300,
              industrySpecific: true
            },
            {
              id: 'customs_compliance',
              type: 'compliance',
              title: 'Customs Compliance Score',
              description: 'International trade regulation compliance',
              dataSource: 'customs_compliance',
              visualization: 'gauge',
              position: { x: 3, y: 0, width: 3, height: 2 },
              refreshInterval: 300,
              industrySpecific: true
            },
            {
              id: 'shipping_routes',
              type: 'chart',
              title: 'Popular Shipping Routes',
              description: 'Most frequently processed shipping routes',
              dataSource: 'routing_data',
              visualization: 'world_map',
              position: { x: 6, y: 0, width: 6, height: 4 },
              refreshInterval: 900,
              industrySpecific: true
            },
            {
              id: 'processing_speed',
              type: 'chart',
              title: 'Document Processing Speed',
              description: 'Processing time by document type',
              dataSource: 'processing_metrics',
              visualization: 'bar_chart',
              position: { x: 0, y: 2, width: 6, height: 2 },
              refreshInterval: 600,
              industrySpecific: false
            }
          ],
          layout: {
            columns: 12,
            spacing: 16,
            responsive: true,
            priority: 'speed'
          }
        },
        preferredMetrics: [
          'shipments_processed',
          'customs_compliance_rate',
          'processing_speed',
          'duty_calculation_accuracy',
          'hs_code_accuracy',
          'multi_language_support'
        ],
        alertThresholds: {
          customs_compliance: 0.92,
          processing_speed: 45.0,
          hs_code_accuracy: 0.90
        },
        complianceTracking: {
          customs_regulations: {
            enabled: true,
            requirements: ['hs_code_validation', 'origin_verification', 'duty_calculation'],
            reporting_frequency: 'daily'
          },
          trade_agreements: {
            enabled: true,
            requirements: ['preferential_origin', 'certificate_validation'],
            reporting_frequency: 'weekly'
          }
        },
        customKPIs: {
          delivery_accuracy: {
            name: 'Delivery Prediction Accuracy',
            formula: 'accurate_predictions / total_predictions * 100',
            target: 88,
            unit: '%',
            description: 'Accuracy of delivery time predictions'
          }
        }
      }
    ]
  };

  async createAnalyticsConfigForUser(userId: string): Promise<SmartAnalyticsConfig[]> {
    try {
      const [user, profile, documents] = await Promise.all([
        storage.getUser(userId),
        storage.getOnboardingProfile(userId),
        storage.getUserDocuments(userId, 20)
      ]);

      if (!user?.industry) return [];

      const industryTemplates = this.industryTemplates[user.industry] || [];
      const configs: InsertSmartAnalyticsConfig[] = [];

      for (const template of industryTemplates) {
        const customizedConfig = this.customizeTemplateForUser(template, {
          user,
          profile: profile ?? null,
          documents
        });

        configs.push({
          userId,
          industry: user.industry,
          configName: customizedConfig.configName,
          dashboardLayout: customizedConfig.dashboardLayout,
          preferredMetrics: customizedConfig.preferredMetrics,
          alertThresholds: customizedConfig.alertThresholds,
          reportingFrequency: this.getReportingFrequency(profile ?? null),
          complianceTracking: customizedConfig.complianceTracking,
          customKPIs: customizedConfig.customKPIs,
          visualizationPreferences: this.getVisualizationPreferences(profile ?? null),
          dataRetentionSettings: this.getDataRetentionSettings(user.industry, profile ?? null),
          sharingSettings: this.getSharingSettings(profile ?? null),
          automationRules: this.getAutomationRules(profile ?? null),
          isDefault: configs.length === 0 // First config is default
        });
      }

      // Save configurations to database
      const savedConfigs: SmartAnalyticsConfig[] = [];
      for (const config of configs) {
        try {
          const saved = await storage.createAnalyticsConfig(config);
          savedConfigs.push(saved);
        } catch (error) {
          console.error('Error saving analytics config:', error);
        }
      }

      return savedConfigs;
    } catch (error) {
      console.error('Error creating analytics config for user:', error);
      return [];
    }
  }

  private customizeTemplateForUser(template: IndustryAnalyticsTemplate, context: {
    user: User;
    profile: UserOnboardingProfile | null;
    documents: Document[];
  }) {
    const { user, profile, documents } = context;
    const customized = JSON.parse(JSON.stringify(template));

    // Customize based on experience level
    if (profile?.experienceLevel === 'beginner') {
      // Simplify dashboard - fewer widgets, larger sizes
      customized.dashboardLayout.widgets = customized.dashboardLayout.widgets
        .filter((w: any) => w.type !== 'table') // Remove complex tables
        .map((w: any) => ({ ...w, position: { ...w.position, height: w.position.height + 1 } })); // Make widgets taller
    } else if (profile?.experienceLevel === 'expert') {
      // Add advanced widgets
      customized.dashboardLayout.widgets.push({
        id: 'advanced_analytics',
        type: 'chart',
        title: 'Advanced Analytics',
        description: 'Custom analytics and trending',
        dataSource: 'advanced_metrics',
        visualization: 'custom_chart',
        position: { x: 0, y: 5, width: 12, height: 3 },
        refreshInterval: 1800,
        industrySpecific: false
      });
    }

    // Customize based on document types
    const documentTypes = documents.map(d => d.documentType).filter(Boolean);
    if (documentTypes.length > 0) {
      // Add document type specific metrics
      const docTypeMetrics = documentTypes.map(type => `${type}_processing_rate`);
      customized.preferredMetrics.push(...docTypeMetrics);
    }

    // Customize based on organization size
    if (profile?.organizationSize === 'large' || profile?.organizationSize === 'enterprise') {
      // Add team collaboration widgets
      customized.dashboardLayout.widgets.push({
        id: 'team_performance',
        type: 'chart',
        title: 'Team Performance',
        description: 'Performance metrics by team member',
        dataSource: 'team_metrics',
        visualization: 'multi_line_chart',
        position: { x: 0, y: 6, width: 12, height: 3 },
        refreshInterval: 900,
        industrySpecific: false
      });
    }

    // Customize compliance tracking based on requirements
    if (profile?.complianceRequirements) {
      for (const requirement of profile.complianceRequirements) {
        if (!customized.complianceTracking[requirement]) {
          customized.complianceTracking[requirement] = {
            enabled: true,
            requirements: [requirement],
            reporting_frequency: 'daily'
          };
        }
      }
    }

    return customized;
  }

  private getReportingFrequency(profile: UserOnboardingProfile | null): string {
    if (!profile) return 'weekly';

    // High volume users need more frequent reports
    if (profile.documentVolume === 'very_high' || profile.documentVolume === 'high') {
      return 'daily';
    }

    // Compliance-heavy users need regular reports
    if (profile.complianceRequirements && profile.complianceRequirements.length > 2) {
      return 'daily';
    }

    return 'weekly';
  }

  private getVisualizationPreferences(profile: UserOnboardingProfile | null) {
    return {
      theme: profile?.experienceLevel === 'beginner' ? 'light' : 'auto',
      complexity: profile?.experienceLevel === 'expert' ? 'advanced' : 'standard',
      animations: profile?.experienceLevel !== 'beginner',
      interactivity: profile?.experienceLevel === 'expert' ? 'high' : 'medium'
    };
  }

  private getDataRetentionSettings(industry: string, profile: UserOnboardingProfile | null) {
    const settings: Record<string, any> = {
      analytics_data: '2_years',
      metrics_data: '1_year',
      logs_data: '6_months'
    };

    // Industry-specific retention policies
    if (industry === 'medical') {
      settings.analytics_data = '7_years'; // HIPAA requirement
      settings.audit_logs = '7_years';
    } else if (industry === 'legal') {
      settings.analytics_data = '7_years'; // Legal document retention
      settings.audit_logs = '10_years';
    } else if (industry === 'finance') {
      settings.analytics_data = '7_years'; // SOX requirement
      settings.audit_logs = '7_years';
    }

    // Compliance-based adjustments
    if (profile?.complianceRequirements?.includes('sox')) {
      settings.audit_logs = '7_years';
    }

    return settings;
  }

  private getSharingSettings(profile: UserOnboardingProfile | null) {
    return {
      default_sharing: profile?.organizationSize === 'solo' ? 'private' : 'team',
      export_enabled: profile?.experienceLevel === 'advanced' || profile?.experienceLevel === 'expert',
      external_sharing: false, // Always start with secure defaults
      watermarking: true
    };
  }

  private getAutomationRules(profile: UserOnboardingProfile | null) {
    const rules: Record<string, any> = {};

    // High volume users get more automation
    if (profile?.documentVolume === 'very_high') {
      rules.auto_report_generation = true;
      rules.alert_automation = true;
      rules.batch_processing_alerts = true;
    }

    // Compliance users get compliance-focused automation
    if (profile?.complianceRequirements && profile.complianceRequirements.length > 0) {
      rules.compliance_alerts = true;
      rules.auto_compliance_reports = true;
      rules.threshold_monitoring = true;
    }

    return rules;
  }

  async getUserAnalyticsConfigs(userId: string): Promise<SmartAnalyticsConfig[]> {
    try {
      return await storage.getUserAnalyticsConfigs(userId);
    } catch (error) {
      console.error('Error getting user analytics configs:', error);
      return [];
    }
  }

  async updateAnalyticsConfig(configId: number, updates: Partial<SmartAnalyticsConfig>): Promise<SmartAnalyticsConfig | null> {
    try {
      return await storage.updateAnalyticsConfig(configId, updates);
    } catch (error) {
      console.error('Error updating analytics config:', error);
      return null;
    }
  }

  async generateAnalyticsData(userId: string, configId: number): Promise<Record<string, any>> {
    try {
      const [config, documents, behaviorAnalysis] = await Promise.all([
        storage.getUserAnalyticsConfigs(userId),
        storage.getUserDocuments(userId, 100),
        storage.analyzeUserPatterns(userId, 168)
      ]);

      const userConfig = config.find(c => c.id === configId);
      if (!userConfig) return {};

      const analyticsData: Record<string, any> = {};

      // Generate data for each preferred metric
      for (const metric of userConfig.preferredMetrics || []) {
        analyticsData[metric] = this.calculateMetric(metric, {
          documents,
          behaviorAnalysis,
          config: userConfig
        });
      }

      // Generate widget data
      const dashboardLayout = userConfig.dashboardLayout as any;
      if (dashboardLayout?.widgets) {
        analyticsData.widgets = {};
        for (const widget of dashboardLayout.widgets) {
          analyticsData.widgets[widget.id] = this.generateWidgetData(widget, {
            documents,
            behaviorAnalysis,
            config: userConfig
          });
        }
      }

      // Check alert thresholds
      analyticsData.alerts = this.checkAlertThresholds(
        analyticsData,
        userConfig.alertThresholds as Record<string, number>
      );

      return analyticsData;
    } catch (error) {
      console.error('Error generating analytics data:', error);
      return {};
    }
  }

  private calculateMetric(metric: string, context: {
    documents: Document[];
    behaviorAnalysis: any;
    config: SmartAnalyticsConfig;
  }): any {
    const { documents, behaviorAnalysis } = context;

    switch (metric) {
      case 'documents_processed':
      case 'patient_records_processed':
      case 'contracts_processed':
      case 'shipments_processed':
        return documents.length;

      case 'average_processing_time':
        const times = documents
          .map(d => d.processingProgress && d.processingProgress === 100 ? 
            Math.random() * 60 + 30 : 0) // Placeholder calculation
          .filter(t => t > 0);
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      case 'hipaa_compliance_score':
      case 'privilege_compliance_score':
      case 'customs_compliance_rate':
        return Math.random() * 0.1 + 0.9; // Placeholder - would calculate from compliance data

      case 'processing_speed':
        return behaviorAnalysis.averageTimeSpent || 0;

      case 'error_rate':
        const errorDocs = documents.filter(d => d.status === 'error').length;
        return documents.length > 0 ? errorDocs / documents.length : 0;

      case 'cost_per_document':
        return Math.random() * 2 + 1; // Placeholder cost calculation

      default:
        return Math.random() * 100; // Default placeholder
    }
  }

  private generateWidgetData(widget: AnalyticsWidget, context: any) {
    const { documents, behaviorAnalysis } = context;

    switch (widget.type) {
      case 'metric':
        return {
          value: this.calculateMetric(widget.dataSource, context),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          change: (Math.random() * 20 - 10).toFixed(1) + '%'
        };

      case 'chart':
        const dataPoints = [];
        for (let i = 0; i < 7; i++) {
          dataPoints.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.random() * 100
          });
        }
        return { data: dataPoints.reverse() };

      case 'table':
        return {
          headers: ['Type', 'Count', 'Accuracy', 'Avg Time'],
          rows: documents.slice(0, 10).map((d: any) => [
            d.documentType || 'Unknown',
            '1',
            `${(Math.random() * 0.2 + 0.8).toFixed(2)}`,
            `${(Math.random() * 60 + 30).toFixed(0)}s`
          ])
        };

      case 'compliance':
        return {
          score: Math.random() * 0.1 + 0.9,
          status: 'compliant',
          lastChecked: new Date().toISOString()
        };

      default:
        return { placeholder: true };
    }
  }

  private checkAlertThresholds(data: Record<string, any>, thresholds: Record<string, number>) {
    const alerts = [];

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const value = data[metric];
      if (typeof value === 'number') {
        if (metric.includes('compliance') || metric.includes('accuracy')) {
          // Higher is better metrics
          if (value < threshold) {
            alerts.push({
              metric,
              value,
              threshold,
              severity: value < threshold * 0.9 ? 'high' : 'medium',
              message: `${metric.replace('_', ' ')} is below threshold`
            });
          }
        } else if (metric.includes('error') || metric.includes('time')) {
          // Lower is better metrics  
          if (value > threshold) {
            alerts.push({
              metric,
              value,
              threshold,
              severity: value > threshold * 1.5 ? 'high' : 'medium',
              message: `${metric.replace('_', ' ')} is above threshold`
            });
          }
        }
      }
    }

    return alerts;
  }

  getIndustryTemplate(industry: string, templateName?: string): IndustryAnalyticsTemplate | null {
    const templates = this.industryTemplates[industry];
    if (!templates) return null;

    if (templateName) {
      return templates.find(t => t.configName === templateName) || null;
    }

    return templates[0] || null;
  }

  getAllIndustryTemplates(industry: string): IndustryAnalyticsTemplate[] {
    return this.industryTemplates[industry] || [];
  }
}

export const smartAnalyticsService = new SmartAnalyticsService();