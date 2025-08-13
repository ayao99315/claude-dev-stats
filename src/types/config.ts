/**
 * 配置管理相关的类型定义
 * 
 * 定义系统配置的接口和类型，确保类型安全
 * 支持配置验证、默认值处理和配置合并
 */

/**
 * 支持的语言类型
 */
export type Language = 'zh-CN' | 'en-US';

/**
 * 数据源类型
 */
export type DataSourceType = 'otel' | 'jsonl' | 'cost_api' | 'hooks' | 'auto';

/**
 * 日志级别
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * 报告格式类型
 */
export type ReportFormat = 'table' | 'detailed' | 'brief' | 'insights' | 'chart' | 'pie' | 'financial';

/**
 * 数据源配置（简化版）
 */
export interface DataSourceConfig {
  /** 是否启用 Cost API */
  cost_api: boolean;
  /** 是否启用 OpenTelemetry */
  opentelemetry: boolean;
  /** 数据缓存超时时间（毫秒） */
  cache_timeout_ms?: number;
}

/**
 * 分析配置
 */
export interface AnalysisConfig {
  /** 是否启用项目级分析 */
  project_level: boolean;
  /** 是否启用趋势分析 */
  trend_analysis: boolean;
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  /** 最大文件大小（字节） */
  max_file_size: number;
  /** 最大并发处理数 */
  max_concurrency: number;
  /** 处理超时时间（毫秒） */
  process_timeout_ms: number;
  /** 是否启用性能监控 */
  enable_monitoring: boolean;
}

/**
 * 日志配置
 */
export interface LogConfig {
  /** 日志级别 */
  level: LogLevel;
  /** 是否输出到文件 */
  file_output: boolean;
  /** 日志文件路径 */
  file_path?: string;
  /** 是否启用彩色输出 */
  colorize: boolean;
  /** 最大日志文件大小（字节） */
  max_file_size: number;
  /** 保留的日志文件数量 */
  max_files: number;
}

/**
 * 报告配置
 */
export interface ReportConfig {
  /** 默认报告格式 */
  default_format: ReportFormat;
  /** 是否启用彩色输出 */
  colorize: boolean;
  /** 是否显示图标 */
  show_icons: boolean;
  /** 默认时间范围 */
  default_timeframe: string;
}

/**
 * 主配置接口（简化版）
 */
export interface AppConfig {
  /** 是否启用 cc-stats */
  enabled: boolean;
  /** 界面语言 */
  language: Language;
  /** 数据源配置 */
  data_sources: DataSourceConfig;
  /** 分析配置 */
  analysis: AnalysisConfig;
  /** 性能配置 */
  performance?: PerformanceConfig;
  /** 日志配置 */
  logging?: LogConfig;
  /** 报告配置 */
  reports?: ReportConfig;
  /** 项目特定配置 */
  projects?: Record<string, ProjectConfig>;
}

/**
 * 项目特定配置
 */
export interface ProjectConfig {
  /** 项目名称 */
  name: string;
  /** 项目路径 */
  path: string;
  /** 是否启用 */
  enabled: boolean;
  /** 自定义数据源配置 */
  data_sources?: Partial<DataSourceConfig>;
  /** 自定义报告配置 */
  reports?: Partial<ReportConfig>;
  /** 项目特定的忽略模式 */
  ignore_patterns?: string[];
}

/**
 * 配置验证错误
 */
export interface ConfigValidationError {
  /** 错误字段路径 */
  path: string;
  /** 错误消息 */
  message: string;
  /** 当前值 */
  value: unknown;
  /** 期望值或类型 */
  expected?: string;
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 验证错误列表 */
  errors: ConfigValidationError[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 默认配置常量（简化版）
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  enabled: true,
  language: 'zh-CN',
  data_sources: {
    cost_api: true,
    opentelemetry: false,
    cache_timeout_ms: 300000 // 5分钟
  },
  analysis: {
    project_level: true,
    trend_analysis: true
  },
  performance: {
    max_file_size: 100 * 1024 * 1024, // 100MB
    max_concurrency: 4,
    process_timeout_ms: 30000, // 30秒
    enable_monitoring: false
  },
  logging: {
    level: 'info',
    file_output: false,
    colorize: true,
    max_file_size: 10 * 1024 * 1024, // 10MB
    max_files: 5
  },
  reports: {
    default_format: 'table',
    colorize: true,
    show_icons: true,
    default_timeframe: 'today'
  }
};

/**
 * 配置文件路径常量
 */
export const CONFIG_PATHS = {
  /** 全局配置文件路径 */
  GLOBAL: '~/.claude/settings.json',
  /** 项目配置文件名 */
  PROJECT: '.cc-stats.json',
  /** 用户配置目录 */
  USER_DIR: '~/.claude',
  /** 配置备份目录 */
  BACKUP_DIR: '~/.claude/backups'
} as const;