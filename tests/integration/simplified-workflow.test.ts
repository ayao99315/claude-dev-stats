/**
 * 简化工作流程集成测试
 * 基于新设计的端到端测试：Cost API → 分析 → 报告
 */

import { SimplifiedDataManager } from '@/data-sources/simplified-manager';
import { AnalyticsEngine } from '@/analytics/engine';
import { ReportGenerator } from '@/reports/generator';
import { CommandInterface } from '@/commands/interface';
import { exec } from 'child_process';

// Mock child_process
jest.mock('child_process');
jest.mock('@/utils/config');

const mockExec = exec as jest.MockedFunction<typeof exec>;

describe('简化工作流程集成测试', () => {
  let dataManager: SimplifiedDataManager;
  let analyticsEngine: AnalyticsEngine;
  let reportGenerator: ReportGenerator;
  let commandInterface: CommandInterface;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock 配置管理器
    const { ConfigManager } = require('@/utils/config');
    ConfigManager.mockImplementation(() => ({
      getDataSourceConfig: () => ({
        cost_api: true,
        opentelemetry: false
      })
    }));

    dataManager = new SimplifiedDataManager();
    analyticsEngine = new AnalyticsEngine(dataManager);
    reportGenerator = new ReportGenerator('zh-CN');
    commandInterface = new CommandInterface(analyticsEngine, reportGenerator);
  });

  describe('端到端工作流程', () => {
    it('应该完成从 Cost API 到报告生成的完整流程', async () => {
      // 1. Mock Cost API 响应
      const mockCostApiResponse = {
        input_tokens: 2000,
        output_tokens: 1500,
        total_tokens: 3500,
        input_cost: 0.030,
        output_cost: 0.045,
        total_cost: 0.075,
        session_duration: 150,  // 2.5小时
        messages: 25
      };

      mockExec.mockImplementation((cmd, options, callback) => {
        if (cmd.includes('claude cost --json') && callback) {
          callback(null, { 
            stdout: JSON.stringify(mockCostApiResponse), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      // 2. 通过命令接口执行完整流程
      const result = await commandInterface.handleStatsCommand(['today']);

      // 3. 验证结果包含预期信息
      expect(result).toContain('📊 Claude Code 今日开发统计报告');
      expect(result).toContain('2.5 小时'); // 150分钟 = 2.5小时
      expect(result).toContain('3,500 tokens');
      expect(result).toContain('¥0.075');
      expect(result).toContain('25 个会话'); // messages_count
      
      // 4. 验证 Cost API 被调用
      expect(mockExec).toHaveBeenCalledWith(
        'claude cost --json',
        { cwd: process.cwd() },
        expect.any(Function)
      );
    }, 10000);

    it('应该处理不同的报告格式', async () => {
      const mockResponse = {
        total_tokens: 1000,
        total_cost: 0.05,
        session_duration: 60,
        messages: 10
      };

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify(mockResponse), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      // 测试简要报告
      const briefResult = await commandInterface.handleStatsCommand([]);
      expect(briefResult).toContain('📊 今日简报');
      expect(briefResult).toContain('1h');
      expect(briefResult).toContain('1000 tokens');

      // 测试详细报告
      const detailedResult = await commandInterface.handleStatsCommand(['today']);
      expect(detailedResult).toContain('📊 Claude Code 今日开发统计报告');
      expect(detailedResult).toContain('🕐 开发时间');
      expect(detailedResult).toContain('💡 今日洞察');
    });

    it('应该处理 OpenTelemetry 增强数据', async () => {
      // Mock 配置启用 OpenTelemetry
      const { ConfigManager } = require('@/utils/config');
      ConfigManager.mockImplementation(() => ({
        getDataSourceConfig: () => ({
          cost_api: true,
          opentelemetry: true
        })
      }));

      const mockCostResponse = {
        total_tokens: 2000,
        total_cost: 0.10,
        session_duration: 120,
        messages: 20
      };

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify(mockCostResponse), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      // Mock getOTelData 方法返回增强数据
      const mockGetOTelData = jest.spyOn(dataManager as any, 'getOTelData')
        .mockResolvedValue({
          timestamp: '2024-01-01T10:00:00Z',
          project: 'test-project',
          tokens: { total: 2000 },
          costs: { total: 0.10 },
          source: 'opentelemetry',
          tools_used: ['Edit', 'Read', 'Write'],
          files_modified: 5
        });

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(result).toContain('📊 Claude Code 今日开发统计报告');
      expect(mockGetOTelData).toHaveBeenCalled();
    });
  });

  describe('多语言报告生成', () => {
    it('应该生成中文报告', async () => {
      const chineseInterface = new CommandInterface(
        analyticsEngine, 
        new ReportGenerator('zh-CN')
      );

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify({ total_tokens: 1500, total_cost: 0.075 }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const result = await chineseInterface.handleStatsCommand(['today']);

      expect(result).toContain('📊 Claude Code 今日开发统计报告');
      expect(result).toContain('开发时间');
      expect(result).toContain('Token 消耗');
      expect(result).toContain('开发效率');
    });

    it('应该生成英文报告', async () => {
      const englishInterface = new CommandInterface(
        analyticsEngine, 
        new ReportGenerator('en-US')
      );

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify({ total_tokens: 1500, total_cost: 0.075 }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const result = await englishInterface.handleStatsCommand(['today']);

      expect(result).toContain('📊 Claude Code Daily Development Report');
      expect(result).toContain('Development Time');
      expect(result).toContain('Token Usage');
      expect(result).toContain('Productivity');
    });
  });

  describe('错误恢复和降级', () => {
    it('应该处理 Cost API 失败的情况', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(new Error('Claude command not found'), null as any, '');
        }
        return {} as any;
      });

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(result).toContain('执行命令时出错');
      expect(result).toContain('Claude command not found');
    });

    it('应该处理无效的 JSON 响应', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: 'invalid json response', 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(result).toContain('执行命令时出错');
    });

    it('应该处理空的 Cost API 响应', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: '{}', 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const result = await commandInterface.handleStatsCommand(['today']);

      // 应该能正常生成报告，即使数据为空
      expect(result).toContain('📊 Claude Code 今日开发统计报告');
      expect(result).toContain('0 小时');
      expect(result).toContain('0 tokens');
    });
  });

  describe('项目路径处理', () => {
    it('应该处理自定义项目路径', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        expect(options?.cwd).toBe('/custom/project/path');
        
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify({ total_tokens: 800, total_cost: 0.04 }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      await commandInterface.handleStatsCommand(['project', '/custom/project/path']);

      expect(mockExec).toHaveBeenCalledWith(
        'claude cost --json',
        { cwd: '/custom/project/path' },
        expect.any(Function)
      );
    });

    it('应该使用环境变量 CLAUDE_PROJECT_DIR', async () => {
      const originalEnv = process.env.CLAUDE_PROJECT_DIR;
      process.env.CLAUDE_PROJECT_DIR = '/env/project/path';

      try {
        mockExec.mockImplementation((cmd, options, callback) => {
          expect(options?.cwd).toBe('/env/project/path');
          
          if (callback) {
            callback(null, { 
              stdout: JSON.stringify({ total_tokens: 600 }), 
              stderr: '' 
            } as any, '');
          }
          return {} as any;
        });

        await commandInterface.handleStatsCommand(['today']);

        expect(mockExec).toHaveBeenCalledWith(
          'claude cost --json',
          { cwd: '/env/project/path' },
          expect.any(Function)
        );
      } finally {
        if (originalEnv !== undefined) {
          process.env.CLAUDE_PROJECT_DIR = originalEnv;
        } else {
          delete process.env.CLAUDE_PROJECT_DIR;
        }
      }
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成分析', async () => {
      const largeMockResponse = {
        input_tokens: 50000,
        output_tokens: 30000,
        total_tokens: 80000,
        total_cost: 4.0,
        session_duration: 600, // 10小时
        messages: 500
      };

      mockExec.mockImplementation((cmd, options, callback) => {
        // 模拟一定的延迟
        setTimeout(() => {
          if (callback) {
            callback(null, { 
              stdout: JSON.stringify(largeMockResponse), 
              stderr: '' 
            } as any, '');
          }
        }, 100);
        return {} as any;
      });

      const startTime = Date.now();
      const result = await commandInterface.handleStatsCommand(['today']);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(result).toContain('📊 Claude Code 今日开发统计报告');
      expect(result).toContain('80,000 tokens');
      expect(processingTime).toBeLessThan(2000); // 2秒内完成
    }, 5000);
  });

  describe('数据质量评估', () => {
    it('应该显示数据源信息', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify({ 
              total_tokens: 1000,
              total_cost: 0.05,
              session_duration: 60
            }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const result = await commandInterface.handleStatsCommand(['today']);

      expect(result).toContain('数据来源: cost_api');
      expect(result).toContain('生成时间:');
    });

    it('应该反映数据完整性', async () => {
      // 测试不同配置下的数据完整性显示
      const { ConfigManager } = require('@/utils/config');
      
      // 仅 Cost API
      ConfigManager.mockImplementation(() => ({
        getDataSourceConfig: () => ({
          cost_api: true,
          opentelemetry: false
        })
      }));

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify({ total_tokens: 1000 }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const result = await commandInterface.handleStatsCommand(['today']);
      
      expect(result).toContain('数据来源: cost_api');
      // 基础数据应该显示较低的完整性评分（在实际实现中）
    });
  });
});