/**
 * 日志系统
 * 
 * 提供统一的日志记录功能
 * 支持多级别日志输出、文件记录和彩色终端显示
 * 集成配置管理系统，支持动态配置调整
 */

import * as winston from 'winston';
import * as path from 'path';
import * as os from 'os';
import { LogLevel, LogConfig } from '../types/config';

/**
 * 日志级别优先级映射
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * 日志颜色映射
 */
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

/**
 * 日志格式化器
 */
const createFormatter = (colorize: boolean) => {
  return winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      const content = stack || message;
      
      if (colorize && process.stdout.isTTY) {
        // 终端彩色输出
        const levelColor = LOG_COLORS[level as LogLevel] || 'white';
        return `\x1b[36m${prefix}\x1b[0m \x1b[${getLevelColorCode(levelColor)}m${content}\x1b[0m`;
      }
      
      return `${prefix} ${content}`;
    })
  );
};

/**
 * 获取颜色代码
 */
function getLevelColorCode(color: string): string {
  const colorCodes: Record<string, string> = {
    red: '31',
    yellow: '33',
    green: '32',
    blue: '34',
    white: '37'
  };
  return colorCodes[color] || '37';
}

/**
 * 日志管理器类
 */
export class Logger {
  private logger: winston.Logger;
  private config: LogConfig;
  private static instance: Logger;

  constructor(config?: LogConfig) {
    this.config = config || {
      level: 'info',
      file_output: false,
      colorize: true,
      max_file_size: 10 * 1024 * 1024, // 10MB
      max_files: 5
    };

    this.logger = this.createLogger();
  }

  /**
   * 获取日志管理器单例
   */
  static getInstance(config?: LogConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      Logger.instance.updateConfig(config);
    }
    return Logger.instance;
  }

  /**
   * 更新日志配置
   */
  updateConfig(config: LogConfig): void {
    this.config = config;
    this.logger = this.createLogger();
  }

  /**
   * 记录错误日志
   */
  error(message: string, meta?: unknown): void {
    this.logger.error(message, meta);
  }

  /**
   * 记录警告日志
   */
  warn(message: string, meta?: unknown): void {
    this.logger.warn(message, meta);
  }

  /**
   * 记录信息日志
   */
  info(message: string, meta?: unknown): void {
    this.logger.info(message, meta);
  }

  /**
   * 记录调试日志
   */
  debug(message: string, meta?: unknown): void {
    this.logger.debug(message, meta);
  }

  /**
   * 记录性能指标
   */
  performance(message: string, duration: number, meta?: unknown): void {
    this.info(`[PERF] ${message} (${duration}ms)`, meta);
  }

  /**
   * 记录数据源操作
   */
  dataSource(source: string, operation: string, meta?: unknown): void {
    this.debug(`[DATA] ${source}: ${operation}`, meta);
  }

  /**
   * 记录配置变更
   */
  logConfig(message: string, meta?: unknown): void {
    this.info(`[CONFIG] ${message}`, meta);
  }

  /**
   * 记录用户操作
   */
  user(action: string, meta?: unknown): void {
    this.info(`[USER] ${action}`, meta);
  }

  /**
   * 创建子日志器（带前缀）
   */
  child(prefix: string): Logger {
    const childLogger = new Logger(this.config);
    
    // 重写日志方法以添加前缀
    const originalMethods = ['error', 'warn', 'info', 'debug'] as const;
    
    originalMethods.forEach(method => {
      const originalMethod = childLogger[method].bind(childLogger);
      (childLogger as any)[method] = (message: string, meta?: unknown) => {
        originalMethod(`[${prefix}] ${message}`, meta);
      };
    });

    return childLogger;
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.logger.level = level;
  }

  /**
   * 检查是否启用了指定日志级别
   */
  isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.config.level];
  }

  /**
   * 清理日志文件
   */
  async cleanup(): Promise<void> {
    // Winston 会自动处理日志轮转和清理
    this.info('日志清理完成');
  }

  /**
   * 创建 Winston 日志器实例
   */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // 控制台输出
    transports.push(
      new winston.transports.Console({
        level: this.config.level,
        format: createFormatter(this.config.colorize)
      })
    );

    // 文件输出
    if (this.config.file_output && this.config.file_path) {
      const logDir = path.dirname(this.config.file_path);
      
      // 应用日志文件
      transports.push(
        new winston.transports.File({
          filename: this.config.file_path,
          level: this.config.level,
          format: createFormatter(false),
          maxsize: this.config.max_file_size,
          maxFiles: this.config.max_files,
          tailable: true
        })
      );

      // 错误日志单独文件
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: createFormatter(false),
          maxsize: this.config.max_file_size,
          maxFiles: this.config.max_files,
          tailable: true
        })
      );
    }

    return winston.createLogger({
      levels: LOG_LEVELS,
      level: this.config.level,
      transports,
      exitOnError: false,
      // 未捕获异常处理
      exceptionHandlers: this.config.file_output && this.config.file_path
        ? [
          new winston.transports.File({
            filename: path.join(path.dirname(this.config.file_path), 'exceptions.log')
          })
        ]
        : [],
      // 未捕获 Promise 拒绝处理
      rejectionHandlers: this.config.file_output && this.config.file_path
        ? [
          new winston.transports.File({
            filename: path.join(path.dirname(this.config.file_path), 'rejections.log')
          })
        ]
        : []
    });
  }
}

/**
 * 创建默认日志器实例
 */
const createDefaultLogger = (): Logger => {
  const defaultConfig: LogConfig = {
    level: 'info',
    file_output: false,
    colorize: true,
    max_file_size: 10 * 1024 * 1024,
    max_files: 5
  };

  return new Logger(defaultConfig);
};

/**
 * 默认日志器导出
 */
export const logger = createDefaultLogger();

/**
 * 日志装饰器工厂
 */
export function logMethod(logLevel: LogLevel = 'debug') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      const methodName = propertyKey;
      const startTime = Date.now();
      
      logger[logLevel](`开始执行 ${className}.${methodName}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        logger.performance(`${className}.${methodName} 执行完成`, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${className}.${methodName} 执行失败 (${duration}ms)`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 性能监控装饰器
 */
export function measurePerformance(threshold: number = 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        const className = target.constructor.name;
        logger.warn(`性能警告: ${className}.${propertyKey} 执行时间过长 (${duration}ms)`);
      }
      
      return result;
    };

    return descriptor;
  };
}