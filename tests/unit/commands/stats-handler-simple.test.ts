/**
 * StatsHandler 简化单元测试
 * 测试核心功能和错误处理
 */

import { StatsHandler } from '@/commands/stats-handler';

// Mock 所有外部依赖
jest.mock('@/analytics', () => ({
  AnalyticsEngine: jest.fn().mockImplementation(() => ({
    generateAnalysisReport: jest.fn(),
    quickAnalysis: jest.fn(),
    analyzeToolUsage: jest.fn(),
    analyzeCost: jest.fn(),
    compareAnalysis: jest.fn(),
    checkDataAvailability: jest.fn()
  }))
}));

jest.mock('@/reports/generator', () => ({
  ReportGenerator: jest.fn().mockImplementation(() => ({
    generateReport: jest.fn()
  }))
}));

jest.mock('@/utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn()
  }))
}));

jest.mock('@/utils/config', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    loadConfig: jest.fn(),
    getConfig: jest.fn()
  }))
}));

jest.mock('@/utils/cli-helpers', () => ({
  PaginationManager: jest.fn().mockImplementation(() => ({
    displayPaginated: jest.fn()
  }))
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn()
}));

describe('StatsHandler', () => {
  let statsHandler: StatsHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    statsHandler = new StatsHandler();
  });

  describe('构造函数', () => {
    it('应该正确初始化', () => {
      expect(statsHandler).toBeDefined();
      expect(statsHandler instanceof StatsHandler).toBe(true);
    });
  });

  describe('handleStatsCommand', () => {
    it('应该处理基础统计命令', async () => {
      // Mock 分析引擎返回值
      const mockAnalysisResult = {
        timeframe: 'today',
        project_path: '/test',
        basic_stats: {
          total_time_hours: 2,
          total_time_seconds: 7200,
          total_tokens: 1500,
          total_cost: 0.15,
          total_cost_usd: 0.15,
          session_count: 3,
          files_modified_count: 5,
          files_modified: [],
          tool_usage: {},
          model_usage: {}
        },
        efficiency: {
          tokens_per_hour: 750,
          lines_per_hour: 150,
          estimated_lines_changed: 300,
          productivity_score: 7.5,
          cost_per_hour: 0.075,
          efficiency_rating: 'Good'
        },
        data_source: 'cost_api',
        generated_at: '2025-08-14T00:00:00.000Z',
        data_quality: { completeness: 1.0, reliability: 0.8, freshness: 1.0 }
      };

      const mockEngine = (statsHandler as any).analyticsEngine;
      const mockGenerator = (statsHandler as any).reportGenerator;

      mockEngine.generateAnalysisReport.mockResolvedValue(mockAnalysisResult);
      mockGenerator.generateReport.mockResolvedValue('Test report');

      const result = await statsHandler.handleStatsCommand({
        timeframe: 'today'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Test report');
    });

    it('应该处理错误情况', async () => {
      const mockEngine = (statsHandler as any).analyticsEngine;
      mockEngine.generateAnalysisReport.mockRejectedValue(new Error('Test error'));

      const result = await statsHandler.handleStatsCommand({
        timeframe: 'today'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('handleBasicStatsCommand', () => {
    it('应该处理基础统计命令', async () => {
      const mockQuickResult = {
        basic_stats: {
          total_time_hours: 1,
          total_time_seconds: 3600,
          total_tokens: 800,
          total_cost: 0.08,
          total_cost_usd: 0.08,
          session_count: 2,
          files_modified_count: 3,
          files_modified: [],
          tool_usage: {},
          model_usage: {}
        },
        efficiency: {
          tokens_per_hour: 800,
          lines_per_hour: 100,
          estimated_lines_changed: 200,
          productivity_score: 6.5,
          cost_per_hour: 0.08,
          efficiency_rating: 'Fair'
        },
        summary: 'Quick analysis summary'
      };

      const mockEngine = (statsHandler as any).analyticsEngine;
      const mockGenerator = (statsHandler as any).reportGenerator;

      mockEngine.quickAnalysis.mockResolvedValue(mockQuickResult);
      mockGenerator.generateReport.mockResolvedValue('Basic stats report');

      const result = await statsHandler.handleBasicStatsCommand({
        project: '/test'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Basic stats report');
    });
  });

  describe('handleCheckCommand', () => {
    it('应该处理数据源检查命令', async () => {
      const mockAvailability = {
        cost_api: true,
        opentelemetry: false,
        overall_status: 'good' as const,
        recommendations: ['Enable OpenTelemetry for detailed monitoring']
      };

      const mockEngine = (statsHandler as any).analyticsEngine;
      mockEngine.checkDataAvailability.mockResolvedValue(mockAvailability);

      const result = await statsHandler.handleCheckCommand({ verbose: false });

      expect(result.success).toBe(true);
      expect(result.message).toContain('数据源可用性检查');
      expect(result.message).toContain('Cost API');
    });
  });

  describe('辅助方法测试', () => {
    it('应该正确解析自定义时间范围', () => {
      const parseCustomRange = (statsHandler as any).parseCustomRange;
      
      const result1 = parseCustomRange.call(statsHandler, {
        timeframe: 'custom',
        from: '2025-08-01',
        to: '2025-08-14'
      });
      
      expect(result1).toEqual([new Date('2025-08-01'), new Date('2025-08-14')]);

      const result2 = parseCustomRange.call(statsHandler, { timeframe: 'today' });
      expect(result2).toBeUndefined();
    });

    it('应该正确构建导出文件路径', () => {
      const buildExportPath = (statsHandler as any).buildExportPath;

      const result = buildExportPath.call(statsHandler, {
        output: './test-export',
        exportFormat: 'json'
      });

      expect(result).toMatch(/test-export-.*\.json$/);
    });
  });

  describe('公共方法测试', () => {
    it('应该执行带计时的操作', async () => {
      const operation = jest.fn().mockResolvedValue('test result');
      
      const result = await statsHandler.executeWithTiming(operation, 'test operation');
      
      expect(result).toBe('test result');
      expect(operation).toHaveBeenCalled();
    });

    it('应该显示命令开始提示', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      statsHandler.showCommandStart('test', { verbose: false });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('应该显示命令完成提示', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      statsHandler.showCommandComplete('test', true);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});