/**
 * 报告生成模块类型定义
 * 定义报告格式、模板和生成器的核心数据结构
 */

/**
 * 报告类型枚举
 */
export type ReportType = 
  | 'daily'      // 日报
  | 'weekly'     // 周报
  | 'monthly'    // 月报
  | 'project'    // 项目报告
  | 'efficiency' // 效率分析报告
  | 'trends'     // 趋势分析报告
  | 'tools'      // 工具使用报告
  | 'cost'       // 成本分析报告
  | 'insights';  // 智能洞察报告

/**
 * 报告输出格式
 */
export type ReportFormat =
  | 'table'      // 表格格式
  | 'detailed'   // 详细格式
  | 'brief'      // 简要格式
  | 'insights'   // 洞察格式
  | 'chart'      // 图表格式
  | 'pie'        // 饼图格式
  | 'financial'  // 财务格式
  | 'json'       // JSON格式
  | 'markdown';  // Markdown格式

/**
 * 语言类型
 */
export type Language = 'zh-CN' | 'en-US';

/**
 * 报告配置接口
 */
export interface ReportConfig {
  /** 报告类型 */
  type: ReportType;
  /** 输出格式 */
  format: ReportFormat;
  /** 语言设置 */
  language: Language;
  /** 是否包含图表 */
  include_charts: boolean;
  /** 是否包含洞察 */
  include_insights: boolean;
  /** 自定义配置 */
  custom_options?: Record<string, any>;
}

/**
 * 报告模板接口
 */
export interface ReportTemplate {
  /** 模板名称 */
  name: string;
  /** 模板类型 */
  type: ReportType;
  /** 支持的格式 */
  supported_formats: ReportFormat[];
  /** 模板渲染函数 */
  render: (data: any, config: ReportConfig) => string;
  /** 模板描述 */
  description?: string;
}

/**
 * 表格配置
 */
export interface TableConfig {
  /** 表格列定义 */
  columns: TableColumn[];
  /** 是否显示边框 */
  border: boolean;
  /** 表格标题 */
  title?: string;
  /** 表格样式 */
  style?: 'ascii' | 'unicode' | 'compact';
}

/**
 * 表格列定义
 */
export interface TableColumn {
  /** 列标识 */
  key: string;
  /** 列标题 */
  title: string;
  /** 列宽度 */
  width?: number;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 数据格式化函数 */
  formatter?: (value: any) => string;
}

/**
 * 图表配置
 */
export interface ChartConfig {
  /** 图表类型 */
  type: 'bar' | 'line' | 'pie' | 'histogram';
  /** 图表标题 */
  title: string;
  /** 图表宽度（字符数） */
  width: number;
  /** 图表高度（行数） */
  height: number;
  /** 颜色主题 */
  colors?: string[];
  /** 是否显示图例 */
  show_legend: boolean;
}

/**
 * 文本图表数据
 */
export interface TextChartData {
  /** 数据标签 */
  labels: string[];
  /** 数据值 */
  values: number[];
  /** 数据单位 */
  unit?: string;
}

/**
 * 报告部分接口
 */
export interface ReportSection {
  /** 部分标题 */
  title: string;
  /** 部分内容 */
  content: string | TableConfig | ChartConfig;
  /** 部分类型 */
  type: 'text' | 'table' | 'chart' | 'list' | 'metrics';
  /** 是否可选 */
  optional?: boolean;
  /** 条件渲染函数 */
  condition?: (data: any) => boolean;
}

/**
 * 完整报告结构
 */
export interface Report {
  /** 报告标题 */
  title: string;
  /** 报告副标题 */
  subtitle?: string;
  /** 报告头部信息 */
  header: ReportHeader;
  /** 报告主体部分 */
  sections: ReportSection[];
  /** 报告尾部信息 */
  footer: ReportFooter;
  /** 生成配置 */
  config: ReportConfig;
}

/**
 * 报告头部信息
 */
export interface ReportHeader {
  /** 项目名称 */
  project_name: string;
  /** 时间范围 */
  timeframe: string;
  /** 数据来源 */
  data_source: string;
  /** 生成时间 */
  generated_at: string;
  /** 数据质量 */
  data_quality?: number;
}

/**
 * 报告尾部信息
 */
export interface ReportFooter {
  /** 版本信息 */
  version: string;
  /** 联系信息 */
  contact?: string;
  /** 免责声明 */
  disclaimer?: string;
  /** 额外说明 */
  notes?: string[];
}

/**
 * 指标卡片配置
 */
export interface MetricCard {
  /** 指标标题 */
  title: string;
  /** 指标值 */
  value: string | number;
  /** 指标单位 */
  unit?: string;
  /** 变化趋势 */
  trend?: 'up' | 'down' | 'stable';
  /** 趋势值 */
  trend_value?: number;
  /** 指标描述 */
  description?: string;
  /** 指标图标 */
  icon?: string;
}

/**
 * 洞察卡片配置
 */
export interface InsightCard {
  /** 洞察类型 */
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  /** 洞察标题 */
  title: string;
  /** 洞察内容 */
  content: string;
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 行动建议 */
  action?: string;
  /** 相关指标 */
  related_metrics?: string[];
}

/**
 * 报告导出选项
 */
export interface ExportOptions {
  /** 文件名 */
  filename?: string;
  /** 输出目录 */
  output_dir?: string;
  /** 是否压缩 */
  compress?: boolean;
  /** 额外的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 报告缓存配置
 */
export interface ReportCacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存过期时间（毫秒） */
  ttl: number;
  /** 缓存键前缀 */
  key_prefix: string;
  /** 最大缓存大小 */
  max_size: number;
}

/**
 * 报告生成器接口
 */
export interface ReportGenerator {
  /**
   * 生成报告
   */
  generateReport(
    data: any,
    config: ReportConfig
  ): Promise<string>;

  /**
   * 注册报告模板
   */
  registerTemplate(template: ReportTemplate): void;

  /**
   * 获取支持的报告类型
   */
  getSupportedTypes(): ReportType[];

  /**
   * 获取支持的格式
   */
  getSupportedFormats(type: ReportType): ReportFormat[];

  /**
   * 导出报告到文件
   */
  exportReport(
    report: string,
    options: ExportOptions
  ): Promise<string>;
}

/**
 * 双语文本配置
 */
export interface BilingualText {
  'zh-CN': string;
  'en-US': string;
}

/**
 * 模板渲染上下文
 */
export interface RenderContext {
  /** 原始数据 */
  data: any;
  /** 报告配置 */
  config: ReportConfig;
  /** 语言设置 */
  language: Language;
  /** 时间戳 */
  timestamp: string;
  /** 辅助函数 */
  helpers: {
    formatNumber: (num: number, precision?: number) => string;
    formatPercent: (num: number) => string;
    formatTime: (hours: number) => string;
    formatCost: (cost: number) => string;
    t: (key: string) => string; // 国际化翻译函数
  };
}

/**
 * 报告验证结果
 */
export interface ReportValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
  /** 验证详情 */
  details?: Record<string, any>;
}