/**
 * 效率分析引擎
 * 计算开发效率和生产力相关指标
 */

import { BasicStats, EfficiencyMetrics, ToolUsageAnalysis, CostAnalysis } from '../types/analytics';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';

/**
 * 代码行数估算模型
 * 基于工具使用模式智能估算代码变更行数
 */
export class CodeEstimator {
  private logger: Logger;
  private lineEstimationModel: Record<string, number>;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
    
    // 默认的工具与代码行数映射模型
    this.lineEstimationModel = {
      'Edit': 15,        // 单次编辑平均15行
      'MultiEdit': 35,   // 批量编辑平均35行  
      'Write': 60,       // 新建文件平均60行
      'Read': 0,         // 读取不产生代码变更
      'Bash': 8,         // 命令执行可能产生的文件变更
      'Grep': 0,         // 搜索不产生代码变更
      'Glob': 0,         // 文件匹配不产生代码变更
      'Task': 40,        // 复杂任务平均40行
      'LS': 0,           // 目录列表不产生代码变更
      'WebFetch': 0,     // 网络获取不产生代码变更
      'NotebookEdit': 25 // Notebook编辑平均25行
    };
  }

  /**
   * 基于工具使用模式估算代码变更行数
   * @param toolUsage 工具使用统计
   * @returns 估算的代码行数
   */
  estimateLinesChanged(toolUsage: Record<string, number>): number {
    this.logger.debug('开始估算代码变更行数', { toolUsage });

    let totalLines = 0;
    const estimationDetails: Record<string, number> = {};

    // 计算每种工具的贡献
    Object.entries(toolUsage).forEach(([tool, count]) => {
      // 确保count为非负数
      const validCount = Math.max(0, count || 0);
      const linesPerUse = this.lineEstimationModel[tool] || 10; // 未知工具默认10行
      const toolLines = linesPerUse * validCount;
      totalLines += toolLines;
      estimationDetails[tool] = toolLines;
      
      this.logger.debug(`工具 ${tool}: ${validCount} 次使用 × ${linesPerUse} 行/次 = ${toolLines} 行`);
    });

    // 应用修正系数
    const correctionFactor = this.calculateCorrectionFactor(toolUsage);
    const correctedLines = Math.round(totalLines * correctionFactor);

    this.logger.debug('代码行数估算完成', {
      rawEstimate: totalLines,
      correctionFactor,
      finalEstimate: correctedLines,
      details: estimationDetails
    });

    return correctedLines;
  }

  /**
   * 计算修正系数
   * 基于工具使用模式的复杂度调整估算结果
   * @private
   */
  private calculateCorrectionFactor(toolUsage: Record<string, number>): number {
    const toolCount = Object.keys(toolUsage).length;
    const totalUsage = Object.values(toolUsage).reduce((sum, count) => sum + count, 0);

    // 工具多样性修正（更多工具类型表示更复杂的任务）
    const diversityFactor = Math.min(1.3, 1 + (toolCount - 1) * 0.05);
    
    // 使用频率修正（高频使用可能重复性较高，效率更高）
    const frequencyFactor = totalUsage > 20 ? 0.9 : 1.0;
    
    // 编辑工具比例修正（更多编辑表示更多实际代码产出）
    const editTools = ['Edit', 'MultiEdit', 'Write', 'NotebookEdit'];
    const editUsage = editTools.reduce((sum, tool) => sum + (toolUsage[tool] || 0), 0);
    const editRatio = totalUsage > 0 ? editUsage / totalUsage : 0;
    const editFactor = 0.8 + editRatio * 0.4; // 0.8 到 1.2 之间

    const finalFactor = diversityFactor * frequencyFactor * editFactor;
    
    this.logger.debug('修正系数计算', {
      diversityFactor,
      frequencyFactor, 
      editFactor,
      finalFactor
    });

    return Math.max(0.5, Math.min(2.0, finalFactor)); // 限制在合理范围内
  }

  /**
   * 更新估算模型
   * @param newModel 新的估算模型参数
   */
  updateModel(newModel: Partial<Record<string, number>>): void {
    this.logger.info('更新代码行数估算模型', { newModel });
    Object.assign(this.lineEstimationModel, newModel);
  }

  /**
   * 获取当前模型参数
   */
  getModel(): Record<string, number> {
    return { ...this.lineEstimationModel };
  }
}

/**
 * 效率指标计算器
 * 计算各种开发效率指标和生产力评分
 */
export class EfficiencyCalculator {
  private logger: Logger;
  private codeEstimator: CodeEstimator;
  private config: ConfigManager;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
    this.codeEstimator = new CodeEstimator();
    this.config = new ConfigManager();
  }

  /**
   * 计算效率指标
   * @param stats 基础统计数据
   * @returns 效率指标
   */
  calculateEfficiencyMetrics(stats: BasicStats): EfficiencyMetrics {
    this.logger.debug('开始计算效率指标', { stats });

    try {
      // 处理零时间的情况
      if (stats.total_time_hours <= 0) {
        this.logger.warn('开发时间为零，返回空效率指标');
        return this.getEmptyEfficiencyMetrics();
      }

      // 估算代码行数
      const estimatedLines = this.codeEstimator.estimateLinesChanged(stats.tool_usage);

      // 计算基础效率指标
      const tokensPerHour = stats.total_tokens / stats.total_time_hours;
      const linesPerHour = estimatedLines / stats.total_time_hours;
      const costPerHour = stats.total_cost_usd / stats.total_time_hours;

      // 计算综合生产力评分
      const productivityScore = this.calculateProductivityScore(
        tokensPerHour,
        linesPerHour,
        stats.tool_usage,
        stats.session_count,
        stats.total_time_hours
      );

      // 计算效率评级
      const efficiencyRating = this.calculateEfficiencyRating(productivityScore);

      const metrics: EfficiencyMetrics = {
        tokens_per_hour: this.roundToDecimal(tokensPerHour, 1),
        lines_per_hour: this.roundToDecimal(linesPerHour, 1),
        estimated_lines_changed: estimatedLines,
        productivity_score: this.roundToDecimal(productivityScore, 1),
        cost_per_hour: this.roundToDecimal(costPerHour, 2),
        efficiency_rating: efficiencyRating
      };

      this.logger.debug('效率指标计算完成', { metrics });
      return metrics;
    } catch (error) {
      this.logger.error('效率指标计算失败', error);
      return this.getEmptyEfficiencyMetrics();
    }
  }

  /**
   * 计算综合生产力评分（0-10分）
   * @private
   */
  private calculateProductivityScore(
    tokensPerHour: number,
    linesPerHour: number, 
    toolUsage: Record<string, number>,
    sessionCount: number,
    totalHours: number
  ): number {
    // 获取配置的权重，或使用默认值
    const weights = {
      token_weight: 0.3,
      lines_weight: 0.4,
      tools_weight: 0.2,
      session_weight: 0.1
    };

    // Token效率评分（0-3分）
    // 基于经验：优秀开发者约1000-2000 tokens/hour
    const tokenScore = Math.min(3, (tokensPerHour / 1500) * 3);

    // 代码产出评分（0-4分）
    // 基于经验：优秀开发者约50-150 lines/hour
    const linesScore = Math.min(4, (linesPerHour / 100) * 4);

    // 工具使用多样性评分（0-2分）
    const toolDiversity = Object.keys(toolUsage).length;
    const toolsScore = Math.min(2, toolDiversity / 6 * 2);

    // 会话效率评分（0-1分）
    // 更少的会话完成同样工作表示效率更高
    const avgTimePerSession = sessionCount > 0 ? totalHours / sessionCount : totalHours;
    const sessionScore = avgTimePerSession > 2 ? 0.5 : 1; // 超过2小时/会话降分

    // 加权综合评分
    const rawScore = 
      tokenScore * weights.token_weight +
      linesScore * weights.lines_weight +
      toolsScore * weights.tools_weight +
      sessionScore * weights.session_weight;

    // 转换到10分制
    const finalScore = (rawScore / (3 * weights.token_weight + 4 * weights.lines_weight + 2 * weights.tools_weight + 1 * weights.session_weight)) * 10;

    this.logger.debug('生产力评分计算', {
      tokenScore,
      linesScore,
      toolsScore,
      sessionScore,
      rawScore,
      finalScore
    });

    return Math.max(0, Math.min(10, finalScore));
  }

  /**
   * 计算效率评级
   * @private
   */
  private calculateEfficiencyRating(productivityScore: number): string {
    if (productivityScore >= 8.5) return '卓越';
    if (productivityScore >= 7.0) return '优秀';
    if (productivityScore >= 5.5) return '良好';
    if (productivityScore >= 4.0) return '一般';
    if (productivityScore >= 2.5) return '待改进';
    return '较差';
  }

  /**
   * 分析工具使用效率
   * @param toolUsage 工具使用统计
   * @param totalHours 总时间
   * @returns 工具使用分析
   */
  analyzeToolUsage(toolUsage: Record<string, number>, totalHours: number): ToolUsageAnalysis[] {
    this.logger.debug('开始分析工具使用效率');

    const analyses: ToolUsageAnalysis[] = [];

    Object.entries(toolUsage).forEach(([toolName, usageCount]) => {
      const usageRate = totalHours > 0 ? usageCount / totalHours : 0;
      const estimatedLines = this.codeEstimator.estimateLinesChanged({ [toolName]: usageCount });
      const efficiencyScore = this.calculateToolEfficiencyScore(toolName, usageRate, estimatedLines);

      analyses.push({
        tool_name: toolName,
        usage_count: usageCount,
        usage_rate: this.roundToDecimal(usageRate, 2),
        estimated_lines: estimatedLines,
        efficiency_score: this.roundToDecimal(efficiencyScore, 1)
      });
    });

    // 按使用次数排序
    analyses.sort((a, b) => b.usage_count - a.usage_count);

    this.logger.debug('工具使用分析完成', { analyses });
    return analyses;
  }

  /**
   * 计算工具效率评分
   * @private
   */
  private calculateToolEfficiencyScore(toolName: string, usageRate: number, estimatedLines: number): number {
    // 基于工具类型的基础评分
    const toolBaseScores: Record<string, number> = {
      'Edit': 8,
      'MultiEdit': 9,
      'Write': 7,
      'Task': 8,
      'Read': 5,
      'Bash': 6,
      'Grep': 4,
      'Glob': 4,
      'LS': 3
    };

    const baseScore = toolBaseScores[toolName] || 5;
    
    // 根据产出调整评分
    const linesFactor = estimatedLines > 50 ? 1.2 : estimatedLines > 20 ? 1.0 : 0.8;
    
    // 根据使用频率调整（适度使用最好）
    const rateFactor = usageRate > 3 ? 0.9 : usageRate > 1 ? 1.0 : 0.8;

    return Math.min(10, baseScore * linesFactor * rateFactor);
  }

  /**
   * 计算成本分析
   * @param stats 基础统计数据
   * @returns 成本分析结果
   */
  calculateCostAnalysis(stats: BasicStats): CostAnalysis {
    this.logger.debug('开始计算成本分析');

    const estimatedLines = this.codeEstimator.estimateLinesChanged(stats.tool_usage);
    const costPerHour = stats.total_time_hours > 0 ? stats.total_cost_usd / stats.total_time_hours : 0;
    const costPerLine = estimatedLines > 0 ? stats.total_cost_usd / estimatedLines : 0;

    // 简化的成本分布（实际应该从Cost API获取详细数据）
    const costBreakdown = {
      input_cost: stats.total_cost_usd * 0.3,   // 假设30%为输入成本
      output_cost: stats.total_cost_usd * 0.7,  // 假设70%为输出成本
      model_costs: stats.model_usage
    };

    // 成本优化建议
    const optimizationSuggestions = this.generateCostOptimizationSuggestions(
      costPerHour,
      costPerLine,
      stats
    );

    return {
      total_cost: stats.total_cost_usd,
      cost_per_hour: this.roundToDecimal(costPerHour, 2),
      cost_per_line: this.roundToDecimal(costPerLine, 4),
      cost_breakdown: costBreakdown,
      optimization_suggestions: optimizationSuggestions
    };
  }

  /**
   * 生成成本优化建议
   * @private
   */
  private generateCostOptimizationSuggestions(
    costPerHour: number,
    costPerLine: number,
    stats: BasicStats
  ): string[] {
    const suggestions: string[] = [];

    // 高成本预警
    if (costPerHour > 15) {
      suggestions.push('每小时成本较高，建议优化提问方式，减少冗长对话');
    }

    if (costPerLine > 0.1) {
      suggestions.push('每行代码成本偏高，建议使用更精确的指令');
    }

    // 基于工具使用的建议
    const readUsage = stats.tool_usage['Read'] || 0;
    const editUsage = stats.tool_usage['Edit'] || 0;
    
    if (readUsage > editUsage * 2) {
      suggestions.push('读取操作较多，建议事先整理需求，减少重复阅读');
    }

    // 会话效率建议
    if (stats.session_count > 10) {
      suggestions.push('会话数量较多，建议集中处理相关任务，减少上下文切换');
    }

    return suggestions;
  }

  /**
   * 数值四舍五入
   * @private
   */
  private roundToDecimal(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * 获取空的效率指标
   * @private
   */
  private getEmptyEfficiencyMetrics(): EfficiencyMetrics {
    return {
      tokens_per_hour: 0,
      lines_per_hour: 0,
      estimated_lines_changed: 0,
      productivity_score: 0,
      cost_per_hour: 0,
      efficiency_rating: '无数据'
    };
  }
}

/**
 * 导出单例实例
 */
export const codeEstimator = new CodeEstimator();
export const efficiencyCalculator = new EfficiencyCalculator();