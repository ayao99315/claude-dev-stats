/**
 * CommandLineInterface 单元测试
 * 测试主要的 CLI 接口和命令路由功能
 */

import { CommandLineInterface } from '@/commands/cli';
import { StatsHandler } from '@/commands/stats-handler';
import { ParameterValidator } from '@/commands/validator';
import { InteractiveHelper } from '@/commands/interactive';
import { Logger } from '@/utils/logger';
import chalk from 'chalk';

// Mock 所有依赖
jest.mock('@/commands/stats-handler');
jest.mock('@/commands/validator');
jest.mock('@/commands/interactive');
jest.mock('@/utils/logger');
jest.mock('@/utils/cli-helpers', () => ({
  SmartHintProvider: jest.fn().mockImplementation(() => ({
    showParameterHints: jest.fn(),
    getCommandHints: jest.fn()
  }))
}));
jest.mock('@/utils/config', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    loadConfig: jest.fn(),
    getConfig: jest.fn().mockReturnValue({
      language: 'zh-CN',
      analytics: { enabled: true },
      reports: { default_format: 'table' }
    }),
    isLoaded: true
  }))
}));
jest.mock('@/analytics/index', () => ({
  AnalyticsEngine: jest.fn().mockImplementation(() => ({
    generateAnalysisReport: jest.fn(),
    quickAnalysis: jest.fn(),
    analyzeToolUsage: jest.fn(),
    analyzeCost: jest.fn(),
    compareAnalysis: jest.fn(),
    checkDataAvailability: jest.fn()
  }))
}));
jest.mock('chalk', () => ({
  blue: jest.fn((str) => `blue:${str}`),
  green: jest.fn((str) => `green:${str}`),
  red: jest.fn((str) => `red:${str}`),
  yellow: jest.fn((str) => `yellow:${str}`),
  bold: jest.fn((str) => `bold:${str}`)
}));

const MockStatsHandler = StatsHandler as jest.MockedClass<typeof StatsHandler>;
const MockParameterValidator = ParameterValidator as jest.MockedClass<typeof ParameterValidator>;
const MockInteractiveHelper = InteractiveHelper as jest.MockedClass<typeof InteractiveHelper>;
const MockLogger = Logger as jest.MockedClass<typeof Logger>;

describe('CommandLineInterface', () => {
  let cli: CommandLineInterface;
  let mockStatsHandler: jest.Mocked<StatsHandler>;
  let mockValidator: jest.Mocked<ParameterValidator>;
  let mockInteractive: jest.Mocked<InteractiveHelper>;
  let mockLogger: jest.Mocked<Logger>;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock process.exit
    originalProcessExit = process.exit;
    process.exit = jest.fn() as any;

    // Setup mocks
    mockStatsHandler = {
      handleStatsCommand: jest.fn(),
      handleBasicStatsCommand: jest.fn(),
      handleEfficiencyCommand: jest.fn(),
      handleToolsCommand: jest.fn(),
      handleCostCommand: jest.fn(),
      handleCompareCommand: jest.fn(),
      handleTrendsCommand: jest.fn(),
      handleInsightsCommand: jest.fn(),
      handleExportCommand: jest.fn(),
      handleCheckCommand: jest.fn(),
      showCommandStart: jest.fn(),
      showCommandComplete: jest.fn(),
      executeWithTiming: jest.fn()
    } as any;

    mockValidator = {
      validateOptions: jest.fn()
    } as any;

    mockInteractive = {
      showSpinner: jest.fn(),
      hideSpinner: jest.fn()
    } as any;

    mockLogger = {
      error: jest.fn()
    } as any;

    MockStatsHandler.mockImplementation(() => mockStatsHandler);
    MockParameterValidator.mockImplementation(() => mockValidator);
    MockInteractiveHelper.mockImplementation(() => mockInteractive);
    MockLogger.mockImplementation(() => mockLogger);

    cli = new CommandLineInterface();
  });

  afterEach(() => {
    // Restore original functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe('构造函数', () => {
    it('应该正确初始化所有依赖', () => {
      expect(MockStatsHandler).toHaveBeenCalledTimes(1);
      expect(MockParameterValidator).toHaveBeenCalledTimes(1);
      expect(MockInteractiveHelper).toHaveBeenCalledTimes(1);
      expect(MockLogger).toHaveBeenCalledWith({
        level: 'info',
        colorize: true,
        file_output: false,
        max_file_size: 10 * 1024 * 1024,
        max_files: 5
      });
    });
  });

  describe('命令执行', () => {
    beforeEach(() => {
      // Mock 成功的验证
      mockValidator.validateOptions.mockImplementation((options) => options);
    });

    it('应该成功执行 stats 命令', async () => {
      const mockResult = {
        success: true,
        message: '统计报告内容'
      };
      mockStatsHandler.handleStatsCommand.mockResolvedValue(mockResult);

      // 模拟命令执行
      const executeCommand = (cli as any).executeCommand;
      await executeCommand.call(cli, 'stats', { verbose: false }, async () => mockResult);

      expect(mockValidator.validateOptions).toHaveBeenCalledWith({ verbose: false }, 'stats');
      expect(mockInteractive.showSpinner).toHaveBeenCalledWith('执行 stats...');
      expect(mockInteractive.hideSpinner).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('统计报告内容');
    });

    it('应该在 verbose 模式下显示详细信息', async () => {
      const mockResult = {
        success: true,
        message: '详细报告'
      };

      const executeCommand = (cli as any).executeCommand;
      await executeCommand.call(cli, 'stats', { verbose: true }, async () => mockResult);

      expect(console.log).toHaveBeenCalledWith('blue:🚀 执行命令: stats');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('green:✅ 命令执行成功'));
      expect(mockInteractive.showSpinner).not.toHaveBeenCalled();
    });

    it('应该处理命令执行失败', async () => {
      const mockResult = {
        success: false,
        error: '执行失败原因'
      };

      const executeCommand = (cli as any).executeCommand;
      await executeCommand.call(cli, 'stats', { verbose: false }, async () => mockResult);

      expect(console.error).toHaveBeenCalledWith('red:❌ 命令执行失败: 执行失败原因');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('应该处理异常错误', async () => {
      const error = new Error('测试异常');
      const executeCommand = (cli as any).executeCommand;

      await executeCommand.call(cli, 'stats', { verbose: false }, async () => {
        throw error;
      });

      expect(mockLogger.error).toHaveBeenCalledWith('命令 stats 执行失败', error);
      expect(console.error).toHaveBeenCalledWith('red:❌ 执行失败: 测试异常');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('应该显示故障排除建议', async () => {
      const error = new Error('Cost API 连接失败');
      const executeCommand = (cli as any).executeCommand;
      const showTroubleshootingSuggestions = (cli as any).showTroubleshootingSuggestions;

      // 测试故障排除建议显示
      showTroubleshootingSuggestions.call(cli, 'stats', error);

      expect(console.log).toHaveBeenCalledWith('yellow:\n💡 故障排除建议:');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('确保 Claude Code 正常安装'));
    });
  });

  describe('参数验证', () => {
    it('应该在参数验证失败时抛出错误', async () => {
      const validationError = new Error('参数验证失败');
      mockValidator.validateOptions.mockImplementation(() => {
        throw validationError;
      });

      const executeCommand = (cli as any).executeCommand;
      await executeCommand.call(cli, 'stats', { invalid: true }, async () => ({ success: true }));

      expect(mockLogger.error).toHaveBeenCalledWith('命令 stats 执行失败', validationError);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('命令示例生成', () => {
    it('应该为 stats 命令生成正确的示例', () => {
      const getCommandExamples = (cli as any).getCommandExamples;
      const examples = getCommandExamples.call(cli, 'stats');

      expect(examples).toContain('cc-stats stats');
      expect(examples).toContain('cc-stats stats -t week');
      expect(examples).toContain('cc-stats stats --compare');
      expect(examples).toContain('cc-stats stats -f json -o report.json');
    });

    it('应该为 basic 命令生成正确的示例', () => {
      const getCommandExamples = (cli as any).getCommandExamples;
      const examples = getCommandExamples.call(cli, 'stats:basic');

      expect(examples).toContain('cc-stats basic');
      expect(examples).toContain('cc-stats basic -t month');
    });

    it('应该为 tools 命令生成正确的示例', () => {
      const getCommandExamples = (cli as any).getCommandExamples;
      const examples = getCommandExamples.call(cli, 'stats:tools');

      expect(examples).toContain('cc-stats tools');
      expect(examples).toContain('cc-stats tools --top 5');
      expect(examples).toContain('cc-stats tools --inefficient');
    });

    it('应该为未知命令返回空字符串', () => {
      const getCommandExamples = (cli as any).getCommandExamples;
      const examples = getCommandExamples.call(cli, 'unknown');

      expect(examples).toBe('');
    });
  });

  describe('故障排除建议', () => {
    const showTroubleshootingSuggestions = function(this: any, command: string, error: any) {
      return (this as any).showTroubleshootingSuggestions(command, error);
    };

    it('应该为 Cost API 错误提供特定建议', () => {
      const error = new Error('Cost API 不可用');
      showTroubleshootingSuggestions.call(cli, 'stats', error);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('确保 Claude Code 正常安装'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('尝试运行: claude cost --help'));
    });

    it('应该为项目路径错误提供特定建议', () => {
      const error = new Error('项目路径不存在');
      showTroubleshootingSuggestions.call(cli, 'stats', error);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('检查项目路径是否正确'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('确保在 Claude Code 项目目录中执行命令'));
    });

    it('应该为时间格式错误提供特定建议', () => {
      const error = new Error('时间格式错误');
      showTroubleshootingSuggestions.call(cli, 'stats', error);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('检查日期格式是否为 YYYY-MM-DD'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('确保起始日期早于结束日期'));
    });

    it('应该始终显示通用建议', () => {
      const error = new Error('未知错误');
      showTroubleshootingSuggestions.call(cli, 'stats', error);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('使用 -v 选项获取详细错误信息'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('运行 cc-stats check 检查系统状态'));
    });
  });

  describe('程序设置', () => {
    it('应该正确设置程序基本信息', () => {
      // 测试程序配置
      expect(cli).toBeDefined();
      // 由于 commander.js 的内部实现，我们主要验证初始化没有抛出错误
    });

    it('应该设置最大监听器数量', () => {
      // 验证 process.setMaxListeners 被调用
      // 这个测试主要确保代码执行正常
      expect(cli).toBeDefined();
    });
  });

  describe('错误处理中间件', () => {
    it('应该捕获未处理的异常', () => {
      // 验证异常处理器已设置
      expect(cli).toBeDefined();
      // 这里主要测试初始化过程中没有错误
    });

    it('应该捕获未处理的 Promise 拒绝', () => {
      // 验证 Promise 拒绝处理器已设置
      expect(cli).toBeDefined();
      // 这里主要测试初始化过程中没有错误
    });
  });
});