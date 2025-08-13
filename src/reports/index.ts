/**
 * 报告生成系统模块
 * 
 * 负责生成各种格式的统计报告：
 * - 中英文双语支持
 * - 多种输出格式（表格、详细、简要等）
 * - 文本图表可视化
 * - 报告模板管理
 * - 缓存机制和性能优化
 */

// 导出主要组件
export { ReportGenerator, reportGenerator } from './generator';
export { 
  ReportTemplates, 
  ReportTemplateGenerator,
  BilingualTextManager,
  ReportFormatter,
  reportTemplates,
  reportTemplateGenerator,
  bilingualTextManager
} from './templates';

// 导出类型定义
export * from '../types/reports';