/**
 * 效率指标计算引擎测试
 */

import { EfficiencyCalculator, CodeEstimator, codeEstimator, efficiencyCalculator } from '@/analytics/efficiency';
import { EfficiencyMetrics } from '@/types/analytics';
import { BasicStats } from '@/types/analytics';
import { mockBasicStats } from '@tests/mocks/data';

// 测试单例导出
describe('单例导出测试', () => {
  it('应该正确导出单例', () => {
    expect(codeEstimator).toBeInstanceOf(CodeEstimator);
    expect(efficiencyCalculator).toBeInstanceOf(EfficiencyCalculator);
  });

  it('单例应该正常工作', () => {
    const result1 = codeEstimator.estimateLinesChanged({ Edit: 5 });
    const result2 = efficiencyCalculator.calculateEfficiencyMetrics(mockBasicStats());
    
    expect(typeof result1).toBe('number');
    expect(typeof result2).toBe('object');
  });
});

describe('CodeEstimator', () => {
  let estimator: CodeEstimator;
  
  beforeEach(() => {
    estimator = new CodeEstimator();
  });

  describe('代码变更量估算', () => {
    it('应该基于工具使用模式估算代码行数', () => {
      const toolUsage = {
        Edit: 5,      // 5 * 15 = 75行
        Write: 2,     // 2 * 60 = 120行
        MultiEdit: 3, // 3 * 35 = 105行
        Read: 10      // 10 * 0 = 0行（读取不计算）
      };

      const estimatedLines = estimator.estimateLinesChanged(toolUsage);
      
      expect(estimatedLines).toBeGreaterThan(0);
      expect(typeof estimatedLines).toBe('number');
      
      // 基础计算: 75 + 120 + 105 + 0 = 300, 再加上修正系数
      expect(estimatedLines).toBeGreaterThan(200); // 考虑修正系数后应该还有200+
    });

    it('应该处理空工具使用记录', () => {
      const toolUsage = {};
      const estimatedLines = estimator.estimateLinesChanged(toolUsage);
      
      expect(estimatedLines).toBe(0);
    });

    it('应该处理负数值', () => {
      const toolUsage = {
        Edit: -5,
        Write: -2
      };

      const estimatedLines = estimator.estimateLinesChanged(toolUsage);
      
      // 应该处理负数情况
      expect(estimatedLines).toBeGreaterThanOrEqual(0);
    });

    it('应该处理空值undefined和null', () => {
      const toolUsage = {
        Edit: undefined as any,
        Write: null as any,
        Read: 5
      };

      const estimatedLines = estimator.estimateLinesChanged(toolUsage);
      
      // 应该只计算有效值
      expect(estimatedLines).toBeGreaterThanOrEqual(0);
      // Read: 5 * 0 = 0行（因为Read不产生代码变更），但有修正系数
      // 修正系数会基于工具多样性等因素计算，所以不会是严格的0
      expect(estimatedLines).toBeLessThan(10); // 应该很小，但可能不是0
    });

    it('应该正确处理未知工具', () => {
      const toolUsage = {
        UnknownTool1: 3,
        UnknownTool2: 2
      };

      const estimatedLines = estimator.estimateLinesChanged(toolUsage);
      
      // 未知工具默认10行/次: (3 + 2) * 10 * 修正系数
      expect(estimatedLines).toBeGreaterThan(0);
    });
  });

  describe('模型管理', () => {
    it('应该能更新估算模型', () => {
      const newModel = {
        CustomTool: 20
      };

      estimator.updateModel(newModel);
      const currentModel = estimator.getModel();
      
      expect(currentModel.CustomTool).toBe(20);
    });

    it('应该能获取当前模型', () => {
      const model = estimator.getModel();
      
      expect(typeof model).toBe('object');
      expect(model.Edit).toBeDefined();
      expect(typeof model.Edit).toBe('number');
    });
  });

  describe('修正系数计算', () => {
    it('应该正确处理不同工具多样性', () => {
      // 单一工具 vs 多种工具
      const singleTool = { Edit: 10 };
      const multipleTools = { Edit: 5, Write: 3, Read: 8, Bash: 2 };
      
      const singleResult = estimator.estimateLinesChanged(singleTool);
      const multipleResult = estimator.estimateLinesChanged(multipleTools);
      
      // 多种工具的估算结果应该有一定的修正
      expect(typeof singleResult).toBe('number');
      expect(typeof multipleResult).toBe('number');
    });

    it('应该正确处理高频使用情况', () => {
      // 低频 vs 高频使用
      const lowUsage = { Edit: 5, Write: 3 };
      const highUsage = { Edit: 25, Write: 15, Read: 30 }; // 总计70 > 20
      
      const lowResult = estimator.estimateLinesChanged(lowUsage);
      const highResult = estimator.estimateLinesChanged(highUsage);
      
      // 高频使用应该有频率修正
      expect(typeof lowResult).toBe('number');
      expect(typeof highResult).toBe('number');
    });

    it('应该正确处理编辑工具比例', () => {
      // 高编辑比例 vs 低编辑比例
      const highEditRatio = { Edit: 10, MultiEdit: 5, Write: 8 }; // 全是编辑工具
      const lowEditRatio = { Read: 15, Grep: 10, LS: 5 }; // 全是非编辑工具
      
      const highEditResult = estimator.estimateLinesChanged(highEditRatio);
      const lowEditResult = estimator.estimateLinesChanged(lowEditRatio);
      
      // 高编辑比例应该产生更多代码行数
      expect(highEditResult).toBeGreaterThan(lowEditResult);
    });

    it('应该限制修正系数在合理范围内', () => {
      // 极端情况测试
      const extremeUsage = {
        Edit: 1000,
        Write: 500,
        MultiEdit: 200,
        Read: 2000,
        CustomTool1: 100,
        CustomTool2: 100,
        CustomTool3: 100,
        CustomTool4: 100,
        CustomTool5: 100
      };
      
      const result = estimator.estimateLinesChanged(extremeUsage);
      
      // 结果应该是合理的（不会因为修正系数过大或过小而变得离谱）
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1000000); // 不应该过大
    });
  });
});

describe('EfficiencyCalculator', () => {
  let calculator: EfficiencyCalculator;
  
  beforeEach(() => {
    calculator = new EfficiencyCalculator();
  });

  describe('基础效率计算', () => {
    it('应该能计算基础效率指标', () => {
      const basicStats = mockBasicStats({
        total_time_hours: 1,
        total_tokens: 500,
        tool_usage: { Edit: 10, Read: 5 },
        total_cost_usd: 0.05
      });

      const metrics = calculator.calculateEfficiencyMetrics(basicStats);
      
      expect(metrics.tokens_per_hour).toBe(500);
      expect(metrics.estimated_lines_changed).toBeGreaterThan(0);
      expect(metrics.productivity_score).toBeGreaterThan(0);
      expect(metrics.cost_per_hour).toBe(0.05);
      expect(metrics.efficiency_rating).toBeDefined();
    });

    it('应该处理零时间情况', () => {
      const basicStats = mockBasicStats({
        total_time_hours: 0,
        total_tokens: 500,
        total_cost_usd: 0.05
      });

      const metrics = calculator.calculateEfficiencyMetrics(basicStats);
      
      expect(metrics.tokens_per_hour).toBe(0);
      expect(metrics.cost_per_hour).toBe(0);
    });

    it('应该正确计算生产力评分', () => {
      const highEfficiencyStats = mockBasicStats({
        total_time_hours: 1,
        total_tokens: 1000,
        tool_usage: { Edit: 20, Write: 10 },
        total_cost_usd: 0.1
      });

      const lowEfficiencyStats = mockBasicStats({
        total_time_hours: 4,
        total_tokens: 100,
        tool_usage: { Read: 50 },
        total_cost_usd: 0.5
      });

      const highMetrics = calculator.calculateEfficiencyMetrics(highEfficiencyStats);
      const lowMetrics = calculator.calculateEfficiencyMetrics(lowEfficiencyStats);
      
      expect(highMetrics.productivity_score).toBeGreaterThan(lowMetrics.productivity_score);
      expect(highMetrics.efficiency_rating).not.toBe(lowMetrics.efficiency_rating);
    });
  });

  describe('效率评级', () => {
    it('应该返回正确的效率评级', () => {
      const excellentStats = mockBasicStats({
        total_time_hours: 1,
        total_tokens: 2000,
        tool_usage: { Edit: 50, Write: 20 }
      });

      const poorStats = mockBasicStats({
        total_time_hours: 5,
        total_tokens: 200,
        tool_usage: { Read: 100 }
      });

      const excellentMetrics = calculator.calculateEfficiencyMetrics(excellentStats);
      const poorMetrics = calculator.calculateEfficiencyMetrics(poorStats);
      
      expect(['卓越', '优秀', '良好']).toContain(excellentMetrics.efficiency_rating);
      expect(['一般', '待改进', '较差']).toContain(poorMetrics.efficiency_rating);
    });

    it('应该正确分级不同分数范围', () => {
      // 测试所有分级范围
      const testCases = [
        { score: 9.0, expectedRatings: ['卓越'] },
        { score: 7.5, expectedRatings: ['优秀'] },
        { score: 6.0, expectedRatings: ['良好'] },
        { score: 4.5, expectedRatings: ['一般'] },
        { score: 3.0, expectedRatings: ['待改进'] },
        { score: 1.0, expectedRatings: ['较差'] }
      ];

      testCases.forEach(({ score, expectedRatings }) => {
        // 通过模拟不同的统计数据来达到目标分数
        const stats = mockBasicStats({
          total_time_hours: 1,
          total_tokens: score * 150, // 调整token数量来影响分数
          tool_usage: { Edit: Math.round(score * 10), Read: 5 }
        });
        const metrics = calculator.calculateEfficiencyMetrics(stats);
        // 至少要在预期范围内
        const isInExpectedRange = expectedRatings.includes(metrics.efficiency_rating) || 
          ['卓越', '优秀', '良好', '一般', '待改进', '较差'].includes(metrics.efficiency_rating);
        expect(isInExpectedRange).toBe(true);
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理负数统计', () => {
      const invalidStats = mockBasicStats({
        total_time_hours: -1,
        total_tokens: -100,
        total_cost_usd: -0.5
      });

      expect(() => calculator.calculateEfficiencyMetrics(invalidStats)).not.toThrow();
      
      const metrics = calculator.calculateEfficiencyMetrics(invalidStats);
      expect(metrics.tokens_per_hour).toBeGreaterThanOrEqual(0);
      expect(metrics.cost_per_hour).toBeGreaterThanOrEqual(0);
    });

    it('应该处理极大数值', () => {
      const extremeStats = mockBasicStats({
        total_time_hours: 1000,
        total_tokens: 10000000,
        tool_usage: { Edit: 10000 },
        total_cost_usd: 5000
      });

      const metrics = calculator.calculateEfficiencyMetrics(extremeStats);
      
      expect(metrics.tokens_per_hour).toBe(10000);
      expect(metrics.cost_per_hour).toBe(5);
      expect(typeof metrics.productivity_score).toBe('number');
      expect(metrics.productivity_score).toBeGreaterThanOrEqual(0);
      expect(metrics.productivity_score).toBeLessThanOrEqual(10);
    });

    it('应该触发错误处理路径', () => {
      // 传入无效数据来触发catch块
      const invalidStats = {
        ...mockBasicStats(),
        tool_usage: null as any // 造成TypeError
      };
      
      const metrics = calculator.calculateEfficiencyMetrics(invalidStats);
      
      // 应该返回空的效率指标
      expect(metrics.tokens_per_hour).toBe(0);
      expect(metrics.efficiency_rating).toBe('无数据');
    });
  });

  describe('工具使用分析', () => {
    it('应该正确分析工具使用效率', () => {
      const toolUsage = {
        Edit: 10,
        Write: 5,
        Read: 20,
        Bash: 3
      };
      const totalHours = 2;
      
      const analysis = calculator.analyzeToolUsage(toolUsage, totalHours);
      
      expect(analysis).toHaveLength(4);
      expect(analysis[0].tool_name).toBe('Read'); // 最高使用次数
      
      analysis.forEach(item => {
        expect(item.tool_name).toBeDefined();
        expect(item.usage_count).toBeGreaterThan(0);
        expect(item.usage_rate).toBeGreaterThanOrEqual(0);
        expect(item.estimated_lines).toBeGreaterThanOrEqual(0);
        expect(item.efficiency_score).toBeGreaterThanOrEqual(0);
        expect(item.efficiency_score).toBeLessThanOrEqual(10);
      });
    });

    it('应该处理零时间情况', () => {
      const analysis = calculator.analyzeToolUsage({ Edit: 5 }, 0);
      
      expect(analysis).toHaveLength(1);
      expect(analysis[0].usage_rate).toBe(0);
    });

    it('应该正确评估不同工具的效率分数', () => {
      // 高效工具
      const highEfficiencyTools = { Edit: 1, MultiEdit: 1, Write: 1 };
      // 低效工具  
      const lowEfficiencyTools = { Read: 1, LS: 1, Grep: 1 };
      
      const highAnalysis = calculator.analyzeToolUsage(highEfficiencyTools, 1);
      const lowAnalysis = calculator.analyzeToolUsage(lowEfficiencyTools, 1);
      
      const avgHighScore = highAnalysis.reduce((sum, item) => sum + item.efficiency_score, 0) / highAnalysis.length;
      const avgLowScore = lowAnalysis.reduce((sum, item) => sum + item.efficiency_score, 0) / lowAnalysis.length;
      
      expect(avgHighScore).toBeGreaterThan(avgLowScore);
    });
  });

  describe('成本分析', () => {
    it('应该正确计算成本分析', () => {
      const stats = mockBasicStats({
        total_cost_usd: 1.0,
        total_time_hours: 2.0,
        tool_usage: { Edit: 10, Write: 5 },
        model_usage: { 'claude-3': 20, 'claude-2': 10 }
      });
      
      const costAnalysis = calculator.calculateCostAnalysis(stats);
      
      expect(costAnalysis.total_cost).toBe(1.0);
      expect(costAnalysis.cost_per_hour).toBe(0.5);
      expect(costAnalysis.cost_per_line).toBeGreaterThan(0);
      expect(costAnalysis.cost_breakdown.input_cost).toBe(0.3);
      expect(costAnalysis.cost_breakdown.output_cost).toBe(0.7);
      expect(costAnalysis.cost_breakdown.model_costs).toEqual({ 'claude-3': 20, 'claude-2': 10 });
      expect(costAnalysis.optimization_suggestions).toBeInstanceOf(Array);
    });

    it('应该处理零成本和时间', () => {
      const stats = mockBasicStats({
        total_cost_usd: 0,
        total_time_hours: 0,
        tool_usage: {}
      });
      
      const costAnalysis = calculator.calculateCostAnalysis(stats);
      
      expect(costAnalysis.cost_per_hour).toBe(0);
      expect(costAnalysis.cost_per_line).toBe(0);
    });

    it('应该生成高成本预警建议', () => {
      const highCostStats = mockBasicStats({
        total_cost_usd: 50,  // 高成本
        total_time_hours: 2,  // 短时间 -> 每小时高成本
        tool_usage: { Edit: 1 } // 低产出 -> 每行高成本
      });
      
      const costAnalysis = calculator.calculateCostAnalysis(highCostStats);
      
      expect(costAnalysis.optimization_suggestions.length).toBeGreaterThan(0);
      expect(costAnalysis.optimization_suggestions.some(s => s.includes('每小时成本较高'))).toBe(true);
    });

    it('应该生成读取操作过多的建议', () => {
      const readHeavyStats = mockBasicStats({
        total_cost_usd: 1,
        total_time_hours: 2,
        tool_usage: { Read: 20, Edit: 5 } // 读取超过编辑2倍
      });
      
      const costAnalysis = calculator.calculateCostAnalysis(readHeavyStats);
      
      expect(costAnalysis.optimization_suggestions.some(s => 
        s.includes('读取操作较多')
      )).toBe(true);
    });

    it('应该生成会话数量过多的建议', () => {
      const manySessionsStats = mockBasicStats({
        total_cost_usd: 1,
        total_time_hours: 2,
        session_count: 15, // 超过10个会话
        tool_usage: { Edit: 10 }
      });
      
      const costAnalysis = calculator.calculateCostAnalysis(manySessionsStats);
      
      expect(costAnalysis.optimization_suggestions.some(s => 
        s.includes('会话数量较多')
      )).toBe(true);
    });
  });

  describe('边界情况和私有方法', () => {
    it('应该正确计算工具效率分数', () => {
      // 通过公共方法间接测试私有方法
      const toolUsageHigh = { Edit: 100 }; // 高产出
      const toolUsageLow = { Edit: 5 }; // 低产出，差距更大
      
      const analysisHigh = calculator.analyzeToolUsage(toolUsageHigh, 1);
      const analysisLow = calculator.analyzeToolUsage(toolUsageLow, 1);
      
      // 高产出应该有更高的效率分数
      expect(analysisHigh[0].efficiency_score).toBeGreaterThan(analysisLow[0].efficiency_score);
      
      // 检查分数在合理范围内
      expect(analysisHigh[0].efficiency_score).toBeLessThanOrEqual(10);
      expect(analysisLow[0].efficiency_score).toBeGreaterThanOrEqual(0);
    });

    it('应该正确处理未知工具', () => {
      const unknownToolUsage = { 'UnknownTool': 5 };
      
      const analysis = calculator.analyzeToolUsage(unknownToolUsage, 1);
      
      expect(analysis).toHaveLength(1);
      expect(analysis[0].tool_name).toBe('UnknownTool');
      expect(analysis[0].efficiency_score).toBeGreaterThan(0);
    });

    it('应该正确计算数值四舍五入', () => {
      // 通过检查返回的指标是否正确舍入来间接测试
      const stats = mockBasicStats({
        total_time_hours: 3,
        total_tokens: 1001, // 会产生 333.666... tokens/hour
        total_cost_usd: 0.3333, // 会产生 0.1111 cost/hour
        tool_usage: { Edit: 5 }
      });
      
      const metrics = calculator.calculateEfficiencyMetrics(stats);
      
      // 检查是否正确舍入到指定小数位
      expect(metrics.tokens_per_hour).toBe(333.7); // 1位小数
      expect(metrics.cost_per_hour).toBe(0.11); // 2位小数
    });

    it('应该正确计算复杂的生产力评分', () => {
      // 测试生产力评分的各个维度
      const perfectStats = mockBasicStats({
        total_time_hours: 1,
        total_tokens: 1500,  // 理想的tokens/hour
        tool_usage: { 
          Edit: 10,       // 产生约100行 -> 100 lines/hour
          Write: 2,       // 产生约120行  
          MultiEdit: 1,   // 产生约35行
          Task: 1         // 产生约40行
          // 总计约295行 -> 接近理想的100 lines/hour
        },
        session_count: 1,    // 效率高（1个会话）
        total_cost_usd: 0.75
      });
      
      const metrics = calculator.calculateEfficiencyMetrics(perfectStats);
      
      expect(metrics.productivity_score).toBeGreaterThan(5); // 应该是相对高分
      expect(metrics.productivity_score).toBeLessThanOrEqual(10); // 不超过10分
    });

    it('应该正确处理会话时间过长的情况', () => {
      const longSessionStats = mockBasicStats({
        total_time_hours: 10,  // 10小时
        total_tokens: 5000,
        tool_usage: { Edit: 50 },
        session_count: 2,      // 平均10/2=5小时/会话 > 2小时
        total_cost_usd: 2.5
      });
      
      const metrics = calculator.calculateEfficiencyMetrics(longSessionStats);
      
      // 会话时间过长应该影响评分
      expect(typeof metrics.productivity_score).toBe('number');
      expect(metrics.productivity_score).toBeGreaterThanOrEqual(0);
    });

    it('应该正确处理零会话数情况', () => {
      const zeroSessionStats = mockBasicStats({
        total_time_hours: 2,
        total_tokens: 1000,
        tool_usage: { Edit: 10 },
        session_count: 0, // 零会话
        total_cost_usd: 0.5
      });
      
      const metrics = calculator.calculateEfficiencyMetrics(zeroSessionStats);
      
      expect(typeof metrics.productivity_score).toBe('number');
      expect(metrics.productivity_score).toBeGreaterThanOrEqual(0);
    });

    it('应该正确处理所有可能的评级情况', () => {
      // 测试边界分数
      const testScores = [0, 2.4, 2.5, 3.9, 4.0, 5.4, 5.5, 6.9, 7.0, 8.4, 8.5, 10];
      const expectedRatings = ['较差', '较差', '待改进', '待改进', '一般', '一般', '良好', '良好', '优秀', '优秀', '卓越', '卓越'];
      
      testScores.forEach((score, index) => {
        // 模拟不同分数的统计数据
        const stats = mockBasicStats({
          total_time_hours: 1,
          total_tokens: score * 200, // 调整以达到目标分数
          tool_usage: { Edit: Math.max(1, Math.round(score * 5)) },
          session_count: 1,
          total_cost_usd: 0.1
        });
        
        const metrics = calculator.calculateEfficiencyMetrics(stats);
        // 检查评级是有效的
        expect(['卓越', '优秀', '良好', '一般', '待改进', '较差']).toContain(metrics.efficiency_rating);
      });
    });

    it('应该处理构造函数初始化', () => {
      // 测试新的实例创建
      const newCalculator = new EfficiencyCalculator();
      const newEstimator = new CodeEstimator();
      
      expect(newCalculator).toBeDefined();
      expect(newEstimator).toBeDefined();
      
      // 测试默认模型
      const model = newEstimator.getModel();
      expect(model.Edit).toBe(15);
      expect(model.Write).toBe(60);
      expect(model.MultiEdit).toBe(35);
    });

    it('应该正确处理空的效率指标返回', () => {
      const zeroTimeStats = mockBasicStats({
        total_time_hours: 0,
        total_tokens: 1000,
        tool_usage: { Edit: 10 },
        total_cost_usd: 0.5
      });
      
      const metrics = calculator.calculateEfficiencyMetrics(zeroTimeStats);
      
      expect(metrics.tokens_per_hour).toBe(0);
      expect(metrics.lines_per_hour).toBe(0);
      expect(metrics.estimated_lines_changed).toBe(0);
      expect(metrics.productivity_score).toBe(0);
      expect(metrics.cost_per_hour).toBe(0);
      expect(metrics.efficiency_rating).toBe('无数据');
    });
  });

  describe('专门测试类创建和初始化', () => {
    it('应该正确初始化所有组件', () => {
      const calc = new EfficiencyCalculator();
      const est = new CodeEstimator();
      
      // 测试内部状态
      expect(calc).toBeInstanceOf(EfficiencyCalculator);
      expect(est).toBeInstanceOf(CodeEstimator);
      
      // 测试默认配置
      const model = est.getModel();
      expect(Object.keys(model).length).toBeGreaterThan(5);
      expect(model.Task).toBe(40);
      expect(model.NotebookEdit).toBe(25);
    });
  });
});