/**
 * AnalyticsEngine 智能分析引擎测试
 * 基于新设计的分析引擎功能测试
 */

import { AnalyticsEngine } from '@/analytics/index';
import { SimplifiedDataManager } from '@/data-sources/simplified-manager';
import { BasicUsageStats, EfficiencyMetrics, TrendAnalysis } from '@/types';

// Mock 依赖
jest.mock('@/data-sources/simplified-manager');

const MockSimplifiedDataManager = SimplifiedDataManager as jest.MockedClass<typeof SimplifiedDataManager>;

describe('AnalyticsEngine', () => {
  let engine: AnalyticsEngine;
  let mockDataManager: jest.Mocked<SimplifiedDataManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDataManager = {
      getUsageStats: jest.fn()
    } as any;

    MockSimplifiedDataManager.mockImplementation(() => mockDataManager);
    engine = new AnalyticsEngine(mockDataManager);
  });

  describe('基础统计计算', () => {
    it('应该能计算完整的基础统计数据', () => {
      const mockRawData = [
        {
          session_id: 'session1',
          active_time_seconds: 3600,
          token_usage: { input_tokens: 1000, output_tokens: 500, total_tokens: 1500 },
          tool_usage: { Edit: 5, Read: 10, Write: 2 },
          files_modified: ['file1.ts', 'file2.ts'],
          cost_usd: 0.075
        },
        {
          session_id: 'session2',
          active_time_seconds: 1800,
          token_usage: { input_tokens: 800, output_tokens: 700, total_tokens: 1500 },
          tool_usage: { Edit: 3, MultiEdit: 2 },
          files_modified: ['file2.ts', 'file3.ts'],
          cost_usd: 0.075
        }
      ];

      const basicStats = engine['calculateBasicStats'](mockRawData);

      expect(basicStats.session_count).toBe(2);
      expect(basicStats.total_time_seconds).toBe(5400);
      expect(basicStats.total_time_hours).toBe(1.5);
      expect(basicStats.total_tokens).toBe(3000);
      expect(basicStats.total_cost_usd).toBe(0.15);
      expect(basicStats.files_modified_count).toBe(3); // 去重后
      expect(basicStats.files_modified).toContain('file1.ts');
      expect(basicStats.files_modified).toContain('file2.ts');
      expect(basicStats.files_modified).toContain('file3.ts');
      expect(basicStats.tool_usage.Edit).toBe(8);
      expect(basicStats.tool_usage.Read).toBe(10);
      expect(basicStats.tool_usage.Write).toBe(2);
      expect(basicStats.tool_usage.MultiEdit).toBe(2);
    });

    it('应该处理空数据的情况', () => {
      const basicStats = engine['calculateBasicStats']([]);

      expect(basicStats.session_count).toBe(0);
      expect(basicStats.total_time_seconds).toBe(0);
      expect(basicStats.total_time_hours).toBe(0);
      expect(basicStats.total_tokens).toBe(0);
      expect(basicStats.total_cost_usd).toBe(0);
      expect(basicStats.files_modified_count).toBe(0);
      expect(basicStats.files_modified).toEqual([]);
      expect(basicStats.tool_usage).toEqual({});
      expect(basicStats.model_usage).toEqual({});
    });

    it('应该正确处理相同 session_id 的去重', () => {
      const mockRawData = [
        {
          session_id: 'same-session',
          active_time_seconds: 1000,
          token_usage: { total_tokens: 500 },
          tool_usage: { Edit: 1 },
          files_modified: ['file1.ts'],
          cost_usd: 0.025
        },
        {
          session_id: 'same-session', 
          active_time_seconds: 1000,
          token_usage: { total_tokens: 500 },
          tool_usage: { Edit: 1 },
          files_modified: ['file2.ts'],
          cost_usd: 0.025
        }
      ];

      const basicStats = engine['calculateBasicStats'](mockRawData);

      expect(basicStats.session_count).toBe(1); // 去重
      expect(basicStats.total_time_seconds).toBe(2000); // 但时间累计
      expect(basicStats.total_tokens).toBe(1000); // token累计
    });
  });

  describe('效率指标计算', () => {
    it('应该计算正确的效率指标', () => {
      const mockRawData = [
        {
          session_id: 'session1',
          active_time_seconds: 3600, // 1 小时
          token_usage: { total_tokens: 2000 },
          tool_usage: { Edit: 6, Write: 2 }, // 6*15 + 2*50 = 190 行
          files_modified: ['file1.ts', 'file2.ts'],
          cost_usd: 0.10
        }
      ];

      const efficiency = engine['calculateEfficiencyMetrics'](mockRawData);

      expect(efficiency.tokens_per_hour).toBe(2000);
      expect(efficiency.lines_per_hour).toBe(190);
      expect(efficiency.estimated_lines_changed).toBe(190);
      expect(efficiency.cost_per_hour).toBe(0.10);
      expect(efficiency.productivity_score).toBeGreaterThan(0);
      expect(efficiency.productivity_score).toBeLessThanOrEqual(10);
      expect(efficiency.efficiency_rating).toBeDefined();
    });

    it('应该处理零时间的边界情况', () => {
      const mockRawData = [
        {
          session_id: 'session1',
          active_time_seconds: 0,
          token_usage: { total_tokens: 1000 },
          tool_usage: { Edit: 5 },
          files_modified: [],
          cost_usd: 0.05
        }
      ];

      const efficiency = engine['calculateEfficiencyMetrics'](mockRawData);

      expect(efficiency.tokens_per_hour).toBe(0);
      expect(efficiency.lines_per_hour).toBe(0);
      expect(efficiency.productivity_score).toBe(0);
      expect(efficiency.cost_per_hour).toBe(0);
      expect(efficiency.efficiency_rating).toBe('无数据');
    });

    it('应该基于工具使用正确估算代码行数', () => {
      const mockRawData = [
        {
          session_id: 'session1',
          active_time_seconds: 3600,
          token_usage: { total_tokens: 1000 },
          tool_usage: {
            Edit: 4,      // 4 * 15 = 60
            MultiEdit: 2, // 2 * 25 = 50
            Write: 1,     // 1 * 50 = 50
            Read: 10,     // 10 * 0 = 0 (不计算)
            Bash: 3,      // 3 * 5 = 15
            Task: 2       // 2 * 30 = 60
          },
          files_modified: [],
          cost_usd: 0.05
        }
      ];

      const estimatedLines = engine['estimateLinesChanged'](mockRawData);
      expect(estimatedLines).toBe(235); // 60+50+50+0+15+60
    });

    it('应该为未知工具提供默认估算', () => {
      const mockRawData = [
        {
          session_id: 'session1',
          active_time_seconds: 3600,
          token_usage: { total_tokens: 1000 },
          tool_usage: { UnknownTool: 5 }, // 5 * 10 (默认) = 50
          files_modified: [],
          cost_usd: 0.05
        }
      ];

      const estimatedLines = engine['estimateLinesChanged'](mockRawData);
      expect(estimatedLines).toBe(50);
    });
  });

  describe('生产力评分算法', () => {
    it('应该根据不同指标计算综合评分', () => {
      // 高效率场景
      const highScore = engine['calculateProductivityScore'](2000, 200, { Edit: 10, Write: 5 });
      expect(highScore).toBeGreaterThan(6);

      // 中等效率场景
      const mediumScore = engine['calculateProductivityScore'](1000, 100, { Edit: 3, Read: 5 });
      expect(mediumScore).toBeGreaterThan(2);
      expect(mediumScore).toBeLessThan(7);

      // 低效率场景
      const lowScore = engine['calculateProductivityScore'](200, 20, { Read: 2 });
      expect(lowScore).toBeLessThan(4);
    });

    it('应该根据评分给出正确的效率评级', () => {
      expect(engine['rateEfficiency'](9)).toBe('优秀');
      expect(engine['rateEfficiency'](7)).toBe('良好');
      expect(engine['rateEfficiency'](5)).toBe('一般');
      expect(engine['rateEfficiency'](2)).toBe('待改进');
    });
  });

  describe('趋势分析', () => {
    it('应该对单日数据返回无趋势信息', () => {
      const mockRawData = [
        {
          session_id: 'session1',
          timestamp: '2024-01-01T10:00:00Z',
          active_time_seconds: 3600,
          token_usage: { total_tokens: 1000 },
          tool_usage: { Edit: 5 },
          files_modified: [],
          cost_usd: 0.05
        }
      ];

      const trends = engine['analyzeTrends'](mockRawData, 'today');

      expect(trends.productivity_trend).toBe(0);
      expect(trends.token_trend).toBe(0);
      expect(trends.time_trend).toBe(0);
      expect(trends.daily_metrics).toEqual({});
      expect((trends as any).message).toContain('单日数据无法分析趋势');
    });

    it('应该计算多日数据的趋势变化', () => {
      const mockRawData = [
        {
          session_id: 'session1',
          timestamp: '2024-01-01T10:00:00Z',
          active_time_seconds: 3600,
          token_usage: { total_tokens: 1000 },
          tool_usage: { Edit: 5 },
          files_modified: [],
          cost_usd: 0.05
        },
        {
          session_id: 'session2',
          timestamp: '2024-01-02T10:00:00Z',
          active_time_seconds: 5400,
          token_usage: { total_tokens: 1500 },
          tool_usage: { Edit: 8 },
          files_modified: [],
          cost_usd: 0.075
        }
      ];

      const trends = engine['analyzeTrends'](mockRawData, 'week');

      expect(trends.productivity_trend).toBeGreaterThan(0); // 上升趋势
      expect(trends.token_trend).toBeGreaterThan(0); // token增长
      expect(trends.time_trend).toBeGreaterThan(0); // 时间增长
      expect(Object.keys(trends.daily_metrics)).toHaveLength(2);
    });

    it('应该正确计算趋势变化百分比', () => {
      expect(engine['calculateTrend'](100, 150)).toBe(0.5); // 50% 增长
      expect(engine['calculateTrend'](200, 100)).toBe(-0.5); // 50% 下降
      expect(engine['calculateTrend'](0, 100)).toBe(0); // 从0开始无法计算
    });
  });

  describe('智能洞察生成', () => {
    it('应该根据效率指标生成相应洞察', () => {
      const basicStats = {
        session_count: 3,
        total_time_hours: 2,
        total_tokens: 3000,
        total_cost_usd: 0.15,
        files_modified_count: 5,
        files_modified: ['file1.ts', 'file2.ts'],
        tool_usage: { Edit: 15, Read: 20 },
        model_usage: { 'claude-sonnet-4': 3000 }
      };

      const efficiency = {
        tokens_per_hour: 1500,
        lines_per_hour: 150,
        productivity_score: 8.5,
        cost_per_hour: 0.075,
        efficiency_rating: '优秀'
      } as EfficiencyMetrics;

      const trends = {
        productivity_trend: 0.2,
        token_trend: 0.1,
        time_trend: 0.05,
        daily_metrics: {}
      } as TrendAnalysis;

      const insights = engine['generateInsights'](basicStats, efficiency, trends);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => insight.includes('优秀') || insight.includes('效率'))).toBe(true);
      expect(insights.some(insight => insight.includes('Edit'))).toBe(true);
      expect(insights.some(insight => insight.includes('上升'))).toBe(true);
    });

    it('应该为低效率场景提供改进建议', () => {
      const basicStats = {
        session_count: 1,
        total_time_hours: 1,
        total_tokens: 200,
        total_cost_usd: 0.01,
        files_modified_count: 0,
        files_modified: [],
        tool_usage: { Read: 10 },
        model_usage: {}
      };

      const efficiency = {
        tokens_per_hour: 200,
        lines_per_hour: 0,
        productivity_score: 2.0,
        cost_per_hour: 0.01,
        efficiency_rating: '待改进'
      } as EfficiencyMetrics;

      const trends = {
        productivity_trend: -0.1,
        token_trend: -0.2,
        time_trend: 0,
        daily_metrics: {}
      } as TrendAnalysis;

      const insights = engine['generateInsights'](basicStats, efficiency, trends);

      expect(insights.some(insight => insight.includes('待改进') || insight.includes('较低'))).toBe(true);
      expect(insights.some(insight => insight.includes('下降'))).toBe(true);
    });
  });

  describe('项目报告生成', () => {
    it('应该生成完整的项目分析报告', async () => {
      const mockUsageStats = {
        project: 'test-project',
        timespan: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-01T23:59:59Z',
          duration_minutes: 120
        },
        tokens: { input: 1000, output: 500, total: 1500 },
        costs: { input: 0.015, output: 0.0075, total: 0.0225 },
        activity: {
          sessions: 2,
          messages: 25,
          tools_used: ['Edit', 'Read'],
          files_modified: 3
        },
        data_quality: {
          sources: ['cost_api'],
          completeness: 0.7,
          last_updated: '2024-01-01T12:00:00Z'
        }
      };

      mockDataManager.getUsageStats.mockResolvedValue(mockUsageStats);

      const report = await engine.generateProjectReport('/test/project', 'today');

      expect(report).toBeDefined();
      expect(report.timeframe).toBe('today');
      expect(report.project_path).toBe('/test/project');
      expect(report.basic_stats).toBeDefined();
      expect(report.efficiency).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.insights).toBeDefined();
      expect(Array.isArray(report.insights)).toBe(true);
      expect(report.generated_at).toBeDefined();
    });

    it('应该处理不同的时间范围', async () => {
      mockDataManager.getUsageStats.mockResolvedValue({} as any);

      const todayReport = await engine.generateProjectReport('/test/project', 'today');
      const weekReport = await engine.generateProjectReport('/test/project', 'week');

      expect(todayReport.timeframe).toBe('today');
      expect(weekReport.timeframe).toBe('week');
    });
  });

  describe('时间范围解析', () => {
    it('应该正确解析不同的时间范围', () => {
      const [todayStart, todayEnd] = engine['parseTimeframe']('today');
      const [weekStart, weekEnd] = engine['parseTimeframe']('week');

      expect(todayEnd.getTime() - todayStart.getTime()).toBe(24 * 60 * 60 * 1000);
      expect(weekEnd.getTime() - weekStart.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('应该处理无效的时间范围', () => {
      const [start, end] = engine['parseTimeframe']('invalid');
      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000); // 默认为今天
    });
  });

  describe('错误处理', () => {
    it('应该处理数据获取失败的情况', async () => {
      mockDataManager.getUsageStats.mockRejectedValue(new Error('Data unavailable'));

      await expect(engine.generateProjectReport('/test/project', 'today'))
        .rejects.toThrow('Data unavailable');
    });

    it('应该处理无效数据的情况', () => {
      const invalidData = [
        null,
        undefined,
        { invalid: 'data' },
        {
          session_id: 'valid',
          active_time_seconds: 3600,
          token_usage: { total_tokens: 1000 },
          tool_usage: { Edit: 5 },
          files_modified: [],
          cost_usd: 0.05
        }
      ] as any;

      expect(() => engine['calculateBasicStats'](invalidData)).not.toThrow();
      expect(() => engine['calculateEfficiencyMetrics'](invalidData)).not.toThrow();
    });
  });
});