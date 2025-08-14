/**
 * 错误处理系统集成测试
 * 
 * 验证错误处理、故障排除、错误报告等系统的正确集成
 */

import { ErrorHandler } from '../../src/utils/error-handler';
import { ErrorMessageFormatter, formatError, formatErrorSimple } from '../../src/utils/error-messages';
import { Troubleshooter } from '../../src/utils/troubleshooter';
import { ErrorReporter } from '../../src/utils/error-reporter';
import { StatsHandler } from '../../src/commands/stats-handler';
import { 
  AppError, 
  ErrorCode, 
  ErrorCategory, 
  ErrorLevel, 
  ConfigError, 
  DataSourceError 
} from '../../src/types/errors';
import { Logger } from '../../src/utils/logger';
import { join } from 'path';
import { rmSync, existsSync, mkdirSync } from 'fs';

describe('错误处理系统集成测试', () => {
  let errorHandler: ErrorHandler;
  let errorFormatter: ErrorMessageFormatter;
  let troubleshooter: Troubleshooter;
  let errorReporter: ErrorReporter;
  let logger: Logger;
  let testReportsDir: string;

  beforeAll(() => {
    // 创建测试专用的报告目录
    testReportsDir = join(__dirname, '../temp/error-reports');
    if (existsSync(testReportsDir)) {
      rmSync(testReportsDir, { recursive: true, force: true });
    }
    mkdirSync(testReportsDir, { recursive: true });
  });

  beforeEach(() => {
    logger = new Logger({ 
      level: 'error', 
      colorize: false, 
      file_output: false 
    });
    
    errorHandler = new ErrorHandler(logger);
    errorFormatter = new ErrorMessageFormatter();
    troubleshooter = new Troubleshooter(logger);
    errorReporter = new ErrorReporter(logger, testReportsDir, 10);
  });

  afterAll(() => {
    // 清理测试目录
    if (existsSync(testReportsDir)) {
      rmSync(testReportsDir, { recursive: true, force: true });
    }
  });

  describe('ErrorMessageFormatter 集成测试', () => {
    test('应该正确格式化配置错误', () => {
      const error = new ConfigError(
        '配置文件不存在',
        ErrorCode.CONFIG_NOT_FOUND,
        { filePath: '/home/user/.claude/settings.json' }
      );

      const formatted = errorFormatter.format(error);
      
      expect(formatted).toContain('配置文件未找到');
      expect(formatted).toContain('⚙️');
      expect(formatted).toContain('CONFIG_NOT_FOUND');
      expect(formatted).toContain('claude config init');
    });

    test('应该正确格式化数据源错误', () => {
      const error = new DataSourceError(
        'Cost API不可用',
        ErrorCode.DATA_SOURCE_NOT_AVAILABLE,
        { apiEndpoint: 'claude cost' }
      );

      const formatted = errorFormatter.format(error);
      
      expect(formatted).toContain('数据源不可用');
      expect(formatted).toContain('📊');
      expect(formatted).toContain('claude check');
    });

    test('应该支持英文格式化', () => {
      const formatter = new ErrorMessageFormatter({ language: 'en' });
      const error = new ConfigError(
        'Configuration file not found',
        ErrorCode.CONFIG_NOT_FOUND
      );

      const formatted = formatter.format(error);
      
      expect(formatted).toContain('Configuration File Not Found');
      expect(formatted).toContain('claude config init');
    });
  });

  describe('Troubleshooter 集成测试', () => {
    test('应该能执行系统诊断', async () => {
      const report = await troubleshooter.diagnose();
      
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.overallHealth).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.results)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      // 应该包含基本的系统检查
      const nodeCheck = report.results.find(r => r.id === 'node_version_ok' || r.id === 'node_version_outdated');
      expect(nodeCheck).toBeDefined();
    });

    test('应该能针对特定错误进行诊断', async () => {
      const error = new ConfigError(
        '配置文件不存在',
        ErrorCode.CONFIG_NOT_FOUND
      );

      const diagnostics = await troubleshooter.diagnoseError(error);
      
      expect(Array.isArray(diagnostics)).toBe(true);
      expect(diagnostics.length).toBeGreaterThan(0);
      
      // 应该包含配置相关的诊断
      const configDiagnostic = diagnostics.find(d => d.category === '配置管理');
      expect(configDiagnostic).toBeDefined();
    });
  });

  describe('ErrorReporter 集成测试', () => {
    test('应该能收集和保存错误报告', async () => {
      const error = new AppError(
        '测试错误',
        ErrorCode.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorLevel.ERROR,
        { metadata: { testContext: 'integration_test' } }
      );

      const reportId = await errorReporter.reportError(error, {
        command: 'test-command',
        arguments: ['--test']
      });

      expect(reportId).toBeDefined();
      expect(reportId).toMatch(/^[0-9a-f-]{36}$/); // UUID 格式

      // 验证报告摘要生成
      const summary = await errorReporter.generateReportSummary(reportId);
      expect(summary).toContain('错误报告摘要');
      expect(summary).toContain(reportId);
      expect(summary).toContain('UNKNOWN_ERROR');
    });

    test('应该能获取错误统计', async () => {
      // 创建几个测试错误
      const errors = [
        new ConfigError('配置错误1', ErrorCode.CONFIG_NOT_FOUND),
        new ConfigError('配置错误2', ErrorCode.CONFIG_PARSE_FAILED),
        new DataSourceError('数据源错误', ErrorCode.DATA_SOURCE_NOT_AVAILABLE)
      ];

      for (const error of errors) {
        await errorReporter.reportError(error);
      }

      const stats = await errorReporter.getErrorStatistics();
      
      expect(stats.totalErrors).toBeGreaterThanOrEqual(3);
      expect(stats.errorsByCategory['CONFIG']).toBeGreaterThanOrEqual(2);
      expect(stats.errorsByCategory['DATA_SOURCE']).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(stats.topErrors)).toBe(true);
    });

    test('应该记录用户操作', () => {
      errorReporter.recordAction('test-action', 'success', 100);
      errorReporter.recordAction('test-action-2', 'error', 50);
      
      // 通过创建错误报告验证操作记录
      expect(() => {
        const error = new AppError('测试', ErrorCode.UNKNOWN_ERROR, ErrorCategory.UNKNOWN, ErrorLevel.ERROR);
        return errorReporter.reportError(error);
      }).not.toThrow();
    });
  });

  describe('CLI 集成测试', () => {
    test('CLI 系统应该能正确处理和显示错误', async () => {
      const statsHandler = new StatsHandler();
      
      // 模拟一个会引发错误的命令（测试无效的格式参数）
      try {
        await statsHandler.handleStatsCommand({
          format: 'invalid-format' as any, // 故意传入无效值
          language: 'zh-CN'
        });
      } catch (error) {
        // 验证错误被正确处理
        expect(error).toBeDefined();
        
        // 测试错误格式化
        const formatted = formatError(error);
        expect(formatted).toContain('错误');
        
        const simple = formatErrorSimple(error);
        expect(simple).toBeDefined();
      }
    });
  });

  describe('错误处理工作流集成测试', () => {
    test('完整的错误处理工作流', async () => {
      // 1. 创建一个错误
      const originalError = new Error('原始错误');
      const context = { 
        component: 'test-component', 
        method: 'test-method',
        metadata: { testRun: true }
      };

      // 2. 通过错误处理器处理
      const appError = errorHandler.handle(originalError, context);
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.context.component).toBe('test-component');

      // 3. 格式化错误消息
      const formattedMessage = errorFormatter.format(appError);
      expect(formattedMessage).toContain('未知错误');

      // 4. 进行故障诊断
      const diagnostics = await troubleshooter.diagnoseError(appError);
      expect(Array.isArray(diagnostics)).toBe(true);

      // 5. 收集错误报告
      const reportId = await errorReporter.reportError(appError, {
        command: context.method || 'unknown',
        workingDirectory: process.cwd()
      });
      expect(reportId).toBeDefined();

      // 6. 生成报告摘要
      const summary = await errorReporter.generateReportSummary(reportId);
      expect(summary).toContain('test-component');
      expect(summary).toContain('test-method');
    });

    test('隐私保护工作流', async () => {
      const error = new AppError(
        '包含敏感信息的错误',
        ErrorCode.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorLevel.ERROR,
        { metadata: { sensitiveData: 'secret-key-123' } }
      );

      // 使用严格的隐私设置
      const reportId = await errorReporter.reportError(error, {
        command: 'sensitive-command',
        workingDirectory: '/home/user/secret-project'
      }, undefined, {
        includeSystemInfo: false,
        includeErrorStack: false,
        includeFileNames: false,
        includeUserPaths: false,
        anonymizeData: true
      });

      const summary = await errorReporter.generateReportSummary(reportId);
      
      // 验证敏感信息被正确处理
      expect(summary).not.toContain('secret-key-123');
      expect(summary).not.toContain('/home/user/secret-project');
      expect(summary).toContain('hidden'); // 系统信息应该被隐藏
    });
  });

  describe('多语言支持集成测试', () => {
    test('应该支持中英文错误消息切换', () => {
      const error = new ConfigError(
        '配置文件解析失败',
        ErrorCode.CONFIG_PARSE_FAILED
      );

      // 中文格式化
      const zhFormatter = new ErrorMessageFormatter({ language: 'zh-CN' });
      const zhMessage = zhFormatter.format(error);
      expect(zhMessage).toContain('配置文件解析失败');
      expect(zhMessage).toContain('详情：');

      // 英文格式化
      const enFormatter = new ErrorMessageFormatter({ language: 'en' });
      const enMessage = enFormatter.format(error);
      expect(enMessage).toContain('Configuration File Parse Failed');
      expect(enMessage).toContain('Details:');
    });
  });

  describe('性能和资源管理测试', () => {
    test('应该正确管理错误报告数量', async () => {
      const maxReports = 5;
      const reporter = new ErrorReporter(logger, testReportsDir, maxReports);

      // 创建超过最大数量的错误报告
      for (let i = 0; i < maxReports + 3; i++) {
        const error = new AppError(
          `测试错误 ${i}`,
          ErrorCode.UNKNOWN_ERROR,
          ErrorCategory.UNKNOWN,
          ErrorLevel.ERROR
        );
        await reporter.reportError(error);
      }

      const stats = await reporter.getErrorStatistics();
      
      // 应该只保留最近的报告
      expect(stats.totalErrors).toBeLessThanOrEqual(maxReports);
    });

    test('错误频率应该被正确跟踪', async () => {
      const sameError = new AppError(
        '重复错误',
        ErrorCode.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorLevel.ERROR
      );

      // 报告同一个错误多次
      await errorReporter.reportError(sameError);
      await errorReporter.reportError(sameError);
      const reportId = await errorReporter.reportError(sameError);

      const summary = await errorReporter.generateReportSummary(reportId);
      expect(summary).toContain('频率: 3 次');
    });
  });
});