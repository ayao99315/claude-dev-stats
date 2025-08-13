/**
 * SimplifiedDataManager 简化数据管理器测试
 * 基于新设计：Cost API（主） + OpenTelemetry（增强）
 */

import { SimplifiedDataManager } from '@/data-sources/simplified-manager';
import { UsageData, BasicUsageStats } from '@/types/usage-data';
import { ConfigManager } from '@/utils/config';
import { exec } from 'child_process';

// Mock 依赖
jest.mock('child_process');
jest.mock('@/utils/config');

const mockExec = exec as jest.MockedFunction<typeof exec>;
const MockConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;

describe('SimplifiedDataManager', () => {
  let manager: SimplifiedDataManager;
  let mockConfigManager: jest.Mocked<ConfigManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfigManager = {
      getDataSourceConfig: jest.fn().mockReturnValue({
        cost_api: true,
        opentelemetry: false
      })
    } as any;

    MockConfigManager.mockImplementation(() => mockConfigManager);
    manager = new SimplifiedDataManager();
  });

  describe('Cost API 数据获取', () => {
    it('应该能通过 claude cost 命令获取基础数据', async () => {
      const mockCostData = {
        input_tokens: 1200,
        output_tokens: 800,
        total_tokens: 2000,
        input_cost: 0.018,
        output_cost: 0.024,
        total_cost: 0.042,
        session_duration: 90,
        messages: 15
      };

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify(mockCostData), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const projectDir = '/test/project';
      const result = await manager['getCostData'](projectDir);

      expect(result).toBeDefined();
      expect(result.tokens.total).toBe(2000);
      expect(result.costs.total).toBe(0.042);
      expect(result.session?.duration_minutes).toBe(90);
      expect(result.session?.messages_count).toBe(15);
      expect(result.source).toBe('cost_api');
      expect(result.project).toBe('test-project');
    });

    it('应该处理 Cost API 执行错误', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(new Error('Command failed'), null as any, '');
        }
        return {} as any;
      });

      await expect(manager['getCostData']()).rejects.toThrow();
    });

    it('应该处理无效的 JSON 响应', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: 'invalid json', 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      await expect(manager['getCostData']()).rejects.toThrow();
    });
  });

  describe('数据合并逻辑', () => {
    it('应该能合并 Cost API 和 OpenTelemetry 数据', () => {
      const costData: UsageData = {
        timestamp: '2024-01-01T10:00:00Z',
        project: 'test-project',
        tokens: { input: 100, output: 200, total: 300 },
        costs: { input: 0.015, output: 0.030, total: 0.045 },
        session: { duration_minutes: 60, messages_count: 10 },
        source: 'cost_api'
      };

      const otelData: UsageData = {
        timestamp: '2024-01-01T10:00:00Z',
        project: 'test-project',
        tokens: { input: 100, output: 200, total: 300 },
        costs: { input: 0.015, output: 0.030, total: 0.045 },
        session: { duration_minutes: 60, messages_count: 10 },
        source: 'opentelemetry',
        tools_used: ['Edit', 'Read'],
        files_modified: 3
      };

      const result = manager['mergeDataSources'](costData, otelData);

      expect(result.project).toBe('test-project');
      expect(result.tokens.total).toBe(300);
      expect(result.costs.total).toBe(0.045);
      expect(result.timespan.duration_minutes).toBe(60);
      expect(result.activity.sessions).toBe(1);
      expect(result.activity.messages).toBe(10);
      expect(result.data_quality.sources).toContain('cost_api');
      expect(result.data_quality.completeness).toBe(0.9); // 有增强数据
    });

    it('应该能处理仅有 Cost API 数据的情况', () => {
      const costData: UsageData = {
        timestamp: '2024-01-01T10:00:00Z',
        project: 'test-project',
        tokens: { input: 100, output: 200, total: 300 },
        costs: { input: 0.015, output: 0.030, total: 0.045 },
        session: { duration_minutes: 60, messages_count: 10 },
        source: 'cost_api'
      };

      const result = manager['mergeDataSources'](costData, null);

      expect(result.project).toBe('test-project');
      expect(result.data_quality.sources).toEqual(['cost_api']);
      expect(result.data_quality.completeness).toBe(0.7); // 仅基础数据
      expect(result.activity.tools_used).toEqual([]);
      expect(result.activity.files_modified).toBe(0);
    });
  });

  describe('统计数据获取', () => {
    it('应该能获取完整的使用统计数据', async () => {
      const mockCostData = {
        input_tokens: 1000,
        output_tokens: 500,
        total_tokens: 1500,
        total_cost: 0.075,
        session_duration: 120,
        messages: 20
      };

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify(mockCostData), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const stats = await manager.getUsageStats('/test/project');

      expect(stats).toBeDefined();
      expect(stats.project).toBe('test-project');
      expect(stats.tokens.total).toBe(1500);
      expect(stats.costs.total).toBe(0.075);
      expect(stats.timespan.duration_minutes).toBe(120);
      expect(stats.activity.sessions).toBe(1);
      expect(stats.activity.messages).toBe(20);
      expect(stats.data_quality.sources).toContain('cost_api');
    });

    it('应该在启用时尝试获取 OpenTelemetry 数据', async () => {
      mockConfigManager.getDataSourceConfig.mockReturnValue({
        cost_api: true,
        opentelemetry: true
      });

      // Mock Cost API 成功
      mockExec.mockImplementationOnce((cmd, options, callback) => {
        if (callback && cmd.includes('claude cost')) {
          callback(null, { 
            stdout: JSON.stringify({ total_tokens: 1000, total_cost: 0.05 }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      // Mock getOTelData 方法
      const mockGetOTelData = jest.spyOn(manager as any, 'getOTelData')
        .mockResolvedValue({
          timestamp: '2024-01-01T10:00:00Z',
          project: 'test-project',
          tokens: { total: 1000 },
          costs: { total: 0.05 },
          source: 'opentelemetry',
          tools_used: ['Edit'],
          files_modified: 2
        });

      const stats = await manager.getUsageStats('/test/project');

      expect(mockGetOTelData).toHaveBeenCalledWith('/test/project');
      expect(stats.data_quality.completeness).toBe(0.9); // 增强数据可用
    });

    it('应该处理数据获取失败的情况', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(new Error('Cost API unavailable'), null as any, '');
        }
        return {} as any;
      });

      await expect(manager.getUsageStats()).rejects.toThrow('无法获取使用数据');
    });
  });

  describe('项目名称解析', () => {
    it('应该从项目路径中提取项目名称', () => {
      const projectName = manager['getProjectName']('/Users/test/my-awesome-project');
      expect(projectName).toBe('my-awesome-project');
    });

    it('应该处理根目录路径', () => {
      const projectName = manager['getProjectName']('/');
      expect(projectName).toBe('root');
    });

    it('应该处理空路径', () => {
      const projectName = manager['getProjectName']('');
      expect(projectName).toBe('unknown');
    });

    it('应该处理当前目录', () => {
      const originalCwd = process.cwd();
      const mockCwd = '/Users/test/current-project';
      
      jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
      
      const projectName = manager['getProjectName']();
      expect(projectName).toBe('current-project');
      
      // 恢复原始值
      jest.spyOn(process, 'cwd').mockReturnValue(originalCwd);
    });
  });

  describe('配置驱动的数据源选择', () => {
    it('应该根据配置选择数据源', async () => {
      // 测试仅启用 Cost API
      mockConfigManager.getDataSourceConfig.mockReturnValueOnce({
        cost_api: true,
        opentelemetry: false
      });

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify({ total_tokens: 500 }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const spyGetOTelData = jest.spyOn(manager as any, 'getOTelData');
      
      await manager.getUsageStats();
      
      expect(spyGetOTelData).not.toHaveBeenCalled();
    });

    it('应该在 OpenTelemetry 启用时调用相应方法', async () => {
      mockConfigManager.getDataSourceConfig.mockReturnValueOnce({
        cost_api: true,
        opentelemetry: true
      });

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify({ total_tokens: 500 }), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const spyGetOTelData = jest.spyOn(manager as any, 'getOTelData')
        .mockResolvedValue(null);
      
      await manager.getUsageStats();
      
      expect(spyGetOTelData).toHaveBeenCalled();
    });
  });

  describe('边界条件处理', () => {
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

      const result = await manager['getCostData']();

      expect(result.tokens.input).toBe(0);
      expect(result.tokens.output).toBe(0);
      expect(result.tokens.total).toBe(0);
      expect(result.costs.total).toBe(0);
    });

    it('应该处理部分数据缺失的情况', async () => {
      const partialData = {
        total_tokens: 1000,
        // 缺失成本和会话信息
      };

      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) {
          callback(null, { 
            stdout: JSON.stringify(partialData), 
            stderr: '' 
          } as any, '');
        }
        return {} as any;
      });

      const result = await manager['getCostData']();

      expect(result.tokens.total).toBe(1000);
      expect(result.costs.total).toBe(0); // 默认值
      expect(result.session?.duration_minutes).toBe(0); // 默认值
    });
  });
});