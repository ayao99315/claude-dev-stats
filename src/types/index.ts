/**
 * 全局类型定义导出
 */

export * from './config';
export * from './data-sources';
export * from './usage-data';
export * from './errors';

// 分析模块类型（只导出非重复的类型）
export type { 
  BasicStats as AnalyticsBasicStats, 
  EfficiencyMetrics as AnalyticsEfficiencyMetrics,
  TrendAnalysis as AnalyticsTrendAnalysis,
  SmartInsights,
  ToolUsageAnalysis,
  AnalysisRequest,
  AnalysisResult,
  AnalyticsConfig
} from './analytics';

// 报告模块类型（只导出非重复的类型）
export type {
  ReportConfig as ReportsConfig,
  ReportFormat as ReportsFormat,
  Language as ReportsLanguage,
  ReportType,
  ReportTemplate,
  ReportGenerator as IReportGenerator,
  Report,
  ReportSection,
  ReportHeader,
  ReportFooter
} from './reports';

// TODO: 以下类型将在后续任务中实现
// export * from './commands';