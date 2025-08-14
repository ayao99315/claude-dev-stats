#!/usr/bin/env node

/**
 * Claude Code 开发统计命令行接口
 * 实现所有 /stats 系列 slash commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  CommandOptions,
  StatsCommandOptions,
  ToolsCommandOptions,
  CostCommandOptions,
  CompareCommandOptions,
  TrendsCommandOptions,
  ExportCommandOptions,
  CommandResult,
  AVAILABLE_COMMANDS
} from '../types/commands';
import { StatsHandler } from './stats-handler';
import { ParameterValidator } from './validator';
import { InteractiveHelper } from './interactive';
import { SmartHintProvider } from '../utils/cli-helpers';
import { Logger } from '../utils/logger';

export class CommandLineInterface {
  private program: Command;
  private statsHandler: StatsHandler;
  private validator: ParameterValidator;
  private interactive: InteractiveHelper;
  private hintProvider: SmartHintProvider;
  private logger: Logger;

  constructor() {
    this.program = new Command();
    this.statsHandler = new StatsHandler();
    this.validator = new ParameterValidator();
    this.interactive = new InteractiveHelper();
    this.hintProvider = new SmartHintProvider();
    this.logger = new Logger({ 
      level: 'info', 
      colorize: true, 
      file_output: false,
      max_file_size: 10 * 1024 * 1024,
      max_files: 5
    });

    this.setupProgram();
    this.setupCommands();
  }

  /**
   * 设置主程序信息
   */
  private setupProgram(): void {
    this.program
      .name('cc-stats')
      .description('Claude Code 开发统计与分析工具')
      .version('0.9.0')
      .option('-v, --verbose', '启用详细输出')
      .option('--no-color', '禁用彩色输出')
      .option('-c, --config <path>', '指定配置文件路径')
      .helpOption('-h, --help', '显示帮助信息');

    // 设置彩色输出
    this.program.configureOutput({
      writeOut: (str: string) => process.stdout.write(str),
      writeErr: (str: string) => process.stderr.write(chalk.red(str)),
      outputError: (str: string, write: (str: string) => void) => write(str)
    });

    // 设置最大监听器数量避免警告
    process.setMaxListeners(20);

    // 添加全局错误处理
    if (process.listenerCount('uncaughtException') === 0) {
      process.on('uncaughtException', (error) => {
        this.logger.error('未捕获的异常', error);
        console.error(chalk.red('❌ 发生未预期的错误:'), error.message);
        process.exit(1);
      });
    }

    if (process.listenerCount('unhandledRejection') === 0) {
      process.on('unhandledRejection', (reason, promise) => {
        this.logger.error('未处理的Promise拒绝', { reason, promise });
        console.error(chalk.red('❌ 异步操作失败:'), reason);
        process.exit(1);
      });
    }
  }

  /**
   * 设置所有命令
   */
  private setupCommands(): void {
    this.setupStatsCommand();
    this.setupBasicStatsCommand();
    this.setupEfficiencyCommand();
    this.setupToolsCommand();
    this.setupCostCommand();
    this.setupCompareCommand();
    this.setupTrendsCommand();
    this.setupInsightsCommand();
    this.setupExportCommand();
    this.setupCheckCommand();
  }

  /**
   * 主统计命令: cc-stats stats
   */
  private setupStatsCommand(): void {
    const cmd = this.program
      .command('stats')
      .alias('st')
      .alias('s')
      .description('显示综合开发统计数据')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '时间范围 (today|week|month|custom)', 'today')
      .option('--from <date>', '起始日期 (YYYY-MM-DD)')
      .option('--to <date>', '结束日期 (YYYY-MM-DD)')
      .option('-f, --format <type>', '输出格式 (table|detailed|summary|json|chart)', 'table')
      .option('-l, --language <lang>', '输出语言 (zh-CN|en-US)', 'zh-CN')
      .option('-o, --output <file>', '输出文件路径')
      .option('--compare', '比较上一时间段数据')
      .option('--summary', '仅显示摘要信息')
      .option('--trends', '显示趋势分析')
      .option('--insights', '包含智能洞察')
      .option('--include <types...>', '包含的分析类型')
      .option('--exclude <types...>', '排除的分析类型')
      .action(async (options: StatsCommandOptions) => {
        await this.executeCommand('stats', options, async () => {
          return await this.statsHandler.handleStatsCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats')}`);
  }

  /**
   * 基础统计命令: cc-stats basic
   */
  private setupBasicStatsCommand(): void {
    const cmd = this.program
      .command('basic')
      .alias('b')
      .description('显示基础统计信息')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '时间范围', 'today')
      .option('-f, --format <type>', '输出格式', 'table')
      .option('-l, --language <lang>', '输出语言', 'zh-CN')
      .action(async (options: CommandOptions) => {
        await this.executeCommand('stats:basic', options, async () => {
          return await this.statsHandler.handleBasicStatsCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:basic')}`);
  }

  /**
   * 效率分析命令: cc-stats efficiency
   */
  private setupEfficiencyCommand(): void {
    const cmd = this.program
      .command('efficiency')
      .alias('eff')
      .alias('e')
      .description('显示效率分析数据')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '时间范围', 'today')
      .option('-f, --format <type>', '输出格式', 'table')
      .option('-l, --language <lang>', '输出语言', 'zh-CN')
      .action(async (options: CommandOptions) => {
        await this.executeCommand('stats:efficiency', options, async () => {
          return await this.statsHandler.handleEfficiencyCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:efficiency')}`);
  }

  /**
   * 工具使用分析命令: cc-stats tools
   */
  private setupToolsCommand(): void {
    const cmd = this.program
      .command('tools')
      .alias('t')
      .description('显示工具使用分析')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '时间范围', 'today')
      .option('-f, --format <type>', '输出格式', 'table')
      .option('-s, --sort-by <field>', '排序方式 (usage|efficiency|time)', 'usage')
      .option('--top <n>', '显示前N个工具', '10')
      .option('--inefficient', '仅显示低效工具')
      .action(async (options: ToolsCommandOptions) => {
        await this.executeCommand('stats:tools', options, async () => {
          return await this.statsHandler.handleToolsCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:tools')}`);
  }

  /**
   * 成本分析命令: cc-stats cost
   */
  private setupCostCommand(): void {
    const cmd = this.program
      .command('cost')
      .alias('c')
      .description('显示成本分析数据')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '时间范围', 'today')
      .option('-f, --format <type>', '输出格式', 'table')
      .option('-b, --breakdown <type>', '成本分析粒度 (hourly|daily|tool-based)', 'daily')
      .option('--recommendations', '显示成本优化建议')
      .option('--currency <unit>', '货币单位 (USD|CNY)', 'USD')
      .action(async (options: CostCommandOptions) => {
        await this.executeCommand('stats:cost', options, async () => {
          return await this.statsHandler.handleCostCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:cost')}`);
  }

  /**
   * 比较分析命令: cc-stats compare
   */
  private setupCompareCommand(): void {
    const cmd = this.program
      .command('compare')
      .alias('comp')
      .alias('cmp')
      .description('比较不同时间段的数据')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '当前时间范围', 'today')
      .option('-b, --baseline <range>', '比较基准 (previous-week|previous-month|custom)', 'previous-week')
      .option('--baseline-from <date>', '基准起始日期 (YYYY-MM-DD)')
      .option('--baseline-to <date>', '基准结束日期 (YYYY-MM-DD)')
      .option('-f, --format <type>', '输出格式', 'table')
      .option('--percentage', '显示变化百分比')
      .action(async (options: CompareCommandOptions) => {
        await this.executeCommand('stats:compare', options, async () => {
          return await this.statsHandler.handleCompareCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:compare')}`);
  }

  /**
   * 趋势分析命令: cc-stats trends
   */
  private setupTrendsCommand(): void {
    const cmd = this.program
      .command('trends')
      .alias('trend')
      .alias('tr')
      .description('显示历史趋势分析')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --type <category>', '趋势类型 (productivity|cost|usage|tools)', 'productivity')
      .option('-g, --granularity <level>', '数据粒度 (daily|weekly|monthly)', 'daily')
      .option('-f, --format <type>', '输出格式', 'chart')
      .option('--forecast <days>', '预测未来N天')
      .action(async (options: TrendsCommandOptions) => {
        await this.executeCommand('stats:trends', options, async () => {
          return await this.statsHandler.handleTrendsCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:trends')}`);
  }

  /**
   * 智能洞察命令: cc-stats insights
   */
  private setupInsightsCommand(): void {
    const cmd = this.program
      .command('insights')
      .alias('insight')
      .alias('ai')
      .description('显示智能洞察和建议')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '时间范围', 'week')
      .option('-f, --format <type>', '输出格式', 'detailed')
      .option('-l, --language <lang>', '输出语言', 'zh-CN')
      .action(async (options: CommandOptions) => {
        await this.executeCommand('stats:insights', options, async () => {
          return await this.statsHandler.handleInsightsCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:insights')}`);
  }

  /**
   * 导出命令: cc-stats export
   */
  private setupExportCommand(): void {
    const cmd = this.program
      .command('export')
      .alias('exp')
      .description('导出统计数据到文件')
      .option('-p, --project <path>', '项目路径', process.cwd())
      .option('-t, --timeframe <range>', '时间范围', 'month')
      .option('--type <category>', '导出类型 (all|stats|trends|insights)', 'all')
      .option('--export-format <format>', '导出格式 (json|csv|xlsx|pdf)', 'json')
      .option('-o, --output <file>', '输出文件路径', './claude-stats-export')
      .option('--include-charts', '包含图表')
      .action(async (options: ExportCommandOptions) => {
        await this.executeCommand('stats:export', options, async () => {
          return await this.statsHandler.handleExportCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:export')}`);
  }

  /**
   * 检查命令: cc-stats check
   */
  private setupCheckCommand(): void {
    const cmd = this.program
      .command('check')
      .alias('status')
      .description('检查数据源可用性')
      .option('-f, --format <type>', '输出格式', 'table')
      .option('-v, --verbose', '显示详细信息')
      .action(async (options: CommandOptions) => {
        await this.executeCommand('stats:check', options, async () => {
          return await this.statsHandler.handleCheckCommand(options);
        });
      });

    cmd.addHelpText('after', `\n${this.getCommandExamples('stats:check')}`);
  }

  /**
   * 执行命令的通用包装器
   */
  private async executeCommand(
    commandName: string,
    options: any,
    handler: () => Promise<CommandResult>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 显示命令开始执行提示
      this.statsHandler.showCommandStart(commandName, options);
      
      // 提供预执行智能提示
      this.providedPreExecutionHints(commandName, options);
      
      // 显示执行指示器
      if (options.verbose) {
        console.log(chalk.blue(`🚀 执行命令: ${commandName}`));
      } else {
        this.interactive.showSpinner(`执行 ${commandName}...`);
      }

      // 验证参数
      this.validator.validateOptions(options, commandName as any);

      // 使用 StatsHandler 的计时功能执行命令
      const result = await this.statsHandler.executeWithTiming(
        handler,
        commandName
      );
      
      // 隐藏指示器
      if (!options.verbose) {
        this.interactive.hideSpinner();
      }

      // 显示结果
      if (result.success) {
        this.statsHandler.showCommandComplete(commandName, true);
        
        if (result.message) {
          console.log(result.message);
        }
      } else {
        this.statsHandler.showCommandComplete(commandName, false);
        console.error(chalk.red(`❌ 命令执行失败: ${result.error || '未知错误'}`));
        process.exit(1);
      }

    } catch (error) {
      // 隐藏指示器
      if (!options.verbose) {
        this.interactive.hideSpinner();
      }

      this.logger.error(`命令 ${commandName} 执行失败`, error);
      console.error(chalk.red(`❌ 执行失败: ${error instanceof Error ? error.message : String(error)}`));
      
      // 提供故障排除建议
      this.showTroubleshootingSuggestions(commandName, error);
      
      process.exit(1);
    }
  }

  /**
   * 获取命令示例
   */
  private getCommandExamples(command: string): string {
    const examples: Record<string, string[]> = {
      'stats': [
        'cc-stats stats                     # 显示今日统计',
        'cc-stats stats -t week             # 显示本周统计',
        'cc-stats stats --compare           # 与上周对比',
        'cc-stats stats -f json -o report.json  # 导出JSON格式'
      ],
      'stats:basic': [
        'cc-stats basic                     # 基础统计信息',
        'cc-stats basic -t month            # 本月基础统计'
      ],
      'stats:efficiency': [
        'cc-stats efficiency               # 效率分析',
        'cc-stats eff -f detailed          # 详细效率报告'
      ],
      'stats:tools': [
        'cc-stats tools                    # 工具使用分析',
        'cc-stats tools --top 5            # 显示前5个工具',
        'cc-stats tools --inefficient      # 显示低效工具'
      ],
      'stats:cost': [
        'cc-stats cost                     # 成本分析',
        'cc-stats cost --recommendations   # 包含优化建议',
        'cc-stats cost -b hourly           # 按小时分解'
      ],
      'stats:compare': [
        'cc-stats compare                  # 与上周比较',
        'cc-stats compare -b previous-month # 与上月比较',
        'cc-stats comp --percentage        # 显示变化百分比'
      ],
      'stats:trends': [
        'cc-stats trends                   # 生产力趋势',
        'cc-stats trends -t cost           # 成本趋势',
        'cc-stats tr --forecast 7          # 预测未来7天'
      ],
      'stats:insights': [
        'cc-stats insights                 # 智能洞察',
        'cc-stats ai -l en-US              # 英文洞察'
      ],
      'stats:export': [
        'cc-stats export                   # 导出所有数据',
        'cc-stats export --type trends     # 仅导出趋势',
        'cc-stats exp --export-format csv  # 导出CSV格式'
      ],
      'stats:check': [
        'cc-stats check                    # 检查数据源',
        'cc-stats status -v                # 详细状态信息'
      ]
    };

    const commandExamples = examples[command] || [];
    if (commandExamples.length === 0) {
      return '';
    }

    return chalk.yellow('示例:') + '\n  ' + commandExamples.join('\n  ');
  }

  /**
   * 显示智能参数提示
   */
  private showSmartHints(command: string, args: string[]): void {
    // 检查是否有 --help 标志，如果有则显示智能提示
    if (args.includes('--help') || args.includes('-h')) {
      this.hintProvider.showParameterHints(command, args);
    }
  }

  /**
   * 在命令执行前提供智能提示
   */
  private providedPreExecutionHints(command: string, options: any): void {
    const suggestions: string[] = [];

    // 基于缺失的重要参数提供建议
    if (command === 'stats' && !options.timeframe) {
      suggestions.push('💡 提示: 使用 --timeframe 指定时间范围（today/week/month）');
    }

    if (command === 'export' && !options.output) {
      suggestions.push('💡 提示: 使用 --output 指定输出文件路径');
    }

    if (command === 'compare' && !options.baseline) {
      suggestions.push('💡 提示: 使用 --baseline 指定比较基准期间');
    }

    // 性能优化建议
    if (command === 'trends' && !options.granularity) {
      suggestions.push('💡 提示: 使用 --granularity 控制数据粒度，可提升性能');
    }

    if (suggestions.length > 0) {
      console.log('');
      suggestions.forEach(suggestion => {
        console.log(chalk.blue(suggestion));
      });
      console.log('');
    }
  }

  /**
   * 显示故障排除建议
   */
  private showTroubleshootingSuggestions(command: string, error: any): void {
    console.log(chalk.yellow('\n💡 故障排除建议:'));
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Cost API')) {
      console.log('  • 确保 Claude Code 正常安装并可访问');
      console.log('  • 尝试运行: claude cost --help');
    }
    
    if (errorMessage.includes('项目路径') || errorMessage.includes('project')) {
      console.log('  • 检查项目路径是否正确');
      console.log('  • 确保在 Claude Code 项目目录中执行命令');
    }
    
    if (errorMessage.includes('时间') || errorMessage.includes('date')) {
      console.log('  • 检查日期格式是否为 YYYY-MM-DD');
      console.log('  • 确保起始日期早于结束日期');
    }
    
    console.log('  • 使用 -v 选项获取详细错误信息');
    console.log('  • 运行 cc-stats check 检查系统状态');
    console.log('  • 查看文档: https://github.com/your-username/claude-dev-stats');
  }

  /**
   * 启动CLI程序
   */
  public run(): void {
    this.program.parse();
  }
}

// 如果直接运行此文件，启动CLI
if (require.main === module) {
  const cli = new CommandLineInterface();
  cli.run();
}