/**
 * 分析模块类型定义
 * 定义智能分析引擎的核心数据结构和接口
 */

/**
 * 基础统计数据接口
 * 提供项目开发活动的基础指标
 */
export interface BasicStats {
  /** 会话总数 */
  session_count: number;
  /** 总开发时间（秒） */
  total_time_seconds: number;
  /** 总开发时间（小时） */
  total_time_hours: number;
  /** Token 总消耗量 */
  total_tokens: number;
  /** 总成本（美元） */
  total_cost_usd: number;
  /** 修改文件数量 */
  files_modified_count: number;
  /** 修改的文件列表 */
  files_modified: string[];
  /** 工具使用统计 */
  tool_usage: Record<string, number>;
  /** 模型使用统计 */
  model_usage: Record<string, number>;
}

/**
 * 效率指标数据接口
 * 衡量开发效率和生产力的关键指标
 */
export interface EfficiencyMetrics {
  /** 每小时Token消耗量 */
  tokens_per_hour: number;
  /** 每小时代码行数 */
  lines_per_hour: number;
  /** 估算的代码变更行数 */
  estimated_lines_changed: number;
  /** 综合生产力评分（0-10分） */
  productivity_score: number;
  /** 每小时成本 */
  cost_per_hour: number;
  /** 效率评级 */
  efficiency_rating: string;
}

/**
 * 趋势分析数据接口
 * 分析历史数据的变化趋势和模式
 */
export interface TrendAnalysis {
  /** 生产力趋势变化率 */
  productivity_trend: number;
  /** Token使用趋势变化率 */
  token_trend: number;
  /** 时间使用趋势变化率 */
  time_trend: number;
  /** 按日统计的历史数据 */
  daily_metrics: Record<string, DailyMetric>;
  /** 趋势分析消息 */
  message?: string;
  /** 异常检测结果（高级分析专用） */
  anomalies?: {
    productivity: number;
    tokens: number;
    time: number;
  };
  /** 季节性分析结果（高级分析专用） */
  seasonality?: {
    has_pattern: boolean;
    pattern_description: string;
    weekly_patterns?: Record<string, number>;
  };
  /** 整体置信度评分（高级分析专用） */
  confidence_score?: number;
}

/**
 * 日度指标数据
 */
export interface DailyMetric {
  /** 当日Token消耗 */
  tokens: number;
  /** 当日开发时间（小时） */
  time_hours: number;
  /** 当日生产力评分 */
  productivity_score: number;
  /** 当日成本 */
  cost: number;
  /** 当日修改文件数 */
  files_count?: number;
}

/**
 * 智能洞察接口
 * 基于数据分析生成的智能建议和洞察
 */
export interface SmartInsights {
  /** 洞察列表 */
  insights: string[];
  /** 改进建议 */
  recommendations: string[];
  /** 洞察等级 */
  priority: 'high' | 'medium' | 'low';
  /** 洞察类型 */
  category: 'efficiency' | 'cost' | 'productivity' | 'tools' | 'trends';
}

/**
 * 分析请求参数
 */
export interface AnalysisRequest {
  /** 项目路径 */
  project_path: string;
  /** 时间范围 */
  timeframe: 'today' | 'week' | 'month' | 'custom';
  /** 自定义时间范围 */
  custom_range?: [Date, Date];
  /** 分析类型 */
  analysis_types?: ('basic' | 'efficiency' | 'trends' | 'insights')[];
}

/**
 * 完整的分析结果接口
 * 包含所有分析维度的综合报告
 */
export interface AnalysisResult {
  /** 分析时间范围 */
  timeframe: string;
  /** 项目路径 */
  project_path: string;
  /** 基础统计数据 */
  basic_stats: BasicStats;
  /** 效率指标 */
  efficiency: EfficiencyMetrics;
  /** 趋势分析（可选） */
  trends?: TrendAnalysis;
  /** 智能洞察（可选） */
  insights?: SmartInsights;
  /** 数据来源标识 */
  data_source: string;
  /** 报告生成时间 */
  generated_at: string;
  /** 数据质量指标 */
  data_quality?: {
    completeness: number;
    reliability: number;
    freshness: number;
  };
}

/**
 * 工具使用分析
 */
export interface ToolUsageAnalysis {
  /** 工具名称 */
  tool_name: string;
  /** 使用次数 */
  usage_count: number;
  /** 使用频率（次/小时） */
  usage_rate: number;
  /** 估算贡献的代码行数 */
  estimated_lines: number;
  /** 工具效率评分 */
  efficiency_score: number;
}

/**
 * 成本分析接口
 */
export interface CostAnalysis {
  /** 总成本 */
  total_cost: number;
  /** 每小时成本 */
  cost_per_hour: number;
  /** 每行代码成本 */
  cost_per_line: number;
  /** 成本分布 */
  cost_breakdown: {
    input_cost: number;
    output_cost: number;
    model_costs: Record<string, number>;
  };
  /** 成本优化建议 */
  optimization_suggestions: string[];
}

/**
 * 分析引擎配置
 */
export interface AnalyticsConfig {
  /** 启用的分析类型 */
  enabled_analyses: string[];
  /** 代码行数估算模型配置 */
  line_estimation_model: Record<string, number>;
  /** 生产力评分权重配置 */
  productivity_weights: {
    token_weight: number;
    lines_weight: number;
    tools_weight: number;
  };
  /** 洞察生成配置 */
  insights_config: {
    enabled: boolean;
    language: 'zh-CN' | 'en-US';
    max_insights: number;
  };
}

/**
 * 时间范围解析结果
 */
export interface TimeframeResult {
  /** 开始时间 */
  start: Date;
  /** 结束时间 */
  end: Date;
  /** 时间范围描述 */
  description: string;
  /** 是否为单日数据 */
  is_single_day: boolean;
}

/**
 * 数据聚合选项
 */
export interface AggregationOptions {
  /** 聚合维度 */
  dimension: 'hour' | 'day' | 'week' | 'month';
  /** 聚合指标 */
  metrics: ('tokens' | 'time' | 'cost' | 'files' | 'tools')[];
  /** 是否填充缺失数据 */
  fill_gaps: boolean;
}