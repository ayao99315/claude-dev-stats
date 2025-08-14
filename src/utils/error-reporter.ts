/**
 * 错误报告收集系统
 * 
 * 提供结构化的错误信息收集和报告功能，包括：
 * - 错误信息的结构化收集
 * - 系统环境信息收集
 * - 隐私保护的错误报告生成
 * - 本地错误日志管理
 * - 用户反馈收集
 */

import { AppError } from '../types/errors';
import { Logger } from './logger';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * 错误报告数据
 */
export interface ErrorReport {
  id: string;
  timestamp: Date;
  version: string;
  environment: SystemInfo;
  error: ErrorDetails;
  context: ContextInfo;
  userFeedback?: UserFeedback;
  privacy: PrivacySettings;
}

/**
 * 系统信息
 */
export interface SystemInfo {
  platform: string;
  nodeVersion: string;
  architecture: string;
  claudeCodeVersion?: string;
  packageVersion: string;
  locale: string;
  timezone: string;
}

/**
 * 错误详情
 */
export interface ErrorDetails {
  code: string;
  message: string;
  category: string;
  level: string;
  stack?: string;
  originalError?: string;
  timestamp: Date;
  frequency: number; // 该错误的发生频率
}

/**
 * 上下文信息
 */
export interface ContextInfo {
  command?: string;
  arguments?: string[];
  workingDirectory: string;
  configPath: string;
  projectInfo?: ProjectInfo;
  recentActions?: RecentAction[];
  performanceMetrics?: PerformanceMetrics;
}

/**
 * 项目信息
 */
export interface ProjectInfo {
  type?: string; // git, npm, etc.
  name?: string;
  version?: string;
  dependencies?: string[];
  size?: {
    files: number;
    lines: number;
  };
}

/**
 * 最近操作
 */
export interface RecentAction {
  timestamp: Date;
  action: string;
  result: 'success' | 'error' | 'warning';
  duration?: number;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
  uptime: number;
  loadTime?: number;
}

/**
 * 用户反馈
 */
export interface UserFeedback {
  description?: string;
  reproductionSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  userEmail?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'feature' | 'performance' | 'usability';
}

/**
 * 隐私设置
 */
export interface PrivacySettings {
  includeSystemInfo: boolean;
  includeErrorStack: boolean;
  includeFileNames: boolean;
  includeUserPaths: boolean;
  anonymizeData: boolean;
}

/**
 * 错误统计
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByLevel: Record<string, number>;
  errorsByCode: Record<string, number>;
  recentErrors: ErrorReport[];
  topErrors: Array<{ code: string; count: number; lastSeen: Date }>;
}

/**
 * 默认隐私设置
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  includeSystemInfo: true,
  includeErrorStack: false, // 默认不包含堆栈，保护隐私
  includeFileNames: false,  // 默认不包含文件名，保护隐私
  includeUserPaths: false,  // 默认不包含用户路径，保护隐私
  anonymizeData: true       // 默认匿名化数据
};

/**
 * 错误报告器
 */
export class ErrorReporter {
  private logger: Logger;
  private reportsDir: string;
  private maxReports: number;
  private errorFrequency: Map<string, number>;
  private recentActions: RecentAction[];
  private packageVersion: string;

  constructor(
    logger?: Logger,
    reportsDir?: string,
    maxReports: number = 100
  ) {
    this.logger = logger || Logger.getInstance();
    this.reportsDir = reportsDir || join(require('os').homedir(), '.claude', 'error-reports');
    this.maxReports = maxReports;
    this.errorFrequency = new Map();
    this.recentActions = [];
    this.packageVersion = this.getPackageVersion();
    
    this.ensureReportsDirectory();
  }

  /**
   * 报告错误
   * 
   * @param error - 应用错误
   * @param context - 额外上下文
   * @param userFeedback - 用户反馈
   * @param privacySettings - 隐私设置
   * @returns 错误报告ID
   */
  async reportError(
    error: AppError,
    context: Partial<ContextInfo> = {},
    userFeedback?: UserFeedback,
    privacySettings: Partial<PrivacySettings> = {}
  ): Promise<string> {
    const reportId = randomUUID();
    
    try {
      // 更新错误频率
      const errorKey = `${error.code}:${error.message}`;
      this.errorFrequency.set(errorKey, (this.errorFrequency.get(errorKey) || 0) + 1);

      // 收集系统信息
      const systemInfo = await this.collectSystemInfo();
      
      // 收集上下文信息
      const contextInfo = await this.collectContextInfo(context);
      
      // 创建错误报告
      const report: ErrorReport = {
        id: reportId,
        timestamp: new Date(),
        version: this.packageVersion,
        environment: systemInfo,
        error: {
          code: error.code,
          message: error.message,
          category: error.category,
          level: error.level,
          stack: error.stack,
          originalError: error.originalError?.message,
          timestamp: error.timestamp,
          frequency: this.errorFrequency.get(errorKey) || 1
        },
        context: contextInfo,
        userFeedback,
        privacy: { ...DEFAULT_PRIVACY_SETTINGS, ...privacySettings }
      };

      // 应用隐私设置
      this.applyPrivacySettings(report);

      // 保存报告
      await this.saveReport(report);

      // 记录到日志
      this.logger.info(`错误报告已生成: ${reportId}`);

      // 清理旧报告
      await this.cleanupOldReports();

      return reportId;

    } catch (reportError) {
      this.logger.error('生成错误报告失败', reportError);
      throw reportError;
    }
  }

  /**
   * 获取错误统计
   * 
   * @returns 错误统计信息
   */
  async getErrorStatistics(): Promise<ErrorStatistics> {
    const reports = await this.loadAllReports();
    
    const stats: ErrorStatistics = {
      totalErrors: reports.length,
      errorsByCategory: {},
      errorsByLevel: {},
      errorsByCode: {},
      recentErrors: reports.slice(-10), // 最近10个错误
      topErrors: []
    };

    // 统计各维度数据
    const codeCount = new Map<string, { count: number; lastSeen: Date }>();
    
    reports.forEach(report => {
      // 按类别统计
      const category = report.error.category;
      stats.errorsByCategory[category] = (stats.errorsByCategory[category] || 0) + 1;

      // 按级别统计
      const level = report.error.level;
      stats.errorsByLevel[level] = (stats.errorsByLevel[level] || 0) + 1;

      // 按错误代码统计
      const code = report.error.code;
      stats.errorsByCode[code] = (stats.errorsByCode[code] || 0) + 1;

      // 收集错误代码信息
      const existing = codeCount.get(code);
      if (!existing || report.timestamp > existing.lastSeen) {
        codeCount.set(code, {
          count: (existing?.count || 0) + 1,
          lastSeen: report.timestamp
        });
      }
    });

    // 生成top错误列表
    stats.topErrors = Array.from(codeCount.entries())
      .map(([code, info]) => ({ code, count: info.count, lastSeen: info.lastSeen }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * 生成错误报告摘要
   * 
   * @param reportId - 报告ID
   * @returns 报告摘要
   */
  async generateReportSummary(reportId: string): Promise<string> {
    const report = await this.loadReport(reportId);
    if (!report) {
      throw new Error(`错误报告未找到: ${reportId}`);
    }

    const lines: string[] = [];
    
    lines.push('🐛 错误报告摘要');
    lines.push('='.repeat(50));
    lines.push(`报告ID: ${report.id}`);
    lines.push(`时间: ${report.timestamp.toLocaleString()}`);
    lines.push(`版本: ${report.version}`);
    lines.push('');

    // 错误信息
    lines.push('📋 错误信息');
    lines.push(`代码: ${report.error.code}`);
    lines.push(`消息: ${report.error.message}`);
    lines.push(`类别: ${report.error.category}`);
    lines.push(`级别: ${report.error.level}`);
    lines.push(`频率: ${report.error.frequency} 次`);
    lines.push('');

    // 系统环境
    lines.push('💻 系统环境');
    lines.push(`平台: ${report.environment.platform}`);
    lines.push(`Node.js: ${report.environment.nodeVersion}`);
    lines.push(`架构: ${report.environment.architecture}`);
    if (report.environment.claudeCodeVersion) {
      lines.push(`Claude Code: ${report.environment.claudeCodeVersion}`);
    }
    lines.push('');

    // 上下文信息
    lines.push('📍 上下文信息');
    if (report.context.command) {
      lines.push(`命令: ${report.context.command}`);
    }
    if (report.context.arguments) {
      lines.push(`参数: ${report.context.arguments.join(' ')}`);
    }
    lines.push(`工作目录: ${this.anonymizePath(report.context.workingDirectory)}`);
    lines.push('');

    // 用户反馈
    if (report.userFeedback) {
      lines.push('💬 用户反馈');
      lines.push(`严重程度: ${report.userFeedback.severity}`);
      lines.push(`类别: ${report.userFeedback.category}`);
      if (report.userFeedback.description) {
        lines.push(`描述: ${report.userFeedback.description}`);
      }
      lines.push('');
    }

    // 性能指标
    if (report.context.performanceMetrics) {
      const metrics = report.context.performanceMetrics;
      lines.push('⚡ 性能指标');
      lines.push(`内存使用: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
      lines.push(`运行时间: ${Math.round(metrics.uptime)}秒`);
      if (metrics.loadTime) {
        lines.push(`加载时间: ${metrics.loadTime}ms`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 记录用户操作
   * 
   * @param action - 操作名称
   * @param result - 操作结果
   * @param duration - 持续时间
   */
  recordAction(action: string, result: 'success' | 'error' | 'warning', duration?: number): void {
    const recentAction: RecentAction = {
      timestamp: new Date(),
      action,
      result,
      duration
    };

    this.recentActions.unshift(recentAction);
    
    // 保持最近10个操作
    if (this.recentActions.length > 10) {
      this.recentActions = this.recentActions.slice(0, 10);
    }
  }

  /**
   * 收集系统信息
   */
  private async collectSystemInfo(): Promise<SystemInfo> {
    const info: SystemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      architecture: process.arch,
      packageVersion: this.packageVersion,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // 尝试获取Claude Code版本
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('claude --version');
      info.claudeCodeVersion = stdout.trim();
    } catch (error) {
      // Claude Code不可用或版本获取失败
    }

    return info;
  }

  /**
   * 收集上下文信息
   */
  private async collectContextInfo(context: Partial<ContextInfo>): Promise<ContextInfo> {
    const info: ContextInfo = {
      workingDirectory: process.cwd(),
      configPath: join(require('os').homedir(), '.claude', 'settings.json'),
      recentActions: [...this.recentActions],
      performanceMetrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage?.(),
        uptime: process.uptime()
      },
      ...context
    };

    // 收集项目信息
    try {
      info.projectInfo = await this.collectProjectInfo();
    } catch (error) {
      // 项目信息收集失败
    }

    return info;
  }

  /**
   * 收集项目信息
   */
  private async collectProjectInfo(): Promise<ProjectInfo | undefined> {
    const cwd = process.cwd();
    const packageJsonPath = join(cwd, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return {
          type: 'npm',
          name: packageJson.name,
          version: packageJson.version,
          dependencies: Object.keys({
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          })
        };
      } catch (error) {
        // package.json解析失败
      }
    }

    // 检查是否是Git项目
    if (existsSync(join(cwd, '.git'))) {
      return {
        type: 'git'
      };
    }

    return undefined;
  }

  /**
   * 应用隐私设置
   */
  private applyPrivacySettings(report: ErrorReport): void {
    const privacy = report.privacy;

    if (!privacy.includeSystemInfo) {
      // 移除敏感的系统信息
      report.environment = {
        platform: 'hidden',
        nodeVersion: 'hidden',
        architecture: 'hidden',
        packageVersion: report.environment.packageVersion,
        locale: 'hidden',
        timezone: 'hidden'
      };
    }

    if (!privacy.includeErrorStack) {
      delete report.error.stack;
      delete report.error.originalError;
    }

    if (!privacy.includeUserPaths) {
      report.context.workingDirectory = this.anonymizePath(report.context.workingDirectory);
      report.context.configPath = this.anonymizePath(report.context.configPath);
    }

    if (!privacy.includeFileNames && report.context.projectInfo) {
      delete report.context.projectInfo.name;
      delete report.context.projectInfo.dependencies;
    }

    if (privacy.anonymizeData) {
      // 匿名化用户相关信息
      if (report.userFeedback?.userEmail) {
        delete report.userFeedback.userEmail;
      }
    }
  }

  /**
   * 匿名化路径
   */
  private anonymizePath(path: string): string {
    const homeDir = require('os').homedir();
    return path.replace(homeDir, '~');
  }

  /**
   * 保存错误报告
   */
  private async saveReport(report: ErrorReport): Promise<void> {
    const filePath = join(this.reportsDir, `${report.id}.json`);
    const reportData = JSON.stringify(report, null, 2);
    
    writeFileSync(filePath, reportData, 'utf-8');
  }

  /**
   * 加载错误报告
   */
  private async loadReport(reportId: string): Promise<ErrorReport | null> {
    const filePath = join(this.reportsDir, `${reportId}.json`);
    
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const reportData = readFileSync(filePath, 'utf-8');
      const report = JSON.parse(reportData);
      
      // 恢复日期对象
      report.timestamp = new Date(report.timestamp);
      report.error.timestamp = new Date(report.error.timestamp);
      
      return report;
    } catch (error) {
      this.logger.error(`加载错误报告失败: ${reportId}`, error);
      return null;
    }
  }

  /**
   * 加载所有错误报告
   */
  private async loadAllReports(): Promise<ErrorReport[]> {
    const reports: ErrorReport[] = [];
    
    if (!existsSync(this.reportsDir)) {
      return reports;
    }

    const { readdirSync } = require('fs');
    const files = readdirSync(this.reportsDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const reportId = file.replace('.json', '');
      const report = await this.loadReport(reportId);
      if (report) {
        reports.push(report);
      }
    }

    // 按时间排序
    reports.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return reports;
  }

  /**
   * 清理旧报告
   */
  private async cleanupOldReports(): Promise<void> {
    const reports = await this.loadAllReports();
    
    if (reports.length <= this.maxReports) {
      return;
    }

    // 删除最旧的报告
    const reportsToDelete = reports.slice(0, reports.length - this.maxReports);
    const { unlinkSync } = require('fs');
    
    for (const report of reportsToDelete) {
      try {
        const filePath = join(this.reportsDir, `${report.id}.json`);
        unlinkSync(filePath);
      } catch (error) {
        this.logger.warn(`删除旧报告失败: ${report.id}`, error);
      }
    }
    
    this.logger.info(`清理了 ${reportsToDelete.length} 个旧错误报告`);
  }

  /**
   * 确保报告目录存在
   */
  private ensureReportsDirectory(): void {
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * 获取包版本
   */
  private getPackageVersion(): string {
    try {
      const packageJsonPath = join(__dirname, '../../package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version || '0.0.0';
      }
    } catch (error) {
      // 版本获取失败
    }
    return '0.0.0';
  }
}

/**
 * 默认错误报告器实例
 */
export const errorReporter = new ErrorReporter();