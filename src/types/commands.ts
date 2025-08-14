/**
 * 命令行接口类型定义
 * 支持所有 /stats 系列 slash commands
 */

export interface CommandOptions {
  /** 项目路径，默认为当前目录 */
  project?: string;
  /** 时间范围：today|week|month|custom */
  timeframe?: 'today' | 'week' | 'month' | 'custom';
  /** 自定义时间范围起始日期 (YYYY-MM-DD) */
  from?: string;
  /** 自定义时间范围结束日期 (YYYY-MM-DD) */
  to?: string;
  /** 输出格式：table|detailed|summary|json|chart */
  format?: 'table' | 'detailed' | 'summary' | 'json' | 'chart';
  /** 输出语言：zh-CN|en-US */
  language?: 'zh-CN' | 'en-US';
  /** 输出文件路径 */
  output?: string;
  /** 启用详细模式 */
  verbose?: boolean;
  /** 禁用彩色输出 */
  noColor?: boolean;
  /** 包含的分析类型 */
  include?: string[];
  /** 排除的分析类型 */
  exclude?: string[];
}

export interface StatsCommandOptions extends CommandOptions {
  /** 比较上一时间段数据 */
  compare?: boolean;
  /** 仅显示摘要信息 */
  summary?: boolean;
  /** 显示趋势分析 */
  trends?: boolean;
  /** 包含智能洞察 */
  insights?: boolean;
}

export interface ToolsCommandOptions extends CommandOptions {
  /** 排序方式：usage|efficiency|time */
  sortBy?: 'usage' | 'efficiency' | 'time';
  /** 显示前N个工具 */
  top?: number;
  /** 仅显示低效工具 */
  inefficient?: boolean;
}

export interface CostCommandOptions extends CommandOptions {
  /** 成本分析粒度：hourly|daily|tool-based */
  breakdown?: 'hourly' | 'daily' | 'tool-based';
  /** 显示成本优化建议 */
  recommendations?: boolean;
  /** 货币单位 */
  currency?: 'USD' | 'CNY';
}

export interface CompareCommandOptions extends CommandOptions {
  /** 比较的基准时间段 */
  baseline?: 'previous-week' | 'previous-month' | 'custom';
  /** 比较的基准日期范围 */
  baselineFrom?: string;
  baselineTo?: string;
  /** 显示变化百分比 */
  percentage?: boolean;
}

export interface TrendsCommandOptions extends CommandOptions {
  /** 趋势分析类型：productivity|cost|usage|tools */
  type?: 'productivity' | 'cost' | 'usage' | 'tools';
  /** 数据聚合粒度：daily|weekly|monthly */
  granularity?: 'daily' | 'weekly' | 'monthly';
  /** 预测未来N天 */
  forecast?: number;
}

export interface ExportCommandOptions extends CommandOptions {
  /** 导出类型：all|stats|trends|insights */
  type?: 'all' | 'stats' | 'trends' | 'insights';
  /** 导出格式：json|csv|xlsx|pdf */
  exportFormat?: 'json' | 'csv' | 'xlsx' | 'pdf';
  /** 包含图表 */
  includeCharts?: boolean;
}

/**
 * 命令执行结果
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  executionTime?: number;
}

/**
 * 命令元数据
 */
export interface CommandMeta {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  options: {
    flag: string;
    description: string;
    type: 'string' | 'number' | 'boolean';
    default?: any;
    choices?: string[];
  }[];
}

/**
 * 可用的所有命令
 */
export const AVAILABLE_COMMANDS = {
  'stats': {
    name: 'stats',
    description: '显示综合开发统计数据',
    aliases: ['st', 's']
  },
  'stats:basic': {
    name: 'stats:basic',
    description: '显示基础统计信息',
    aliases: ['basic', 'b']
  },
  'stats:efficiency': {
    name: 'stats:efficiency',
    description: '显示效率分析数据',
    aliases: ['eff', 'e']
  },
  'stats:tools': {
    name: 'stats:tools',
    description: '显示工具使用分析',
    aliases: ['tools', 't']
  },
  'stats:cost': {
    name: 'stats:cost',
    description: '显示成本分析数据',
    aliases: ['cost', 'c']
  },
  'stats:compare': {
    name: 'stats:compare',
    description: '比较不同时间段的数据',
    aliases: ['comp', 'cmp']
  },
  'stats:trends': {
    name: 'stats:trends',
    description: '显示历史趋势分析',
    aliases: ['trend', 'tr']
  },
  'stats:insights': {
    name: 'stats:insights',
    description: '显示智能洞察和建议',
    aliases: ['insight', 'ai']
  },
  'stats:export': {
    name: 'stats:export',
    description: '导出统计数据到文件',
    aliases: ['export', 'exp']
  },
  'stats:check': {
    name: 'stats:check',
    description: '检查数据源可用性',
    aliases: ['check', 'status']
  }
} as const;

export type CommandName = keyof typeof AVAILABLE_COMMANDS;

/**
 * 参数验证错误
 */
export class ParameterValidationError extends Error {
  constructor(
    public parameter: string,
    public value: any,
    public expectedType: string,
    message?: string
  ) {
    super(message || `参数 ${parameter} 的值 ${value} 不符合期望的类型 ${expectedType}`);
    this.name = 'ParameterValidationError';
  }
}

/**
 * 命令执行错误
 */
export class CommandExecutionError extends Error {
  constructor(
    public command: string,
    public originalError?: Error,
    message?: string
  ) {
    super(message || `命令 ${command} 执行失败: ${originalError?.message || '未知错误'}`);
    this.name = 'CommandExecutionError';
  }
}

/**
 * 参数验证器接口
 */
export interface ParameterValidator {
  /**
   * 验证命令选项
   * @param options 原始选项
   * @param commandName 命令名称
   * @returns 验证后的选项
   */
  validateOptions(options: any, commandName: CommandName): CommandOptions;
  
  /**
   * 验证时间范围
   * @param timeframe 时间范围
   * @param from 起始日期
   * @param to 结束日期
   */
  validateTimeframe(timeframe?: string, from?: string, to?: string): void;
  
  /**
   * 验证输出格式
   * @param format 输出格式
   */
  validateFormat(format?: string): void;
}

/**
 * 命令补全提供者接口
 */
export interface CommandCompletion {
  /**
   * 获取命令补全建议
   * @param partial 部分输入的命令
   * @returns 补全建议数组
   */
  getCommandCompletions(partial: string): string[];
  
  /**
   * 获取选项补全建议
   * @param command 命令名称
   * @param option 选项名称
   * @param partial 部分输入的值
   * @returns 补全建议数组
   */
  getOptionCompletions(command: string, option: string, partial: string): string[];
}