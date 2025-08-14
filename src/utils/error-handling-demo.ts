/**
 * 错误处理系统演示模块
 * 
 * 演示完整的错误处理、故障排除、错误报告功能
 * 用于验证系统集成和用户体验
 */

import { 
  ErrorHandler, 
  ErrorMessageFormatter, 
  Troubleshooter, 
  ErrorReporter,
  Logger 
} from './index';
import { 
  AppError, 
  ErrorCode, 
  ErrorCategory, 
  ErrorLevel,
  ConfigError,
  DataSourceError,
  ValidationError 
} from '../types/errors';
import chalk from 'chalk';

/**
 * 错误处理系统演示器
 */
export class ErrorHandlingDemo {
  private errorHandler: ErrorHandler;
  private errorFormatter: ErrorMessageFormatter;
  private troubleshooter: Troubleshooter;
  private errorReporter: ErrorReporter;
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ 
      level: 'info', 
      colorize: true, 
      file_output: false 
    });
    
    this.errorHandler = new ErrorHandler(this.logger);
    this.errorFormatter = new ErrorMessageFormatter();
    this.troubleshooter = new Troubleshooter(this.logger);
    this.errorReporter = new ErrorReporter(this.logger);
  }

  /**
   * 运行完整的错误处理演示
   */
  async runDemo(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 Claude Code 错误处理系统演示\n'));
    console.log('='.repeat(60));

    try {
      // 1. 错误格式化演示
      await this.demoErrorFormatting();

      // 2. 故障诊断演示
      await this.demoTroubleshooting();

      // 3. 错误报告演示
      await this.demoErrorReporting();

      // 4. 完整工作流演示
      await this.demoCompleteWorkflow();

      // 5. 多语言支持演示
      await this.demoMultiLanguageSupport();

      console.log(chalk.green.bold('\n✅ 错误处理系统演示完成！\n'));
      
    } catch (error) {
      console.error(chalk.red.bold('\n❌ 演示过程中发生错误：'), error);
    }
  }

  /**
   * 演示错误格式化功能
   */
  private async demoErrorFormatting(): Promise<void> {
    this.printSection('1. 错误消息格式化演示');

    // 演示不同类型的错误
    const errors = [
      new ConfigError(
        '配置文件 ~/.claude/settings.json 不存在',
        ErrorCode.CONFIG_FILE_NOT_FOUND,
        { filePath: '~/.claude/settings.json' }
      ),
      new DataSourceError(
        'Claude Cost API 连接超时',
        ErrorCode.DATA_SOURCE_UNAVAILABLE,
        { apiEndpoint: 'claude cost' }
      ),
      new ValidationError(
        '命令参数 --format 必须是 table, json, yaml 之一',
        ErrorCode.PARAMETER_VALIDATION_FAILED,
        { parameter: '--format', validValues: ['table', 'json', 'yaml'] }
      )
    ];

    for (const error of errors) {
      console.log(chalk.yellow('\n📝 错误格式化示例：'));
      const formatted = this.errorFormatter.format(error);
      console.log(formatted);
      
      console.log(chalk.cyan('\n📝 简化格式：'));
      const simple = this.errorFormatter.formatSimple(error);
      console.log(simple);
      
      await this.sleep(1000);
    }
  }

  /**
   * 演示故障诊断功能
   */
  private async demoTroubleshooting(): Promise<void> {
    this.printSection('2. 智能故障诊断演示');

    console.log(chalk.yellow('🔍 执行系统诊断...'));
    
    const startTime = Date.now();
    const report = await this.troubleshooter.diagnose();
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`✅ 诊断完成（耗时 ${duration}ms）\n`));
    
    // 显示诊断摘要
    console.log(chalk.blue('📊 诊断摘要：'));
    console.log(`总检查项: ${report.summary.total}`);
    console.log(`${chalk.green('✅ 正常')}: ${report.summary.healthy}`);
    console.log(`${chalk.yellow('⚠️ 警告')}: ${report.summary.warnings}`);
    console.log(`${chalk.red('❌ 错误')}: ${report.summary.errors}`);
    console.log(`${chalk.red.bold('🚨 严重')}: ${report.summary.critical}`);
    console.log(`整体状态: ${this.getHealthIcon(report.overallHealth)} ${report.overallHealth}`);
    
    // 显示关键问题
    if (report.summary.errors > 0 || report.summary.critical > 0) {
      console.log(chalk.red('\n🚨 发现的问题：'));
      const criticalAndErrors = report.results.filter(r => 
        r.level === 'critical' || r.level === 'error'
      );
      
      criticalAndErrors.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${this.getDiagnosticIcon(result.level)} ${result.title}`);
        console.log(`   ${result.description}`);
        if (result.suggestion) {
          console.log(chalk.cyan(`   💡 建议: ${result.suggestion}`));
        }
      });
    }

    // 显示建议
    if (report.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 系统建议：'));
      report.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * 演示错误报告功能
   */
  private async demoErrorReporting(): Promise<void> {
    this.printSection('3. 错误报告收集演示');

    // 创建一个示例错误
    const error = new AppError(
      '数据聚合过程中发生内存不足错误',
      ErrorCode.DATA_AGGREGATION_FAILED,
      ErrorCategory.DATA_SOURCE,
      ErrorLevel.ERROR,
      { 
        component: 'AnalyticsEngine',
        method: 'aggregateUsageData',
        memoryUsage: '512MB',
        dataSize: '1.2GB'
      }
    );

    console.log(chalk.yellow('📝 收集错误报告...'));
    
    // 记录一些用户操作
    this.errorReporter.recordAction('load-data', 'success', 1200);
    this.errorReporter.recordAction('analyze-trends', 'success', 800);
    this.errorReporter.recordAction('aggregate-data', 'error', 2500);

    // 生成错误报告
    const reportId = await this.errorReporter.reportError(error, {
      command: 'claude stats',
      arguments: ['--range', '30d', '--format', 'table'],
      workingDirectory: process.cwd()
    }, {
      description: '在生成30天的使用统计时发生内存不足错误',
      reproductionSteps: [
        '运行 claude stats --range 30d',
        '等待数据加载',
        '在数据聚合阶段出现错误'
      ],
      expectedBehavior: '应该成功生成统计报告',
      actualBehavior: '内存不足导致进程崩溃',
      severity: 'high',
      category: 'bug'
    });

    console.log(chalk.green(`✅ 错误报告已生成: ${reportId}\n`));

    // 生成报告摘要
    console.log(chalk.blue('📄 报告摘要：'));
    const summary = await this.errorReporter.generateReportSummary(reportId);
    console.log(summary);

    // 显示错误统计
    console.log(chalk.blue('\n📈 错误统计：'));
    const stats = await this.errorReporter.getErrorStatistics();
    console.log(`总错误数: ${stats.totalErrors}`);
    
    if (stats.topErrors.length > 0) {
      console.log('\n🔝 Top 错误：');
      stats.topErrors.slice(0, 3).forEach((error, index) => {
        console.log(`${index + 1}. ${error.code} (${error.count} 次)`);
      });
    }
  }

  /**
   * 演示完整工作流
   */
  private async demoCompleteWorkflow(): Promise<void> {
    this.printSection('4. 完整错误处理工作流演示');

    console.log(chalk.yellow('🔄 模拟一个实际的错误场景...\n'));

    try {
      // 模拟一个会失败的操作
      await this.simulateFailingOperation();
      
    } catch (originalError) {
      console.log(chalk.red('❌ 捕获到错误，开始处理流程...\n'));

      // 1. 错误标准化
      console.log(chalk.blue('1️⃣ 错误标准化'));
      const appError = this.errorHandler.handle(originalError, {
        component: 'SimulatedOperation',
        method: 'performComplexTask'
      });
      console.log(`✅ 错误已标准化: ${appError.code}`);

      // 2. 错误格式化
      console.log(chalk.blue('\n2️⃣ 错误格式化'));
      const formattedMessage = this.errorFormatter.format(appError);
      console.log(formattedMessage);

      // 3. 故障诊断
      console.log(chalk.blue('\n3️⃣ 故障诊断'));
      const diagnostics = await this.troubleshooter.diagnoseError(appError);
      console.log(`✅ 诊断完成，发现 ${diagnostics.length} 个相关检查项`);
      
      if (diagnostics.length > 0) {
        const topDiagnostic = diagnostics[0];
        console.log(`🔍 主要问题: ${topDiagnostic.title}`);
        if (topDiagnostic.suggestion) {
          console.log(`💡 建议: ${topDiagnostic.suggestion}`);
        }
      }

      // 4. 错误报告
      console.log(chalk.blue('\n4️⃣ 错误报告收集'));
      const reportId = await this.errorReporter.reportError(appError);
      console.log(`✅ 错误报告已保存: ${reportId}`);

      // 5. 用户反馈
      console.log(chalk.blue('\n5️⃣ 用户体验'));
      console.log(chalk.green('✨ 为用户提供了：'));
      console.log('  • 清晰的错误说明和解决建议');
      console.log('  • 自动的系统诊断和修复建议');
      console.log('  • 详细的错误报告用于后续分析');
      console.log('  • 隐私保护的信息收集');
    }
  }

  /**
   * 演示多语言支持
   */
  private async demoMultiLanguageSupport(): Promise<void> {
    this.printSection('5. 多语言支持演示');

    const error = new ConfigError(
      '配置验证失败：语言设置无效',
      ErrorCode.CONFIG_VALIDATION_FAILED,
      { field: 'language', value: 'invalid-lang' }
    );

    // 中文格式化
    console.log(chalk.blue('🇨🇳 中文格式：'));
    const zhFormatter = new ErrorMessageFormatter({ language: 'zh-CN' });
    const zhMessage = zhFormatter.format(error);
    console.log(zhMessage);

    await this.sleep(1000);

    // 英文格式化
    console.log(chalk.blue('\n🇺🇸 English Format:'));
    const enFormatter = new ErrorMessageFormatter({ language: 'en' });
    const enMessage = enFormatter.format(error);
    console.log(enMessage);
  }

  /**
   * 模拟一个会失败的操作
   */
  private async simulateFailingOperation(): Promise<void> {
    // 模拟一些正常操作
    await this.sleep(500);
    
    // 然后失败
    throw new Error('Simulated complex operation failure: insufficient memory to process large dataset');
  }

  /**
   * 辅助方法：打印章节标题
   */
  private printSection(title: string): void {
    console.log('\n' + chalk.blue.bold('─'.repeat(60)));
    console.log(chalk.blue.bold(title));
    console.log(chalk.blue.bold('─'.repeat(60)));
  }

  /**
   * 辅助方法：获取健康状态图标
   */
  private getHealthIcon(health: string): string {
    switch (health) {
    case 'healthy': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'critical': return '🚨';
    default: return '❓';
    }
  }

  /**
   * 辅助方法：获取诊断级别图标
   */
  private getDiagnosticIcon(level: string): string {
    switch (level) {
    case 'healthy': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'critical': return '🚨';
    default: return '❓';
    }
  }

  /**
   * 辅助方法：异步睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 运行演示的便捷函数
 */
export async function runErrorHandlingDemo(): Promise<void> {
  const demo = new ErrorHandlingDemo();
  await demo.runDemo();
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runErrorHandlingDemo().catch(console.error);
}