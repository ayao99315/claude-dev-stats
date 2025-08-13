/**
 * Claude Code 智能开发统计与分析工具 - 主入口文件
 * 
 * 基于 TypeScript + Node.js 技术栈
 * 提供项目级别的开发统计与效率分析
 * 
 * @author Claude Code Stats Team
 * @version 1.0.0
 */

// 基础模块导出
export * from './types';
export * from './utils/config';
export * from './utils/logger';
export * from './utils/error-handler';

// 主要组件导出（基础设施）
export { ConfigManager, configManager } from './utils/config';
export { Logger, logger } from './utils/logger';
export { ErrorHandler, errorHandler } from './utils/error-handler';

// 数据源管理
export { SimplifiedDataManager } from './data-sources/simplified-manager';

// 分析引擎（已实现）
export { 
  AnalyticsEngine,
  analyticsEngine,
  BasicStatsCalculator,
  EfficiencyCalculator,
  CodeEstimator,
  TrendsAnalyzer,
  AdvancedTrendsAnalyzer,
  InsightsGenerator,
  RecommendationEngine
} from './analytics';

// TODO: 以下组件将在后续任务中实现
// export { CommandInterface } from './commands/cli';
// export { ReportGenerator } from './reports/generator';

/**
 * 版本信息
 */
export const VERSION = '1.0.0';

/**
 * 应用程序名称
 */
export const APP_NAME = 'Claude Code Stats';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  language: 'zh-CN' as const,
  dataSource: 'auto' as const,
  enableCache: true,
  cacheTimeoutMs: 300000, // 5分钟缓存
  maxFileSize: 100 * 1024 * 1024, // 100MB 最大文件大小
  logLevel: 'info' as const
};