/**
 * 基础统计计算引擎测试 - 适配新设计
 */

import { BasicStatsCalculator, StatsComparator } from '@/analytics/basic-stats';
import { BasicStats } from '@/types/analytics';
import { UsageData, BasicUsageStats } from '@/types/usage-data';
import { mockUsageData, mockBasicUsageStats, mockBasicStats } from '@tests/mocks/data';

describe('BasicStatsCalculator', () => {
  let calculator: BasicStatsCalculator;
  
  beforeEach(() => {
    calculator = new BasicStatsCalculator();
  });

  describe('基础统计计算', () => {
    it('应该能计算空数据的统计结果', () => {
      const stats = calculator.calculateFromUsageDataList([]);
      
      expect(stats.session_count).toBe(0);
      expect(stats.total_time_seconds).toBe(0);
      expect(stats.total_tokens).toBe(0);
      expect(stats.total_cost_usd).toBe(0);
      expect(stats.files_modified_count).toBe(0);
    });

    it('应该能正确计算单个会话的统计数据', () => {
      const usageData: UsageData = {
        timestamp: '2024-01-01T10:00:00Z',
        project: 'test-project',
        tokens: { input: 100, output: 200, total: 300 },
        costs: { input: 0.02, output: 0.03, total: 0.05 },
        session: { duration_minutes: 60, messages_count: 5 },
        source: 'cost_api'
      };

      const stats = calculator.calculateFromUsageDataList([usageData]);
      
      expect(stats.session_count).toBe(1);
      expect(stats.total_tokens).toBe(300);
      expect(stats.total_cost_usd).toBe(0.05);
    });

    it('应该能正确聚合多个会话的数据', () => {
      const usageData: UsageData[] = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          project: 'test-project',
          tokens: { input: 60, output: 40, total: 100 },
          costs: { input: 0.01, output: 0.01, total: 0.02 },
          session: { duration_minutes: 30, messages_count: 3 },
          source: 'cost_api'
        },
        {
          timestamp: '2024-01-01T14:00:00Z',
          project: 'test-project',
          tokens: { input: 90, output: 60, total: 150 },
          costs: { input: 0.015, output: 0.015, total: 0.03 },
          session: { duration_minutes: 40, messages_count: 5 },
          source: 'cost_api'
        }
      ];

      const stats = calculator.calculateFromUsageDataList(usageData);
      
      expect(stats.session_count).toBe(2);
      expect(stats.total_tokens).toBe(250);
      expect(stats.total_cost_usd).toBe(0.05);
    });

    it('应该能处理多个数据点', () => {
      const usageData = [
        mockUsageData({ 
          timestamp: '2024-01-01T10:00:00Z',
          tokens: { input: 100, output: 50, total: 150 } 
        }),
        mockUsageData({ 
          timestamp: '2024-01-01T14:00:00Z',
          tokens: { input: 200, output: 100, total: 300 } 
        })
      ];

      const stats = calculator.calculateFromUsageDataList(usageData);
      
      expect(stats.total_tokens).toBe(450);
      expect(stats.session_count).toBe(2);
    });
  });

  describe('边界情况处理', () => {
    it('应该能处理负数和无效数据', () => {
      const usageData = mockUsageData({
        tokens: { input: -50, output: -25, total: -75 },
        costs: { input: -0.01, output: -0.005, total: -0.015 }
      });

      const stats = calculator.calculateFromUsageDataList([usageData]);
      
      // 应该将负数处理为0或进行适当的错误处理
      expect(stats.total_tokens).toBeGreaterThanOrEqual(0);
      expect(stats.total_cost_usd).toBeGreaterThanOrEqual(0);
    });

    it('应该能处理极大的数值', () => {
      const usageData = mockUsageData({
        tokens: { input: 5000000, output: 5000000, total: 10000000 },
        costs: { input: 500, output: 500, total: 1000 }
      });

      const stats = calculator.calculateFromUsageDataList([usageData]);
      
      expect(stats.total_tokens).toBe(10000000);
      expect(stats.total_cost_usd).toBe(1000);
    });
  });

  describe('数据验证', () => {
    it('应该验证输入数据的格式', () => {
      const invalidData = [
        { invalid: 'data' } as any,
        mockUsageData()
      ];

      // 应该能处理无效数据而不抛出异常
      expect(() => calculator.calculateFromUsageDataList(invalidData)).not.toThrow();
    });

    it('应该能识别并跳过null或undefined数据', () => {
      const dataWithNulls = [
        null,
        mockUsageData({ timestamp: '2024-01-01T10:00:00Z' }),
        undefined,
        mockUsageData({ timestamp: '2024-01-01T14:00:00Z' })
      ] as UsageData[];

      const stats = calculator.calculateFromUsageDataList(dataWithNulls);
      
      expect(stats.session_count).toBe(2);
    });

    it('应该能处理opentelemetry数据源', () => {
      const usageData = [
        mockUsageData({ 
          timestamp: '2024-01-01T10:00:00Z',
          source: 'opentelemetry',
          tokens: { input: 100, output: 50, total: 150 } 
        })
      ];

      const stats = calculator.calculateFromUsageDataList(usageData);
      
      expect(stats.session_count).toBe(1);
      expect(stats.total_tokens).toBe(150);
    });

    it('应该能处理只包含无效数据的数组', () => {
      const invalidData = [
        null,
        undefined,
        'invalid' as any,
        123 as any
      ];

      const stats = calculator.calculateFromUsageDataList(invalidData);
      
      expect(stats.session_count).toBe(0);
      expect(stats.total_tokens).toBe(0);
    });

    it('应该触发calculateFromUsageDataList错误处理', () => {
      // Mock Math.max 来抛出异常
      const originalMax = Math.max;
      jest.spyOn(Math, 'max').mockImplementation(() => {
        throw new Error('测试异常');
      });

      const usageData = [mockUsageData()];
      const result = calculator.calculateFromUsageDataList(usageData);
      
      // 应该返回空统计而不抛出异常
      expect(result.session_count).toBe(0);
      expect(result.total_tokens).toBe(0);

      // 恢复原方法
      Math.max = originalMax;
    });
  });

  describe('calculateFromUsageStats方法', () => {
    it('应该能从BasicUsageStats计算统计数据', () => {
      const usageStats = mockBasicUsageStats({
        timespan: { 
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-01T23:59:59Z',
          duration_minutes: 120 
        },
        tokens: { input: 1000, output: 500, total: 1500 },
        costs: { input: 0.05, output: 0.03, total: 0.08 },
        activity: {
          sessions: 2,
          messages: 20,
          tools_used: ['Edit', 'Read', 'Write'],
          files_modified: 5
        }
      });

      const stats = calculator.calculateFromUsageStats(usageStats);

      expect(stats.session_count).toBe(2);
      expect(stats.total_time_hours).toBe(2);
      expect(stats.total_tokens).toBe(1500);
      expect(stats.total_cost_usd).toBe(0.08);
      expect(stats.files_modified_count).toBe(5);
    });

    it('应该处理负数和空数据', () => {
      const usageStats = mockBasicUsageStats({
        timespan: { 
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-01T23:59:59Z',
          duration_minutes: -60 
        },
        tokens: { input: -100, output: -50, total: -150 },
        costs: { input: -0.01, output: -0.01, total: -0.02 },
        activity: {
          sessions: -1,
          messages: 20,
          tools_used: [],
          files_modified: -3
        }
      });

      const stats = calculator.calculateFromUsageStats(usageStats);

      expect(stats.session_count).toBeGreaterThanOrEqual(1);
      expect(stats.total_time_hours).toBeGreaterThanOrEqual(0);
      expect(stats.total_tokens).toBeGreaterThanOrEqual(0);
      expect(stats.total_cost_usd).toBeGreaterThanOrEqual(0);
      expect(stats.files_modified_count).toBeGreaterThanOrEqual(0);
    });

    it('应该处理异常情况', () => {
      const invalidStats = {
        timespan: {},
        tokens: {},
        costs: {},
        activity: {}
      } as BasicUsageStats;
      
      expect(() => calculator.calculateFromUsageStats(invalidStats)).not.toThrow();
      const stats = calculator.calculateFromUsageStats(invalidStats);
      expect(stats.session_count).toBeGreaterThanOrEqual(1);
    });

    it('应该触发错误处理路径', () => {
      // 使用spy模拟方法抛出异常来测试错误处理
      const originalRound = calculator['roundToDecimal'];
      jest.spyOn(calculator as any, 'roundToDecimal').mockImplementation(() => {
        throw new Error('测试异常');
      });

      const usageStats = mockBasicUsageStats();
      const result = calculator.calculateFromUsageStats(usageStats);
      
      // 应该返回空统计而不抛出异常
      expect(result.session_count).toBe(0);
      expect(result.total_tokens).toBe(0);

      // 恢复原方法
      (calculator as any).roundToDecimal = originalRound;
    });
  });

  describe('mergeStats方法', () => {
    it('应该能合并多个统计结果', () => {
      const stats1 = mockBasicStats({
        session_count: 2,
        total_tokens: 1000,
        total_cost_usd: 0.05,
        files_modified: ['file1.ts', 'file2.ts'],
        tool_usage: { Edit: 10, Read: 5 }
      });
      
      const stats2 = mockBasicStats({
        session_count: 1,
        total_tokens: 500,
        total_cost_usd: 0.03,
        files_modified: ['file3.ts'],
        tool_usage: { Edit: 5, Write: 3 }
      });

      const merged = calculator.mergeStats([stats1, stats2]);

      expect(merged.session_count).toBe(3);
      expect(merged.total_tokens).toBe(1500);
      expect(merged.total_cost_usd).toBe(0.08);
      expect(merged.files_modified).toHaveLength(3);
      expect(merged.tool_usage.Edit).toBe(15);
      expect(merged.tool_usage.Read).toBe(5);
      expect(merged.tool_usage.Write).toBe(3);
    });

    it('应该处理空数组', () => {
      const merged = calculator.mergeStats([]);
      
      expect(merged.session_count).toBe(0);
      expect(merged.total_tokens).toBe(0);
      expect(merged.total_cost_usd).toBe(0);
      expect(merged.files_modified).toHaveLength(0);
    });

    it('应该处理单个统计结果', () => {
      const stats = mockBasicStats({ session_count: 5 });
      const merged = calculator.mergeStats([stats]);
      
      expect(merged.session_count).toBe(5);
    });

    it('应该处理异常情况', () => {
      const invalidStats = [null] as any;
      
      expect(() => calculator.mergeStats(invalidStats)).not.toThrow();
    });

    it('应该触发mergeStats错误处理', () => {
      // Mock Array.from 来抛出异常
      const originalFrom = Array.from;
      jest.spyOn(Array, 'from').mockImplementation(() => {
        throw new Error('测试异常');
      });

      const stats1 = mockBasicStats({ files_modified: ['file1.ts'] });
      const stats2 = mockBasicStats({ files_modified: ['file2.ts'] });
      
      const result = calculator.mergeStats([stats1, stats2]);
      
      // 应该返回空统计而不抛出异常
      expect(result.session_count).toBe(0);
      expect(result.total_tokens).toBe(0);

      // 恢复原方法
      Array.from = originalFrom;
    });
  });

  describe('validateAndCorrect方法', () => {
    it('应该验证有效的统计数据', () => {
      const validStats = mockBasicStats({
        total_time_seconds: 3600,
        total_time_hours: 1,
        total_tokens: 1000,
        total_cost_usd: 0.05,
        files_modified_count: 3,
        files_modified: ['file1.ts', 'file2.ts', 'file3.ts'],
        session_count: 2
      });

      const result = calculator.validateAndCorrect(validStats);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.corrected).toEqual(validStats);
    });

    it('应该修正负数时间', () => {
      const invalidStats = mockBasicStats({
        total_time_seconds: -3600,
        total_time_hours: -1
      });

      const result = calculator.validateAndCorrect(invalidStats);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('总时间不能为负数');
      expect(result.corrected.total_time_seconds).toBe(0);
      expect(result.corrected.total_time_hours).toBe(0);
    });

    it('应该修正负数Token', () => {
      const invalidStats = mockBasicStats({ total_tokens: -100 });

      const result = calculator.validateAndCorrect(invalidStats);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Token数量不能为负数');
      expect(result.corrected.total_tokens).toBe(0);
    });

    it('应该修正负数成本', () => {
      const invalidStats = mockBasicStats({ total_cost_usd: -0.05 });

      const result = calculator.validateAndCorrect(invalidStats);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('成本不能为负数');
      expect(result.corrected.total_cost_usd).toBe(0);
    });

    it('应该修正文件数量不一致', () => {
      const invalidStats = mockBasicStats({
        files_modified_count: 5,
        files_modified: ['file1.ts', 'file2.ts'] // 只有2个文件
      });

      const result = calculator.validateAndCorrect(invalidStats);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('文件修改数量与文件列表长度不一致');
      expect(result.corrected.files_modified_count).toBe(2);
    });

    it('应该修正零会话数量', () => {
      const invalidStats = mockBasicStats({ session_count: 0 });

      const result = calculator.validateAndCorrect(invalidStats);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('会话数量应大于0');
      expect(result.corrected.session_count).toBe(1);
    });

    it('应该修正时间单位换算不一致', () => {
      const invalidStats = mockBasicStats({
        total_time_seconds: 3600,
        total_time_hours: 2 // 应该是1小时，但设置为2小时
      });

      const result = calculator.validateAndCorrect(invalidStats);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('时间单位换算不一致');
      expect(result.corrected.total_time_hours).toBe(1);
    });
  });
});

describe('StatsComparator', () => {
  let comparator: StatsComparator;
  
  beforeEach(() => {
    comparator = new StatsComparator();
  });

  describe('compare方法', () => {
    it('应该能比较两个统计结果', () => {
      const current = mockBasicStats({
        total_time_hours: 2,
        total_tokens: 1000,
        total_cost_usd: 0.08,
        files_modified_count: 5,
        session_count: 3
      });
      
      const previous = mockBasicStats({
        total_time_hours: 1,
        total_tokens: 500,
        total_cost_usd: 0.04,
        files_modified_count: 3,
        session_count: 2
      });

      const comparison = comparator.compare(current, previous);

      expect(comparison.time_change).toBe(100); // 从1小时到2小时，增长100%
      expect(comparison.tokens_change).toBe(100); // 从500到1000，增长100%
      expect(comparison.cost_change).toBe(100); // 从0.04到0.08，增长100%
      expect(comparison.files_change).toBeCloseTo(66.67, 1); // 从3到5，增长66.67%
      expect(comparison.sessions_change).toBe(50); // 从2到3，增长50%
    });

    it('应该处理效率变化计算', () => {
      const current = mockBasicStats({
        total_time_hours: 2,
        total_tokens: 1000
      });
      
      const previous = mockBasicStats({
        total_time_hours: 1,
        total_tokens: 400
      });

      const comparison = comparator.compare(current, previous);

      // 当前效率: 1000/2 = 500 tokens/hour
      // 之前效率: 400/1 = 400 tokens/hour
      // 变化: (500-400)/400 * 100 = 25%
      expect(comparison.efficiency_change).toBe(25);
    });

    it('应该处理零值情况', () => {
      const current = mockBasicStats({
        total_time_hours: 1,
        total_tokens: 100
      });
      
      const previous = mockBasicStats({
        total_time_hours: 0,
        total_tokens: 0
      });

      const comparison = comparator.compare(current, previous);

      expect(comparison.time_change).toBe(100);
      expect(comparison.tokens_change).toBe(100);
      expect(comparison.efficiency_change).toBe(100);
    });

    it('应该处理负增长', () => {
      const current = mockBasicStats({
        total_tokens: 500,
        total_cost_usd: 0.02
      });
      
      const previous = mockBasicStats({
        total_tokens: 1000,
        total_cost_usd: 0.04
      });

      const comparison = comparator.compare(current, previous);

      expect(comparison.tokens_change).toBe(-50);
      expect(comparison.cost_change).toBe(-50);
    });
  });
});