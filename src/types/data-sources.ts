/**
 * 数据源相关类型定义
 */

import type { DataSourceType } from './config';

/**
 * 数据源可用性状态
 */
export interface DataSourceAvailability {
  otel: boolean;
  jsonl: boolean;
  cost_api: boolean;
  hooks: boolean;
}

/**
 * 重导出数据源类型
 */
export type { DataSourceType } from './config';

/**
 * 数据源优先级排序
 */
export type DataSourcePriority = DataSourceType[];

/**
 * 数据源状态
 */
export interface DataSourceStatus {
  available: boolean;
  path?: string;
  error?: string;
  last_updated?: Date;
}

/**
 * 数据源发现结果
 */
export interface DataSourceDiscovery {
  sources: DataSourceAvailability;
  preferred: DataSourceType;
  status: Record<DataSourceType, DataSourceStatus>;
}