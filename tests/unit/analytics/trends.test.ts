/**
 * 历史趋势分析引擎测试
 * 测试 TrendsAnalyzer 和 AdvancedTrendsAnalyzer 类的功能
 */

import { TrendsAnalyzer, AdvancedTrendsAnalyzer } from '@/analytics/trends';
import { BasicStats, TrendAnalysis } from '@/types/analytics';
import { mockBasicStats } from '@tests/mocks/data';

describe('TrendsAnalyzer', () => {
  let analyzer: TrendsAnalyzer;
  
  beforeEach(() => {
    analyzer = new TrendsAnalyzer();
  });

  describe('基础趋势分析', () => {
    it('应该能分析空数据', () => {
      const analysis = analyzer.analyzeTrends([], 'week');
      
      expect(analysis).toEqual({
        productivity_trend: 0,
        token_trend: 0,
        time_trend: 0,
        daily_metrics: {},
        message: 'week数据不足，无法进行趋势分析（至少需要2个数据点）'
      });
    });

    it('应该能计算单个数据点的趋势', () => {
      const stats = [mockBasicStats({ 
        total_time_hours: 4,
        total_tokens: 1000
      })];
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      
      expect(analysis.productivity_trend).toBe(0);
      expect(analysis.token_trend).toBe(0);
      expect(analysis.time_trend).toBe(0);
      expect(analysis.message).toBe('week数据不足，无法进行趋势分析（至少需要2个数据点）');
      expect(Object.keys(analysis.daily_metrics)).toHaveLength(0);
    });

    it('应该能计算多个数据点的正向趋势', () => {
      const stats = [
        mockBasicStats({ 
          total_time_hours: 3,
          total_tokens: 500  // 166.7 tokens/hour
        }),
        mockBasicStats({ 
          total_time_hours: 3,
          total_tokens: 750  // 250 tokens/hour
        }),
        mockBasicStats({ 
          total_time_hours: 3,
          total_tokens: 1000 // 333.3 tokens/hour
        })
      ];
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      
      expect(analysis.productivity_trend).toBeGreaterThan(0);
      expect(analysis.token_trend).toBeGreaterThan(0);
      expect(analysis.time_trend).toBe(0); // 时间保持恒定，趋势为0
    });

    it('应该能计算多个数据点的负向趋势', () => {
      const stats = [
        mockBasicStats({ 
          total_time_hours: 3,
          total_tokens: 1000  // 333.3 tokens/hour
        }),
        mockBasicStats({ 
          total_time_hours: 3,
          total_tokens: 750   // 250 tokens/hour
        }),
        mockBasicStats({ 
          total_time_hours: 3,
          total_tokens: 500   // 166.7 tokens/hour
        })
      ];
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      
      expect(analysis.productivity_trend).toBeLessThan(0);
      expect(analysis.token_trend).toBeLessThan(0);
      expect(analysis.time_trend).toBe(0); // 时间保持恒定，趋势为0
    });
  });

  describe('时间周期处理', () => {
    it('应该能处理不同的时间周期', () => {
      const stats = [mockBasicStats(), mockBasicStats()];
      
      const weeklyAnalysis = analyzer.analyzeTrends(stats, 'week');
      const monthlyAnalysis = analyzer.analyzeTrends(stats, 'month');
      
      expect(weeklyAnalysis).toBeDefined();
      expect(monthlyAnalysis).toBeDefined();
      expect(typeof weeklyAnalysis.productivity_trend).toBe('number');
      expect(typeof monthlyAnalysis.productivity_trend).toBe('number');
    });
  });

  describe('边界情况处理', () => {
    it('应该能处理包含无效数据的数组', () => {
      const stats = [
        null as any,
        mockBasicStats(),
        undefined as any,
        mockBasicStats()
      ];
      
      expect(() => analyzer.analyzeTrends(stats, 'week')).not.toThrow();
    });

    it('应该能处理包含负数的数据', () => {
      const stats = [
        mockBasicStats({ 
          total_time_hours: -1,
          total_tokens: -100
        }),
        mockBasicStats()
      ];
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      expect(analysis).toBeDefined();
    });
  });
});

describe('AdvancedTrendsAnalyzer', () => {
  let analyzer: AdvancedTrendsAnalyzer;
  
  beforeEach(() => {
    analyzer = new AdvancedTrendsAnalyzer();
  });

  describe('高级趋势分析', () => {
    it('应该能进行移动平均分析', () => {
      const stats = Array.from({ length: 10 }, (_, i) => 
        mockBasicStats({ 
          total_time_hours: 2 + i,
          total_tokens: 500 + i * 100
        })
      );
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      
      expect(analysis).toBeDefined();
      expect(analysis.productivity_trend).toBeDefined();
      expect(analysis.token_trend).toBeDefined();
      expect(analysis.time_trend).toBeDefined();
    });

    it('应该能检测异常值', () => {
      const stats = [
        mockBasicStats({ total_time_hours: 2, total_tokens: 500 }),
        mockBasicStats({ total_time_hours: 2.1, total_tokens: 510 }),
        mockBasicStats({ total_time_hours: 20, total_tokens: 5000 }), // 异常值
        mockBasicStats({ total_time_hours: 2.2, total_tokens: 520 })
      ];
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      
      expect(analysis).toBeDefined();
      // 高级分析器应该能识别并处理异常值
      expect(Math.abs(analysis.productivity_trend)).toBeLessThan(2); // 异常值不应该过度影响趋势
    });
  });

  describe('季节性分析', () => {
    it('应该能进行季节性检测', () => {
      const stats = Array.from({ length: 30 }, (_, i) => {
        // 模拟周期性模式
        const cyclicValue = Math.sin(i / 7 * Math.PI) + 2;
        return mockBasicStats({ 
          total_time_hours: cyclicValue,
          total_tokens: cyclicValue * 250
        });
      });
      
      const analysis = analyzer.analyzeTrends(stats, 'month');
      
      expect(analysis).toBeDefined();
      expect(typeof analysis.productivity_trend).toBe('number');
    });
  });

  describe('异常检测', () => {
    it('应该能检测数据中的异常模式', () => {
      const normalStats = Array.from({ length: 5 }, () => 
        mockBasicStats({ total_time_hours: 3, total_tokens: 600 })
      );
      
      const statsWithAnomaly = [
        ...normalStats,
        mockBasicStats({ total_time_hours: 50, total_tokens: 100 }) // 时间异常高，token异常低
      ];
      
      const normalAnalysis = analyzer.analyzeTrends(normalStats, 'week');
      const anomalyAnalysis = analyzer.analyzeTrends(statsWithAnomaly, 'week');
      
      expect(normalAnalysis).toBeDefined();
      expect(anomalyAnalysis).toBeDefined();
      
      // 异常检测应该影响趋势分析结果
      expect(normalAnalysis.productivity_trend).not.toEqual(anomalyAnalysis.productivity_trend);
    });
  });

  describe('边界情况处理', () => {
    it('应该能处理数据量不足的情况', () => {
      const stats = [mockBasicStats()];
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      
      expect(analysis).toBeDefined();
      expect(analysis.productivity_trend).toBe(0);
    });

    it('应该能处理所有数据都相同的情况', () => {
      const stats = Array.from({ length: 5 }, () => 
        mockBasicStats({ 
          total_time_hours: 3,
          total_tokens: 600
        })
      );
      
      const analysis = analyzer.analyzeTrends(stats, 'week');
      
      expect(analysis).toBeDefined();
      expect(analysis.productivity_trend).toBe(0);
      expect(analysis.token_trend).toBe(0);
      expect(analysis.time_trend).toBe(0);
    });
  });
});

describe('TrendsAnalyzer 集成测试', () => {
  it('基础分析器和高级分析器结果应该具有一致性', () => {
    const stats = Array.from({ length: 7 }, (_, i) => 
      mockBasicStats({ 
        total_time_hours: 2 + i * 0.5,
        total_tokens: 400 + i * 100
      })
    );
    
    const basicAnalyzer = new TrendsAnalyzer();
    const advancedAnalyzer = new AdvancedTrendsAnalyzer();
    
    const basicAnalysis = basicAnalyzer.analyzeTrends(stats, 'week');
    const advancedAnalysis = advancedAnalyzer.analyzeTrends(stats, 'week');
    
    // 趋势方向应该一致
    expect(Math.sign(basicAnalysis.productivity_trend))
      .toBe(Math.sign(advancedAnalysis.productivity_trend));
    expect(Math.sign(basicAnalysis.token_trend))
      .toBe(Math.sign(advancedAnalysis.token_trend));
    expect(Math.sign(basicAnalysis.time_trend))
      .toBe(Math.sign(advancedAnalysis.time_trend));
  });
});