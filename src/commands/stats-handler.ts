/**
 * 统计命令处理器
 * 处理所有 /stats 系列命令的业务逻辑
 */

import {
  CommandResult,
  CommandOptions,
  StatsCommandOptions,
  ToolsCommandOptions,
  CostCommandOptions,
  CompareCommandOptions,
  TrendsCommandOptions,
  ExportCommandOptions
} from '../types/commands';
import { AnalyticsEngine } from '../analytics';
import { ReportGenerator } from '../reports/generator';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { PaginationManager } from '../utils/cli-helpers';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { ReportConfig } from '../types/reports';

export class StatsHandler {
  private analyticsEngine: AnalyticsEngine;
  private reportGenerator: ReportGenerator;
  private logger: Logger;
  private configManager: ConfigManager;
  private paginationManager: PaginationManager;

  constructor() {
    this.analyticsEngine = new AnalyticsEngine();
    this.reportGenerator = new ReportGenerator();
    this.configManager = new ConfigManager();
    this.paginationManager = new PaginationManager(20); // 每页20行
    this.logger = new Logger({ 
      level: 'info', 
      colorize: true, 
      file_output: false,
      max_file_size: 10 * 1024 * 1024,
      max_files: 5
    });
  }

  /**
   * 处理主统计命令
   */
  async handleStatsCommand(options: StatsCommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理主统计命令', { options });

      // 构建分析请求
      const analysisTypes: ('basic' | 'efficiency' | 'trends' | 'insights')[] = [];
      
      if (options.trends) analysisTypes.push('trends');
      if (options.insights) analysisTypes.push('insights');
      if (!options.summary) {
        analysisTypes.push('basic', 'efficiency');
      }

      const analysisRequest = {
        project_path: options.project || process.cwd(),
        timeframe: (options.timeframe || 'today') as 'today' | 'week' | 'month' | 'custom',
        custom_range: this.parseCustomRange(options),
        analysis_types: (analysisTypes.length > 0 ? analysisTypes : ['basic', 'efficiency']) as ('basic' | 'efficiency' | 'trends' | 'insights')[]
      };

      // 执行分析
      let analysisResult;
      if (options.compare) {
        // 比较模式
        const previousRequest = this.buildPreviousRequest(analysisRequest as any);
        const comparison = await this.analyticsEngine.compareAnalysis(analysisRequest, previousRequest);
        analysisResult = comparison.current;
        
        // 添加比较信息到结果
        (analysisResult as any).comparison = comparison.comparison;
      } else {
        // 普通分析
        analysisResult = await this.analyticsEngine.generateAnalysisReport(analysisRequest);
      }

      // 生成报告
      const reportConfig = {
        type: options.summary ? 'efficiency' : 'efficiency', // 使用 efficiency 模板代替 project
        format: (options.format || 'table') as 'detailed' | 'table' | 'json' | 'markdown' | 'html' | 'csv' | 'compact' | 'ascii' | 'unicode',
        language: (options.language || 'zh-CN') as 'zh-CN' | 'en-US',
        include_charts: options.format === 'chart' || false,
        include_insights: options.insights || false
      };

      const report = await this.reportGenerator.generateReport(
        analysisResult as any,
        reportConfig as any
      );

      // 保存文件（如果指定）
      if (options.output) {
        await this.saveReportToFile(report, options.output);
        return {
          success: true,
          message: `${chalk.green('✅ 统计报告已生成')}\n${report}\n\n${chalk.blue('📁 已保存到:')} ${options.output}`
        };
      }

      // 检查是否需要分页显示
      const reportLines = report.split('\n');
      if (reportLines.length > 25 && options.format !== 'json') {
        await this.displayPaginatedReport(reportLines, '统计报告');
        return {
          success: true,
          message: ''
        };
      }

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('主统计命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理基础统计命令
   */
  async handleBasicStatsCommand(options: CommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理基础统计命令', { options });

      const quickResult = await this.analyticsEngine.quickAnalysis(options.project);
      
      const reportConfig = this.createReportConfig(
        'efficiency',
        options.format || 'table',
        options.language || 'zh-CN'
      );

      const report = await this.reportGenerator.generateReport(
        ({
          timeframe: options.timeframe || 'today',
          project_path: options.project || process.cwd(),
          basic_stats: quickResult.basic_stats,
          efficiency: quickResult.efficiency,
          data_source: 'cost_api',
          generated_at: new Date().toISOString(),
          data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
        }) as any,
        reportConfig as any
      );

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('基础统计命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理效率分析命令
   */
  async handleEfficiencyCommand(options: CommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理效率分析命令', { options });

      const quickResult = await this.analyticsEngine.quickAnalysis(options.project);
      
      const reportConfig = this.createReportConfig(
        'efficiency',
        options.format || 'table',
        options.language || 'zh-CN'
      );

      const report = await this.reportGenerator.generateReport(
        ({
          timeframe: options.timeframe || 'today',
          project_path: options.project || process.cwd(),
          basic_stats: quickResult.basic_stats,
          efficiency: quickResult.efficiency,
          data_source: 'cost_api',
          generated_at: new Date().toISOString(),
          data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
        }) as any,
        reportConfig as any
      );

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('效率分析命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理工具使用分析命令
   */
  async handleToolsCommand(options: ToolsCommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理工具使用分析命令', { options });

      const toolAnalysis = await this.analyticsEngine.analyzeToolUsage(options.project);
      
      // 根据选项处理结果
      let processedAnalysis = toolAnalysis.tool_analysis;
      
      // 排序
      if (options.sortBy) {
        processedAnalysis = this.sortToolAnalysis(processedAnalysis, options.sortBy);
      }
      
      // 限制数量
      if (options.top) {
        const topCount = parseInt(String(options.top), 10);
        processedAnalysis = processedAnalysis.slice(0, topCount);
      }
      
      // 过滤低效工具
      if (options.inefficient) {
        processedAnalysis = processedAnalysis.filter(tool => tool.efficiency_score < 5);
      }

      const result = {
        timeframe: options.timeframe || 'today',
        project_path: options.project || process.cwd(),
        basic_stats: {
          total_time_hours: 0,
          total_time_seconds: 0,
          total_tokens: 0,
          total_cost: 0,
          total_cost_usd: 0,
          session_count: 0,
          files_modified_count: 0,
          files_modified: [],
          tool_usage: {},
          model_usage: {}
        },
        efficiency: {
          tokens_per_hour: 0,
          lines_per_hour: 0,
          estimated_lines_changed: 0,
          productivity_score: 0,
          cost_per_hour: 0,
          efficiency_rating: 'N/A'
        },
        tools: processedAnalysis,
        recommendations: toolAnalysis.recommendations,
        efficiency_score: toolAnalysis.efficiency_score,
        data_source: 'cost_api',
        generated_at: new Date().toISOString(),
        data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
      };

      const reportConfig = this.createReportConfig(
        'efficiency',
        options.format || 'table',
        options.language || 'zh-CN'
      );

      const report = await this.reportGenerator.generateReport(
        result as any,
        reportConfig as any
      );

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('工具使用分析命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理成本分析命令
   */
  async handleCostCommand(options: CostCommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理成本分析命令', { options });

      const costAnalysis = await this.analyticsEngine.analyzeCost(options.project);
      
      const result = {
        timeframe: options.timeframe || 'today',
        project_path: options.project || process.cwd(),
        basic_stats: {
          total_time_hours: 0,
          total_time_seconds: 0,
          total_tokens: 0,
          total_cost: costAnalysis.total_cost,
          total_cost_usd: costAnalysis.total_cost,
          session_count: 0,
          files_modified_count: 0,
          files_modified: [],
          tool_usage: {},
          model_usage: {}
        },
        efficiency: {
          tokens_per_hour: 0,
          lines_per_hour: 0,
          estimated_lines_changed: 0,
          productivity_score: 0,
          cost_per_hour: costAnalysis.cost_per_hour,
          efficiency_rating: 'N/A'
        },
        cost_analysis: costAnalysis,
        breakdown: options.breakdown || 'daily',
        currency: options.currency || 'USD',
        include_recommendations: options.recommendations || false,
        data_source: 'cost_api',
        generated_at: new Date().toISOString(),
        data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
      };

      const reportConfig = this.createReportConfig(
        'efficiency',
        options.format || 'table',
        options.language || 'zh-CN'
      );

      const report = await this.reportGenerator.generateReport(
        result as any,
        reportConfig as any
      );

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('成本分析命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理比较分析命令
   */
  async handleCompareCommand(options: CompareCommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理比较分析命令', { options });

      // 构建当前和基准分析请求
      const currentRequest = {
        project_path: options.project || process.cwd(),
        timeframe: options.timeframe || 'today',
        custom_range: this.parseCustomRange(options),
        analysis_types: ['basic', 'efficiency']
      };

      const baselineRequest = this.buildBaselineRequest(options, currentRequest as any);
      
      const comparison = await this.analyticsEngine.compareAnalysis(currentRequest as any, baselineRequest as any);
      
      const result = {
        timeframe: comparison.current.timeframe,
        project_path: comparison.current.project_path,
        basic_stats: comparison.current.basic_stats,
        efficiency: comparison.current.efficiency,
        current: comparison.current,
        previous: comparison.previous,
        comparison: comparison.comparison,
        show_percentage: options.percentage || false,
        data_source: 'cost_api',
        generated_at: new Date().toISOString(),
        data_quality: comparison.current.data_quality
      };

      const reportConfig = this.createReportConfig(
        'efficiency',
        options.format || 'table',
        options.language || 'zh-CN'
      );

      const report = await this.reportGenerator.generateReport(
        result as any,
        reportConfig as any
      );

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('比较分析命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理趋势分析命令
   */
  async handleTrendsCommand(options: TrendsCommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理趋势分析命令', { options });

      const analysisRequest = {
        project_path: options.project || process.cwd(),
        timeframe: this.expandTimeframeForTrends(options) as 'today' | 'week' | 'month' | 'custom',
        analysis_types: ['trends'] as ('basic' | 'efficiency' | 'trends' | 'insights')[]
      };

      const analysisResult = await this.analyticsEngine.generateAnalysisReport(analysisRequest);
      
      const result = {
        ...analysisResult,
        trend_type: options.type || 'productivity',
        granularity: options.granularity || 'daily',
        forecast_days: options.forecast || 0
      };

      const reportConfig = this.createReportConfig(
        'efficiency',
        options.format || 'table',
        options.language || 'zh-CN'
      );

      const report = await this.reportGenerator.generateReport(
        result as any,
        reportConfig as any
      );

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('趋势分析命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理洞察命令
   */
  async handleInsightsCommand(options: CommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理洞察命令', { options });

      const analysisRequest = {
        project_path: options.project || process.cwd(),
        timeframe: (options.timeframe || 'week') as 'today' | 'week' | 'month' | 'custom',
        analysis_types: ['basic', 'efficiency', 'insights'] as ('basic' | 'efficiency' | 'trends' | 'insights')[]
      };

      const analysisResult = await this.analyticsEngine.generateAnalysisReport(analysisRequest);
      
      const reportConfig = {
        type: 'efficiency' as 'summary' | 'efficiency' | 'daily' | 'weekly' | 'monthly',
        format: (options.format || 'detailed') as 'detailed' | 'table' | 'json' | 'markdown' | 'html' | 'csv' | 'compact' | 'ascii' | 'unicode',
        language: (options.language || 'zh-CN') as 'zh-CN' | 'en-US'
      };

      const report = await this.reportGenerator.generateReport(
        analysisResult as any,
        reportConfig as any
      );

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('洞察命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理导出命令
   */
  async handleExportCommand(options: ExportCommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理导出命令', { options });

      const analysisRequest = {
        project_path: options.project || process.cwd(),
        timeframe: (options.timeframe || 'month') as 'today' | 'week' | 'month' | 'custom',
        analysis_types: this.getAnalysisTypesForExport(options.type) as ('basic' | 'efficiency' | 'trends' | 'insights')[]
      };

      const analysisResult = await this.analyticsEngine.generateAnalysisReport(analysisRequest);
      
      // 确定输出文件路径和格式
      const outputPath = this.buildExportPath(options);
      const exportFormat = options.exportFormat || 'json';
      
      // 生成并保存报告
      let report: string;
      
      if (exportFormat === 'json') {
        report = JSON.stringify(analysisResult, null, 2);
      } else {
        // 对于其他格式，使用报告生成器
        const reportConfig = this.createReportConfig(
          'efficiency',
          'detailed',
          options.language || 'zh-CN'
        );
        report = await this.reportGenerator.generateReport(
          analysisResult as any,
          reportConfig as any
        );
      }

      await this.saveReportToFile(report, outputPath);

      return {
        success: true,
        message: `${chalk.green('✅ 数据导出完成')}\n📁 文件保存在: ${outputPath}\n📊 包含数据: ${options.type || 'all'}\n🗓️  时间范围: ${options.timeframe || 'month'}`
      };

    } catch (error) {
      this.logger.error('导出命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 处理检查命令
   */
  async handleCheckCommand(options: CommandOptions): Promise<CommandResult> {
    try {
      this.logger.info('处理检查命令', { options });

      const availability = await this.analyticsEngine.checkDataAvailability();
      
      let report = '';
      
      // 数据源状态
      report += chalk.bold('\n🔍 数据源可用性检查\n');
      report += '─'.repeat(50) + '\n';
      
      report += `Cost API: ${availability.cost_api ? chalk.green('✅ 可用') : chalk.red('❌ 不可用')}\n`;
      report += `OpenTelemetry: ${availability.opentelemetry ? chalk.green('✅ 可用') : chalk.yellow('⚠️  未启用')}\n`;
      
      // 总体状态
      const statusColors = {
        excellent: chalk.green,
        good: chalk.yellow,
        limited: chalk.yellowBright,
        unavailable: chalk.red
      };
      
      const statusEmojis = {
        excellent: '🟢',
        good: '🟡',
        limited: '🟠',
        unavailable: '🔴'
      };

      report += `\n${statusEmojis[availability.overall_status]} 总体状态: ${statusColors[availability.overall_status](availability.overall_status.toUpperCase())}\n`;
      
      // 建议
      if (availability.recommendations.length > 0) {
        report += '\n💡 建议:\n';
        availability.recommendations.forEach((rec, index) => {
          report += `  ${index + 1}. ${rec}\n`;
        });
      }

      // 详细信息（如果启用）
      if (options.verbose) {
        report += '\n📋 系统信息:\n';
        report += `  • 配置文件: ~/.claude/settings.json\n`;
        report += `  • 当前目录: ${process.cwd()}\n`;
        report += `  • Node.js 版本: ${process.version}\n`;
        report += `  • 平台: ${process.platform}\n`;
      }

      return {
        success: true,
        message: report
      };

    } catch (error) {
      this.logger.error('检查命令执行失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // ===== 私有辅助方法 =====

  /**
   * 创建报告配置
   */
  private createReportConfig(
    type: string = 'efficiency',
    format: string = 'table',
    language: string = 'zh-CN',
    includeCharts: boolean = false,
    includeInsights: boolean = false
  ): ReportConfig {
    // 映射到正确的报告类型
    const reportType = type === 'summary' ? 'efficiency' : 
                      type === 'efficiency' ? 'efficiency' :
                      type as 'daily' | 'weekly' | 'monthly' | 'project' | 'efficiency' | 'trends' | 'tools' | 'cost' | 'insights';
    
    // 映射到正确的格式
    const reportFormat = format === 'chart' ? 'chart' :
                        format === 'csv' ? 'json' :
                        format === 'html' ? 'markdown' :
                        format === 'compact' ? 'brief' :
                        format === 'ascii' ? 'table' :
                        format === 'unicode' ? 'table' :
                        format as 'table' | 'detailed' | 'brief' | 'insights' | 'chart' | 'pie' | 'financial' | 'json' | 'markdown';

    return {
      type: reportType,
      format: reportFormat,
      language: language as 'zh-CN' | 'en-US',
      include_charts: includeCharts,
      include_insights: includeInsights
    };
  }

  /**
   * 解析自定义时间范围
   */
  private parseCustomRange(options: CommandOptions): [Date, Date] | undefined {
    if (options.timeframe === 'custom' && options.from && options.to) {
      return [new Date(options.from), new Date(options.to)];
    }
    return undefined;
  }

  /**
   * 构建上一时间段的请求
   */
  private buildPreviousRequest(currentRequest: any): any {
    const timeframe = currentRequest.timeframe;
    const now = new Date();
    
    let previousStart: Date;
    let previousEnd: Date;

    switch (timeframe) {
    case 'today':
      previousStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      previousEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000);
      break;
    case 'week':
      previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      previousEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      previousStart = lastMonth;
      previousEnd = lastMonthEnd;
      break;
    default:
      // 默认前一天
      previousStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      previousEnd = now;
    }

    return {
      ...currentRequest,
      custom_range: [previousStart, previousEnd]
    };
  }

  /**
   * 构建基准请求
   */
  private buildBaselineRequest(options: CompareCommandOptions, currentRequest: any): any {
    const baseline = options.baseline || 'previous-week';
    
    if (baseline === 'custom' && options.baselineFrom && options.baselineTo) {
      return {
        ...currentRequest,
        custom_range: [new Date(options.baselineFrom), new Date(options.baselineTo)]
      };
    }

    // 使用预设基准
    return this.buildPreviousRequest(currentRequest);
  }

  /**
   * 为趋势分析扩展时间范围
   */
  private expandTimeframeForTrends(options: TrendsCommandOptions): string {
    const granularity = options.granularity || 'daily';
    
    // 根据粒度自动扩展时间范围以获得足够的数据点
    switch (granularity) {
    case 'daily':
      return 'month'; // 1个月的日数据
    case 'weekly':
      return 'month'; // 3个月的周数据（近似）
    case 'monthly':
      return 'month'; // 1年的月数据（近似）
    default:
      return 'month';
    }
  }

  /**
   * 获取导出的分析类型
   */
  private getAnalysisTypesForExport(exportType?: string): ('basic' | 'efficiency' | 'trends' | 'insights')[] {
    switch (exportType) {
    case 'stats':
      return ['basic', 'efficiency'];
    case 'trends':
      return ['trends'];
    case 'insights':
      return ['insights'];
    case 'all':
    default:
      return ['basic', 'efficiency', 'trends', 'insights'];
    }
  }

  /**
   * 构建导出文件路径
   */
  private buildExportPath(options: ExportCommandOptions): string {
    const baseOutput = options.output || './claude-stats-export';
    const format = options.exportFormat || 'json';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 如果输出路径没有扩展名，添加扩展名和时间戳
    if (!path.extname(baseOutput)) {
      return `${baseOutput}-${timestamp}.${format}`;
    }
    
    return baseOutput;
  }

  /**
   * 保存报告到文件
   */
  private async saveReportToFile(report: string, filePath: string): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // 写入文件
      await fs.writeFile(filePath, report, 'utf-8');
      
      this.logger.info('报告已保存到文件', { filePath });
    } catch (error) {
      this.logger.error('保存报告失败', { filePath, error });
      throw new Error(`无法保存文件到 ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 排序工具分析结果
   */
  private sortToolAnalysis(analysis: any[], sortBy: string): any[] {
    switch (sortBy) {
    case 'usage':
      return analysis.sort((a, b) => b.usage_count - a.usage_count);
    case 'efficiency':
      return analysis.sort((a, b) => b.efficiency_score - a.efficiency_score);
    case 'time':
      return analysis.sort((a, b) => (b.avg_time_per_use || 0) - (a.avg_time_per_use || 0));
    default:
      return analysis;
    }
  }

  /**
   * 分页显示报告
   */
  private async displayPaginatedReport(reportLines: string[], title: string): Promise<void> {
    try {
      console.log(chalk.blue(`\n📄 ${title} (${reportLines.length} 行)`));
      console.log(chalk.gray('内容较长，将使用分页显示...\n'));
      
      await this.paginationManager.displayPaginated(reportLines, title);
    } catch (error) {
      // 如果分页显示失败，回退到直接输出
      console.log(chalk.yellow('分页显示失败，使用普通显示模式\n'));
      reportLines.forEach(line => console.log(line));
    }
  }

  /**
   * 测量命令执行时间
   */
  public async executeWithTiming<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.showExecutionTime(operationName, duration);
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(chalk.red(`\n❌ ${operationName} 执行失败 (耗时: ${this.formatDuration(duration)})`));
      throw error;
    }
  }

  /**
   * 显示执行时间
   */
  private showExecutionTime(operationName: string, duration: number): void {
    const formattedDuration = this.formatDuration(duration);
    let timeColor = chalk.green;
    
    // 根据执行时间选择颜色
    if (duration > 5000) {
      timeColor = chalk.red; // 超过5秒显示红色
    } else if (duration > 2000) {
      timeColor = chalk.yellow; // 超过2秒显示黄色
    }
    
    console.log(timeColor(`\n⏱️  ${operationName} 执行完成，耗时: ${formattedDuration}`));
  }

  /**
   * 格式化时长显示
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * 显示命令开始执行提示
   */
  public showCommandStart(commandName: string, options: any): void {
    console.log(chalk.blue(`\n🚀 开始执行 ${commandName} 命令...`));
    
    if (process.env.NODE_ENV === 'development' || options.verbose) {
      console.log(chalk.gray('参数:'), JSON.stringify(options, null, 2));
    }
  }

  /**
   * 显示命令完成提示
   */
  public showCommandComplete(commandName: string, success: boolean): void {
    if (success) {
      console.log(chalk.green(`\n✅ ${commandName} 命令执行完成`));
    } else {
      console.log(chalk.red(`\n❌ ${commandName} 命令执行失败`));
    }
  }
}