/**
 * 测试数据 Mock 工具 - 适配新设计
 * 为单元测试和集成测试提供模拟数据
 */

import { UsageData, BasicUsageStats } from '@/types/usage-data';
import { BasicStats, EfficiencyMetrics, TrendAnalysis } from '@/types/analytics';
import { DataSourceConfig } from '@/types/config';

/**
 * 生成模拟的使用数据 - 适配新设计
 */
export function mockUsageData(overrides: Partial<UsageData> = {}): UsageData {
  const defaultData: UsageData = {
    timestamp: new Date().toISOString(),
    project: 'mock-project',
    tokens: {
      input: 500,
      output: 300,
      total: 800
    },
    costs: {
      input: 0.02,
      output: 0.02,
      total: 0.04
    },
    session: {
      duration_minutes: 60,
      messages_count: 5
    },
    source: 'cost_api'
  };

  return { ...defaultData, ...overrides };
}

/**
 * 生成模拟的基础使用统计数据 - 新设计
 */
export function mockBasicUsageStats(overrides: Partial<BasicUsageStats> = {}): BasicUsageStats {
  const defaultStats: BasicUsageStats = {
    project: 'mock-project',
    timespan: {
      start: '2024-01-01T00:00:00Z',
      end: '2024-01-01T23:59:59Z',
      duration_minutes: 240 // 4小时
    },
    tokens: {
      input: 2000,
      output: 1500,
      total: 3500
    },
    costs: {
      input: 0.030,
      output: 0.045,
      total: 0.075
    },
    activity: {
      sessions: 3,
      messages: 45,
      tools_used: ['Edit', 'Read', 'Write'],
      files_modified: 8
    },
    data_quality: {
      sources: ['cost_api'],
      completeness: 0.7,
      last_updated: '2024-01-01T12:00:00Z'
    }
  };

  return { ...defaultStats, ...overrides };
}

/**
 * 生成模拟的基础统计数据
 */
export function mockBasicStats(overrides?: Partial<BasicStats>): BasicStats {
  const defaults: BasicStats = {
    session_count: 3,
    total_time_seconds: 10800,
    total_time_hours: 3,
    total_tokens: 1500,
    total_cost_usd: 0.25,
    files_modified_count: 8,
    files_modified: [
      'src/components/App.tsx',
      'src/utils/helpers.ts',
      'README.md',
      'package.json',
      'tests/app.test.ts',
      'src/types/index.ts',
      'docs/api.md',
      'src/config.ts'
    ],
    tool_usage: {
      Edit: 15,
      Read: 25,
      Write: 8,
      Bash: 12,
      Grep: 20,
      MultiEdit: 5
    },
    model_usage: {
      'claude-sonnet-4': 1200,
      'claude-haiku-3': 300
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * 生成模拟的效率指标数据
 */
export function mockEfficiencyMetrics(overrides?: Partial<EfficiencyMetrics>): EfficiencyMetrics {
  const defaults: EfficiencyMetrics = {
    tokens_per_hour: 500,
    lines_per_hour: 120,
    estimated_lines_changed: 360,
    productivity_score: 7.5,
    cost_per_hour: 0.083,
    efficiency_rating: '良好'
  };

  return { ...defaults, ...overrides };
}

/**
 * 生成模拟的数据源配置 - 适配新设计
 */
export function mockDataSourceConfig(overrides: Partial<DataSourceConfig> = {}): DataSourceConfig {
  const defaults: DataSourceConfig = {
    cost_api: true,
    opentelemetry: false
  };

  return { ...defaults, ...overrides };
}

/**
 * 生成模拟的趋势分析数据
 */
export function mockTrendAnalysis(overrides?: Partial<TrendAnalysis>): TrendAnalysis {
  const defaults: TrendAnalysis = {
    productivity_trend: 0.15,
    token_trend: 0.08,
    time_trend: -0.05,
    daily_metrics: {
      '2024-01-01': {
        tokens: 800,
        time_hours: 2.5,
        productivity_score: 6.8,
        cost: 0.12
      },
      '2024-01-02': {
        tokens: 950,
        time_hours: 2.8,
        productivity_score: 7.2,
        cost: 0.15
      },
      '2024-01-03': {
        tokens: 1100,
        time_hours: 3.0,
        productivity_score: 7.8,
        cost: 0.18
      }
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * 生成批量测试数据 - 适配新设计
 */
export function generateUsageDataBatch(
  count: number, 
  options: {
    dateRange?: [Date, Date];
    projectPaths?: string[];
    sessionPrefix?: string;
  } = {}
): UsageData[] {
  const { dateRange, projectPaths = ['mock-project'], sessionPrefix = 'batch' } = options;
  const result: UsageData[] = [];

  for (let i = 0; i < count; i++) {
    let timestamp: string;
    
    if (dateRange) {
      const [start, end] = dateRange;
      const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
      timestamp = new Date(randomTime).toISOString();
    } else {
      timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    }

    const projectPath = projectPaths[Math.floor(Math.random() * projectPaths.length)];
    
    result.push(mockUsageData({
      timestamp,
      project: projectPath.split('/').pop() || 'mock-project',
      tokens: {
        input: Math.floor(300 + Math.random() * 700),
        output: Math.floor(200 + Math.random() * 500),
        total: Math.floor(500 + Math.random() * 1200)
      },
      costs: {
        input: Math.round((0.01 + Math.random() * 0.04) * 100) / 100,
        output: Math.round((0.01 + Math.random() * 0.04) * 100) / 100,
        total: Math.round((0.02 + Math.random() * 0.08) * 100) / 100
      },
      session: {
        duration_minutes: Math.floor(30 + Math.random() * 90),
        messages_count: Math.floor(3 + Math.random() * 20)
      }
    }));
  }

  return result;
}

/**
 * 生成随机的工具使用数据
 */
function generateRandomToolUsage(): Record<string, number> {
  const tools = ['Edit', 'Read', 'Write', 'MultiEdit', 'Bash', 'Grep', 'Task'];
  const usage: Record<string, number> = {};

  // 随机选择3-6个工具
  const toolCount = 3 + Math.floor(Math.random() * 4);
  const selectedTools = tools.sort(() => 0.5 - Math.random()).slice(0, toolCount);

  selectedTools.forEach(tool => {
    usage[tool] = Math.floor(1 + Math.random() * 15);
  });

  return usage;
}

/**
 * 生成随机的文件修改列表
 */
function generateRandomFiles(): string[] {
  const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go'];
  const directories = ['src', 'lib', 'utils', 'components', 'services'];
  const files: string[] = [];

  const fileCount = Math.floor(1 + Math.random() * 8);

  for (let i = 0; i < fileCount; i++) {
    const dir = directories[Math.floor(Math.random() * directories.length)];
    const name = `file${i + 1}`;
    const ext = extensions[Math.floor(Math.random() * extensions.length)];
    files.push(`${dir}/${name}${ext}`);
  }

  return files;
}

/**
 * 生成JSONL格式的测试数据
 */
export function generateJsonlTestData(usageData: UsageData[]): string {
  return usageData
    .map(data => JSON.stringify(data))
    .join('\n') + '\n';
}

/**
 * 生成带有无效行的JSONL测试数据
 */
export function generateJsonlWithInvalidLines(validData: UsageData[], invalidLines: string[]): string {
  const lines: string[] = [];
  
  validData.forEach((data, index) => {
    lines.push(JSON.stringify(data));
    
    // 随机插入无效行
    if (index < invalidLines.length) {
      lines.push(invalidLines[index]);
    }
  });

  return lines.join('\n') + '\n';
}

/**
 * 生成模拟的文件系统路径
 */
export function mockFilePaths(count: number, prefix: string = '/test'): string[] {
  const extensions = ['.ts', '.js', '.tsx', '.jsx', '.json', '.md'];
  const paths: string[] = [];

  for (let i = 0; i < count; i++) {
    const ext = extensions[Math.floor(Math.random() * extensions.length)];
    paths.push(`${prefix}/file${i}${ext}`);
  }

  return paths;
}

/**
 * 生成完整的分析报告模拟数据 - 适配新设计
 */
export function mockAnalysisReport(overrides: any = {}): any {
  const defaultReport = {
    timeframe: 'today',
    project_path: '/mock/project',
    basic_stats: mockBasicStats(),
    efficiency: mockEfficiencyMetrics(),
    trends: mockTrendAnalysis(),
    insights: [
      '🎉 今天的开发效率不错，还有提升空间。',
      '🔧 最常用工具：Read（40次使用）',
      '💡 Token 使用量适中，建议继续保持当前工作方式。',
      '📈 生产力呈上升趋势，工作效率在持续改善。'
    ],
    data_source: 'cost_api',
    generated_at: new Date().toISOString()
  };

  return { ...defaultReport, ...overrides };
}

/**
 * Jest 自定义匹配器：验证 UsageData 格式
 */
export function toBeValidUsageData(received: any): { message: () => string; pass: boolean } {
  const requiredFields = [
    'session_id', 'timestamp', 'project', 'active_time_seconds',
    'token_usage', 'tool_usage', 'files_modified', 'cost_usd'
  ];

  const missingFields = requiredFields.filter(field => !(field in received));
  
  if (missingFields.length > 0) {
    return {
      message: () => `Expected valid UsageData, but missing fields: ${missingFields.join(', ')}`,
      pass: false
    };
  }

  if (typeof received.token_usage !== 'object' || !('total_tokens' in received.token_usage)) {
    return {
      message: () => 'Expected valid token_usage with total_tokens',
      pass: false
    };
  }

  if (!Array.isArray(received.files_modified)) {
    return {
      message: () => 'Expected files_modified to be an array',
      pass: false
    };
  }

  return {
    message: () => 'Expected invalid UsageData',
    pass: true
  };
}

// 扩展 Jest 匹配器
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUsageData(): R;
    }
  }
}

// 注册自定义匹配器
if (typeof expect !== 'undefined') {
  expect.extend({
    toBeValidUsageData
  });
}