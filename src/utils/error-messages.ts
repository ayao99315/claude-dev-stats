/**
 * 统一错误消息格式系统
 * 
 * 提供标准化的错误消息格式，包括：
 * - 双语错误消息模板
 * - 错误级别对应的图标和颜色
 * - 结构化错误信息展示
 * - 上下文相关的错误说明
 */

import { AppError, ErrorLevel, ErrorCategory, ErrorCode } from '../types/errors';

/**
 * 错误消息语言
 */
export type ErrorMessageLanguage = 'zh-CN' | 'en';

/**
 * 错误消息模板
 */
export interface ErrorMessageTemplate {
  title: string;
  description: string;
  suggestion?: string;
  icon: string;
  color: string;
}

/**
 * 错误消息配置
 */
export interface ErrorMessageConfig {
  language: ErrorMessageLanguage;
  showSuggestions: boolean;
  showContext: boolean;
  colorOutput: boolean;
  includeErrorCode: boolean;
  maxDescriptionLength: number;
}

/**
 * 默认错误消息配置
 */
export const DEFAULT_ERROR_MESSAGE_CONFIG: ErrorMessageConfig = {
  language: 'zh-CN',
  showSuggestions: true,
  showContext: true,
  colorOutput: true,
  includeErrorCode: true,
  maxDescriptionLength: 200
};

/**
 * 错误级别图标和颜色映射
 */
export const ERROR_LEVEL_MAPPING = {
  [ErrorLevel.FATAL]: {
    icon: '💥',
    color: '\x1b[91m', // 亮红色
    priority: 4
  },
  [ErrorLevel.ERROR]: {
    icon: '❌',
    color: '\x1b[31m', // 红色
    priority: 3
  },
  [ErrorLevel.WARNING]: {
    icon: '⚠️',
    color: '\x1b[33m', // 黄色
    priority: 2
  },
  [ErrorLevel.INFO]: {
    icon: 'ℹ️',
    color: '\x1b[36m', // 青色
    priority: 1
  }
};

/**
 * 错误类别图标映射
 */
export const ERROR_CATEGORY_ICONS = {
  [ErrorCategory.CONFIGURATION]: '⚙️',
  [ErrorCategory.DATA_SOURCE]: '📊',
  [ErrorCategory.FILE_SYSTEM]: '📁',
  [ErrorCategory.VALIDATION]: '✅',
  [ErrorCategory.NETWORK]: '🌐',
  [ErrorCategory.PARSING]: '📄',
  [ErrorCategory.PERMISSION]: '🔒',
  [ErrorCategory.USER_INPUT]: '👤',
  [ErrorCategory.USER]: '👤',
  [ErrorCategory.SYSTEM]: '💻',
  [ErrorCategory.UNKNOWN]: '❓'
};

/**
 * 错误消息模板库 - 中文
 */
const ERROR_TEMPLATES_ZH: Record<string, ErrorMessageTemplate> = {
  // 配置相关错误
  [ErrorCode.CONFIG_NOT_FOUND]: {
    title: '配置文件未找到',
    description: '无法找到Claude Code配置文件。系统需要配置文件来正常工作。',
    suggestion: '运行 `claude config init` 创建默认配置，或检查 ~/.claude/settings.json 是否存在。',
    icon: '⚙️',
    color: '\x1b[33m'
  },
  [ErrorCode.CONFIG_PARSE_FAILED]: {
    title: '配置文件解析失败',
    description: '配置文件格式不正确或包含无效的JSON语法。',
    suggestion: '检查配置文件语法，或运行 `claude config validate` 验证配置。',
    icon: '⚙️',
    color: '\x1b[31m'
  },
  [ErrorCode.CONFIG_VALIDATION_FAILED]: {
    title: '配置验证失败',
    description: '配置文件包含无效的配置项或缺少必需的字段。',
    suggestion: '查看错误详情，修正配置项，或运行 `claude config reset` 重置为默认配置。',
    icon: '⚙️',
    color: '\x1b[31m'
  },

  // 数据源相关错误
  [ErrorCode.DATA_SOURCE_NOT_AVAILABLE]: {
    title: '数据源不可用',
    description: 'Claude Code数据源无法访问。可能是Cost API或OpenTelemetry配置问题。',
    suggestion: '检查网络连接，确认Claude Code正在运行，或运行 `claude check` 诊断数据源状态。',
    icon: '📊',
    color: '\x1b[31m'
  },
  [ErrorCode.DATA_FETCH_FAILED]: {
    title: '数据获取失败',
    description: '从数据源获取使用统计信息时发生错误。',
    suggestion: '稍后重试，或检查Claude Code是否有足够的权限访问数据。',
    icon: '📊',
    color: '\x1b[31m'
  },
  [ErrorCode.DATA_AGGREGATION_FAILED]: {
    title: '数据聚合失败',
    description: '在处理和聚合数据时发生错误。可能是数据格式不兼容。',
    suggestion: '检查数据完整性，或尝试清除缓存后重新获取数据。',
    icon: '📊',
    color: '\x1b[31m'
  },

  // 文件系统相关错误
  [ErrorCode.FILE_NOT_FOUND]: {
    title: '文件未找到',
    description: '指定的文件或目录不存在。',
    suggestion: '检查文件路径是否正确，或确认文件是否已被删除或移动。',
    icon: '📁',
    color: '\x1b[31m'
  },
  [ErrorCode.FILE_PERMISSION_DENIED]: {
    title: '文件权限被拒绝',
    description: '没有足够的权限访问指定的文件或目录。',
    suggestion: '检查文件权限，或使用sudo运行命令（谨慎使用）。',
    icon: '🔒',
    color: '\x1b[31m'
  },
  [ErrorCode.FILE_WRITE_FAILED]: {
    title: '文件写入失败',
    description: '无法写入文件。可能是权限问题或磁盘空间不足。',
    suggestion: '检查磁盘空间和文件权限，确保目标目录存在。',
    icon: '📁',
    color: '\x1b[31m'
  },

  // 验证相关错误
  [ErrorCode.PARAMETER_VALIDATION_FAILED]: {
    title: '参数验证失败',
    description: '提供的命令参数不符合要求或格式不正确。',
    suggestion: '检查命令语法，或运行 `claude --help` 查看正确的参数格式。',
    icon: '✅',
    color: '\x1b[31m'
  },
  [ErrorCode.TYPE_VALIDATION_FAILED]: {
    title: '类型验证失败',
    description: '数据类型不匹配，可能是配置错误或数据损坏。',
    suggestion: '检查配置文件中的数据类型，确保符合规范。',
    icon: '✅',
    color: '\x1b[31m'
  },

  // 网络相关错误
  [ErrorCode.NETWORK_CONNECTION_FAILED]: {
    title: '网络连接失败',
    description: '无法建立网络连接。可能是网络问题或服务器不可用。',
    suggestion: '检查网络连接，确认服务器状态，或稍后重试。',
    icon: '🌐',
    color: '\x1b[31m'
  },

  // 通用错误
  [ErrorCode.UNKNOWN_ERROR]: {
    title: '未知错误',
    description: '发生了不可预期的错误。',
    suggestion: '请重试操作，如果问题持续存在，请提交错误报告。',
    icon: '❓',
    color: '\x1b[31m'
  }
};

/**
 * 错误消息模板库 - 英文
 */
const ERROR_TEMPLATES_EN: Record<string, ErrorMessageTemplate> = {
  // Configuration related errors
  [ErrorCode.CONFIG_NOT_FOUND]: {
    title: 'Configuration File Not Found',
    description: 'Cannot find Claude Code configuration file. The system requires a configuration file to work properly.',
    suggestion: 'Run `claude config init` to create default configuration, or check if ~/.claude/settings.json exists.',
    icon: '⚙️',
    color: '\x1b[33m'
  },
  [ErrorCode.CONFIG_PARSE_FAILED]: {
    title: 'Configuration File Parse Failed',
    description: 'Configuration file format is incorrect or contains invalid JSON syntax.',
    suggestion: 'Check configuration file syntax, or run `claude config validate` to validate configuration.',
    icon: '⚙️',
    color: '\x1b[31m'
  },
  [ErrorCode.CONFIG_VALIDATION_FAILED]: {
    title: 'Configuration Validation Failed',
    description: 'Configuration file contains invalid configuration items or missing required fields.',
    suggestion: 'Review error details, fix configuration items, or run `claude config reset` to reset to default configuration.',
    icon: '⚙️',
    color: '\x1b[31m'
  },

  // Data source related errors
  [ErrorCode.DATA_SOURCE_NOT_AVAILABLE]: {
    title: 'Data Source Unavailable',
    description: 'Claude Code data source is not accessible. Might be Cost API or OpenTelemetry configuration issue.',
    suggestion: 'Check network connection, confirm Claude Code is running, or run `claude check` to diagnose data source status.',
    icon: '📊',
    color: '\x1b[31m'
  },
  [ErrorCode.DATA_FETCH_FAILED]: {
    title: 'Data Fetch Failed',
    description: 'An error occurred while fetching usage statistics from data source.',
    suggestion: 'Retry later, or check if Claude Code has sufficient permissions to access data.',
    icon: '📊',
    color: '\x1b[31m'
  },
  [ErrorCode.DATA_AGGREGATION_FAILED]: {
    title: 'Data Aggregation Failed',
    description: 'An error occurred while processing and aggregating data. Might be data format incompatibility.',
    suggestion: 'Check data integrity, or try clearing cache and refetching data.',
    icon: '📊',
    color: '\x1b[31m'
  },

  // File system related errors
  [ErrorCode.FILE_NOT_FOUND]: {
    title: 'File Not Found',
    description: 'The specified file or directory does not exist.',
    suggestion: 'Check if the file path is correct, or confirm if the file has been deleted or moved.',
    icon: '📁',
    color: '\x1b[31m'
  },
  [ErrorCode.FILE_PERMISSION_DENIED]: {
    title: 'File Permission Denied',
    description: 'Insufficient permissions to access the specified file or directory.',
    suggestion: 'Check file permissions, or run command with sudo (use with caution).',
    icon: '🔒',
    color: '\x1b[31m'
  },
  [ErrorCode.FILE_WRITE_FAILED]: {
    title: 'File Write Failed',
    description: 'Unable to write to file. Might be permission issue or insufficient disk space.',
    suggestion: 'Check disk space and file permissions, ensure target directory exists.',
    icon: '📁',
    color: '\x1b[31m'
  },

  // Validation related errors
  [ErrorCode.PARAMETER_VALIDATION_FAILED]: {
    title: 'Parameter Validation Failed',
    description: 'Provided command parameters do not meet requirements or incorrect format.',
    suggestion: 'Check command syntax, or run `claude --help` to see correct parameter format.',
    icon: '✅',
    color: '\x1b[31m'
  },
  [ErrorCode.TYPE_VALIDATION_FAILED]: {
    title: 'Type Validation Failed',
    description: 'Data type mismatch, might be configuration error or data corruption.',
    suggestion: 'Check data types in configuration file, ensure they comply with specifications.',
    icon: '✅',
    color: '\x1b[31m'
  },

  // Network related errors
  [ErrorCode.NETWORK_CONNECTION_FAILED]: {
    title: 'Network Connection Failed',
    description: 'Unable to establish network connection. Might be network issue or server unavailable.',
    suggestion: 'Check network connection, confirm server status, or retry later.',
    icon: '🌐',
    color: '\x1b[31m'
  },

  // Generic errors
  [ErrorCode.UNKNOWN_ERROR]: {
    title: 'Unknown Error',
    description: 'An unexpected error occurred.',
    suggestion: 'Please retry the operation. If the problem persists, please submit an error report.',
    icon: '❓',
    color: '\x1b[31m'
  }
};

/**
 * 统一错误消息格式化器
 */
export class ErrorMessageFormatter {
  private config: ErrorMessageConfig;

  constructor(config: Partial<ErrorMessageConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_MESSAGE_CONFIG, ...config };
  }

  /**
   * 格式化错误消息
   * 
   * @param error - 应用错误对象
   * @returns 格式化的错误消息字符串
   */
  format(error: AppError): string {
    const template = this.getErrorTemplate(error.code);
    const levelMapping = ERROR_LEVEL_MAPPING[error.level];
    const categoryIcon = ERROR_CATEGORY_ICONS[error.category];

    const parts: string[] = [];

    // 1. 错误标题行
    const titleLine = this.formatTitleLine(
      template.title,
      levelMapping.icon,
      categoryIcon,
      levelMapping.color
    );
    parts.push(titleLine);

    // 2. 错误描述
    if (template.description) {
      const description = this.truncateText(template.description, this.config.maxDescriptionLength);
      parts.push(this.formatDescriptionLine(description));
    }

    // 3. 错误代码（如果启用）
    if (this.config.includeErrorCode) {
      parts.push(this.formatErrorCodeLine(error.code, error.category));
    }

    // 4. 上下文信息（如果启用且有信息）
    if (this.config.showContext && error.context && Object.keys(error.context).length > 0) {
      parts.push(this.formatContextLine(error.context));
    }

    // 5. 建议（如果启用且有建议）
    if (this.config.showSuggestions && template.suggestion) {
      parts.push(this.formatSuggestionLine(template.suggestion));
    }

    // 6. 分隔线
    parts.push(this.formatSeparatorLine());

    return parts.join('\n');
  }

  /**
   * 格式化简化错误消息（单行）
   * 
   * @param error - 应用错误对象
   * @returns 单行错误消息
   */
  formatSimple(error: AppError): string {
    const template = this.getErrorTemplate(error.code);
    const levelMapping = ERROR_LEVEL_MAPPING[error.level];
    
    const icon = this.config.colorOutput ? levelMapping.icon : '';
    const color = this.config.colorOutput ? levelMapping.color : '';
    const reset = this.config.colorOutput ? '\x1b[0m' : '';
    
    return `${color}${icon} ${template.title}: ${error.message}${reset}`;
  }

  /**
   * 获取错误模板
   * 
   * @param errorCode - 错误代码
   * @returns 错误消息模板
   */
  private getErrorTemplate(errorCode: ErrorCode): ErrorMessageTemplate {
    const templates = this.config.language === 'zh-CN' ? ERROR_TEMPLATES_ZH : ERROR_TEMPLATES_EN;
    
    return templates[errorCode.toString()] || {
      title: this.config.language === 'zh-CN' ? '未知错误' : 'Unknown Error',
      description: this.config.language === 'zh-CN' 
        ? '发生了不可预期的错误' 
        : 'An unexpected error occurred',
      suggestion: this.config.language === 'zh-CN'
        ? '请重试操作，如果问题持续存在，请提交错误报告'
        : 'Please retry the operation. If the problem persists, please submit an error report',
      icon: '❓',
      color: '\x1b[31m'
    };
  }

  /**
   * 格式化标题行
   * 
   * @param title - 错误标题
   * @param levelIcon - 错误级别图标
   * @param categoryIcon - 错误类别图标
   * @param color - 颜色代码
   * @returns 格式化的标题行
   */
  private formatTitleLine(title: string, levelIcon: string, categoryIcon: string, color: string): string {
    if (!this.config.colorOutput) {
      return `${levelIcon} ${categoryIcon} ${title}`;
    }
    
    return `${color}${levelIcon} ${categoryIcon} ${title}\x1b[0m`;
  }

  /**
   * 格式化描述行
   * 
   * @param description - 错误描述
   * @returns 格式化的描述行
   */
  private formatDescriptionLine(description: string): string {
    const prefix = this.config.language === 'zh-CN' ? '详情：' : 'Details: ';
    return `${prefix}${description}`;
  }

  /**
   * 格式化错误代码行
   * 
   * @param errorCode - 错误代码
   * @param category - 错误类别
   * @returns 格式化的错误代码行
   */
  private formatErrorCodeLine(errorCode: ErrorCode, category: ErrorCategory): string {
    const prefix = this.config.language === 'zh-CN' ? '错误代码：' : 'Error Code: ';
    return `${prefix}${errorCode} (${category})`;
  }

  /**
   * 格式化上下文行
   * 
   * @param context - 错误上下文
   * @returns 格式化的上下文行
   */
  private formatContextLine(context: any): string {
    const prefix = this.config.language === 'zh-CN' ? '上下文：' : 'Context: ';
    const contextStr = JSON.stringify(context, null, 2);
    return `${prefix}\n${contextStr}`;
  }

  /**
   * 格式化建议行
   * 
   * @param suggestion - 建议内容
   * @returns 格式化的建议行
   */
  private formatSuggestionLine(suggestion: string): string {
    const prefix = this.config.language === 'zh-CN' ? '💡 建议：' : '💡 Suggestion: ';
    if (!this.config.colorOutput) {
      return `${prefix}${suggestion}`;
    }
    
    return `\x1b[36m${prefix}\x1b[0m${suggestion}`;
  }

  /**
   * 格式化分隔线
   * 
   * @returns 分隔线
   */
  private formatSeparatorLine(): string {
    return '─'.repeat(60);
  }

  /**
   * 截断文本
   * 
   * @param text - 原文本
   * @param maxLength - 最大长度
   * @returns 截断后的文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    const suffix = this.config.language === 'zh-CN' ? '...' : '...';
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 更新配置
   * 
   * @param newConfig - 新配置
   */
  updateConfig(newConfig: Partial<ErrorMessageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 默认错误消息格式化器实例
 */
export const errorMessageFormatter = new ErrorMessageFormatter();

/**
 * 便捷的错误格式化函数
 * 
 * @param error - 应用错误或原始错误
 * @param config - 格式化配置
 * @returns 格式化的错误消息
 */
export function formatError(
  error: AppError | Error | unknown,
  config?: Partial<ErrorMessageConfig>
): string {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(
      error.message,
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorLevel.ERROR,
      {},
      error
    );
  } else {
    appError = new AppError(
      String(error),
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorLevel.ERROR
    );
  }

  const formatter = config 
    ? new ErrorMessageFormatter(config)
    : errorMessageFormatter;

  return formatter.format(appError);
}

/**
 * 便捷的简化错误格式化函数
 * 
 * @param error - 应用错误或原始错误
 * @param config - 格式化配置
 * @returns 单行错误消息
 */
export function formatErrorSimple(
  error: AppError | Error | unknown,
  config?: Partial<ErrorMessageConfig>
): string {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(
      error.message,
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorLevel.ERROR,
      {},
      error
    );
  } else {
    appError = new AppError(
      String(error),
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorLevel.ERROR
    );
  }

  const formatter = config 
    ? new ErrorMessageFormatter(config)
    : errorMessageFormatter;

  return formatter.formatSimple(appError);
}