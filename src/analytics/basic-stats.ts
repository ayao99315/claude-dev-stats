/**
 * 基础统计计算引擎
 * 提供项目开发活动的基础指标计算功能
 */

import { BasicUsageStats, UsageData, ActivityStats } from '../types/usage-data';
import { BasicStats } from '../types/analytics';
import { Logger } from '../utils/logger';

/**
 * 基础统计计算器
 * 负责从原始使用数据中计算基础统计指标
 */
export class BasicStatsCalculator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
  }

  /**
   * 从 BasicUsageStats 计算基础统计数据
   * @param usageStats 基础使用统计数据
   * @returns 基础统计结果
   */
  calculateFromUsageStats(usageStats: BasicUsageStats): BasicStats {
    this.logger.debug('开始计算基础统计数据');

    try {
      const stats: BasicStats = {
        session_count: Math.max(1, usageStats.activity.sessions || 0),
        total_time_seconds: Math.max(0, (usageStats.timespan.duration_minutes || 0)) * 60,
        total_time_hours: this.roundToDecimal(Math.max(0, usageStats.timespan.duration_minutes || 0) / 60, 2),
        total_tokens: Math.max(0, usageStats.tokens.total || 0),
        total_cost_usd: this.roundToDecimal(Math.max(0, usageStats.costs.total || 0), 4),
        files_modified_count: Math.max(0, usageStats.activity.files_modified || 0),
        files_modified: [], // BasicUsageStats 中没有文件列表，只有数量
        tool_usage: this.parseToolUsage(usageStats.activity.tools_used || []),
        model_usage: this.estimateModelUsage(Math.max(0, usageStats.tokens.total || 0))
      };

      this.logger.debug('基础统计计算完成', { stats });
      return stats;
    } catch (error) {
      this.logger.error('基础统计计算失败', error);
      return this.getEmptyStats();
    }
  }

  /**
   * 从多个使用数据条目计算基础统计数据
   * @param usageDataList 使用数据列表
   * @returns 基础统计结果
   */
  calculateFromUsageDataList(usageDataList: UsageData[]): BasicStats {
    this.logger.debug(`开始计算 ${usageDataList.length} 条使用数据的统计`);

    if (!usageDataList || usageDataList.length === 0) {
      this.logger.warn('使用数据列表为空，返回空统计');
      return this.getEmptyStats();
    }

    try {
      // 过滤掉 null/undefined 数据项
      const validDataList = usageDataList.filter(data => data != null && typeof data === 'object');
      
      if (validDataList.length === 0) {
        this.logger.warn('没有有效的使用数据，返回空统计');
        return this.getEmptyStats();
      }

      // 聚合所有数据
      let totalTokens = 0;
      let totalCost = 0;
      let totalTimeMinutes = 0;
      const uniqueSessions = new Set<string>();
      const allToolsUsed: string[] = [];
      const allFilesModified = new Set<string>();

      for (const data of validDataList) {
        // 使用安全的数值处理，避免负数
        totalTokens += Math.max(0, data.tokens?.total || 0);
        totalCost += Math.max(0, data.costs?.total || 0);
        totalTimeMinutes += Math.max(0, data.session?.duration_minutes || 0);
        
        // 为每个有效数据项创建唯一的会话标识
        uniqueSessions.add(`${data.timestamp}_${data.project || 'unknown'}`);
        
        // 收集工具使用信息（如果可用）
        if (data.source === 'opentelemetry') {
          // OTel 数据可能包含工具信息，这里做占位处理
          allToolsUsed.push('Edit', 'Read', 'Write'); // 示例工具
        }
      }

      const stats: BasicStats = {
        session_count: uniqueSessions.size,
        total_time_seconds: totalTimeMinutes * 60,
        total_time_hours: this.roundToDecimal(totalTimeMinutes / 60, 2),
        total_tokens: totalTokens,
        total_cost_usd: this.roundToDecimal(totalCost, 4),
        files_modified_count: allFilesModified.size,
        files_modified: Array.from(allFilesModified),
        tool_usage: this.aggregateToolUsage(allToolsUsed),
        model_usage: this.estimateModelUsage(totalTokens)
      };

      this.logger.debug('多条数据统计计算完成', { stats });
      return stats;
    } catch (error) {
      this.logger.error('多条数据统计计算失败', error);
      return this.getEmptyStats();
    }
  }

  /**
   * 合并多个基础统计结果
   * @param statsList 统计结果列表
   * @returns 合并后的统计结果
   */
  mergeStats(statsList: BasicStats[]): BasicStats {
    this.logger.debug(`开始合并 ${statsList.length} 个统计结果`);

    if (!statsList || statsList.length === 0) {
      return this.getEmptyStats();
    }

    if (statsList.length === 1) {
      return statsList[0];
    }

    try {
      const merged: BasicStats = {
        session_count: 0,
        total_time_seconds: 0,
        total_time_hours: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        files_modified_count: 0,
        files_modified: [],
        tool_usage: {},
        model_usage: {}
      };

      const allFiles = new Set<string>();

      for (const stats of statsList) {
        merged.session_count += stats.session_count;
        merged.total_time_seconds += stats.total_time_seconds;
        merged.total_tokens += stats.total_tokens;
        merged.total_cost_usd += stats.total_cost_usd;
        merged.files_modified_count += stats.files_modified_count;

        // 合并文件列表
        stats.files_modified.forEach(file => allFiles.add(file));

        // 合并工具使用统计
        Object.entries(stats.tool_usage).forEach(([tool, count]) => {
          merged.tool_usage[tool] = (merged.tool_usage[tool] || 0) + count;
        });

        // 合并模型使用统计
        Object.entries(stats.model_usage).forEach(([model, tokens]) => {
          merged.model_usage[model] = (merged.model_usage[model] || 0) + tokens;
        });
      }

      merged.total_time_hours = this.roundToDecimal(merged.total_time_seconds / 3600, 2);
      merged.total_cost_usd = this.roundToDecimal(merged.total_cost_usd, 4);
      merged.files_modified = Array.from(allFiles);

      this.logger.debug('统计结果合并完成', { merged });
      return merged;
    } catch (error) {
      this.logger.error('统计结果合并失败', error);
      return this.getEmptyStats();
    }
  }

  /**
   * 验证统计数据的合理性
   * @param stats 统计数据
   * @returns 验证结果和修正后的统计数据
   */
  validateAndCorrect(stats: BasicStats): { 
    valid: boolean; 
    corrected: BasicStats; 
    issues: string[] 
  } {
    const issues: string[] = [];
    const corrected = { ...stats };

    // 验证时间数据合理性
    if (stats.total_time_seconds < 0) {
      issues.push('总时间不能为负数');
      corrected.total_time_seconds = 0;
      corrected.total_time_hours = 0;
    }

    if (Math.abs(corrected.total_time_hours - corrected.total_time_seconds / 3600) > 0.01) {
      issues.push('时间单位换算不一致');
      corrected.total_time_hours = this.roundToDecimal(corrected.total_time_seconds / 3600, 2);
    }

    // 验证Token数据
    if (stats.total_tokens < 0) {
      issues.push('Token数量不能为负数');
      corrected.total_tokens = 0;
    }

    // 验证成本数据
    if (stats.total_cost_usd < 0) {
      issues.push('成本不能为负数');
      corrected.total_cost_usd = 0;
    }

    // 验证文件数据一致性
    if (stats.files_modified_count !== stats.files_modified.length) {
      issues.push('文件修改数量与文件列表长度不一致');
      corrected.files_modified_count = stats.files_modified.length;
    }

    // 验证会话数量合理性
    if (stats.session_count <= 0) {
      issues.push('会话数量应大于0');
      corrected.session_count = Math.max(1, stats.session_count);
    }

    return {
      valid: issues.length === 0,
      corrected,
      issues
    };
  }

  /**
   * 解析工具使用数据
   * @private
   */
  private parseToolUsage(toolsUsed: string[]): Record<string, number> {
    const usage: Record<string, number> = {};
    
    for (const tool of toolsUsed) {
      usage[tool] = (usage[tool] || 0) + 1;
    }

    return usage;
  }

  /**
   * 聚合工具使用统计
   * @private
   */
  private aggregateToolUsage(toolsUsed: string[]): Record<string, number> {
    const usage: Record<string, number> = {};
    
    for (const tool of toolsUsed) {
      usage[tool] = (usage[tool] || 0) + 1;
    }

    return usage;
  }

  /**
   * 估算模型使用统计
   * @private
   */
  private estimateModelUsage(totalTokens: number): Record<string, number> {
    // 简化实现：假设所有Token都来自同一个模型
    // 实际使用中可以从Cost API响应中获取模型信息
    return {
      'claude-3-5-sonnet-20241022': totalTokens // 默认模型
    };
  }

  /**
   * 数值四舍五入到指定小数位
   * @private
   */
  private roundToDecimal(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * 获取空的统计数据
   * @private
   */
  private getEmptyStats(): BasicStats {
    return {
      session_count: 0,
      total_time_seconds: 0,
      total_time_hours: 0,
      total_tokens: 0,
      total_cost_usd: 0,
      files_modified_count: 0,
      files_modified: [],
      tool_usage: {},
      model_usage: {}
    };
  }
}

/**
 * 统计数据比较工具
 * 提供统计数据的比较和差异分析功能
 */
export class StatsComparator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
  }

  /**
   * 比较两个统计结果
   * @param current 当前统计数据
   * @param previous 上一期统计数据
   * @returns 比较结果
   */
  compare(current: BasicStats, previous: BasicStats): {
    time_change: number;
    tokens_change: number;
    cost_change: number;
    files_change: number;
    sessions_change: number;
    efficiency_change: number;
  } {
    this.logger.debug('开始统计数据比较');

    const timeChange = this.calculateChange(current.total_time_hours, previous.total_time_hours);
    const tokensChange = this.calculateChange(current.total_tokens, previous.total_tokens);
    const costChange = this.calculateChange(current.total_cost_usd, previous.total_cost_usd);
    const filesChange = this.calculateChange(current.files_modified_count, previous.files_modified_count);
    const sessionsChange = this.calculateChange(current.session_count, previous.session_count);
    
    // 计算效率变化（Token/小时的变化）
    const currentEfficiency = current.total_time_hours > 0 ? current.total_tokens / current.total_time_hours : 0;
    const previousEfficiency = previous.total_time_hours > 0 ? previous.total_tokens / previous.total_time_hours : 0;
    const efficiencyChange = this.calculateChange(currentEfficiency, previousEfficiency);

    return {
      time_change: timeChange,
      tokens_change: tokensChange,
      cost_change: costChange,
      files_change: filesChange,
      sessions_change: sessionsChange,
      efficiency_change: efficiencyChange
    };
  }

  /**
   * 计算变化百分比
   * @private
   */
  private calculateChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }
}

/**
 * 导出单例实例
 */
export const basicStatsCalculator = new BasicStatsCalculator();
export const statsComparator = new StatsComparator();