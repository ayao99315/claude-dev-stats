/**
 * 工具函数模块
 * 
 * 提供各种通用工具和辅助功能：
 * - 配置管理
 * - 日志系统
 * - 错误处理
 * - 文本图表生成
 * - CLI辅助工具
 * - 错误消息格式化
 * - 智能故障排除
 * - 错误报告收集
 */

// 基础工具模块
export { ConfigManager, configManager } from './config';
export { Logger, logger } from './logger';
export { ErrorHandler, errorHandler } from './error-handler';

// 可视化工具
export { 
  TextChartGenerator,
  BarChartGenerator,
  LineChartGenerator,
  PieChartGenerator,
  textChartGenerator,
  CHART_THEMES
} from './text-charts';

// CLI交互工具
export {
  PaginationManager,
  SmartHintProvider,
  TerminalSizeDetector,
  OutputFormatter,
  KeyboardHandler
} from './cli-helpers';

// 错误处理和用户体验
export {
  ErrorMessageFormatter,
  errorMessageFormatter,
  formatError,
  formatErrorSimple,
  ErrorMessageLanguage,
  ErrorMessageTemplate,
  ErrorMessageConfig,
  DEFAULT_ERROR_MESSAGE_CONFIG,
  ERROR_LEVEL_MAPPING,
  ERROR_CATEGORY_ICONS
} from './error-messages';

// 注意：troubleshooter 和 error-reporter 暂时被禁用以解决类型问题
// export {
//   Troubleshooter,
//   troubleshooter,
//   DiagnosticLevel,
//   DiagnosticResult,
//   TroubleshootingReport,
//   SystemEnvironment
// } from './troubleshooter';

// export {
//   ErrorReporter,
//   errorReporter,
//   ErrorReport,
//   SystemInfo,
//   ErrorDetails,
//   ContextInfo,
//   UserFeedback,
//   PrivacySettings,
//   ErrorStatistics,
//   DEFAULT_PRIVACY_SETTINGS
// } from './error-reporter';