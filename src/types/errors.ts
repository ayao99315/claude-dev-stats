/**
 * 错误处理相关类型定义
 * 
 * 定义系统中所有错误类型和错误处理接口
 * 提供类型安全的错误分类和处理机制
 */

/**
 * 错误级别
 */
export enum ErrorLevel {
  /** 致命错误 - 系统无法继续运行 */
  FATAL = 'fatal',
  /** 错误 - 操作失败但系统可继续运行 */
  ERROR = 'error',
  /** 警告 - 非关键问题 */
  WARNING = 'warning',
  /** 信息 - 提示信息 */
  INFO = 'info'
}

/**
 * 错误类别
 */
export enum ErrorCategory {
  /** 配置错误 */
  CONFIG = 'config',
  /** 数据源错误 */
  DATA_SOURCE = 'data_source',
  /** 文件系统错误 */
  FILE_SYSTEM = 'file_system',
  /** 网络错误 */
  NETWORK = 'network',
  /** 解析错误 */
  PARSING = 'parsing',
  /** 验证错误 */
  VALIDATION = 'validation',
  /** 权限错误 */
  PERMISSION = 'permission',
  /** 系统错误 */
  SYSTEM = 'system',
  /** 用户错误 */
  USER = 'user',
  /** 未知错误 */
  UNKNOWN = 'unknown'
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 配置相关错误 (1000-1099)
  CONFIG_NOT_FOUND = 1001,
  CONFIG_INVALID = 1002,
  CONFIG_PARSE_FAILED = 1003,
  CONFIG_VALIDATION_FAILED = 1004,

  // 数据源相关错误 (2000-2099)
  DATA_SOURCE_NOT_AVAILABLE = 2001,
  DATA_SOURCE_CONNECTION_FAILED = 2002,
  DATA_SOURCE_READ_FAILED = 2003,
  DATA_SOURCE_INVALID_FORMAT = 2004,

  // 文件系统相关错误 (3000-3099)
  FILE_NOT_FOUND = 3001,
  FILE_READ_FAILED = 3002,
  FILE_WRITE_FAILED = 3003,
  FILE_PERMISSION_DENIED = 3004,
  DIRECTORY_NOT_FOUND = 3005,
  DIRECTORY_CREATE_FAILED = 3006,

  // 网络相关错误 (4000-4099)
  NETWORK_CONNECTION_FAILED = 4001,
  NETWORK_TIMEOUT = 4002,
  NETWORK_UNAUTHORIZED = 4003,
  NETWORK_RATE_LIMITED = 4004,

  // 解析相关错误 (5000-5099)
  JSON_PARSE_FAILED = 5001,
  JSONL_PARSE_FAILED = 5002,
  CSV_PARSE_FAILED = 5003,
  XML_PARSE_FAILED = 5004,

  // 验证相关错误 (6000-6099)
  VALIDATION_FAILED = 6001,
  SCHEMA_VALIDATION_FAILED = 6002,
  TYPE_VALIDATION_FAILED = 6003,
  RANGE_VALIDATION_FAILED = 6004,

  // 权限相关错误 (7000-7099)
  ACCESS_DENIED = 7001,
  AUTHENTICATION_FAILED = 7002,
  AUTHORIZATION_FAILED = 7003,

  // 系统相关错误 (8000-8099)
  SYSTEM_ERROR = 8001,
  MEMORY_ERROR = 8002,
  TIMEOUT_ERROR = 8003,
  RESOURCE_EXHAUSTED = 8004,

  // 用户相关错误 (9000-9099)
  USER_INPUT_INVALID = 9001,
  USER_CANCELLED = 9002,
  USER_PARAMETER_MISSING = 9003,

  // 未知错误 (9999)
  UNKNOWN_ERROR = 9999
}

/**
 * 错误上下文信息
 */
export interface ErrorContext {
  /** 组件名称 */
  component?: string;
  /** 方法名称 */
  method?: string;
  /** 文件路径 */
  file?: string;
  /** 行号 */
  line?: number;
  /** 用户操作 */
  userAction?: string;
  /** 额外的调试信息 */
  metadata?: Record<string, unknown>;
}

/**
 * 重试选项
 */
export interface RetryOptions {
  /** 最大重试次数 */
  maxAttempts: number;
  /** 基础延迟时间（毫秒） */
  baseDelay: number;
  /** 是否使用指数退避 */
  exponentialBackoff: boolean;
  /** 最大延迟时间（毫秒） */
  maxDelay: number;
  /** 抖动因子（0-1） */
  jitterFactor: number;
  /** 重试条件判断函数 */
  shouldRetry?: (error: AppError) => boolean;
}

/**
 * 错误恢复选项
 */
export interface RecoveryOptions {
  /** 降级处理函数 */
  fallback?: () => unknown;
  /** 默认返回值 */
  defaultValue?: unknown;
  /** 是否忽略错误继续执行 */
  ignore?: boolean;
  /** 自定义恢复逻辑 */
  customRecovery?: (error: AppError) => unknown;
}

/**
 * 应用程序基础错误类
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly level: ErrorLevel;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    level: ErrorLevel = ErrorLevel.ERROR,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.level = level;
    this.context = context;
    this.timestamp = new Date();
    this.originalError = originalError;

    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * 转换为普通对象（用于序列化）
   */
  toObject(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      level: this.level,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(language: 'zh-CN' | 'en-US' = 'zh-CN'): string {
    return getUserFriendlyMessage(this.code, language);
  }

  /**
   * 检查是否为可重试错误
   */
  isRetryable(): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_CONNECTION_FAILED,
      ErrorCode.NETWORK_TIMEOUT,
      ErrorCode.NETWORK_RATE_LIMITED,
      ErrorCode.FILE_READ_FAILED,
      ErrorCode.FILE_WRITE_FAILED,
      ErrorCode.DATA_SOURCE_CONNECTION_FAILED,
      ErrorCode.SYSTEM_ERROR
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * 检查是否为致命错误
   */
  isFatal(): boolean {
    return this.level === ErrorLevel.FATAL;
  }
}

/**
 * 配置错误类
 */
export class ConfigError extends AppError {
  constructor(message: string, code?: ErrorCode, context?: ErrorContext, originalError?: Error) {
    super(
      message,
      code || ErrorCode.CONFIG_INVALID,
      ErrorCategory.CONFIG,
      ErrorLevel.ERROR,
      context,
      originalError
    );
    this.name = 'ConfigError';
  }
}

/**
 * 数据源错误类
 */
export class DataSourceError extends AppError {
  constructor(message: string, code?: ErrorCode, context?: ErrorContext, originalError?: Error) {
    super(
      message,
      code || ErrorCode.DATA_SOURCE_NOT_AVAILABLE,
      ErrorCategory.DATA_SOURCE,
      ErrorLevel.ERROR,
      context,
      originalError
    );
    this.name = 'DataSourceError';
  }
}

/**
 * 文件系统错误类
 */
export class FileSystemError extends AppError {
  constructor(message: string, code?: ErrorCode, context?: ErrorContext, originalError?: Error) {
    super(
      message,
      code || ErrorCode.FILE_NOT_FOUND,
      ErrorCategory.FILE_SYSTEM,
      ErrorLevel.ERROR,
      context,
      originalError
    );
    this.name = 'FileSystemError';
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message: string, code?: ErrorCode, context?: ErrorContext, originalError?: Error) {
    super(
      message,
      code || ErrorCode.VALIDATION_FAILED,
      ErrorCategory.VALIDATION,
      ErrorLevel.WARNING,
      context,
      originalError
    );
    this.name = 'ValidationError';
  }
}

/**
 * 用户错误类
 */
export class UserError extends AppError {
  constructor(message: string, code?: ErrorCode, context?: ErrorContext, originalError?: Error) {
    super(
      message,
      code || ErrorCode.USER_INPUT_INVALID,
      ErrorCategory.USER,
      ErrorLevel.WARNING,
      context,
      originalError
    );
    this.name = 'UserError';
  }
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(code: ErrorCode, language: 'zh-CN' | 'en-US' = 'zh-CN'): string {
  const messages = {
    'zh-CN': {
      [ErrorCode.CONFIG_NOT_FOUND]: '配置文件未找到，将使用默认配置',
      [ErrorCode.CONFIG_INVALID]: '配置文件格式无效，请检查配置',
      [ErrorCode.CONFIG_PARSE_FAILED]: '配置文件解析失败，请检查语法',
      [ErrorCode.CONFIG_VALIDATION_FAILED]: '配置验证失败，请检查配置内容',
      [ErrorCode.DATA_SOURCE_NOT_AVAILABLE]: '数据源不可用，请检查 Claude Code 是否正常运行',
      [ErrorCode.DATA_SOURCE_CONNECTION_FAILED]: '连接数据源失败，请稍后重试',
      [ErrorCode.FILE_NOT_FOUND]: '文件未找到，请检查路径是否正确',
      [ErrorCode.FILE_PERMISSION_DENIED]: '文件访问被拒绝，请检查权限',
      [ErrorCode.NETWORK_CONNECTION_FAILED]: '网络连接失败，请检查网络设置',
      [ErrorCode.NETWORK_TIMEOUT]: '请求超时，请稍后重试',
      [ErrorCode.JSON_PARSE_FAILED]: 'JSON 格式错误，请检查数据格式',
      [ErrorCode.VALIDATION_FAILED]: '数据验证失败，请检查输入',
      [ErrorCode.USER_INPUT_INVALID]: '输入参数无效，请检查命令格式',
      [ErrorCode.UNKNOWN_ERROR]: '发生未知错误，请联系支持'
    } as Record<ErrorCode, string>,
    'en-US': {
      [ErrorCode.CONFIG_NOT_FOUND]: 'Configuration file not found, using default settings',
      [ErrorCode.CONFIG_INVALID]: 'Invalid configuration file format',
      [ErrorCode.CONFIG_PARSE_FAILED]: 'Failed to parse configuration file',
      [ErrorCode.CONFIG_VALIDATION_FAILED]: 'Configuration validation failed',
      [ErrorCode.DATA_SOURCE_NOT_AVAILABLE]: 'Data source unavailable, check if Claude Code is running',
      [ErrorCode.DATA_SOURCE_CONNECTION_FAILED]: 'Failed to connect to data source, please retry',
      [ErrorCode.FILE_NOT_FOUND]: 'File not found, please check the path',
      [ErrorCode.FILE_PERMISSION_DENIED]: 'File access denied, please check permissions',
      [ErrorCode.NETWORK_CONNECTION_FAILED]: 'Network connection failed, please check settings',
      [ErrorCode.NETWORK_TIMEOUT]: 'Request timeout, please retry later',
      [ErrorCode.JSON_PARSE_FAILED]: 'JSON format error, please check data format',
      [ErrorCode.VALIDATION_FAILED]: 'Data validation failed, please check input',
      [ErrorCode.USER_INPUT_INVALID]: 'Invalid input parameters, please check command format',
      [ErrorCode.UNKNOWN_ERROR]: 'Unknown error occurred, please contact support'
    } as Record<ErrorCode, string>
  };

  return messages[language][code] || messages[language][ErrorCode.UNKNOWN_ERROR];
}

/**
 * 错误结果类型（用于函数返回值）
 */
export type Result<T, E = AppError> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

/**
 * 创建成功结果
 */
export function createSuccess<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * 创建失败结果
 */
export function createError<T>(error: AppError): Result<T> {
  return { success: false, error };
}

/**
 * 默认重试选项
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  exponentialBackoff: true,
  maxDelay: 30000,
  jitterFactor: 0.1
};