import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import { UsageData, BasicUsageStats } from '../types/usage-data';
import { ConfigManager } from '../utils/config';
import { Logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * 简化的数据源管理器
 * 专注于实际可用的数据源：Cost API + 可选的 OpenTelemetry
 */
export class SimplifiedDataManager {
  private configManager: ConfigManager;
  private logger: Logger;

  constructor() {
    this.configManager = new ConfigManager();
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
  }

  /**
   * 获取使用统计数据
   * @param projectDir 项目目录路径
   * @returns 使用统计数据
   */
  async getUsageStats(projectDir?: string): Promise<BasicUsageStats> {
    const config = this.configManager.getDataSourceConfig();
    
    try {
      // 主数据源：Cost API（始终可用）
      const costData = await this.getCostData(projectDir);
      
      // 增强数据源：OpenTelemetry（可选）
      let otelData = null;
      if (config.opentelemetry) {
        try {
          otelData = await this.getOTelData(projectDir);
        } catch (error) {
          this.logger.warn('OpenTelemetry 数据获取失败，使用 Cost API 数据', error);
        }
      }

      return this.mergeDataSources(costData, otelData);
    } catch (error) {
      this.logger.error('数据获取失败', error);
      throw new Error(`无法获取使用数据: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 通过 Claude Code 的 cost 命令获取数据
   * 这是最可靠的数据源
   */
  private async getCostData(projectDir?: string): Promise<UsageData> {
    try {
      // 安全验证工作目录路径
      const cwd = this.validateAndNormalizePath(projectDir || process.cwd());
      
      // 安全执行命令，使用固定的命令字符串
      const { stdout } = await execAsync('claude cost --json', { 
        cwd,
        timeout: 30000, // 30秒超时
        maxBuffer: 1024 * 1024 // 1MB最大输出
      });
      
      // 安全解析JSON并验证
      const costData = this.parseAndValidateCostData(stdout);
      
      return {
        timestamp: new Date().toISOString(),
        project: this.getProjectName(cwd),
        tokens: {
          input: costData.input_tokens || 0,
          output: costData.output_tokens || 0,
          total: costData.total_tokens || 0
        },
        costs: {
          input: costData.input_cost || 0,
          output: costData.output_cost || 0,
          total: costData.total_cost || 0
        },
        session: {
          duration_minutes: costData.session_duration || 0,
          messages_count: costData.messages || 0
        },
        source: 'cost_api'
      };
    } catch (error) {
      throw new Error(`Cost API 调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取 OpenTelemetry 数据（如果可用）
   * 这是增强数据源，提供更详细的监控信息
   */
  private async getOTelData(projectDir?: string): Promise<UsageData | null> {
    // 检查 OpenTelemetry 是否启用
    if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      this.logger.debug('OpenTelemetry 未配置，跳过');
      return null;
    }

    try {
      // 这里需要根据实际的 OTel 数据获取方式实现
      // 目前返回 null，表示 OTel 数据不可用
      this.logger.debug('OpenTelemetry 数据获取功能待实现');
      return null;
    } catch (error) {
      this.logger.warn('OpenTelemetry 数据获取失败', error);
      return null;
    }
  }

  /**
   * 合并不同数据源的数据
   * Cost API 数据为基础，OTel 数据用于增强
   */
  private mergeDataSources(
    costData: UsageData, 
    otelData: UsageData | null
  ): BasicUsageStats {
    const baseStats: BasicUsageStats = {
      project: costData.project,
      timespan: {
        start: costData.timestamp,
        end: costData.timestamp,
        duration_minutes: costData.session?.duration_minutes || 0
      },
      tokens: costData.tokens,
      costs: costData.costs,
      activity: {
        sessions: 1,
        messages: costData.session?.messages_count || 0,
        tools_used: [], // Cost API 不提供工具信息
        files_modified: 0 // Cost API 不提供文件信息
      },
      data_quality: {
        sources: [costData.source],
        completeness: otelData ? 0.9 : 0.7, // OTel 数据提升完整性
        last_updated: costData.timestamp
      }
    };

    // 如果有 OTel 数据，用它来增强统计信息
    if (otelData) {
      baseStats.data_quality.sources.push(otelData.source);
      // 这里可以添加 OTel 特有的数据合并逻辑
    }

    return baseStats;
  }

  /**
   * 从目录路径提取项目名称
   */
  private getProjectName(dirPath: string): string {
    const segments = dirPath.split(/[/\\]/);
    return segments[segments.length - 1] || 'unknown-project';
  }

  /**
   * 检查数据源可用性
   */
  async checkDataSourceAvailability(): Promise<{
    cost_api: boolean;
    opentelemetry: boolean;
  }> {
    return {
      cost_api: await this.checkCostApiAvailability(),
      opentelemetry: await this.checkOTelAvailability()
    };
  }

  /**
   * 检查 Cost API 是否可用
   */
  private async checkCostApiAvailability(): Promise<boolean> {
    try {
      // 安全执行命令检查，不传递外部参数
      await execAsync('claude cost --help', {
        timeout: 10000, // 10秒超时
        maxBuffer: 1024 * 10 // 10KB最大输出
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查 OpenTelemetry 是否可用
   */
  private async checkOTelAvailability(): Promise<boolean> {
    return !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  }

  /**
   * 验证并规范化路径，防止路径遍历攻击
   * @param inputPath 输入路径
   * @returns 安全的绝对路径
   */
  private validateAndNormalizePath(inputPath: string): string {
    try {
      // 解析为绝对路径
      const absolutePath = path.resolve(inputPath);
      
      // 检查路径是否存在异常字符
      if (absolutePath.includes('..') || absolutePath.includes('\0')) {
        throw new Error('路径包含非法字符');
      }
      
      // 确保路径不超出预期范围（可根据需要调整）
      const allowedPaths = [
        path.resolve(process.cwd()), // 当前工作目录
        path.resolve(os.homedir()), // 用户主目录
        path.resolve('/tmp'), // 临时目录
      ];
      
      // 检查路径是否在允许的范围内
      const isAllowed = allowedPaths.some(allowed => 
        absolutePath.startsWith(allowed) || allowed.startsWith(absolutePath)
      );
      
      if (!isAllowed) {
        this.logger.warn(`路径超出允许范围: ${absolutePath}`);
        // 降级到当前工作目录
        return process.cwd();
      }
      
      return absolutePath;
    } catch (error) {
      this.logger.error('路径验证失败', { inputPath, error });
      // 安全降级到当前工作目录
      return process.cwd();
    }
  }

  /**
   * 安全解析和验证Cost API返回的JSON数据
   * @param jsonString JSON字符串
   * @returns 验证后的数据对象
   */
  private parseAndValidateCostData(jsonString: string): any {
    try {
      // 检查JSON字符串长度，防止过大数据
      if (jsonString.length > 1024 * 1024) { // 1MB限制
        throw new Error('JSON数据过大');
      }
      
      // 解析JSON
      const data = JSON.parse(jsonString);
      
      // 基础数据结构验证
      if (!data || typeof data !== 'object') {
        throw new Error('无效的JSON数据结构');
      }
      
      // 验证必要字段的类型
      const requiredNumericFields = ['input_tokens', 'output_tokens', 'total_tokens', 'total_cost'];
      for (const field of requiredNumericFields) {
        if (data[field] !== undefined && (typeof data[field] !== 'number' || isNaN(data[field]) || data[field] < 0)) {
          this.logger.warn(`字段 ${field} 的值无效: ${data[field]}`);
          data[field] = 0; // 安全降级
        }
      }
      
      return data;
    } catch (error) {
      this.logger.error('JSON解析失败', { error, preview: jsonString.substring(0, 100) });
      throw new Error(`Cost API数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}