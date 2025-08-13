/**
 * CommandInterface Slash Commands 接口测试
 * 基于新设计的命令行接口测试
 */

import { CommandInterface } from '@/commands/interface';
import { AnalyticsEngine } from '@/analytics/engine';
import { ReportGenerator } from '@/reports/generator';

// Mock 依赖
jest.mock('@/analytics/engine');
jest.mock('@/reports/generator');

const MockAnalyticsEngine = AnalyticsEngine as jest.MockedClass<typeof AnalyticsEngine>;
const MockReportGenerator = ReportGenerator as jest.MockedClass<typeof ReportGenerator>;

describe('CommandInterface', () => {
  let commandInterface: CommandInterface;
  let mockAnalyticsEngine: jest.Mocked<AnalyticsEngine>;
  let mockReportGenerator: jest.Mocked<ReportGenerator>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAnalyticsEngine = {
      generateProjectReport: jest.fn()
    } as any;

    mockReportGenerator = {
      generateReport: jest.fn()
    } as any;

    MockAnalyticsEngine.mockImplementation(() => mockAnalyticsEngine);
    MockReportGenerator.mockImplementation(() => mockReportGenerator);

    commandInterface = new CommandInterface(mockAnalyticsEngine, mockReportGenerator);
  });

  describe('stats 命令处理', () => {
    it('应该处理今日统计命令', async () => {
      const mockReport = {
        basic_stats: { total_time_hours: 2, total_tokens: 1500 },
        efficiency: { productivity_score: 7.5 },
        insights: ['今天效率不错']
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('模拟的今日报告');

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(mockAnalyticsEngine.generateProjectReport).toHaveBeenCalledWith(
        process.cwd(), 
        'today'
      );
      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'today', 
        'table'
      );
      expect(result).toBe('模拟的今日报告');
    });

    it('应该处理本周统计命令', async () => {
      const mockReport = {
        basic_stats: { total_time_hours: 15, total_tokens: 12000 },
        efficiency: { productivity_score: 8.0 },
        trends: { productivity_trend: 0.1 }
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('模拟的本周报告');

      const result = await commandInterface.handleStatsCommand(['week']);

      expect(mockAnalyticsEngine.generateProjectReport).toHaveBeenCalledWith(
        process.cwd(), 
        'week'
      );
      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'week', 
        'table'
      );
      expect(result).toBe('模拟的本周报告');
    });

    it('应该处理项目统计命令', async () => {
      const mockReport = {
        basic_stats: { total_time_hours: 5, total_tokens: 4000 },
        efficiency: { productivity_score: 6.8 }
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('模拟的项目报告');

      const result = await commandInterface.handleStatsCommand(['project', '/custom/project']);

      expect(mockAnalyticsEngine.generateProjectReport).toHaveBeenCalledWith(
        '/custom/project', 
        'today'
      );
      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'project', 
        'detailed'
      );
      expect(result).toBe('模拟的项目报告');
    });

    it('应该处理项目统计命令（无项目路径）', async () => {
      const mockReport = {
        basic_stats: { total_time_hours: 3, total_tokens: 2500 }
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('当前项目报告');

      const result = await commandInterface.handleStatsCommand(['project']);

      expect(mockAnalyticsEngine.generateProjectReport).toHaveBeenCalledWith(
        process.cwd(), 
        'today'
      );
    });

    it('应该处理效率分析命令', async () => {
      const mockReport = {
        efficiency: {
          productivity_score: 7.2,
          tokens_per_hour: 1200,
          lines_per_hour: 150,
          cost_per_hour: 0.06
        },
        insights: ['效率分析结果']
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('效率分析报告');

      const result = await commandInterface.handleStatsCommand(['efficiency']);

      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'efficiency', 
        'insights'
      );
      expect(result).toBe('效率分析报告');
    });

    it('应该处理趋势分析命令', async () => {
      const mockReport = {
        trends: {
          productivity_trend: 0.15,
          token_trend: 0.08,
          daily_metrics: {}
        }
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('趋势分析图表');

      const result = await commandInterface.handleStatsCommand(['trends']);

      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'trends', 
        'chart'
      );
      expect(result).toBe('趋势分析图表');
    });

    it('应该处理工具使用统计命令', async () => {
      const mockReport = {
        basic_stats: {
          tool_usage: {
            Edit: 50,
            Read: 30,
            Write: 20
          }
        }
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('工具使用饼图');

      const result = await commandInterface.handleStatsCommand(['tools']);

      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'tools', 
        'pie'
      );
      expect(result).toBe('工具使用饼图');
    });

    it('应该处理成本分析命令', async () => {
      const mockReport = {
        basic_stats: {
          total_cost_usd: 5.25,
          total_time_hours: 20
        },
        efficiency: {
          cost_per_hour: 0.26
        }
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('成本分析报告');

      const result = await commandInterface.handleStatsCommand(['cost']);

      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'cost', 
        'financial'
      );
      expect(result).toBe('成本分析报告');
    });

    it('应该处理配置信息命令', async () => {
      const result = await commandInterface.handleStatsCommand(['config']);

      expect(result).toContain('配置信息显示功能开发中');
      expect(mockAnalyticsEngine.generateProjectReport).not.toHaveBeenCalled();
    });
  });

  describe('帮助和默认命令', () => {
    it('应该显示帮助信息', async () => {
      const helpCommands = ['help', '-h', '--help'];

      for (const helpCmd of helpCommands) {
        const result = await commandInterface.handleStatsCommand([helpCmd]);
        
        expect(result).toContain('Claude Code 开发统计查询工具');
        expect(result).toContain('用法:');
        expect(result).toContain('/stats today');
        expect(result).toContain('/stats week');
        expect(result).toContain('/stats project');
        expect(result).toContain('/stats efficiency');
        expect(result).toContain('/stats trends');
        expect(result).toContain('/stats tools');
        expect(result).toContain('/stats cost');
        expect(result).toContain('/stats config');
      }
    });

    it('应该处理无参数命令（默认简要统计）', async () => {
      const mockReport = {
        basic_stats: { total_time_hours: 1.5, total_tokens: 800 },
        efficiency: { productivity_score: 6.0 }
      };

      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('简要统计');

      const result = await commandInterface.handleStatsCommand([]);

      expect(mockAnalyticsEngine.generateProjectReport).toHaveBeenCalledWith(
        process.cwd(), 
        'today'
      );
      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 
        'today', 
        'brief'
      );
      expect(result).toBe('简要统计');
    });

    it('应该处理未知命令', async () => {
      const result = await commandInterface.handleStatsCommand(['unknown']);

      expect(result).toContain('未知命令: unknown');
      expect(result).toContain('使用 \'/stats help\' 查看帮助信息');
      expect(mockAnalyticsEngine.generateProjectReport).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理分析引擎错误', async () => {
      const error = new Error('分析引擎失败');
      mockAnalyticsEngine.generateProjectReport.mockRejectedValue(error);

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(result).toContain('执行命令时出错: 分析引擎失败');
    });

    it('应该处理报告生成错误', async () => {
      const mockReport = { basic_stats: {} };
      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockImplementation(() => {
        throw new Error('报告生成失败');
      });

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(result).toContain('执行命令时出错: 报告生成失败');
    });

    it('应该处理非Error类型的异常', async () => {
      mockAnalyticsEngine.generateProjectReport.mockRejectedValue('字符串错误');

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(result).toContain('执行命令时出错: 字符串错误');
    });
  });

  describe('环境变量处理', () => {
    it('应该使用 CLAUDE_PROJECT_DIR 环境变量', async () => {
      const originalEnv = process.env.CLAUDE_PROJECT_DIR;
      process.env.CLAUDE_PROJECT_DIR = '/custom/project/dir';

      try {
        const mockReport = { basic_stats: {} };
        mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
        mockReportGenerator.generateReport.mockReturnValue('报告');

        await commandInterface.handleStatsCommand(['today']);

        expect(mockAnalyticsEngine.generateProjectReport).toHaveBeenCalledWith(
          '/custom/project/dir', 
          'today'
        );
      } finally {
        // 恢复原始环境变量
        if (originalEnv !== undefined) {
          process.env.CLAUDE_PROJECT_DIR = originalEnv;
        } else {
          delete process.env.CLAUDE_PROJECT_DIR;
        }
      }
    });

    it('应该在没有环境变量时使用当前目录', async () => {
      const originalEnv = process.env.CLAUDE_PROJECT_DIR;
      delete process.env.CLAUDE_PROJECT_DIR;

      try {
        const mockReport = { basic_stats: {} };
        mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
        mockReportGenerator.generateReport.mockReturnValue('报告');

        await commandInterface.handleStatsCommand(['week']);

        expect(mockAnalyticsEngine.generateProjectReport).toHaveBeenCalledWith(
          process.cwd(), 
          'week'
        );
      } finally {
        // 恢复原始环境变量
        if (originalEnv !== undefined) {
          process.env.CLAUDE_PROJECT_DIR = originalEnv;
        }
      }
    });
  });

  describe('命令参数验证', () => {
    it('应该正确传递命令参数', async () => {
      const mockReport = { basic_stats: {} };
      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('报告');

      // 测试各种命令的参数传递
      await commandInterface.handleStatsCommand(['today']);
      expect(mockReportGenerator.generateReport).toHaveBeenLastCalledWith(
        mockReport, 'today', 'table'
      );

      await commandInterface.handleStatsCommand(['efficiency']);
      expect(mockReportGenerator.generateReport).toHaveBeenLastCalledWith(
        mockReport, 'efficiency', 'insights'
      );

      await commandInterface.handleStatsCommand(['trends']);
      expect(mockReportGenerator.generateReport).toHaveBeenLastCalledWith(
        mockReport, 'trends', 'chart'
      );

      await commandInterface.handleStatsCommand(['tools']);
      expect(mockReportGenerator.generateReport).toHaveBeenLastCalledWith(
        mockReport, 'tools', 'pie'
      );

      await commandInterface.handleStatsCommand(['cost']);
      expect(mockReportGenerator.generateReport).toHaveBeenLastCalledWith(
        mockReport, 'cost', 'financial'
      );
    });

    it('应该处理空数组参数', async () => {
      const mockReport = { basic_stats: {} };
      mockAnalyticsEngine.generateProjectReport.mockResolvedValue(mockReport);
      mockReportGenerator.generateReport.mockReturnValue('简要报告');

      const result = await commandInterface.handleStatsCommand([]);

      expect(result).toBe('简要报告');
      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith(
        mockReport, 'today', 'brief'
      );
    });
  });
});