/**
 * CLI命令集成测试
 * 测试真实的命令执行和系统集成
 */

import { CommandLineInterface } from '../../../src/commands/cli';
import { StatsHandler } from '../../../src/commands/stats-handler';
import { ParameterValidator } from '../../../src/commands/validator';
import { AnalyticsEngine } from '../../../src/analytics';

// Mock外部依赖
jest.mock('../../../src/analytics');
jest.mock('fs/promises');

describe('CLI Integration Tests', () => {
  let cli: CommandLineInterface;
  let mockAnalyticsEngine: jest.Mocked<AnalyticsEngine>;

  beforeEach(() => {
    // 重置所有mocks
    jest.clearAllMocks();
    
    // 设置AnalyticsEngine mock
    mockAnalyticsEngine = new AnalyticsEngine() as jest.Mocked<AnalyticsEngine>;
    
    // Mock基本方法
    mockAnalyticsEngine.quickAnalysis = jest.fn().mockResolvedValue({
      basic_stats: {
        total_time_hours: 2.5,
        total_tokens: 15000,
        total_cost: 0.25,
        session_count: 3,
        files_modified: 8,
        tool_usage: {
          'Edit': 25,
          'Read': 18,
          'Write': 5,
          'Bash': 12
        }
      },
      efficiency: {
        tokens_per_hour: 6000,
        estimated_lines_per_hour: 120,
        productivity_score: 7.5,
        efficiency_rating: 'high',
        cost_per_hour: 0.10
      },
      summary: '今日开发2.5小时，消耗15000个Token，生产力评分7.5/10分（高效）'
    });

    mockAnalyticsEngine.generateAnalysisReport = jest.fn().mockResolvedValue({
      timeframe: 'today',
      project_path: '/test/project',
      basic_stats: mockAnalyticsEngine.quickAnalysis().basic_stats,
      efficiency: mockAnalyticsEngine.quickAnalysis().efficiency,
      data_source: 'cost_api',
      generated_at: new Date().toISOString(),
      data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
    });

    mockAnalyticsEngine.checkDataAvailability = jest.fn().mockResolvedValue({
      cost_api: true,
      opentelemetry: false,
      overall_status: 'good' as const,
      recommendations: ['建议启用OpenTelemetry获取更详细的监控数据']
    });

    mockAnalyticsEngine.analyzeToolUsage = jest.fn().mockResolvedValue({
      tool_analysis: [
        {
          tool_name: 'Edit',
          usage_count: 25,
          efficiency_score: 8.2,
          avg_time_per_use: 45
        },
        {
          tool_name: 'Read',
          usage_count: 18,
          efficiency_score: 9.1,
          avg_time_per_use: 12
        }
      ],
      recommendations: ['Read工具使用效率较高，继续保持'],
      efficiency_score: 8.7
    });

    mockAnalyticsEngine.analyzeCost = jest.fn().mockResolvedValue({
      total_cost: 0.25,
      cost_per_hour: 0.10,
      cost_per_1k_tokens: 0.017,
      estimated_lines_per_dollar: 480,
      model_breakdown: {
        'claude-3-sonnet': { cost: 0.20, percentage: 80 },
        'claude-3-haiku': { cost: 0.05, percentage: 20 }
      },
      recommendations: ['当前成本控制良好，可以继续使用']
    });

    // 创建CLI实例
    cli = new CommandLineInterface();
  });

  describe('CLI命令路由测试', () => {
    it('应该正确处理stats命令', async () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      
      // Mock process.exit to prevent actual exit
      process.exit = jest.fn() as any;
      
      try {
        // 模拟命令行参数
        process.argv = ['node', 'cc-stats', 'stats', '--timeframe', 'today'];
        
        // 由于CLI会调用process.exit，我们需要capture输出
        const mockConsoleLog = jest.fn();
        console.log = mockConsoleLog;
        
        // 创建新的CLI实例并运行
        const testCli = new CommandLineInterface();
        testCli.run();
        
        // 验证没有立即退出（正常执行）
        expect(process.exit).not.toHaveBeenCalledWith(1);
        
      } finally {
        process.argv = originalArgv;
        process.exit = originalExit;
      }
    });

    it('应该正确处理invalid命令', async () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      
      // Mock process.exit
      process.exit = jest.fn() as any;
      
      try {
        process.argv = ['node', 'cc-stats', 'invalid-command'];
        
        const testCli = new CommandLineInterface();
        testCli.run();
        
        // 无效命令会显示帮助，但不会exit(1)
        
      } finally {
        process.argv = originalArgv;
        process.exit = originalExit;
      }
    });
  });

  describe('StatsHandler集成测试', () => {
    let statsHandler: StatsHandler;

    beforeEach(() => {
      statsHandler = new StatsHandler();
      
      // 注入mock的AnalyticsEngine
      (statsHandler as any).analyticsEngine = mockAnalyticsEngine;
    });

    it('应该处理基础统计命令', async () => {
      const options = {
        project: '/test/project',
        timeframe: 'today' as const,
        format: 'table' as const,
        language: 'zh-CN' as const
      };

      const result = await statsHandler.handleBasicStatsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('总时间');
      expect(result.message).toContain('2.5小时');
      expect(mockAnalyticsEngine.quickAnalysis).toHaveBeenCalledWith('/test/project');
    });

    it('应该处理效率分析命令', async () => {
      const options = {
        project: '/test/project',
        timeframe: 'today' as const,
        format: 'detailed' as const,
        language: 'zh-CN' as const
      };

      const result = await statsHandler.handleEfficiencyCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('效率分析');
      expect(result.message).toContain('7.5');
    });

    it('应该处理工具使用分析命令', async () => {
      const options = {
        project: '/test/project',
        timeframe: 'today' as const,
        format: 'table' as const,
        sortBy: 'usage' as const,
        top: 5
      };

      const result = await statsHandler.handleToolsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('工具使用');
      expect(mockAnalyticsEngine.analyzeToolUsage).toHaveBeenCalledWith('/test/project');
    });

    it('应该处理成本分析命令', async () => {
      const options = {
        project: '/test/project',
        timeframe: 'today' as const,
        format: 'table' as const,
        breakdown: 'daily' as const,
        currency: 'USD' as const,
        recommendations: true
      };

      const result = await statsHandler.handleCostCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('成本分析');
      expect(mockAnalyticsEngine.analyzeCost).toHaveBeenCalledWith('/test/project');
    });

    it('应该处理检查命令', async () => {
      const options = {
        format: 'table' as const,
        verbose: true
      };

      const result = await statsHandler.handleCheckCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('数据源可用性检查');
      expect(result.message).toContain('Cost API:');
      expect(result.message).toContain('OpenTelemetry:');
      expect(mockAnalyticsEngine.checkDataAvailability).toHaveBeenCalled();
    });

    it('应该处理错误情况', async () => {
      // 设置mock抛出错误
      mockAnalyticsEngine.quickAnalysis.mockRejectedValue(new Error('测试错误'));

      const options = {
        project: '/test/project',
        timeframe: 'today' as const
      };

      const result = await statsHandler.handleBasicStatsCommand(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('测试错误');
    });
  });

  describe('参数验证集成测试', () => {
    let validator: ParameterValidator;

    beforeEach(() => {
      validator = new ParameterValidator();
    });

    it('应该验证完整的命令选项流程', () => {
      const rawOptions = {
        project: '/valid/path',
        timeframe: 'custom',
        from: '2024-01-01',
        to: '2024-01-31',
        format: 'json',
        language: 'zh-CN',
        verbose: true,
        include: ['basic', 'efficiency']
      };

      const validatedOptions = validator.validateOptions(rawOptions, 'stats');

      expect(validatedOptions.project).toBe('/valid/path');
      expect(validatedOptions.timeframe).toBe('custom');
      expect(validatedOptions.from).toBe('2024-01-01');
      expect(validatedOptions.to).toBe('2024-01-31');
      expect(validatedOptions.format).toBe('json');
      expect(validatedOptions.language).toBe('zh-CN');
      expect(validatedOptions.verbose).toBe(true);
      expect(validatedOptions.include).toEqual(['basic', 'efficiency']);
    });

    it('应该验证工具命令特定选项', () => {
      const rawOptions = {
        sortBy: 'efficiency',
        top: '10',
        inefficient: false
      };

      expect(() => {
        validator.validateOptions(rawOptions, 'stats:tools');
      }).not.toThrow();
    });

    it('应该验证成本命令特定选项', () => {
      const rawOptions = {
        breakdown: 'hourly',
        currency: 'CNY',
        recommendations: true
      };

      expect(() => {
        validator.validateOptions(rawOptions, 'stats:cost');
      }).not.toThrow();
    });
  });

  describe('端到端集成测试', () => {
    it('应该完成完整的stats命令执行流程', async () => {
      const statsHandler = new StatsHandler();
      (statsHandler as any).analyticsEngine = mockAnalyticsEngine;

      const options = {
        project: '/test/project',
        timeframe: 'today' as const,
        format: 'table' as const,
        language: 'zh-CN' as const,
        summary: false,
        trends: false,
        insights: false,
        compare: false
      };

      const result = await statsHandler.handleStatsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(mockAnalyticsEngine.generateAnalysisReport).toHaveBeenCalled();
    });

    it('应该处理带比较的stats命令', async () => {
      // Mock比较分析
      mockAnalyticsEngine.compareAnalysis = jest.fn().mockResolvedValue({
        current: {
          timeframe: 'today',
          project_path: '/test/project',
          basic_stats: mockAnalyticsEngine.quickAnalysis().basic_stats,
          efficiency: mockAnalyticsEngine.quickAnalysis().efficiency,
          data_source: 'cost_api',
          generated_at: new Date().toISOString(),
          data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
        },
        previous: {
          timeframe: 'yesterday',
          project_path: '/test/project',
          basic_stats: mockAnalyticsEngine.quickAnalysis().basic_stats,
          efficiency: mockAnalyticsEngine.quickAnalysis().efficiency,
          data_source: 'cost_api',
          generated_at: new Date().toISOString(),
          data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
        },
        comparison: {
          time_change: 15.5,
          tokens_change: 10.2,
          cost_change: -5.8,
          productivity_change: 12.3,
          files_change: 25.0,
          insights: ['工作时间增加了15.5%', '开发效率提升了12.3%']
        }
      });

      const statsHandler = new StatsHandler();
      (statsHandler as any).analyticsEngine = mockAnalyticsEngine;

      const options = {
        project: '/test/project',
        timeframe: 'today' as const,
        format: 'table' as const,
        language: 'zh-CN' as const,
        compare: true
      };

      const result = await statsHandler.handleStatsCommand(options);

      expect(result.success).toBe(true);
      expect(mockAnalyticsEngine.compareAnalysis).toHaveBeenCalled();
    });

    it('应该处理文件输出', async () => {
      // Mock fs.writeFile
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      const mockMkdir = jest.fn().mockResolvedValue(undefined);
      
      jest.doMock('fs/promises', () => ({
        writeFile: mockWriteFile,
        mkdir: mockMkdir
      }));

      const statsHandler = new StatsHandler();
      (statsHandler as any).analyticsEngine = mockAnalyticsEngine;

      const options = {
        project: '/test/project',
        timeframe: 'today' as const,
        format: 'json' as const,
        output: '/tmp/test-report.json'
      };

      const result = await statsHandler.handleStatsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('已保存到');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成命令执行', async () => {
      const startTime = Date.now();
      
      const statsHandler = new StatsHandler();
      (statsHandler as any).analyticsEngine = mockAnalyticsEngine;

      const options = {
        project: '/test/project',
        timeframe: 'today' as const
      };

      await statsHandler.handleBasicStatsCommand(options);
      
      const executionTime = Date.now() - startTime;
      
      // 命令应该在1秒内完成（mock环境）
      expect(executionTime).toBeLessThan(1000);
    });

    it('应该处理大量数据而不崩溃', async () => {
      // 模拟大量工具使用数据
      const largeToolUsage: { [key: string]: number } = {};
      for (let i = 0; i < 1000; i++) {
        largeToolUsage[`Tool${i}`] = Math.floor(Math.random() * 100);
      }

      mockAnalyticsEngine.quickAnalysis.mockResolvedValue({
        basic_stats: {
          total_time_hours: 24,
          total_tokens: 1000000,
          total_cost: 15.50,
          session_count: 50,
          files_modified: 500,
          tool_usage: largeToolUsage
        },
        efficiency: {
          tokens_per_hour: 41666,
          estimated_lines_per_hour: 833,
          productivity_score: 9.2,
          efficiency_rating: 'excellent',
          cost_per_hour: 0.646
        },
        summary: '处理大量数据测试'
      });

      const statsHandler = new StatsHandler();
      (statsHandler as any).analyticsEngine = mockAnalyticsEngine;

      const options = {
        project: '/test/project',
        timeframe: 'month' as const
      };

      const result = await statsHandler.handleBasicStatsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('1,000,000');
    });
  });
});