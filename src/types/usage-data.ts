/**
 * 使用数据相关类型定义
 */

/**
 * Token 使用统计（简化版）
 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * 成本统计
 */
export interface CostData {
  input: number;
  output: number;
  total: number;
}

/**
 * 会话信息
 */
export interface SessionData {
  duration_minutes: number;
  messages_count: number;
}

/**
 * 基础使用数据接口（简化版，适配实际数据源）
 */
export interface UsageData {
  timestamp: string;
  project: string;
  tokens: TokenUsage;
  costs: CostData;
  session?: SessionData;
  source: 'cost_api' | 'opentelemetry';
}

/**
 * 时间范围信息
 */
export interface TimeSpan {
  start: string;
  end: string;
  duration_minutes: number;
}

/**
 * 活动统计
 */
export interface ActivityStats {
  sessions: number;
  messages: number;
  tools_used: string[];
  files_modified: number;
}

/**
 * 数据质量指标
 */
export interface DataQuality {
  sources: string[];
  completeness: number; // 0-1 之间
  last_updated: string;
}

/**
 * 基础统计数据（简化版，专注核心指标）
 */
export interface BasicUsageStats {
  project: string;
  timespan: TimeSpan;
  tokens: TokenUsage;
  costs: CostData;
  activity: ActivityStats;
  data_quality: DataQuality;
}

/**
 * 效率指标数据
 */
export interface EfficiencyMetrics {
  tokens_per_hour: number;
  lines_per_hour: number;
  estimated_lines_changed: number;
  productivity_score: number;
  cost_per_hour: number;
  efficiency_rating: string;
}

/**
 * 趋势分析数据
 */
export interface TrendAnalysis {
  productivity_trend: number;
  token_trend: number;
  time_trend: number;
  daily_metrics: Record<string, any>;
}

/**
 * 日期范围类型
 */
export type DateRange = [Date, Date];