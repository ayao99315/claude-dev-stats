/**
 * 智能洞察生成引擎
 * 基于数据分析结果生成智能建议和洞察
 */

import { 
  BasicStats, 
  EfficiencyMetrics, 
  TrendAnalysis, 
  SmartInsights, 
  ToolUsageAnalysis,
  CostAnalysis
} from '../types/analytics';
import { Logger } from '../utils/logger';

/**
 * 洞察规则接口
 */
export interface InsightRule {
  /** 规则ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 规则类型 */
  category: 'efficiency' | 'cost' | 'productivity' | 'tools' | 'trends';
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 条件判断函数 */
  condition: (data: AnalysisContext) => boolean;
  /** 洞察生成函数 */
  generate: (data: AnalysisContext) => string;
  /** 建议生成函数 */
  recommend?: (data: AnalysisContext) => string;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 分析上下文
 */
export interface AnalysisContext {
  basic_stats: BasicStats;
  efficiency?: EfficiencyMetrics;
  trends?: TrendAnalysis;
  cost_analysis?: CostAnalysis;
  tool_analysis?: ToolUsageAnalysis[];
}

/**
 * 智能洞察生成器
 * 基于规则引擎的洞察生成系统
 */
export class InsightsGenerator {
  private logger: Logger;
  private rules: Map<string, InsightRule>;
  private language: 'zh-CN' | 'en-US';

  constructor(language: 'zh-CN' | 'en-US' = 'zh-CN') {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
    this.language = language;
    this.rules = new Map();
    this.initializeDefaultRules();
  }

  /**
   * 生成智能洞察
   * @param context 分析上下文
   * @returns 智能洞察结果
   */
  generateInsights(context: AnalysisContext): SmartInsights {
    this.logger.debug('开始生成智能洞察');

    try {
      const insights: string[] = [];
      const recommendations: string[] = [];
      let highestPriority: 'high' | 'medium' | 'low' = 'low';
      const categories = new Set<string>();

      // 遍历所有启用的规则
      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;

        try {
          // 检查规则条件
          if (rule.condition(context)) {
            // 生成洞察
            const insight = rule.generate(context);
            if (insight.trim()) {
              insights.push(insight);
              categories.add(rule.category);

              // 更新最高优先级
              if (rule.priority === 'high' || (rule.priority === 'medium' && highestPriority === 'low')) {
                highestPriority = rule.priority;
              }

              // 生成建议（如果有）
              if (rule.recommend) {
                const recommendation = rule.recommend(context);
                if (recommendation.trim()) {
                  recommendations.push(recommendation);
                }
              }
            }
          }
        } catch (error) {
          this.logger.warn(`规则 ${rule.id} 执行失败`, error);
        }
      }

      // 限制洞察数量
      const maxInsights = 8;
      const limitedInsights = insights.slice(0, maxInsights);
      const limitedRecommendations = recommendations.slice(0, maxInsights);

      // 确定主要类别
      const primaryCategory = this.determinePrimaryCategory(context, categories);

      const result: SmartInsights = {
        insights: limitedInsights,
        recommendations: limitedRecommendations,
        priority: highestPriority,
        category: primaryCategory
      };

      this.logger.debug('洞察生成完成', { 
        insightsCount: result.insights.length,
        recommendationsCount: result.recommendations.length,
        priority: result.priority,
        category: result.category
      });

      return result;
    } catch (error) {
      this.logger.error('洞察生成失败', error);
      return this.getEmptyInsights();
    }
  }

  /**
   * 初始化默认规则
   * @private
   */
  private initializeDefaultRules(): void {
    this.logger.debug('初始化洞察规则');

    const rules: InsightRule[] = [
      // 效率相关规则
      {
        id: 'high_productivity',
        name: '高生产力表现',
        category: 'productivity',
        priority: 'medium',
        condition: (ctx) => (ctx.efficiency?.productivity_score || 0) >= 8,
        generate: (ctx) => `🎉 今天的开发效率很高！生产力评分达到了${ctx.efficiency?.productivity_score?.toFixed(1)}分`,
        recommend: () => '继续保持这种高效的工作状态，可以考虑总结今天的工作方法',
        enabled: true
      },
      {
        id: 'low_productivity',
        name: '生产力待提升',
        category: 'productivity',
        priority: 'high',
        condition: (ctx) => (ctx.efficiency?.productivity_score || 0) < 4,
        generate: (ctx) => `💡 生产力评分${ctx.efficiency?.productivity_score?.toFixed(1)}分偏低，可能需要调整工作方式`,
        recommend: () => '建议分析是否被频繁中断或任务过于复杂，考虑使用番茄工作法',
        enabled: true
      },
      {
        id: 'high_token_usage',
        name: 'Token使用量高',
        category: 'efficiency',
        priority: 'medium',
        condition: (ctx) => (ctx.efficiency?.tokens_per_hour || 0) > 1500,
        generate: (ctx) => `⚡ Token使用率较高（${ctx.efficiency?.tokens_per_hour?.toFixed(0)}/小时）`,
        recommend: () => '建议优化提问方式，使用更精确的指令以节省成本',
        enabled: true
      },
      {
        id: 'low_token_usage',
        name: 'Token使用量低',
        category: 'efficiency',
        priority: 'low',
        condition: (ctx) => (ctx.efficiency?.tokens_per_hour || 0) < 300,
        generate: (ctx) => `🤔 Token使用率较低（${ctx.efficiency?.tokens_per_hour?.toFixed(0)}/小时）`,
        recommend: () => '可能需要更充分地利用Claude的能力，考虑使用更多AI辅助功能',
        enabled: true
      },
      
      // 成本相关规则
      {
        id: 'high_cost_per_hour',
        name: '小时成本过高',
        category: 'cost',
        priority: 'high',
        condition: (ctx) => (ctx.efficiency?.cost_per_hour || 0) > 20,
        generate: (ctx) => `💰 每小时成本较高（$${ctx.efficiency?.cost_per_hour?.toFixed(2)}）`,
        recommend: () => '建议使用更精确的指令，减少重复交互和冗长对话',
        enabled: true
      },
      {
        id: 'cost_efficient',
        name: '成本效率良好',
        category: 'cost',
        priority: 'low',
        condition: (ctx) => (ctx.efficiency?.cost_per_hour || 0) < 5,
        generate: (ctx) => `💚 成本控制良好，每小时仅$${ctx.efficiency?.cost_per_hour?.toFixed(2)}`,
        enabled: true
      },

      // 工具使用规则
      {
        id: 'diverse_tool_usage',
        name: '工具使用多样化',
        category: 'tools',
        priority: 'medium',
        condition: (ctx) => Object.keys(ctx.basic_stats.tool_usage).length >= 5,
        generate: (ctx) => `🔧 使用了${Object.keys(ctx.basic_stats.tool_usage).length}种不同工具，展现了多样化的工作方式`,
        enabled: true
      },
      {
        id: 'limited_tool_usage',
        name: '工具使用单一',
        category: 'tools',
        priority: 'medium',
        condition: (ctx) => Object.keys(ctx.basic_stats.tool_usage).length <= 2,
        generate: (ctx) => `🛠️ 主要使用了${Object.keys(ctx.basic_stats.tool_usage).length}种工具`,
        recommend: () => '可以尝试使用更多Claude Code功能，如Task、MultiEdit等提高效率',
        enabled: true
      },
      {
        id: 'most_used_tool',
        name: '最常用工具',
        category: 'tools',
        priority: 'low',
        condition: (ctx) => Object.keys(ctx.basic_stats.tool_usage).length > 0,
        generate: (ctx) => {
          const mostUsed = Object.entries(ctx.basic_stats.tool_usage)
            .sort(([,a], [,b]) => b - a)[0];
          return `📊 最常用工具：${mostUsed[0]}（${mostUsed[1]}次使用）`;
        },
        enabled: true
      },

      // 时间相关规则
      {
        id: 'long_session',
        name: '长时间工作',
        category: 'productivity',
        priority: 'medium',
        condition: (ctx) => ctx.basic_stats.total_time_hours > 6,
        generate: (ctx) => `⏰ 今天工作了${ctx.basic_stats.total_time_hours.toFixed(1)}小时，工作时间较长`,
        recommend: () => '长时间工作要注意休息，建议每2小时休息15分钟保持效率',
        enabled: true
      },
      {
        id: 'efficient_session',
        name: '高效时段',
        category: 'productivity',
        priority: 'low',
        condition: (ctx) => (ctx.basic_stats.total_time_hours > 0 && ctx.basic_stats.total_time_hours < 4 && (ctx.efficiency?.productivity_score || 0) > 6),
        generate: (ctx) => `⚡ 在${ctx.basic_stats.total_time_hours.toFixed(1)}小时内达到了很好的效果`,
        recommend: () => '这是一个很好的高效工作时段，可以总结这种工作节奏',
        enabled: true
      },

      // 趋势相关规则
      {
        id: 'productivity_improving',
        name: '生产力上升趋势',
        category: 'trends',
        priority: 'medium',
        condition: (ctx) => (ctx.trends?.productivity_trend || 0) > 10,
        generate: (ctx) => `📈 生产力呈上升趋势，提升了${ctx.trends?.productivity_trend?.toFixed(1)}%`,
        recommend: () => '继续保持这种改进趋势，分析成功因素以便复制',
        enabled: true
      },
      {
        id: 'productivity_declining',
        name: '生产力下降趋势',
        category: 'trends',
        priority: 'high',
        condition: (ctx) => (ctx.trends?.productivity_trend || 0) < -15,
        generate: (ctx) => `📉 生产力有下降趋势，下降了${Math.abs(ctx.trends?.productivity_trend || 0).toFixed(1)}%`,
        recommend: () => '建议检查工作方式或环境是否有变化，考虑调整策略',
        enabled: true
      },

      // 文件修改规则  
      {
        id: 'high_file_activity',
        name: '文件活动活跃',
        category: 'productivity',
        priority: 'low',
        condition: (ctx) => ctx.basic_stats.files_modified_count > 10,
        generate: (ctx) => `📁 修改了${ctx.basic_stats.files_modified_count}个文件，项目活动很活跃`,
        enabled: true
      },
      {
        id: 'focused_work',
        name: '专注工作模式',
        category: 'productivity', 
        priority: 'low',
        condition: (ctx) => ctx.basic_stats.files_modified_count <= 3 && (ctx.efficiency?.productivity_score || 0) > 6,
        generate: (ctx) => '🎯 在少数几个文件上进行了专注的深度工作',
        recommend: () => '这种专注的工作方式很好，有助于深入思考和高质量产出',
        enabled: true
      }
    ];

    // 注册所有规则
    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    this.logger.debug(`初始化了${rules.length}条洞察规则`);
  }

  /**
   * 确定主要类别
   * @private
   */
  private determinePrimaryCategory(
    context: AnalysisContext, 
    categories: Set<string>
  ): 'efficiency' | 'cost' | 'productivity' | 'tools' | 'trends' {
    // 优先级顺序
    const priorityOrder = ['productivity', 'efficiency', 'cost', 'trends', 'tools'];
    
    for (const category of priorityOrder) {
      if (categories.has(category)) {
        return category as any;
      }
    }

    return 'productivity'; // 默认分类
  }

  /**
   * 添加自定义规则
   * @param rule 洞察规则
   */
  addRule(rule: InsightRule): void {
    this.logger.debug(`添加自定义规则: ${rule.id}`);
    this.rules.set(rule.id, rule);
  }

  /**
   * 移除规则
   * @param ruleId 规则ID
   */
  removeRule(ruleId: string): boolean {
    this.logger.debug(`移除规则: ${ruleId}`);
    return this.rules.delete(ruleId);
  }

  /**
   * 启用/禁用规则
   * @param ruleId 规则ID
   * @param enabled 是否启用
   */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.logger.debug(`规则 ${ruleId} ${enabled ? '启用' : '禁用'}`);
      return true;
    }
    return false;
  }

  /**
   * 获取所有规则
   */
  getRules(): InsightRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 设置语言
   * @param language 语言代码
   */
  setLanguage(language: 'zh-CN' | 'en-US'): void {
    this.language = language;
    this.logger.debug(`语言设置为: ${language}`);
  }

  /**
   * 获取空的洞察结果
   * @private
   */
  private getEmptyInsights(): SmartInsights {
    return {
      insights: ['暂时无法生成洞察，请稍后再试'],
      recommendations: [],
      priority: 'low',
      category: 'productivity'
    };
  }
}

/**
 * 建议生成器
 * 基于洞察结果生成具体的行动建议
 */
export class RecommendationEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: true, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
  }

  /**
   * 生成建议（测试兼容方法）
   * @param stats 基础统计数据
   * @param efficiency 效率指标
   * @param trends 趋势分析
   * @param language 语言设置
   * @returns 带优先级的建议对象
   */
  generateRecommendations(
    stats: BasicStats,
    efficiency: EfficiencyMetrics,
    trends: TrendAnalysis,
    language: 'zh-CN' | 'en-US' = 'zh-CN'
  ): { priority: 'high' | 'medium' | 'low'; suggestions: string[] } {
    const context: AnalysisContext = {
      basic_stats: stats,
      efficiency,
      trends
    };

    // 创建临时的洞察对象用于生成建议
    const insights: SmartInsights = {
      insights: [],
      recommendations: [],
      priority: 'medium',
      category: 'productivity'
    };

    // 确定优先级
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (efficiency.productivity_score < 4 || trends.productivity_trend < -15) {
      priority = 'high';
    } else if (efficiency.productivity_score < 6 || Math.abs(trends.productivity_trend) > 10) {
      priority = 'medium';
    }

    const suggestions = this.generatePersonalizedRecommendations(context, insights);
    
    return { priority, suggestions };
  }

  /**
   * 生成个性化建议
   * @param context 分析上下文
   * @param insights 洞察结果
   * @returns 个性化建议列表
   */
  generatePersonalizedRecommendations(
    context: AnalysisContext,
    insights: SmartInsights
  ): string[] {
    this.logger.debug('开始生成个性化建议');

    const recommendations: string[] = [];

    // 基于效率评分的建议
    if (context.efficiency) {
      recommendations.push(...this.getEfficiencyRecommendations(context.efficiency));
    }

    // 基于工具使用的建议  
    if (context.basic_stats) {
      recommendations.push(...this.getToolRecommendations(context.basic_stats));
    }

    // 基于趋势的建议
    if (context.trends) {
      recommendations.push(...this.getTrendRecommendations(context.trends));
    }

    // 基于成本的建议
    if (context.cost_analysis) {
      recommendations.push(...this.getCostRecommendations(context.cost_analysis));
    }

    // 去重和限制数量
    const uniqueRecommendations = [...new Set(recommendations)];
    return uniqueRecommendations.slice(0, 6);
  }

  /**
   * 生成效率相关建议
   * @private
   */
  private getEfficiencyRecommendations(efficiency: EfficiencyMetrics): string[] {
    const recommendations: string[] = [];

    if (efficiency.productivity_score < 5) {
      recommendations.push('尝试使用番茄工作法，25分钟专注工作+5分钟休息');
      recommendations.push('检查是否有太多干扰因素影响专注度');
    } else if (efficiency.productivity_score > 7) {
      // 高效率用户建议
      recommendations.push('继续保持这种高效的工作状态，可以总结成功经验');
      recommendations.push('维持当前的工作节奏，注意适当休息避免疲劳');
    }

    if (efficiency.lines_per_hour < 30) {
      recommendations.push('可以尝试使用MultiEdit工具进行批量修改，提高代码编辑效率');
    }

    if (efficiency.tokens_per_hour > 1800) {
      recommendations.push('考虑使用更简洁的描述，避免重复说明相同的内容');
    }

    return recommendations;
  }

  /**
   * 生成工具使用建议
   * @private
   */
  private getToolRecommendations(stats: BasicStats): string[] {
    const recommendations: string[] = [];
    const toolUsage = stats.tool_usage;

    // 检查是否缺少常用工具
    if (!toolUsage['Grep'] && !toolUsage['Glob']) {
      recommendations.push('学习使用Grep和Glob工具进行高效的代码搜索');
    }

    if (!toolUsage['Task']) {
      recommendations.push('对复杂任务考虑使用Task工具，让AI帮助分解和处理');
    }

    // 检查工具使用不平衡
    const editCount = (toolUsage['Edit'] || 0) + (toolUsage['MultiEdit'] || 0);
    const readCount = toolUsage['Read'] || 0;

    if (readCount > editCount * 3) {
      recommendations.push('阅读较多，建议整理需求后再开始编码，减少反复阅读');
    }

    return recommendations;
  }

  /**
   * 生成趋势相关建议
   * @private
   */
  private getTrendRecommendations(trends: TrendAnalysis): string[] {
    const recommendations: string[] = [];

    if (trends.productivity_trend < -10) {
      recommendations.push('生产力有下降趋势，建议回顾近期工作模式的变化');
      recommendations.push('考虑是否需要调整工作环境或时间安排');
    }

    if (trends.token_trend > 20) {
      recommendations.push('Token使用量增长较快，关注是否可以优化交互方式');
    }

    return recommendations;
  }

  /**
   * 生成成本相关建议
   * @private
   */
  private getCostRecommendations(costAnalysis: CostAnalysis): string[] {
    const recommendations: string[] = [];

    if (costAnalysis.cost_per_hour > 15) {
      recommendations.push('每小时成本较高，建议提前准备问题，一次性解决相关需求');
    }

    if (costAnalysis.cost_per_line > 0.08) {
      recommendations.push('每行代码成本偏高，可以尝试让AI编写更多代码减少往返');
    }

    return recommendations;
  }
}

/**
 * 导出单例实例
 */
export const insightsGenerator = new InsightsGenerator();
export const recommendationEngine = new RecommendationEngine();