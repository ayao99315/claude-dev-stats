/**
 * 错误处理器
 * 
 * 提供统一的错误处理机制，包括：
 * - 错误分类和转换
 * - 重试机制
 * - 错误恢复
 * - 用户友好的错误消息
 * - 错误上报和记录
 */

import { Logger } from './logger';
import {
  AppError,
  ConfigError,
  DataSourceError,
  FileSystemError,
  ValidationError,
  UserError,
  ErrorCode,
  ErrorCategory,
  ErrorLevel,
  ErrorContext,
  RetryOptions,
  RecoveryOptions,
  Result,
  createSuccess,
  createError,
  DEFAULT_RETRY_OPTIONS
} from '../types/errors';

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private logger: Logger;
  private static instance: ErrorHandler;

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance();
  }

  /**
   * 获取错误处理器单例
   */
  static getInstance(logger?: Logger): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(logger);
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误 - 统一入口
   * 
   * @param error - 原始错误
   * @param context - 错误上下文
   */
  handle(error: unknown, context: ErrorContext = {}): AppError {
    const appError = this.normalizeError(error, context);
    this.logError(appError);
    return appError;
  }

  /**
   * 包装异步操作，提供错误处理
   * 
   * @param operation - 异步操作
   * @param context - 错误上下文
   */
  async wrap<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<Result<T>> {
    try {
      const result = await operation();
      return createSuccess(result);
    } catch (error) {
      const appError = this.handle(error, context);
      return createError(appError);
    }
  }

  /**
   * 带重试的异步操作包装
   * 
   * @param operation - 异步操作
   * @param retryOptions - 重试选项
   * @param context - 错误上下文
   */
  async retry<T>(
    operation: () => Promise<T>,
    retryOptions: Partial<RetryOptions> = {},
    context: ErrorContext = {}
  ): Promise<Result<T>> {
    const options = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
    let lastError: AppError | undefined;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.info(
            `重试操作成功 ${context.method || 'unknown'} (尝试 ${attempt}/${options.maxAttempts})`
          );
        }
        
        return createSuccess(result);
      } catch (error) {
        lastError = this.normalizeError(error, {
          ...context,
          metadata: { ...context.metadata, attempt, maxAttempts: options.maxAttempts }
        });

        // 检查是否应该重试
        const shouldRetry = options.shouldRetry 
          ? options.shouldRetry(lastError)
          : lastError.isRetryable();

        if (attempt < options.maxAttempts && shouldRetry) {
          const delay = this.calculateDelay(attempt, options);
          this.logger.warn(
            `操作失败，${delay}ms 后重试 ${context.method || 'unknown'} ` +
            `(尝试 ${attempt}/${options.maxAttempts}): ${lastError.message}`
          );
          
          await this.sleep(delay);
          continue;
        }

        // 记录最终失败
        this.logError(lastError);
        break;
      }
    }

    // 如果没有错误但也没有成功（理论上不应该发生），创建一个通用错误
    if (!lastError) {
      lastError = new AppError(
        '重试操作失败，但没有记录到具体错误',
        ErrorCode.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorLevel.ERROR,
        context
      );
    }

    return createError(lastError);
  }

  /**
   * 带恢复机制的操作包装
   * 
   * @param operation - 异步操作
   * @param recoveryOptions - 恢复选项
   * @param context - 错误上下文
   */
  async recover<T>(
    operation: () => Promise<T>,
    recoveryOptions: RecoveryOptions,
    context: ErrorContext = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.handle(error, context);

      // 如果设置了忽略错误
      if (recoveryOptions.ignore) {
        this.logger.warn(`忽略错误继续执行: ${appError.message}`);
        return recoveryOptions.defaultValue as T;
      }

      // 尝试自定义恢复逻辑
      if (recoveryOptions.customRecovery) {
        try {
          return recoveryOptions.customRecovery(appError) as T;
        } catch (recoveryError) {
          this.logger.error('自定义恢复逻辑失败', recoveryError);
        }
      }

      // 使用降级处理
      if (recoveryOptions.fallback) {
        try {
          const fallbackResult = recoveryOptions.fallback();
          this.logger.info(`使用降级处理: ${context.method || 'unknown'}`);
          return fallbackResult as T;
        } catch (fallbackError) {
          this.logger.error('降级处理失败', fallbackError);
        }
      }

      // 返回默认值
      if (recoveryOptions.defaultValue !== undefined) {
        this.logger.info(`使用默认值: ${context.method || 'unknown'}`);
        return recoveryOptions.defaultValue as T;
      }

      // 无法恢复，重新抛出错误
      throw appError;
    }
  }

  /**
   * 将普通错误转换为应用错误
   * 
   * @param error - 原始错误
   * @param context - 错误上下文
   */
  private normalizeError(error: unknown, context: ErrorContext = {}): AppError {
    // 如果已经是 AppError，直接返回
    if (error instanceof AppError) {
      return error;
    }

    // 如果是标准 Error
    if (error instanceof Error) {
      return this.convertStandardError(error, context);
    }

    // 如果是字符串
    if (typeof error === 'string') {
      return new AppError(
        error,
        ErrorCode.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorLevel.ERROR,
        context
      );
    }

    // 其他类型的错误
    return new AppError(
      `Unknown error: ${String(error)}`,
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorLevel.ERROR,
      context
    );
  }

  /**
   * 转换标准错误为应用错误
   * 
   * @param error - 标准错误
   * @param context - 错误上下文
   */
  private convertStandardError(error: Error, context: ErrorContext): AppError {
    const message = error.message;
    
    // 根据错误消息和类型推断错误代码和类别
    if (error.name === 'SyntaxError' && message.includes('JSON')) {
      return new AppError(
        message,
        ErrorCode.JSON_PARSE_FAILED,
        ErrorCategory.PARSING,
        ErrorLevel.ERROR,
        context,
        error
      );
    }

    if (error.message.includes('ENOENT')) {
      return new FileSystemError(
        message,
        ErrorCode.FILE_NOT_FOUND,
        context,
        error
      );
    }

    if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
      return new FileSystemError(
        message,
        ErrorCode.FILE_PERMISSION_DENIED,
        context,
        error
      );
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      return new AppError(
        message,
        ErrorCode.NETWORK_CONNECTION_FAILED,
        ErrorCategory.NETWORK,
        ErrorLevel.ERROR,
        context,
        error
      );
    }

    if (error.name === 'TypeError') {
      return new ValidationError(
        message,
        ErrorCode.TYPE_VALIDATION_FAILED,
        context,
        error
      );
    }

    // 默认转换
    return new AppError(
      message,
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorLevel.ERROR,
      context,
      error
    );
  }

  /**
   * 记录错误日志
   * 
   * @param error - 应用错误
   */
  private logError(error: AppError): void {
    const logContext = {
      code: error.code,
      category: error.category,
      context: error.context,
      timestamp: error.timestamp
    };

    switch (error.level) {
    case ErrorLevel.FATAL:
      this.logger.error(`[FATAL] ${error.message}`, logContext);
      break;
    case ErrorLevel.ERROR:
      this.logger.error(`[ERROR] ${error.message}`, logContext);
      break;
    case ErrorLevel.WARNING:
      this.logger.warn(`[WARNING] ${error.message}`, logContext);
      break;
    case ErrorLevel.INFO:
      this.logger.info(`[INFO] ${error.message}`, logContext);
      break;
    }

    // 如果有原始错误，也记录其堆栈
    if (error.originalError?.stack) {
      this.logger.debug('原始错误堆栈:', error.originalError.stack);
    }
  }

  /**
   * 计算重试延迟时间
   * 
   * @param attempt - 当前尝试次数
   * @param options - 重试选项
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay;

    if (options.exponentialBackoff) {
      delay *= Math.pow(2, attempt - 1);
    }

    // 应用最大延迟限制
    delay = Math.min(delay, options.maxDelay);

    // 添加抖动
    if (options.jitterFactor > 0) {
      const jitter = delay * options.jitterFactor * Math.random();
      delay += jitter;
    }

    return Math.floor(delay);
  }

  /**
   * 异步睡眠
   * 
   * @param ms - 延迟时间（毫秒）
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 默认错误处理器实例
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * 错误处理装饰器
 */
export function handleErrors(context?: ErrorContext) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const errorContext: ErrorContext = {
        ...context,
        component: target.constructor.name,
        method: propertyKey
      };

      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const appError = errorHandler.handle(error, errorContext);
        throw appError;
      }
    };

    return descriptor;
  };
}

/**
 * 重试装饰器
 */
export function withRetry(retryOptions?: Partial<RetryOptions>, context?: ErrorContext) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const errorContext: ErrorContext = {
        ...context,
        component: target.constructor.name,
        method: propertyKey
      };

      const result = await errorHandler.retry(
        () => originalMethod.apply(this, args),
        retryOptions,
        errorContext
      );

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    };

    return descriptor;
  };
}

/**
 * 恢复装饰器
 */
export function withRecovery(recoveryOptions: RecoveryOptions, context?: ErrorContext) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const errorContext: ErrorContext = {
        ...context,
        component: target.constructor.name,
        method: propertyKey
      };

      return await errorHandler.recover(
        () => originalMethod.apply(this, args),
        recoveryOptions,
        errorContext
      );
    };

    return descriptor;
  };
}