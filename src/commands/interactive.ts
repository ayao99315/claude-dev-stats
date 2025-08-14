/**
 * 交互式用户体验辅助功能
 * 提供进度指示器、彩色输出、命令补全等现代CLI特性
 */

import chalk from 'chalk';
import { CommandCompletion } from '../types/commands';
import { AVAILABLE_COMMANDS } from '../types/commands';

export class InteractiveHelper {
  private spinnerInterval?: NodeJS.Timeout;
  private spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;
  private currentSpinnerMessage = '';

  /**
   * 显示加载动画
   */
  showSpinner(message: string): void {
    if (this.spinnerInterval) {
      this.hideSpinner();
    }

    this.currentSpinnerMessage = message;
    this.spinnerIndex = 0;

    // 隐藏光标
    process.stdout.write('\x1B[?25l');

    this.spinnerInterval = setInterval(() => {
      const spinner = this.spinnerChars[this.spinnerIndex];
      process.stdout.write(`\r${chalk.cyan(spinner)} ${message}`);
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerChars.length;
    }, 100);
  }

  /**
   * 隐藏加载动画
   */
  hideSpinner(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = undefined;
      
      // 清除当前行并显示光标
      process.stdout.write('\r\x1B[K');
      process.stdout.write('\x1B[?25h');
    }
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string): void {
    console.log(chalk.green(`✅ ${message}`));
  }

  /**
   * 显示警告消息
   */
  showWarning(message: string): void {
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  /**
   * 显示错误消息
   */
  showError(message: string): void {
    console.log(chalk.red(`❌ ${message}`));
  }

  /**
   * 显示信息消息
   */
  showInfo(message: string): void {
    console.log(chalk.blue(`ℹ️  ${message}`));
  }

  /**
   * 显示进度条
   */
  showProgressBar(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const barLength = 20;
    const filledLength = Math.round((barLength * current) / total);
    
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    const progressText = `${message ? message + ' ' : ''}[${bar}] ${percentage}% (${current}/${total})`;
    
    process.stdout.write(`\r${chalk.cyan(progressText)}`);
    
    if (current >= total) {
      console.log(); // 新行
    }
  }

  /**
   * 显示格式化的表格标题
   */
  showTableHeader(title: string): void {
    const borderLength = Math.max(title.length + 4, 40);
    const border = '═'.repeat(borderLength);
    
    console.log(chalk.bold.cyan(`\n╔${border}╗`));
    console.log(chalk.bold.cyan(`║ ${title.padEnd(borderLength - 2)} ║`));
    console.log(chalk.bold.cyan(`╚${border}╝`));
  }

  /**
   * 显示分段标题
   */
  showSectionHeader(title: string): void {
    console.log(chalk.bold.blue(`\n📊 ${title}`));
    console.log(chalk.gray('─'.repeat(title.length + 4)));
  }

  /**
   * 显示键值对信息
   */
  showKeyValue(key: string, value: string | number, color?: 'green' | 'yellow' | 'red' | 'blue'): void {
    const colorFn = color ? chalk[color] : chalk.white;
    console.log(`  ${chalk.gray(key + ':')} ${colorFn(value)}`);
  }

  /**
   * 显示列表项
   */
  showListItem(item: string, level: number = 0): void {
    const indent = '  '.repeat(level);
    console.log(`${indent}• ${item}`);
  }

  /**
   * 显示数字统计（带格式化）
   */
  showStatistic(label: string, value: number, unit?: string, trend?: 'up' | 'down' | 'stable'): void {
    let formattedValue = value.toLocaleString();
    if (unit) {
      formattedValue += ` ${unit}`;
    }

    let trendIcon = '';
    let valueColor = chalk.white;
    
    if (trend) {
      switch (trend) {
      case 'up':
        trendIcon = chalk.green(' ↗️');
        valueColor = chalk.green;
        break;
      case 'down':
        trendIcon = chalk.red(' ↘️');
        valueColor = chalk.red;
        break;
      case 'stable':
        trendIcon = chalk.yellow(' ➡️');
        valueColor = chalk.yellow;
        break;
      }
    }

    console.log(`  ${chalk.gray(label + ':')} ${valueColor(formattedValue)}${trendIcon}`);
  }

  /**
   * 显示时间格式化
   */
  showTimeInfo(label: string, date: Date | string): void {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formattedDate = dateObj.toLocaleDateString('zh-CN');
    const formattedTime = dateObj.toLocaleTimeString('zh-CN');
    
    console.log(`  ${chalk.gray(label + ':')} ${chalk.cyan(formattedDate)} ${chalk.gray(formattedTime)}`);
  }

  /**
   * 显示分隔线
   */
  showDivider(char: string = '─', length: number = 50): void {
    console.log(chalk.gray(char.repeat(length)));
  }

  /**
   * 清屏
   */
  clearScreen(): void {
    console.clear();
  }

  /**
   * 显示应用启动信息
   */
  showWelcome(): void {
    console.log(chalk.bold.cyan('\n🚀 Claude Code 开发统计分析工具'));
    console.log(chalk.gray('   提供智能的开发效率分析和洞察\n'));
  }

  /**
   * 显示命令执行时间
   */
  showExecutionTime(startTime: number): void {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    let timeStr: string;
    if (duration < 1000) {
      timeStr = `${duration}ms`;
    } else {
      timeStr = `${(duration / 1000).toFixed(2)}s`;
    }
    
    console.log(chalk.gray(`\n⏱️  执行时间: ${timeStr}`));
  }

  /**
   * 显示内存使用情况
   */
  showMemoryUsage(): void {
    const used = process.memoryUsage();
    const formatBytes = (bytes: number) => {
      const sizes = ['B', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 B';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    console.log(chalk.gray('\n💾 内存使用:'));
    console.log(`  RSS: ${formatBytes(used.rss)}`);
    console.log(`  Heap Used: ${formatBytes(used.heapUsed)}`);
    console.log(`  External: ${formatBytes(used.external)}`);
  }

  /**
   * 格式化大数字
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * 格式化百分比
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * 格式化时长
   */
  formatDuration(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)}分钟`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}小时`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}天${remainingHours.toFixed(1)}小时`;
    }
  }

  /**
   * 创建简单的ASCII图表
   */
  createBarChart(data: { label: string; value: number }[], maxWidth: number = 30): string[] {
    const maxValue = Math.max(...data.map(d => d.value));
    const lines: string[] = [];
    
    data.forEach(item => {
      const barLength = Math.round((item.value / maxValue) * maxWidth);
      const bar = '█'.repeat(barLength) + '░'.repeat(maxWidth - barLength);
      const percentage = ((item.value / maxValue) * 100).toFixed(1);
      
      lines.push(`  ${item.label.padEnd(15)} ${chalk.cyan(bar)} ${chalk.yellow(percentage + '%')}`);
    });
    
    return lines;
  }

  /**
   * 显示简单图表
   */
  showChart(title: string, data: { label: string; value: number }[]): void {
    this.showSectionHeader(title);
    const chartLines = this.createBarChart(data);
    chartLines.forEach(line => console.log(line));
  }
}

/**
 * 命令补全实现
 */
export class CommandCompletionProvider implements CommandCompletion {
  /**
   * 获取命令补全建议
   */
  getCommandCompletions(partial: string): string[] {
    const commands = Object.keys(AVAILABLE_COMMANDS);
    const aliases = Object.values(AVAILABLE_COMMANDS).flatMap(cmd => cmd.aliases);
    const allCommands = [...commands, ...aliases];
    
    return allCommands
      .filter(cmd => cmd.toLowerCase().startsWith(partial.toLowerCase()))
      .sort();
  }

  /**
   * 获取选项补全建议
   */
  getOptionCompletions(command: string, option: string, partial: string): string[] {
    const completions: Record<string, Record<string, string[]>> = {
      'stats': {
        '--timeframe': ['today', 'week', 'month', 'custom'],
        '--format': ['table', 'detailed', 'summary', 'json', 'chart'],
        '--language': ['zh-CN', 'en-US']
      },
      'tools': {
        '--sort-by': ['usage', 'efficiency', 'time'],
        '--format': ['table', 'detailed', 'summary']
      },
      'cost': {
        '--breakdown': ['hourly', 'daily', 'tool-based'],
        '--currency': ['USD', 'CNY'],
        '--format': ['table', 'detailed', 'summary']
      },
      'compare': {
        '--baseline': ['previous-week', 'previous-month', 'custom'],
        '--format': ['table', 'detailed', 'summary']
      },
      'trends': {
        '--type': ['productivity', 'cost', 'usage', 'tools'],
        '--granularity': ['daily', 'weekly', 'monthly'],
        '--format': ['chart', 'table', 'detailed']
      },
      'export': {
        '--type': ['all', 'stats', 'trends', 'insights'],
        '--export-format': ['json', 'csv', 'xlsx', 'pdf']
      }
    };

    const commandCompletions = completions[command];
    if (!commandCompletions) return [];

    const optionCompletions = commandCompletions[option];
    if (!optionCompletions) return [];

    return optionCompletions
      .filter(comp => comp.toLowerCase().startsWith(partial.toLowerCase()))
      .sort();
  }

  /**
   * 获取路径补全建议（简化实现）
   */
  getPathCompletions(partial: string): string[] {
    // 这里可以实现文件系统路径补全
    // 为简化起见，返回一些常见的项目路径
    const commonPaths = [
      './',
      '../',
      './src/',
      './dist/',
      './build/',
      './node_modules/'
    ];

    return commonPaths
      .filter(path => path.startsWith(partial))
      .sort();
  }
}