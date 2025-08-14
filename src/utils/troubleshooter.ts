/**
 * 智能故障排除系统
 * 
 * 提供自动化的问题诊断和修复建议，包括：
 * - 环境检查和诊断
 * - 配置验证和修复建议
 * - 数据源状态检查
 * - 常见问题的自动解决方案
 * - 系统健康检查
 */

import { AppError, ErrorCode } from '../types/errors';
import { Logger } from './logger';
import { ConfigManager } from './config';
import { existsSync, accessSync, constants } from 'fs';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 诊断结果等级
 */
export enum DiagnosticLevel {
  HEALTHY = 'healthy',
  WARNING = 'warning',  
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 诊断结果
 */
export interface DiagnosticResult {
  id: string;
  level: DiagnosticLevel;
  category: string;
  title: string;
  description: string;
  suggestion?: string;
  autoFix?: () => Promise<boolean>;
  priority: number; // 1-10, 10最高
}

/**
 * 故障排除报告
 */
export interface TroubleshootingReport {
  timestamp: Date;
  overallHealth: DiagnosticLevel;
  summary: {
    total: number;
    healthy: number;
    warnings: number;
    errors: number;
    critical: number;
  };
  results: DiagnosticResult[];
  recommendations: string[];
}

/**
 * 系统环境信息
 */
export interface SystemEnvironment {
  platform: string;
  nodeVersion: string;
  npmVersion?: string;
  claudeCodeAvailable: boolean;
  homeDirectory: string;
  currentDirectory: string;
  configPath: string;
}

/**
 * 智能故障排除器
 */
export class Troubleshooter {
  private logger: Logger;
  private configManager: ConfigManager;

  constructor(logger?: Logger, configManager?: ConfigManager) {
    this.logger = logger || Logger.getInstance();
    this.configManager = configManager || new ConfigManager();
  }

  /**
   * 执行完整的系统诊断
   * 
   * @returns 故障排除报告
   */
  async diagnose(): Promise<TroubleshootingReport> {
    this.logger.info('开始系统诊断...');
    
    const results: DiagnosticResult[] = [];
    const startTime = new Date();

    // 1. 系统环境检查
    results.push(...await this.checkSystemEnvironment());

    // 2. 配置检查
    results.push(...await this.checkConfiguration());

    // 3. 数据源检查
    results.push(...await this.checkDataSources());

    // 4. 权限检查
    results.push(...await this.checkPermissions());

    // 5. 依赖检查
    results.push(...await this.checkDependencies());

    // 生成报告
    const report = this.generateReport(results, startTime);
    
    this.logger.info(`系统诊断完成，发现 ${report.summary.errors + report.summary.critical} 个问题`);
    
    return report;
  }

  /**
   * 针对特定错误进行诊断
   * 
   * @param error - 应用错误
   * @returns 诊断结果列表
   */
  async diagnoseError(error: AppError): Promise<DiagnosticResult[]> {
    this.logger.info(`诊断错误: ${error.code}`);
    
    const results: DiagnosticResult[] = [];

    switch (error.code) {
    case ErrorCode.CONFIG_NOT_FOUND:
      results.push(...await this.diagnoseConfigIssues());
      break;
    case ErrorCode.DATA_SOURCE_NOT_AVAILABLE:
      results.push(...await this.diagnoseDataSourceIssues());
      break;
    case ErrorCode.FILE_PERMISSION_DENIED:
      results.push(...await this.diagnosePermissionIssues());
      break;
    case ErrorCode.NETWORK_CONNECTION_FAILED:
      results.push(...await this.diagnoseNetworkIssues());
      break;
    default:
      results.push(...await this.diagnoseGenericIssues(error));
    }

    return results;
  }

  /**
   * 执行自动修复
   * 
   * @param diagnosticId - 诊断结果ID
   * @returns 修复是否成功
   */
  async autoFix(diagnosticId: string): Promise<boolean> {
    const results = await this.diagnose();
    const diagnostic = results.results.find(r => r.id === diagnosticId);
    
    if (!diagnostic || !diagnostic.autoFix) {
      this.logger.warn(`未找到可自动修复的诊断项: ${diagnosticId}`);
      return false;
    }

    try {
      this.logger.info(`尝试自动修复: ${diagnostic.title}`);
      const success = await diagnostic.autoFix();
      
      if (success) {
        this.logger.info(`自动修复成功: ${diagnostic.title}`);
      } else {
        this.logger.warn(`自动修复失败: ${diagnostic.title}`);
      }
      
      return success;
    } catch (error) {
      this.logger.error(`自动修复出错: ${diagnostic.title}`, error);
      return false;
    }
  }

  /**
   * 检查系统环境
   */
  private async checkSystemEnvironment(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    try {
      const env = await this.getSystemEnvironment();

      // Node.js版本检查
      const nodeVersion = process.version;
      const nodeMajorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (nodeMajorVersion < 16) {
        results.push({
          id: 'node_version_outdated',
          level: DiagnosticLevel.ERROR,
          category: '系统环境',
          title: 'Node.js版本过旧',
          description: `当前Node.js版本 ${nodeVersion}，需要16.0.0或更高版本`,
          suggestion: '升级Node.js到最新LTS版本：https://nodejs.org/',
          priority: 8
        });
      } else {
        results.push({
          id: 'node_version_ok',
          level: DiagnosticLevel.HEALTHY,
          category: '系统环境',
          title: 'Node.js版本正常',
          description: `Node.js版本 ${nodeVersion} 符合要求`,
          priority: 1
        });
      }

      // Claude Code可用性检查
      if (!env.claudeCodeAvailable) {
        results.push({
          id: 'claude_code_unavailable',
          level: DiagnosticLevel.CRITICAL,
          category: '系统环境',
          title: 'Claude Code不可用',
          description: 'Claude Code命令行工具未安装或不在PATH中',
          suggestion: '安装Claude Code并确保在PATH中：https://claude.ai/code',
          autoFix: async () => {
            // 尝试检查常见安装位置
            const commonPaths = [
              '/usr/local/bin/claude',
              '/opt/claude/bin/claude',
              join(env.homeDirectory, '.local/bin/claude')
            ];
            
            for (const path of commonPaths) {
              if (existsSync(path)) {
                this.logger.info(`发现Claude Code安装: ${path}`);
                return false; // 需要用户手动添加到PATH
              }
            }
            return false;
          },
          priority: 10
        });
      } else {
        results.push({
          id: 'claude_code_available',
          level: DiagnosticLevel.HEALTHY,
          category: '系统环境',
          title: 'Claude Code可用',
          description: 'Claude Code命令行工具正常工作',
          priority: 1
        });
      }

    } catch (error) {
      results.push({
        id: 'system_check_failed',
        level: DiagnosticLevel.ERROR,
        category: '系统环境',
        title: '系统环境检查失败',
        description: `无法检查系统环境: ${error}`,
        priority: 7
      });
    }

    return results;
  }

  /**
   * 检查配置
   */
  private async checkConfiguration(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      // 检查配置文件存在性
      const configPath = this.configManager.getConfigPath();
      
      if (!existsSync(configPath)) {
        results.push({
          id: 'config_file_missing',
          level: DiagnosticLevel.WARNING,
          category: '配置管理',
          title: '配置文件不存在',
          description: `配置文件未找到: ${configPath}`,
          suggestion: '创建默认配置文件',
          autoFix: async () => {
            try {
              await this.configManager.createDefaultConfig();
              return true;
            } catch (error) {
              this.logger.error('创建默认配置失败', error);
              return false;
            }
          },
          priority: 6
        });
      } else {
        // 检查配置文件有效性
        try {
          const config = await this.configManager.loadConfig();
          
          results.push({
            id: 'config_file_valid',
            level: DiagnosticLevel.HEALTHY,
            category: '配置管理',
            title: '配置文件有效',
            description: '配置文件格式正确且可读取',
            priority: 1
          });

          // 检查关键配置项
          if (!config['cc-stats']?.enabled) {
            results.push({
              id: 'cc_stats_disabled',
              level: DiagnosticLevel.WARNING,
              category: '配置管理',
              title: 'cc-stats功能未启用',
              description: '统计功能在配置中被禁用',
              suggestion: '在配置中启用cc-stats功能',
              autoFix: async () => {
                try {
                  config['cc-stats'] = { ...config['cc-stats'], enabled: true };
                  await this.configManager.saveConfig(config);
                  return true;
                } catch (error) {
                  return false;
                }
              },
              priority: 5
            });
          }

        } catch (error) {
          results.push({
            id: 'config_file_invalid',
            level: DiagnosticLevel.ERROR,
            category: '配置管理',
            title: '配置文件无效',
            description: `配置文件格式错误: ${error}`,
            suggestion: '修复配置文件或重新创建',
            autoFix: async () => {
              try {
                // 备份原配置并创建新的
                const backupPath = configPath + '.backup.' + Date.now();
                await this.configManager.backupConfig(backupPath);
                await this.configManager.createDefaultConfig();
                return true;
              } catch (error) {
                return false;
              }
            },
            priority: 7
          });
        }
      }

    } catch (error) {
      results.push({
        id: 'config_check_failed',
        level: DiagnosticLevel.ERROR,
        category: '配置管理',
        title: '配置检查失败',
        description: `无法检查配置: ${error}`,
        priority: 7
      });
    }

    return results;
  }

  /**
   * 检查数据源
   */
  private async checkDataSources(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      // 检查Cost API
      const costAPIResult = await this.checkCostAPI();
      results.push(costAPIResult);

      // 检查OpenTelemetry
      const otelResult = await this.checkOpenTelemetry();
      results.push(otelResult);

    } catch (error) {
      results.push({
        id: 'data_source_check_failed',
        level: DiagnosticLevel.ERROR,
        category: '数据源',
        title: '数据源检查失败',
        description: `无法检查数据源: ${error}`,
        priority: 7
      });
    }

    return results;
  }

  /**
   * 检查权限
   */
  private async checkPermissions(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const configPath = this.configManager.getConfigPath();
      const configDir = dirname(configPath);

      // 检查配置目录权限
      try {
        accessSync(configDir, constants.R_OK | constants.W_OK);
        results.push({
          id: 'config_dir_permissions_ok',
          level: DiagnosticLevel.HEALTHY,
          category: '权限',
          title: '配置目录权限正常',
          description: '可以读写配置目录',
          priority: 1
        });
      } catch (error) {
        results.push({
          id: 'config_dir_permissions_denied',
          level: DiagnosticLevel.ERROR,
          category: '权限',
          title: '配置目录权限不足',
          description: `无法访问配置目录: ${configDir}`,
          suggestion: '检查目录权限或使用sudo运行',
          priority: 8
        });
      }

      // 检查当前工作目录权限
      try {
        accessSync(process.cwd(), constants.R_OK);
        results.push({
          id: 'working_dir_permissions_ok',
          level: DiagnosticLevel.HEALTHY,
          category: '权限',
          title: '工作目录权限正常',
          description: '可以读取当前工作目录',
          priority: 1
        });
      } catch (error) {
        results.push({
          id: 'working_dir_permissions_denied',
          level: DiagnosticLevel.WARNING,
          category: '权限',
          title: '工作目录权限不足',
          description: `无法读取当前工作目录: ${process.cwd()}`,
          suggestion: '切换到有权限的目录',
          priority: 5
        });
      }

    } catch (error) {
      results.push({
        id: 'permission_check_failed',
        level: DiagnosticLevel.ERROR,
        category: '权限',
        title: '权限检查失败',
        description: `无法检查权限: ${error}`,
        priority: 7
      });
    }

    return results;
  }

  /**
   * 检查依赖
   */
  private async checkDependencies(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 检查必需的npm包
    const requiredPackages = ['commander', 'winston', 'chalk'];
    
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        results.push({
          id: `dependency_${pkg}_ok`,
          level: DiagnosticLevel.HEALTHY,
          category: '依赖',
          title: `${pkg} 可用`,
          description: `依赖包 ${pkg} 正确安装`,
          priority: 1
        });
      } catch (error) {
        results.push({
          id: `dependency_${pkg}_missing`,
          level: DiagnosticLevel.ERROR,
          category: '依赖',
          title: `${pkg} 缺失`,
          description: `依赖包 ${pkg} 未安装`,
          suggestion: `运行 npm install ${pkg} 安装依赖`,
          autoFix: async () => {
            try {
              await execAsync(`npm install ${pkg}`);
              return true;
            } catch (error) {
              return false;
            }
          },
          priority: 8
        });
      }
    }

    return results;
  }

  /**
   * 特定错误诊断方法
   */
  private async diagnoseConfigIssues(): Promise<DiagnosticResult[]> {
    return await this.checkConfiguration();
  }

  private async diagnoseDataSourceIssues(): Promise<DiagnosticResult[]> {
    return await this.checkDataSources();
  }

  private async diagnosePermissionIssues(): Promise<DiagnosticResult[]> {
    return await this.checkPermissions();
  }

  private async diagnoseNetworkIssues(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      // 检查网络连接
      await execAsync('ping -c 1 google.com');
      results.push({
        id: 'network_connectivity_ok',
        level: DiagnosticLevel.HEALTHY,
        category: '网络',
        title: '网络连接正常',
        description: '可以连接到外部网络',
        priority: 1
      });
    } catch (error) {
      results.push({
        id: 'network_connectivity_failed',
        level: DiagnosticLevel.ERROR,
        category: '网络',
        title: '网络连接失败',
        description: '无法连接到外部网络',
        suggestion: '检查网络设置和防火墙配置',
        priority: 8
      });
    }

    return results;
  }

  private async diagnoseGenericIssues(error: AppError): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    results.push({
      id: `generic_error_${error.code}`,
      level: DiagnosticLevel.ERROR,
      category: '通用问题',
      title: '错误诊断',
      description: `发生错误: ${error.message}`,
      suggestion: '查看详细错误信息和日志，尝试重新运行命令',
      priority: 5
    });

    return results;
  }

  /**
   * 检查Cost API
   */
  private async checkCostAPI(): Promise<DiagnosticResult> {
    try {
      const { stdout } = await execAsync('claude cost --help');
      return {
        id: 'cost_api_available',
        level: DiagnosticLevel.HEALTHY,
        category: '数据源',
        title: 'Cost API可用',
        description: 'Claude Cost API正常工作',
        priority: 1
      };
    } catch (error) {
      return {
        id: 'cost_api_unavailable',
        level: DiagnosticLevel.ERROR,
        category: '数据源',
        title: 'Cost API不可用',
        description: '无法访问Claude Cost API',
        suggestion: '确保Claude Code正确安装并已登录',
        priority: 9
      };
    }
  }

  /**
   * 检查OpenTelemetry
   */
  private async checkOpenTelemetry(): Promise<DiagnosticResult> {
    const hasOtelConfig = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 
                         process.env.OTEL_RESOURCE_ATTRIBUTES;
    
    if (hasOtelConfig) {
      return {
        id: 'opentelemetry_configured',
        level: DiagnosticLevel.HEALTHY,
        category: '数据源',
        title: 'OpenTelemetry已配置',
        description: 'OpenTelemetry环境变量已设置',
        priority: 1
      };
    } else {
      return {
        id: 'opentelemetry_not_configured',
        level: DiagnosticLevel.WARNING,
        category: '数据源',
        title: 'OpenTelemetry未配置',
        description: 'OpenTelemetry可选功能未启用',
        suggestion: '如需详细监控数据，配置OpenTelemetry环境变量',
        priority: 3
      };
    }
  }

  /**
   * 获取系统环境信息
   */
  private async getSystemEnvironment(): Promise<SystemEnvironment> {
    const env: SystemEnvironment = {
      platform: process.platform,
      nodeVersion: process.version,
      claudeCodeAvailable: false,
      homeDirectory: require('os').homedir(),
      currentDirectory: process.cwd(),
      configPath: this.configManager.getConfigPath()
    };

    try {
      const { stdout } = await execAsync('npm --version');
      env.npmVersion = stdout.trim();
    } catch (error) {
      // npm不可用
    }

    try {
      await execAsync('claude --version');
      env.claudeCodeAvailable = true;
    } catch (error) {
      // Claude Code不可用
    }

    return env;
  }

  /**
   * 生成故障排除报告
   */
  private generateReport(results: DiagnosticResult[], startTime: Date): TroubleshootingReport {
    const summary = {
      total: results.length,
      healthy: results.filter(r => r.level === DiagnosticLevel.HEALTHY).length,
      warnings: results.filter(r => r.level === DiagnosticLevel.WARNING).length,
      errors: results.filter(r => r.level === DiagnosticLevel.ERROR).length,
      critical: results.filter(r => r.level === DiagnosticLevel.CRITICAL).length
    };

    // 确定整体健康状况
    let overallHealth = DiagnosticLevel.HEALTHY;
    if (summary.critical > 0) {
      overallHealth = DiagnosticLevel.CRITICAL;
    } else if (summary.errors > 0) {
      overallHealth = DiagnosticLevel.ERROR;
    } else if (summary.warnings > 0) {
      overallHealth = DiagnosticLevel.WARNING;
    }

    // 生成建议
    const recommendations: string[] = [];
    const criticalIssues = results.filter(r => r.level === DiagnosticLevel.CRITICAL);
    const errorIssues = results.filter(r => r.level === DiagnosticLevel.ERROR);

    if (criticalIssues.length > 0) {
      recommendations.push('🚨 有严重问题需要立即解决，系统可能无法正常工作');
      criticalIssues.forEach(issue => {
        if (issue.suggestion) {
          recommendations.push(`• ${issue.suggestion}`);
        }
      });
    }

    if (errorIssues.length > 0) {
      recommendations.push('⚠️ 有错误需要修复，可能影响某些功能');
      errorIssues.slice(0, 3).forEach(issue => { // 只显示前3个
        if (issue.suggestion) {
          recommendations.push(`• ${issue.suggestion}`);
        }
      });
    }

    if (results.some(r => r.autoFix)) {
      recommendations.push('💡 某些问题可以自动修复，使用 autoFix 功能尝试修复');
    }

    // 按优先级排序
    results.sort((a, b) => b.priority - a.priority);

    return {
      timestamp: new Date(),
      overallHealth,
      summary,
      results,
      recommendations
    };
  }
}

/**
 * 默认故障排除器实例
 */
export const troubleshooter = new Troubleshooter();