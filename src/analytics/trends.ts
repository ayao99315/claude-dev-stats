/**
 * 趋势分析引擎
 * 分析历史数据的变化趋势和模式识别
 */

import { TrendAnalysis, DailyMetric, BasicStats, EfficiencyMetrics } from '../types/analytics';
import { BasicUsageStats } from '../types/usage-data';
import { Logger } from '../utils/logger';

/**
 * 时间序列数据点
 */
export interface TimeSeriesData {
  date: string;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * 趋势计算结果
 */
export interface TrendResult {
  direction: 'up' | 'down' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  change_rate: number;
  confidence: number;
  description: string;
}

/**
 * 趋势分析计算器
 * 提供各种趋势分析算法和模式识别功能
 */
export class TrendsAnalyzer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
  }

  /**
   * 分析历史趋势
   * @param historicalStats 历史统计数据列表
   * @param timeframe 分析时间范围
   * @returns 趋势分析结果
   */
  analyzeTrends(
    historicalStats: BasicStats[],
    timeframe: string = 'week'
  ): TrendAnalysis {
    this.logger.debug(`开始分析${timeframe}趋势`, { dataPoints: historicalStats.length });

    try {
      // 如果数据不足，返回默认结果
      if (historicalStats.length < 2) {
        return this.getInsufficientDataResult(timeframe);
      }

      // 按日期聚合数据
      const dailyMetrics = this.aggregateDailyMetrics(historicalStats);
      
      // 计算各项趋势
      const productivityTrend = this.calculateProductivityTrend(dailyMetrics);
      const tokenTrend = this.calculateTokenTrend(dailyMetrics);
      const timeTrend = this.calculateTimeTrend(dailyMetrics);

      const result: TrendAnalysis = {
        productivity_trend: productivityTrend.change_rate,
        token_trend: tokenTrend.change_rate,
        time_trend: timeTrend.change_rate,
        daily_metrics: dailyMetrics
      };

      this.logger.debug('趋势分析完成', { result });
      return result;
    } catch (error) {
      this.logger.error('趋势分析失败', error);
      return this.getErrorResult(timeframe);
    }
  }

  /**
   * 按日期聚合指标数据
   * @private
   */
  private aggregateDailyMetrics(stats: BasicStats[]): Record<string, DailyMetric> {
    const dailyData: Record<string, DailyMetric[]> = {};

    // 按日期分组（这里假设stats已经包含了日期信息，实际中需要从timestamp获取）
    stats.forEach((stat, index) => {
      // 过滤无效数据
      if (!stat || typeof stat !== 'object') {
        return;
      }
      
      // 简化处理：使用索引生成日期
      const date = this.getDateFromIndex(index, stats.length);
      
      if (!dailyData[date]) {
        dailyData[date] = [];
      }

      // 计算该条数据的生产力评分（简化版）
      const productivity_score = this.calculateSimpleProductivityScore(stat);

      dailyData[date].push({
        tokens: stat.total_tokens || 0,
        time_hours: stat.total_time_hours || 0,
        productivity_score,
        cost: stat.total_cost_usd || 0,
        files_count: stat.files_modified_count || 0
      });
    });

    // 聚合每日数据
    const aggregatedData: Record<string, DailyMetric> = {};
    Object.entries(dailyData).forEach(([date, dayStats]) => {
      aggregatedData[date] = {
        tokens: dayStats.reduce((sum, s) => sum + s.tokens, 0),
        time_hours: dayStats.reduce((sum, s) => sum + s.time_hours, 0),
        productivity_score: dayStats.reduce((sum, s) => sum + s.productivity_score, 0) / dayStats.length,
        cost: dayStats.reduce((sum, s) => sum + s.cost, 0),
        files_count: Math.max(...dayStats.map(s => s.files_count || 0))
      };
    });

    return aggregatedData;
  }

  /**
   * 计算生产力趋势
   * @private
   */
  private calculateProductivityTrend(dailyMetrics: Record<string, DailyMetric>): TrendResult {
    const dates = Object.keys(dailyMetrics).sort();
    const values = dates.map(date => dailyMetrics[date].productivity_score);
    
    return this.calculateTrendFromTimeSeries(values, '生产力');
  }

  /**
   * 计算Token使用趋势
   * @private
   */
  private calculateTokenTrend(dailyMetrics: Record<string, DailyMetric>): TrendResult {
    const dates = Object.keys(dailyMetrics).sort();
    const values = dates.map(date => dailyMetrics[date].tokens);
    
    return this.calculateTrendFromTimeSeries(values, 'Token使用量');
  }

  /**
   * 计算时间使用趋势
   * @private
   */
  private calculateTimeTrend(dailyMetrics: Record<string, DailyMetric>): TrendResult {
    const dates = Object.keys(dailyMetrics).sort();
    const values = dates.map(date => dailyMetrics[date].time_hours);
    
    return this.calculateTrendFromTimeSeries(values, '时间投入');
  }

  /**
   * 从时间序列计算趋势
   * @private
   */
  private calculateTrendFromTimeSeries(values: number[], metricName: string): TrendResult {
    if (values.length < 2) {
      return {
        direction: 'stable',
        strength: 'weak',
        change_rate: 0,
        confidence: 0,
        description: `${metricName}数据不足以计算趋势`
      };
    }

    // 使用简单的线性回归计算趋势
    const trend = this.calculateLinearTrend(values);
    
    // 计算变化率
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changeRate = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // 判断趋势方向
    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(changeRate) < 5) {
      direction = 'stable';
    } else if (changeRate > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    // 判断趋势强度
    let strength: 'strong' | 'moderate' | 'weak';
    const absChangeRate = Math.abs(changeRate);
    if (absChangeRate > 25) {
      strength = 'strong';
    } else if (absChangeRate > 10) {
      strength = 'moderate';
    } else {
      strength = 'weak';
    }

    // 计算置信度（基于数据点数量和趋势一致性）
    const confidence = this.calculateTrendConfidence(values, trend);

    const description = this.generateTrendDescription(metricName, direction, strength, changeRate);

    return {
      direction,
      strength,
      change_rate: this.roundToDecimal(changeRate, 1),
      confidence: this.roundToDecimal(confidence, 2),
      description
    };
  }

  /**
   * 计算线性回归趋势
   * @private
   */
  private calculateLinearTrend(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // x = 0, 1, 2, ..., n-1
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 计算R²
    const meanY = sumY / n;
    const ssTotal = values.reduce((sum, v) => sum + Math.pow(v - meanY, 2), 0);
    const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - (slope * i + intercept), 2), 0);
    const r2 = 1 - ssRes / ssTotal;

    return { slope, intercept, r2: isNaN(r2) ? 0 : r2 };
  }

  /**
   * 计算趋势置信度
   * @private
   */
  private calculateTrendConfidence(values: number[], trend: { slope: number; r2: number }): number {
    // 基础置信度基于R²值
    const baseConfidence = Math.max(0, trend.r2) * 100;
    
    // 数据点数量修正
    const dataPointFactor = Math.min(1, values.length / 7); // 7天数据为满分
    
    // 趋势一致性修正
    const consistencyFactor = this.calculateTrendConsistency(values);
    
    return baseConfidence * dataPointFactor * consistencyFactor;
  }

  /**
   * 计算趋势一致性
   * @private
   */
  private calculateTrendConsistency(values: number[]): number {
    if (values.length < 3) return 0.5;

    let consistentChanges = 0;
    let totalChanges = 0;

    for (let i = 2; i < values.length; i++) {
      const change1 = values[i - 1] - values[i - 2];
      const change2 = values[i] - values[i - 1];
      
      if (Math.sign(change1) === Math.sign(change2)) {
        consistentChanges++;
      }
      totalChanges++;
    }

    return totalChanges > 0 ? consistentChanges / totalChanges : 0.5;
  }

  /**
   * 生成趋势描述
   * @private
   */
  private generateTrendDescription(
    metricName: string,
    direction: 'up' | 'down' | 'stable',
    strength: 'strong' | 'moderate' | 'weak',
    changeRate: number
  ): string {
    const directionText = {
      up: '上升',
      down: '下降', 
      stable: '稳定'
    };

    const strengthText = {
      strong: '显著',
      moderate: '适度',
      weak: '轻微'
    };

    if (direction === 'stable') {
      return `${metricName}保持相对稳定`;
    }

    const rate = Math.abs(changeRate);
    return `${metricName}呈${strengthText[strength]}${directionText[direction]}趋势，变化幅度约${rate.toFixed(1)}%`;
  }

  /**
   * 简化的生产力评分计算
   * @private
   */
  private calculateSimpleProductivityScore(stats: BasicStats): number {
    if (!stats || typeof stats !== 'object') return 0;
    
    const timeHours = stats.total_time_hours || 0;
    const tokens = stats.total_tokens || 0;
    const filesCount = stats.files_modified_count || 0;
    
    if (timeHours <= 0) return 0;

    const tokensPerHour = tokens / timeHours;
    const filesPerHour = filesCount / timeHours;
    
    // 简化评分：Token效率 + 文件产出
    const tokenScore = Math.min(5, tokensPerHour / 200); // 200 tokens/hour = 1分
    const filesScore = Math.min(5, filesPerHour * 5); // 0.2 files/hour = 1分
    
    return tokenScore + filesScore;
  }

  /**
   * 从索引生成日期字符串
   * @private
   */
  private getDateFromIndex(index: number, totalCount: number): string {
    const today = new Date();
    const daysAgo = totalCount - index - 1;
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  /**
   * 数值四舍五入
   * @private
   */
  private roundToDecimal(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * 数据不足时的默认结果
   * @private
   */
  private getInsufficientDataResult(timeframe: string): TrendAnalysis {
    return {
      productivity_trend: 0,
      token_trend: 0,
      time_trend: 0,
      daily_metrics: {},
      message: `${timeframe}数据不足，无法进行趋势分析（至少需要2个数据点）`
    };
  }

  /**
   * 错误时的默认结果
   * @private
   */
  private getErrorResult(timeframe: string): TrendAnalysis {
    return {
      productivity_trend: 0,
      token_trend: 0,
      time_trend: 0,
      daily_metrics: {},
      message: `${timeframe}趋势分析过程中发生错误`
    };
  }
}

/**
 * 高级趋势分析器
 * 提供更复杂的趋势分析和预测功能
 */
export class AdvancedTrendsAnalyzer {
  private logger: Logger;
  private basicAnalyzer: TrendsAnalyzer;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
    this.basicAnalyzer = new TrendsAnalyzer();
  }

  /**
   * 检测趋势异常
   * @param timeSeries 时间序列数据
   * @returns 异常检测结果
   */
  detectAnomalies(timeSeries: TimeSeriesData[]): {
    anomalies: TimeSeriesData[];
    anomaly_threshold: number;
    analysis: string;
  } {
    this.logger.debug('开始检测趋势异常');

    if (timeSeries.length < 5) {
      return {
        anomalies: [],
        anomaly_threshold: 0,
        analysis: '数据点不足，无法进行异常检测'
      };
    }

    const values = timeSeries.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 使用2个标准差作为异常阈值
    const threshold = 2 * stdDev;
    const anomalies = timeSeries.filter(d => Math.abs(d.value - mean) > threshold);

    let analysis = '未检测到明显异常';
    if (anomalies.length > 0) {
      analysis = `检测到${anomalies.length}个异常数据点，可能需要进一步调查`;
    }

    this.logger.debug('异常检测完成', {
      anomaliesCount: anomalies.length,
      threshold,
      mean,
      stdDev
    });

    return {
      anomalies,
      anomaly_threshold: this.roundToDecimal(threshold, 2),
      analysis
    };
  }

  /**
   * 计算移动平均
   * @param values 数值序列
   * @param windowSize 窗口大小
   * @returns 移动平均序列
   */
  calculateMovingAverage(values: number[], windowSize: number = 3): number[] {
    const result: number[] = [];

    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, v) => sum + v, 0) / window.length;
      result.push(average);
    }

    return result;
  }

  /**
   * 季节性分析（简化版）
   * @param dailyMetrics 日度指标数据
   * @returns 季节性分析结果
   */
  analyzeSeasonality(dailyMetrics: Record<string, DailyMetric>): {
    has_pattern: boolean;
    pattern_description: string;
    weekly_patterns?: Record<string, number>;
  } {
    this.logger.debug('开始季节性分析');

    const dates = Object.keys(dailyMetrics).sort();
    if (dates.length < 14) { // 至少需要两周数据
      return {
        has_pattern: false,
        pattern_description: '数据不足，无法进行季节性分析'
      };
    }

    // 按星期几分析模式
    const weeklyData: Record<string, number[]> = {
      '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': []
    };

    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay().toString();
      const productivity = dailyMetrics[dateStr].productivity_score;
      
      weeklyData[dayOfWeek].push(productivity);
    });

    // 计算每个工作日的平均生产力
    const weeklyPatterns: Record<string, number> = {};
    let hasSignificantPattern = false;

    Object.entries(weeklyData).forEach(([day, values]) => {
      if (values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        weeklyPatterns[day] = this.roundToDecimal(avg, 2);
      }
    });

    // 检查是否存在显著的周模式
    const avgValues = Object.values(weeklyPatterns);
    if (avgValues.length >= 5) {
      const mean = avgValues.reduce((sum, v) => sum + v, 0) / avgValues.length;
      const variance = avgValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / avgValues.length;
      
      // 如果方差足够大，认为存在模式
      hasSignificantPattern = variance > 0.5;
    }

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    let patternDescription = '未检测到明显的周期性模式';
    
    if (hasSignificantPattern) {
      const maxDay = Object.entries(weeklyPatterns)
        .reduce((max, [day, value]) => value > max.value ? { day, value } : max, { day: '0', value: 0 });
      
      patternDescription = `检测到周期性模式，${dayNames[parseInt(maxDay.day)]}的生产力最高`;
    }

    return {
      has_pattern: hasSignificantPattern,
      pattern_description: patternDescription,
      weekly_patterns: weeklyPatterns
    };
  }

  /**
   * 高级趋势分析
   * 结合异常检测、移动平均和季节性分析的综合趋势分析
   * @param historicalStats 历史统计数据列表
   * @param timeframe 分析时间范围
   * @returns 高级趋势分析结果
   */
  analyzeTrends(
    historicalStats: BasicStats[],
    timeframe: string = 'week'
  ): TrendAnalysis {
    this.logger.debug('开始高级趋势分析', { dataPoints: historicalStats.length });

    // 首先使用基础分析器获取基本趋势
    const basicAnalysis = this.basicAnalyzer.analyzeTrends(historicalStats, timeframe);

    // 如果数据不足，返回基础分析结果
    if (historicalStats.length < 5) {
      return {
        ...basicAnalysis,
        message: `${timeframe}数据不足，已降级为基础趋势分析`
      };
    }

    try {
      // 准备时间序列数据
      const productivityTimeSeries = this.prepareTimeSeriesData(historicalStats, 'productivity');
      const tokenTimeSeries = this.prepareTimeSeriesData(historicalStats, 'tokens');
      const timeTimeSeries = this.prepareTimeSeriesData(historicalStats, 'time');

      // 异常检测
      const productivityAnomalies = this.detectAnomalies(productivityTimeSeries);
      const tokenAnomalies = this.detectAnomalies(tokenTimeSeries);
      const timeAnomalies = this.detectAnomalies(timeTimeSeries);

      // 移动平均平滑处理
      const productivityValues = productivityTimeSeries.map(d => d.value);
      const tokenValues = tokenTimeSeries.map(d => d.value);
      const timeValues = timeTimeSeries.map(d => d.value);

      const smoothedProductivity = this.calculateMovingAverage(productivityValues, 3);
      const smoothedTokens = this.calculateMovingAverage(tokenValues, 3);
      const smoothedTime = this.calculateMovingAverage(timeValues, 3);

      // 使用平滑后的数据重新计算趋势
      const smoothedProductivityTrend = this.calculateAdjustedTrend(smoothedProductivity);
      const smoothedTokenTrend = this.calculateAdjustedTrend(smoothedTokens);
      const smoothedTimeTrend = this.calculateAdjustedTrend(smoothedTime);

      // 季节性分析
      const seasonalityAnalysis = this.analyzeSeasonality(basicAnalysis.daily_metrics);

      // 构建高级分析结果
      const advancedAnalysis: TrendAnalysis = {
        productivity_trend: smoothedProductivityTrend,
        token_trend: smoothedTokenTrend,
        time_trend: smoothedTimeTrend,
        daily_metrics: basicAnalysis.daily_metrics,
        anomalies: {
          productivity: productivityAnomalies.anomalies.length,
          tokens: tokenAnomalies.anomalies.length,
          time: timeAnomalies.anomalies.length
        },
        seasonality: seasonalityAnalysis.has_pattern ? seasonalityAnalysis : undefined,
        confidence_score: this.calculateOverallConfidence(
          productivityAnomalies,
          tokenAnomalies,
          timeAnomalies,
          historicalStats.length
        )
      };

      this.logger.debug('高级趋势分析完成', { 
        anomaliesDetected: Object.values(advancedAnalysis.anomalies!).reduce((a, b) => a + b, 0),
        hasSeasonality: seasonalityAnalysis.has_pattern,
        confidenceScore: advancedAnalysis.confidence_score
      });

      return advancedAnalysis;
    } catch (error) {
      this.logger.error('高级趋势分析失败，降级为基础分析', error);
      return {
        ...basicAnalysis,
        message: `${timeframe}高级分析失败，已降级为基础分析`
      };
    }
  }

  /**
   * 准备时间序列数据
   * @private
   */
  private prepareTimeSeriesData(stats: BasicStats[], metric: 'productivity' | 'tokens' | 'time'): TimeSeriesData[] {
    return stats.map((stat, index) => {
      let value: number;
      switch (metric) {
      case 'productivity':
        value = stat.total_time_hours > 0 ? stat.total_tokens / stat.total_time_hours : 0;
        break;
      case 'tokens':
        value = stat.total_tokens;
        break;
      case 'time':
        value = stat.total_time_hours;
        break;
      default:
        value = 0;
      }

      return {
        date: this.getDateFromIndex(index, stats.length),
        value,
        metadata: { index, originalStat: stat }
      };
    });
  }

  /**
   * 计算调整后的趋势值
   * @private
   */
  private calculateAdjustedTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    if (firstValue === 0) return 0;
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  /**
   * 计算整体置信度
   * @private
   */
  private calculateOverallConfidence(
    productivityAnomalies: ReturnType<typeof this.detectAnomalies>,
    tokenAnomalies: ReturnType<typeof this.detectAnomalies>,
    timeAnomalies: ReturnType<typeof this.detectAnomalies>,
    dataPointsCount: number
  ): number {
    const totalDataPoints = dataPointsCount;
    const totalAnomalies = productivityAnomalies.anomalies.length + 
                           tokenAnomalies.anomalies.length + 
                           timeAnomalies.anomalies.length;
    
    // 基础置信度：数据点越多越可信
    const baseConfidence = Math.min(90, (dataPointsCount / 30) * 90);
    
    // 异常率修正：异常越少越可信
    const anomalyRate = totalAnomalies / (totalDataPoints * 3); // 3个指标
    const anomalyPenalty = anomalyRate * 30; // 最多扣30分
    
    const finalConfidence = Math.max(10, baseConfidence - anomalyPenalty);
    
    return this.roundToDecimal(finalConfidence, 1);
  }

  /**
   * 从索引生成日期字符串
   * @private
   */
  private getDateFromIndex(index: number, totalCount: number): string {
    const today = new Date();
    const daysAgo = totalCount - index - 1;
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  /**
   * 数值四舍五入
   * @private
   */
  private roundToDecimal(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

/**
 * 导出单例实例
 */
export const trendsAnalyzer = new TrendsAnalyzer();
export const advancedTrendsAnalyzer = new AdvancedTrendsAnalyzer();