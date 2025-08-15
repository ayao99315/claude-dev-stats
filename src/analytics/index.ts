/**
 * 智能分析引擎 - 统一入口
 * 整合所有分析模块，提供完整的数据分析功能
 */

import { 
  AnalysisRequest, 
  AnalysisResult, 
  BasicStats, 
  EfficiencyMetrics, 
  TrendAnalysis, 
  SmartInsights,
  CostAnalysis,
  ToolUsageAnalysis,
  AnalyticsConfig,
  TimeframeResult
} from '../types/analytics';
import { BasicUsageStats, UsageData } from '../types/usage-data';
import { SimplifiedDataManager } from '../data-sources/simplified-manager';
import { BasicStatsCalculator, StatsComparator } from './basic-stats';
import { EfficiencyCalculator, CodeEstimator } from './efficiency';
import { TrendsAnalyzer, AdvancedTrendsAnalyzer } from './trends';
import { InsightsGenerator, RecommendationEngine, AnalysisContext } from './insights';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';

/**
 * 分析引擎主类
 * 提供完整的开发统计分析功能
 */
export class AnalyticsEngine {
  private logger: Logger;
  private dataManager: SimplifiedDataManager;
  private basicStatsCalculator: BasicStatsCalculator;
  private efficiencyCalculator: EfficiencyCalculator;
  private trendsAnalyzer: TrendsAnalyzer;
  private insightsGenerator: InsightsGenerator;
  private recommendationEngine: RecommendationEngine;
  private configManager: ConfigManager;
  private config: AnalyticsConfig;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
    this.dataManager = new SimplifiedDataManager();
    this.basicStatsCalculator = new BasicStatsCalculator();
    this.efficiencyCalculator = new EfficiencyCalculator();
    this.trendsAnalyzer = new TrendsAnalyzer();
    this.insightsGenerator = new InsightsGenerator();
    this.recommendationEngine = new RecommendationEngine();
    this.configManager = new ConfigManager();
    
    // 使用默认配置初始化，稍后在需要时加载实际配置
    this.config = this.getDefaultAnalyticsConfig();
    this.logger.info('分析引擎初始化完成');
  }

  /**
   * 生成项目分析报告
   * @param request 分析请求参数
   * @returns 完整的分析结果
   */
  async generateAnalysisReport(request: AnalysisRequest): Promise<AnalysisResult> {
    this.logger.info('开始生成分析报告', { request });

    try {
      // 0. 确保配置已加载
      this.config = await this.loadAnalyticsConfig();
      
      // 1. 解析时间范围
      const timeframe = this.parseTimeframe(request.timeframe, request.custom_range);
      
      // 2. 获取数据
      const usageStats = await this.dataManager.getUsageStats(request.project_path);
      
      // 3. 计算基础统计
      const basicStats = this.basicStatsCalculator.calculateFromUsageStats(usageStats);
      
      // 4. 计算效率指标
      const efficiency = this.efficiencyCalculator.calculateEfficiencyMetrics(basicStats);
      
      // 5. 分析趋势（如果需要）
      let trends: TrendAnalysis | undefined;
      if (request.analysis_types?.includes('trends')) {
        // 这里简化处理，实际中需要获取历史数据
        trends = this.trendsAnalyzer.analyzeTrends([basicStats], request.timeframe);
      }
      
      // 6. 生成智能洞察（如果需要）
      let insights: SmartInsights | undefined;
      if (request.analysis_types?.includes('insights')) {
        const context: AnalysisContext = {
          basic_stats: basicStats,
          efficiency: efficiency,
          trends: trends
        };
        insights = this.insightsGenerator.generateInsights(context);
      }

      // 7. 构建结果
      const result: AnalysisResult = {
        timeframe: timeframe.description,
        project_path: request.project_path,
        basic_stats: basicStats,
        efficiency: efficiency,
        trends: trends,
        insights: insights,
        data_source: usageStats.data_quality.sources.join(', '),
        generated_at: new Date().toISOString(),
        data_quality: {
          completeness: usageStats.data_quality.completeness,
          reliability: this.calculateDataReliability(usageStats),
          freshness: this.calculateDataFreshness(usageStats.data_quality.last_updated)
        }
      };

      this.logger.info('分析报告生成完成', { 
        timeframe: result.timeframe,
        dataSource: result.data_source,
        hasInsights: !!result.insights,
        hasTrends: !!result.trends
      });

      return result;
    } catch (error) {
      this.logger.error('分析报告生成失败', error);
      throw new Error(`分析失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 快速分析（仅基础统计和效率）
   * @param projectPath 项目路径
   * @returns 简化的分析结果
   */
  async quickAnalysis(projectPath?: string): Promise<{
    basic_stats: BasicStats;
    efficiency: EfficiencyMetrics;
    summary: string;
  }> {
    this.logger.debug('开始快速分析');

    try {
      const usageStats = await this.dataManager.getUsageStats(projectPath);
      const basicStats = this.basicStatsCalculator.calculateFromUsageStats(usageStats);
      const efficiency = this.efficiencyCalculator.calculateEfficiencyMetrics(basicStats);

      // 生成简要总结
      const summary = this.generateQuickSummary(basicStats, efficiency);

      return {
        basic_stats: basicStats,
        efficiency: efficiency,
        summary: summary
      };
    } catch (error) {
      this.logger.error('快速分析失败', error);
      throw error;
    }
  }

  /**
   * 比较分析（对比两个时间段的数据）
   * @param currentRequest 当前时间段请求
   * @param previousRequest 对比时间段请求
   * @returns 比较分析结果
   */
  async compareAnalysis(
    currentRequest: AnalysisRequest,
    previousRequest: AnalysisRequest
  ): Promise<{
    current: AnalysisResult;
    previous: AnalysisResult;
    comparison: {
      time_change: number;
      tokens_change: number;
      cost_change: number;
      productivity_change: number;
      files_change: number;
      insights: string[];
    };
  }> {
    this.logger.info('开始比较分析');

    try {
      // 生成两个时间段的分析报告
      const [current, previous] = await Promise.all([
        this.generateAnalysisReport(currentRequest),
        this.generateAnalysisReport(previousRequest)
      ]);

      // 计算变化
      const statsComparator = new StatsComparator();
      const comparison = statsComparator.compare(current.basic_stats, previous.basic_stats);

      // 生成比较洞察
      const comparisonInsights = this.generateComparisonInsights(comparison);

      return {
        current,
        previous,
        comparison: {
          time_change: comparison.time_change,
          tokens_change: comparison.tokens_change,
          cost_change: comparison.cost_change,
          productivity_change: comparison.efficiency_change,
          files_change: comparison.files_change,
          insights: comparisonInsights
        }
      };
    } catch (error) {
      this.logger.error('比较分析失败', error);
      throw error;
    }
  }

  /**
   * 工具使用分析
   * @param projectPath 项目路径
   * @returns 工具使用分析结果
   */
  async analyzeToolUsage(projectPath?: string): Promise<{
    tool_analysis: ToolUsageAnalysis[];
    recommendations: string[];
    efficiency_score: number;
  }> {
    this.logger.debug('开始工具使用分析');

    try {
      const usageStats = await this.dataManager.getUsageStats(projectPath);
      const basicStats = this.basicStatsCalculator.calculateFromUsageStats(usageStats);
      
      const toolAnalysis = this.efficiencyCalculator.analyzeToolUsage(
        basicStats.tool_usage, 
        basicStats.total_time_hours
      );

      // 计算总体工具使用效率
      const efficiencyScore = toolAnalysis.length > 0 
        ? toolAnalysis.reduce((sum, t) => sum + t.efficiency_score, 0) / toolAnalysis.length
        : 0;

      // 生成工具使用建议
      const recommendations = this.generateToolUsageRecommendations(toolAnalysis, basicStats);

      return {
        tool_analysis: toolAnalysis,
        recommendations,
        efficiency_score: this.roundToDecimal(efficiencyScore, 1)
      };
    } catch (error) {
      this.logger.error('工具使用分析失败', error);
      throw error;
    }
  }

  /**
   * 成本分析
   * @param projectPath 项目路径
   * @returns 成本分析结果
   */
  async analyzeCost(projectPath?: string): Promise<CostAnalysis> {
    this.logger.debug('开始成本分析');

    try {
      const usageStats = await this.dataManager.getUsageStats(projectPath);
      const basicStats = this.basicStatsCalculator.calculateFromUsageStats(usageStats);
      
      return this.efficiencyCalculator.calculateCostAnalysis(basicStats);
    } catch (error) {
      this.logger.error('成本分析失败', error);
      throw error;
    }
  }

  /**
   * 检查数据源可用性
   * @returns 数据源可用性状态
   */
  async checkDataAvailability(): Promise<{
    cost_api: boolean;
    opentelemetry: boolean;
    overall_status: 'excellent' | 'good' | 'limited' | 'unavailable';
    recommendations: string[];
  }> {
    this.logger.debug('检查数据源可用性');

    try {
      const availability = await this.dataManager.checkDataSourceAvailability();
      
      let overallStatus: 'excellent' | 'good' | 'limited' | 'unavailable';
      const recommendations: string[] = [];

      if (availability.cost_api && availability.opentelemetry) {
        overallStatus = 'excellent';
        recommendations.push('所有数据源均可用，可以获得最完整的分析结果');
      } else if (availability.cost_api) {
        overallStatus = 'good';
        recommendations.push('Cost API可用，可以进行基础分析');
        recommendations.push('建议启用OpenTelemetry获取更详细的监控数据');
      } else {
        overallStatus = 'unavailable';
        recommendations.push('主要数据源不可用，请检查Claude Code环境配置');
      }

      return {
        ...availability,
        overall_status: overallStatus,
        recommendations
      };
    } catch (error) {
      this.logger.error('数据源可用性检查失败', error);
      return {
        cost_api: false,
        opentelemetry: false,
        overall_status: 'unavailable',
        recommendations: ['数据源检查失败，请联系技术支持']
      };
    }
  }

  /**
   * 更新分析配置
   * @param newConfig 新的配置参数
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.logger.info('更新分析配置', { newConfig });
    
    Object.assign(this.config, newConfig);
    
    // 更新子模块配置
    if (newConfig.insights_config) {
      this.insightsGenerator.setLanguage(newConfig.insights_config.language || 'zh-CN');
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // ===== 私有方法 =====

  /**
   * 获取默认分析配置
   * @private
   */
  private getDefaultAnalyticsConfig(): AnalyticsConfig {
    return {
      enabled_analyses: ['basic', 'efficiency', 'insights', 'trends'],
      line_estimation_model: {
        'Edit': 15,
        'MultiEdit': 35,
        'Write': 60,
        'Task': 40,
        'Read': 0,
        'Bash': 8,
        'Grep': 0
      },
      productivity_weights: {
        token_weight: 0.3,
        lines_weight: 0.4,
        tools_weight: 0.2
      },
      insights_config: {
        enabled: true,
        language: 'zh-CN',
        max_insights: 8
      }
    };
  }

  /**
   * 加载分析配置
   * @private
   */
  private async loadAnalyticsConfig(): Promise<AnalyticsConfig> {
    try {
      await this.configManager.loadConfig();
      const globalConfig = this.configManager.getConfig();
      
      return {
        enabled_analyses: ['basic', 'efficiency', 'insights', 'trends'],
        line_estimation_model: {
          'Edit': 15,
          'MultiEdit': 35,
          'Write': 60,
          'Task': 40,
          'Read': 0,
          'Bash': 8,
          'Grep': 0
        },
        productivity_weights: {
          token_weight: 0.3,
          lines_weight: 0.4,
          tools_weight: 0.2
        },
        insights_config: {
          enabled: true,
          language: globalConfig.language || 'zh-CN',
          max_insights: 8
        }
      };
    } catch (error) {
      this.logger.warn('加载配置失败，使用默认配置', error);
      return this.getDefaultAnalyticsConfig();
    }
  }

  /**
   * 解析时间范围
   * @private
   */
  private parseTimeframe(
    timeframe: string, 
    customRange?: [Date, Date]
  ): TimeframeResult {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeframe) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        description: '今日',
        is_single_day: true
      };
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: weekStart,
        end: now,
        description: '本周',
        is_single_day: false
      };
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: monthStart,
        end: now,
        description: '本月',
        is_single_day: false
      };
    case 'custom':
      if (customRange) {
        return {
          start: customRange[0],
          end: customRange[1],
          description: `${customRange[0].toLocaleDateString()} - ${customRange[1].toLocaleDateString()}`,
          is_single_day: false
        };
      }
      // 默认返回今日
      return this.parseTimeframe('today');
    default:
      return this.parseTimeframe('today');
    }
  }

  /**
   * 计算数据可靠性
   * @private
   */
  private calculateDataReliability(usageStats: BasicUsageStats): number {
    // 基于数据源和完整性计算可靠性
    let reliability = 0.5; // 基础分

    // 数据源加分
    if (usageStats.data_quality.sources.includes('cost_api')) {
      reliability += 0.3;
    }
    if (usageStats.data_quality.sources.includes('opentelemetry')) {
      reliability += 0.2;
    }

    return Math.min(1.0, reliability);
  }

  /**
   * 计算数据新鲜度
   * @private
   */
  private calculateDataFreshness(lastUpdated: string): number {
    const now = Date.now();
    const updateTime = new Date(lastUpdated).getTime();
    const ageHours = (now - updateTime) / (1000 * 60 * 60);

    // 1小时内为满分，24小时后为0分
    return Math.max(0, Math.min(1, (24 - ageHours) / 24));
  }

  /**
   * 生成快速总结
   * @private
   */
  private generateQuickSummary(stats: BasicStats, efficiency: EfficiencyMetrics): string {
    return `今日开发${stats.total_time_hours.toFixed(1)}小时，消耗${stats.total_tokens}个Token，生产力评分${efficiency.productivity_score.toFixed(1)}/10分（${efficiency.efficiency_rating}）`;
  }

  /**
   * 生成比较洞察
   * @private
   */
  private generateComparisonInsights(comparison: any): string[] {
    const insights: string[] = [];

    if (Math.abs(comparison.time_change) > 20) {
      const direction = comparison.time_change > 0 ? '增加' : '减少';
      insights.push(`工作时间${direction}了${Math.abs(comparison.time_change).toFixed(1)}%`);
    }

    if (Math.abs(comparison.efficiency_change) > 15) {
      const direction = comparison.efficiency_change > 0 ? '提升' : '下降';
      insights.push(`开发效率${direction}了${Math.abs(comparison.efficiency_change).toFixed(1)}%`);
    }

    if (Math.abs(comparison.cost_change) > 25) {
      const direction = comparison.cost_change > 0 ? '增加' : '减少';
      insights.push(`成本${direction}了${Math.abs(comparison.cost_change).toFixed(1)}%`);
    }

    return insights;
  }

  /**
   * 生成工具使用建议
   * @private
   */
  private generateToolUsageRecommendations(
    toolAnalysis: ToolUsageAnalysis[],
    stats: BasicStats
  ): string[] {
    const recommendations: string[] = [];

    // 检查低效工具
    const lowEfficiencyTools = toolAnalysis.filter(t => t.efficiency_score < 5);
    if (lowEfficiencyTools.length > 0) {
      recommendations.push(`${lowEfficiencyTools[0].tool_name}工具使用效率较低，建议优化使用方式`);
    }

    // 检查工具多样性
    if (toolAnalysis.length < 3) {
      recommendations.push('工具使用种类较少，可以尝试更多Claude Code功能');
    }

    // 检查读写比例
    const readUsage = stats.tool_usage['Read'] || 0;
    const writeUsage = (stats.tool_usage['Edit'] || 0) + (stats.tool_usage['Write'] || 0);
    
    if (readUsage > writeUsage * 2) {
      recommendations.push('阅读操作较多，建议提前整理需求，减少重复阅读');
    }

    return recommendations;
  }

  /**
   * 数值四舍五入
   * @private
   */
  private roundToDecimal(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

// 导出所有分析相关的类和类型
export * from './basic-stats';
export * from './efficiency';
export * from './trends';
export * from './insights';

// 导出单例实例
export const analyticsEngine = new AnalyticsEngine();