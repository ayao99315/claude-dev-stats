/**
 * StatsHandler 单元测试
 * 测试统计命令处理器的所有命令处理方法
 */

import { StatsHandler } from '@/commands/stats-handler';
import { AnalyticsEngine } from '@/analytics';
import { ReportGenerator } from '@/reports/generator';
import { Logger } from '@/utils/logger';
import { ConfigManager } from '@/utils/config';
import {
  CommandOptions,
  StatsCommandOptions,
  ToolsCommandOptions,
  CostCommandOptions,
  CompareCommandOptions,
  TrendsCommandOptions,
  ExportCommandOptions
} from '@/types/commands';
import fs from 'fs/promises';

// Mock 所有依赖
jest.mock('@/analytics');
jest.mock('@/reports/generator');
jest.mock('@/utils/logger');
jest.mock('@/utils/config');
jest.mock('@/utils/cli-helpers', () => ({
  PaginationManager: jest.fn().mockImplementation(() => ({
    paginate: jest.fn(),
    display: jest.fn()
  }))
}));
jest.mock('fs/promises');
jest.mock('chalk', () => ({
  green: jest.fn((str) => `green:${str}`),
  blue: jest.fn((str) => `blue:${str}`),
  red: jest.fn((str) => `red:${str}`),
  yellow: jest.fn((str) => `yellow:${str}`),
  bold: jest.fn((str) => `bold:${str}`)
}));

const MockAnalyticsEngine = AnalyticsEngine as jest.MockedClass<typeof AnalyticsEngine>;
const MockReportGenerator = ReportGenerator as jest.MockedClass<typeof ReportGenerator>;
const MockLogger = Logger as jest.MockedClass<typeof Logger>;
const MockConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;
const mockFs = fs as jest.Mocked<typeof fs>;

// 测试数据助手函数
const createMockBasicStats = () => ({
  total_time_hours: 2,
  total_time_seconds: 7200,
  total_tokens: 1500,
  total_cost: 0.15,
  total_cost_usd: 0.15,
  session_count: 3,
  files_modified_count: 5,
  files_modified: ['file1.ts', 'file2.ts'],
  tool_usage: { Edit: 10, Read: 8 },
  model_usage: { 'claude-3-haiku': 100 }
});

const createMockEfficiencyMetrics = () => ({
  tokens_per_hour: 750,
  lines_per_hour: 150,
  estimated_lines_changed: 300,
  productivity_score: 7.5,
  cost_per_hour: 0.075,
  efficiency_rating: 'Good' as const
});

const createMockAnalysisResult = (overrides = {}) => ({
  timeframe: 'today' as const,
  project_path: '/test/project',
  basic_stats: createMockBasicStats(),
  efficiency: createMockEfficiencyMetrics(),
  data_source: 'cost_api' as const,
  generated_at: '2025-08-14T00:00:00.000Z',
  data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 },
  ...overrides
});

const createMockQuickAnalysisResult = () => ({
  basic_stats: createMockBasicStats(),
  efficiency: createMockEfficiencyMetrics(),
  summary: 'Quick analysis summary'
});

const createMockToolAnalysis = () => ({
  tool_analysis: [
    {
      tool_name: 'Edit',
      usage_count: 50,
      efficiency_score: 8.5,
      usage_rate: 0.5,
      estimated_lines: 250,
      avg_time_per_use: 5
    },
    {
      tool_name: 'Read',
      usage_count: 30,
      efficiency_score: 7.2,
      usage_rate: 0.3,
      estimated_lines: 0,
      avg_time_per_use: 3
    }
  ],
  recommendations: ['Use Edit tool more efficiently'],
  efficiency_score: 7.5
});

const createMockCostAnalysis = () => ({
  total_cost: 25.50,
  cost_per_hour: 1.28,
  cost_per_line: 0.085,
  model_costs: { 'claude-3-haiku': 15.30 },
  cost_breakdown: { input_tokens: 10.20, output_tokens: 15.30 },
  optimization_suggestions: ['Use more efficient models'],
  recommendations: ['Switch to smaller models for simple tasks']
});

describe('StatsHandler', () => {
  let statsHandler: StatsHandler;
  let mockAnalyticsEngine: jest.Mocked<AnalyticsEngine>;
  let mockReportGenerator: jest.Mocked<ReportGenerator>;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfigManager: jest.Mocked<ConfigManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockAnalyticsEngine = {
      generateAnalysisReport: jest.fn(),
      quickAnalysis: jest.fn(),
      analyzeToolUsage: jest.fn(),
      analyzeCost: jest.fn(),
      compareAnalysis: jest.fn(),
      checkDataAvailability: jest.fn()
    } as any;

    mockReportGenerator = {
      generateReport: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    } as any;

    mockConfigManager = {
      loadConfig: jest.fn(),
      getConfig: jest.fn()
    } as any;

    mockFs.mkdir = jest.fn();
    mockFs.writeFile = jest.fn();

    MockAnalyticsEngine.mockImplementation(() => mockAnalyticsEngine);
    MockReportGenerator.mockImplementation(() => mockReportGenerator);
    MockLogger.mockImplementation(() => mockLogger);
    MockConfigManager.mockImplementation(() => mockConfigManager);

    statsHandler = new StatsHandler();
  });

  describe('构造函数', () => {
    it('应该正确初始化所有依赖', () => {
      expect(MockAnalyticsEngine).toHaveBeenCalledTimes(1);
      expect(MockReportGenerator).toHaveBeenCalledTimes(1);
      expect(MockConfigManager).toHaveBeenCalledTimes(1);
      expect(MockLogger).toHaveBeenCalledWith({
        level: 'info',
        colorize: true,
        file_output: false,
        max_file_size: 10 * 1024 * 1024,
        max_files: 5
      });
    });
  });

  describe('handleStatsCommand', () => {
    it('应该处理基础统计命令', async () => {
      const options: StatsCommandOptions = {
        project: '/test/project',
        timeframe: 'today'
      };

      const mockAnalysisResult = createMockAnalysisResult();

      const mockReport = 'Generated stats report';

      mockAnalyticsEngine.generateAnalysisReport.mockResolvedValue(mockAnalysisResult);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleStatsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockReport);
      expect(mockAnalyticsEngine.generateAnalysisReport).toHaveBeenCalledWith({
        project_path: '/test/project',
        timeframe: 'today',
        custom_range: undefined,
        analysis_types: ['basic', 'efficiency']
      });
    });

    it('应该处理带比较模式的统计命令', async () => {
      const options: StatsCommandOptions = {
        project: '/test/project',
        timeframe: 'week',
        compare: true
      };

      const mockComparison = {
        current: createMockAnalysisResult({ timeframe: 'week' }),
        previous: createMockAnalysisResult({ 
          basic_stats: { ...createMockBasicStats(), total_time_hours: 8 }
        }),
        comparison: {
          time_change: 2,
          tokens_change: 500,
          cost_change: 0.05,
          productivity_change: 0.5,
          files_change: 2,
          insights: ['Productivity improved']
        }
      };

      const mockReport = 'Comparison report';

      mockAnalyticsEngine.compareAnalysis.mockResolvedValue(mockComparison);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleStatsCommand(options);

      expect(result.success).toBe(true);
      expect(mockAnalyticsEngine.compareAnalysis).toHaveBeenCalled();
    });

    it('应该处理文件输出', async () => {
      const options: StatsCommandOptions = {
        timeframe: 'today',
        output: '/test/output.txt'
      };

      const mockAnalysisResult = {
        timeframe: 'today',
        basic_stats: {},
        efficiency: {}
      };

      const mockReport = 'Test report content';

      mockAnalyticsEngine.generateAnalysisReport.mockResolvedValue(mockAnalysisResult);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleStatsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('统计报告已生成');
      expect(result.message).toContain('/test/output.txt');
      expect(mockFs.writeFile).toHaveBeenCalledWith('/test/output.txt', mockReport, 'utf-8');
    });

    it('应该处理命令执行错误', async () => {
      const options: StatsCommandOptions = { timeframe: 'today' };
      const error = new Error('Analysis failed');

      mockAnalyticsEngine.generateAnalysisReport.mockRejectedValue(error);

      const result = await statsHandler.handleStatsCommand(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Analysis failed');
      expect(mockLogger.error).toHaveBeenCalledWith('主统计命令执行失败', error);
    });
  });

  describe('handleBasicStatsCommand', () => {
    it('应该处理基础统计命令', async () => {
      const options: CommandOptions = {
        project: '/test/project',
        timeframe: 'week'
      };

      const mockQuickResult = {
        basic_stats: { total_time_hours: 5 },
        efficiency: { productivity_score: 6.8 }
      };

      const mockReport = 'Basic stats report';

      mockAnalyticsEngine.quickAnalysis.mockResolvedValue(mockQuickResult);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleBasicStatsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockReport);
      expect(mockAnalyticsEngine.quickAnalysis).toHaveBeenCalledWith('/test/project');
    });

    it('应该处理错误情况', async () => {
      const options: CommandOptions = {};
      const error = new Error('Quick analysis failed');

      mockAnalyticsEngine.quickAnalysis.mockRejectedValue(error);

      const result = await statsHandler.handleBasicStatsCommand(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quick analysis failed');
    });
  });

  describe('handleToolsCommand', () => {
    it('应该处理工具使用分析命令', async () => {
      const options: ToolsCommandOptions = {
        project: '/test/project',
        sortBy: 'usage',
        top: 5
      };

      const mockToolAnalysis = {
        tool_analysis: [
          { tool_name: 'Edit', usage_count: 50, efficiency_score: 8.5 },
          { tool_name: 'Read', usage_count: 30, efficiency_score: 7.2 },
          { tool_name: 'Write', usage_count: 20, efficiency_score: 6.8 }
        ],
        recommendations: ['Use Edit tool more efficiently'],
        efficiency_score: 7.5
      };

      const mockReport = 'Tools analysis report';

      mockAnalyticsEngine.analyzeToolUsage.mockResolvedValue(mockToolAnalysis);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleToolsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockReport);
      expect(mockAnalyticsEngine.analyzeToolUsage).toHaveBeenCalledWith('/test/project');
    });

    it('应该正确过滤低效工具', async () => {
      const options: ToolsCommandOptions = {
        inefficient: true
      };

      const mockToolAnalysis = {
        tool_analysis: [
          { tool_name: 'Tool1', usage_count: 10, efficiency_score: 3.0 },
          { tool_name: 'Tool2', usage_count: 15, efficiency_score: 7.0 },
          { tool_name: 'Tool3', usage_count: 5, efficiency_score: 4.5 }
        ],
        recommendations: [],
        efficiency_score: 5.0
      };

      mockAnalyticsEngine.analyzeToolUsage.mockResolvedValue(mockToolAnalysis);
      mockReportGenerator.generateReport.mockResolvedValue('Filtered report');

      const result = await statsHandler.handleToolsCommand(options);

      expect(result.success).toBe(true);
      // 验证过滤逻辑（间接通过 mock 调用参数）
      const reportCall = mockReportGenerator.generateReport.mock.calls[0];
      const reportData = reportCall[0];
      expect(reportData.tools).toHaveLength(2); // 只有效率分数 < 5 的工具
    });
  });

  describe('handleCostCommand', () => {
    it('应该处理成本分析命令', async () => {
      const options: CostCommandOptions = {
        project: '/test/project',
        breakdown: 'daily',
        currency: 'USD',
        recommendations: true
      };

      const mockCostAnalysis = {
        total_cost: 25.50,
        cost_per_hour: 1.28,
        model_costs: {},
        recommendations: ['Use more efficient models']
      };

      const mockReport = 'Cost analysis report';

      mockAnalyticsEngine.analyzeCost.mockResolvedValue(mockCostAnalysis);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleCostCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockReport);
      expect(mockAnalyticsEngine.analyzeCost).toHaveBeenCalledWith('/test/project');
    });
  });

  describe('handleCompareCommand', () => {
    it('应该处理比较分析命令', async () => {
      const options: CompareCommandOptions = {
        project: '/test/project',
        timeframe: 'week',
        baseline: 'previous-week',
        percentage: true
      };

      const mockComparison = {
        current: {
          timeframe: 'week',
          project_path: '/test/project',
          basic_stats: { total_time_hours: 20 },
          efficiency: { productivity_score: 8.0 },
          data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
        },
        previous: {
          basic_stats: { total_time_hours: 15 },
          efficiency: { productivity_score: 7.5 }
        },
        comparison: {
          basic_stats: { total_time_hours: { change: 5, percentage: 33.3 } }
        }
      };

      const mockReport = 'Comparison report';

      mockAnalyticsEngine.compareAnalysis.mockResolvedValue(mockComparison);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleCompareCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockReport);
      expect(mockAnalyticsEngine.compareAnalysis).toHaveBeenCalled();
    });
  });

  describe('handleTrendsCommand', () => {
    it('应该处理趋势分析命令', async () => {
      const options: TrendsCommandOptions = {
        project: '/test/project',
        type: 'productivity',
        granularity: 'daily',
        forecast: 7
      };

      const mockAnalysisResult = {
        timeframe: 'month',
        project_path: '/test/project',
        trends: {
          productivity_trend: 0.15,
          daily_metrics: {}
        }
      };

      const mockReport = 'Trends report';

      mockAnalyticsEngine.generateAnalysisReport.mockResolvedValue(mockAnalysisResult);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleTrendsCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockReport);
    });
  });

  describe('handleExportCommand', () => {
    it('应该处理JSON导出命令', async () => {
      const options: ExportCommandOptions = {
        project: '/test/project',
        type: 'all',
        exportFormat: 'json',
        output: '/test/export.json'
      };

      const mockAnalysisResult = {
        timeframe: 'month',
        basic_stats: {},
        efficiency: {},
        trends: {},
        insights: {}
      };

      mockAnalyticsEngine.generateAnalysisReport.mockResolvedValue(mockAnalysisResult);

      const result = await statsHandler.handleExportCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('数据导出完成');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/export.*\.json$/),
        JSON.stringify(mockAnalysisResult, null, 2),
        'utf-8'
      );
    });

    it('应该处理非JSON格式导出', async () => {
      const options: ExportCommandOptions = {
        exportFormat: 'csv',
        output: '/test/export.csv'
      };

      const mockAnalysisResult = { basic_stats: {} };
      const mockReport = 'CSV format report';

      mockAnalyticsEngine.generateAnalysisReport.mockResolvedValue(mockAnalysisResult);
      mockReportGenerator.generateReport.mockResolvedValue(mockReport);

      const result = await statsHandler.handleExportCommand(options);

      expect(result.success).toBe(true);
      expect(mockReportGenerator.generateReport).toHaveBeenCalled();
    });
  });

  describe('handleCheckCommand', () => {
    it('应该处理数据源检查命令', async () => {
      const options: CommandOptions = {
        verbose: true
      };

      const mockAvailability = {
        cost_api: true,
        opentelemetry: false,
        overall_status: 'good' as const,
        recommendations: ['启用 OpenTelemetry 以获得更详细的数据']
      };

      mockAnalyticsEngine.checkDataAvailability.mockResolvedValue(mockAvailability);

      const result = await statsHandler.handleCheckCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('数据源可用性检查');
      expect(result.message).toContain('Cost API');
      expect(result.message).toContain('OpenTelemetry');
      expect(result.message).toContain('总体状态');
      expect(result.message).toContain('系统信息'); // verbose 模式
    });

    it('应该处理简洁模式的检查', async () => {
      const options: CommandOptions = {
        verbose: false
      };

      const mockAvailability = {
        cost_api: true,
        opentelemetry: true,
        overall_status: 'excellent' as const,
        recommendations: []
      };

      mockAnalyticsEngine.checkDataAvailability.mockResolvedValue(mockAvailability);

      const result = await statsHandler.handleCheckCommand(options);

      expect(result.success).toBe(true);
      expect(result.message).not.toContain('系统信息'); // 非 verbose 模式
    });
  });

  describe('私有辅助方法', () => {
    it('应该正确解析自定义时间范围', () => {
      const parseCustomRange = (statsHandler as any).parseCustomRange;
      
      const options1 = {
        timeframe: 'custom',
        from: '2025-08-01',
        to: '2025-08-14'
      };
      
      const result1 = parseCustomRange.call(statsHandler, options1);
      expect(result1).toEqual([new Date('2025-08-01'), new Date('2025-08-14')]);

      const options2 = { timeframe: 'today' };
      const result2 = parseCustomRange.call(statsHandler, options2);
      expect(result2).toBeUndefined();
    });

    it('应该正确构建导出文件路径', () => {
      const buildExportPath = (statsHandler as any).buildExportPath;

      const options1: ExportCommandOptions = {
        output: './test-export',
        exportFormat: 'json'
      };

      const result1 = buildExportPath.call(statsHandler, options1);
      expect(result1).toMatch(/test-export-.*\.json$/);

      const options2: ExportCommandOptions = {
        output: './test-export.csv'
      };

      const result2 = buildExportPath.call(statsHandler, options2);
      expect(result2).toBe('./test-export.csv');
    });

    it('应该正确排序工具分析结果', () => {
      const sortToolAnalysis = (statsHandler as any).sortToolAnalysis;

      const analysis = [
        { tool_name: 'A', usage_count: 10, efficiency_score: 8.0, avg_time_per_use: 5 },
        { tool_name: 'B', usage_count: 20, efficiency_score: 6.0, avg_time_per_use: 3 },
        { tool_name: 'C', usage_count: 15, efficiency_score: 9.0, avg_time_per_use: 7 }
      ];

      const sortedByUsage = sortToolAnalysis.call(statsHandler, [...analysis], 'usage');
      expect(sortedByUsage[0].tool_name).toBe('B'); // 最高使用次数

      const sortedByEfficiency = sortToolAnalysis.call(statsHandler, [...analysis], 'efficiency');
      expect(sortedByEfficiency[0].tool_name).toBe('C'); // 最高效率分数

      const sortedByTime = sortToolAnalysis.call(statsHandler, [...analysis], 'time');
      expect(sortedByTime[0].tool_name).toBe('C'); // 最长平均时间
    });
  });

  describe('错误处理', () => {
    it('应该处理文件保存错误', async () => {
      const saveReportToFile = (statsHandler as any).saveReportToFile;
      const error = new Error('Permission denied');

      mockFs.writeFile.mockRejectedValue(error);

      await expect(
        saveReportToFile.call(statsHandler, 'test content', '/invalid/path.txt')
      ).rejects.toThrow('无法保存文件到 /invalid/path.txt');

      expect(mockLogger.error).toHaveBeenCalledWith('保存报告失败', {
        filePath: '/invalid/path.txt',
        error
      });
    });

    it('应该处理非Error类型的异常', async () => {
      const options: CommandOptions = {};
      mockAnalyticsEngine.quickAnalysis.mockRejectedValue('String error');

      const result = await statsHandler.handleBasicStatsCommand(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });
  });
});