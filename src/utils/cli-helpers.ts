/**
 * CLI 用户体验辅助工具
 * 提供分页显示、智能提示、命令行交互增强等功能
 */

import chalk from 'chalk';
import readline from 'readline';

/**
 * 分页显示管理器
 */
export class PaginationManager {
  private pageSize: number;
  private currentPage: number = 0;

  constructor(pageSize: number = 20) {
    this.pageSize = pageSize;
  }

  /**
   * 分页显示内容
   */
  async displayPaginated(content: string[], title?: string): Promise<void> {
    if (content.length === 0) {
      console.log(chalk.yellow('没有内容可显示'));
      return;
    }

    // 如果内容少于一页，直接显示
    if (content.length <= this.pageSize) {
      if (title) {
        console.log(chalk.bold.cyan(`\n📄 ${title}`));
        console.log(chalk.gray('─'.repeat(title.length + 4)));
      }
      content.forEach(line => console.log(line));
      return;
    }

    this.currentPage = 0;
    const totalPages = Math.ceil(content.length / this.pageSize);

    while (true) {
      // 清屏并显示当前页
      console.clear();
      
      if (title) {
        console.log(chalk.bold.cyan(`\n📄 ${title}`));
        console.log(chalk.gray('─'.repeat(title.length + 4)));
      }

      const startIndex = this.currentPage * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, content.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        console.log(content[i]);
      }

      // 显示分页信息
      console.log(chalk.gray(`\n第 ${this.currentPage + 1}/${totalPages} 页 (${startIndex + 1}-${endIndex}/${content.length} 项)`));
      console.log(chalk.blue('控制: [n]下一页 [p]上一页 [q]退出 [f]跳转到页面'));

      const input = await this.waitForInput();
      
      if (input === 'q' || input === 'quit') {
        break;
      } else if (input === 'n' || input === 'next') {
        if (this.currentPage < totalPages - 1) {
          this.currentPage++;
        } else {
          console.log(chalk.yellow('已经是最后一页'));
          await this.pause();
        }
      } else if (input === 'p' || input === 'prev') {
        if (this.currentPage > 0) {
          this.currentPage--;
        } else {
          console.log(chalk.yellow('已经是第一页'));
          await this.pause();
        }
      } else if (input === 'f' || input === 'first') {
        const pageInput = await this.askForPageNumber(totalPages);
        if (pageInput !== null) {
          this.currentPage = pageInput - 1;
        }
      }
    }
  }

  /**
   * 等待用户输入
   */
  private waitForInput(): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('', (input) => {
        rl.close();
        resolve(input.toLowerCase().trim());
      });
    });
  }

  /**
   * 询问页码
   */
  private askForPageNumber(totalPages: number): Promise<number | null> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(chalk.blue(`请输入页码 (1-${totalPages}): `), (input) => {
        rl.close();
        const pageNum = parseInt(input.trim());
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          console.log(chalk.red('无效的页码'));
          resolve(null);
        } else {
          resolve(pageNum);
        }
      });
    });
  }

  /**
   * 暂停等待用户按键
   */
  private pause(): Promise<void> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(chalk.gray('按回车键继续...'), () => {
        rl.close();
        resolve();
      });
    });
  }
}

/**
 * 智能参数提示系统
 */
export class SmartHintProvider {
  /**
   * 根据已输入的参数提供智能提示
   */
  getParameterHints(command: string, currentArgs: string[]): string[] {
    const hints: Record<string, (args: string[]) => string[]> = {
      'stats': (args) => this.getStatsHints(args),
      'basic': (args) => this.getBasicHints(args),
      'efficiency': (args) => this.getEfficiencyHints(args),
      'tools': (args) => this.getToolsHints(args),
      'cost': (args) => this.getCostHints(args),
      'compare': (args) => this.getCompareHints(args),
      'trends': (args) => this.getTrendsHints(args),
      'insights': (args) => this.getInsightsHints(args),
      'export': (args) => this.getExportHints(args)
    };

    const hintFunction = hints[command];
    return hintFunction ? hintFunction(currentArgs) : [];
  }

  /**
   * 显示参数提示
   */
  showParameterHints(command: string, currentArgs: string[]): void {
    const hints = this.getParameterHints(command, currentArgs);
    
    if (hints.length > 0) {
      console.log(chalk.blue('\n💡 可用选项:'));
      hints.forEach(hint => {
        console.log(`  ${chalk.gray('•')} ${hint}`);
      });
    }
  }

  /**
   * 获取 stats 命令的提示
   */
  private getStatsHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--timeframe') && !args.includes('-t')) {
      hints.push(chalk.cyan('--timeframe') + chalk.gray(' <today|week|month|custom>') + ' - 指定时间范围');
    }
    
    if (!args.includes('--format') && !args.includes('-f')) {
      hints.push(chalk.cyan('--format') + chalk.gray(' <table|detailed|summary|json|chart>') + ' - 输出格式');
    }
    
    if (!args.includes('--language') && !args.includes('-l')) {
      hints.push(chalk.cyan('--language') + chalk.gray(' <zh-CN|en-US>') + ' - 语言设置');
    }
    
    if (!args.includes('--project-path')) {
      hints.push(chalk.cyan('--project-path') + chalk.gray(' <path>') + ' - 项目路径');
    }

    return hints;
  }

  /**
   * 获取 basic 命令的提示
   */
  private getBasicHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--show-details')) {
      hints.push(chalk.cyan('--show-details') + ' - 显示详细信息');
    }
    
    if (!args.includes('--include-costs')) {
      hints.push(chalk.cyan('--include-costs') + ' - 包含成本信息');
    }

    return hints;
  }

  /**
   * 获取 efficiency 命令的提示
   */
  private getEfficiencyHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--baseline')) {
      hints.push(chalk.cyan('--baseline') + chalk.gray(' <period>') + ' - 基准比较期间');
    }
    
    if (!args.includes('--show-suggestions')) {
      hints.push(chalk.cyan('--show-suggestions') + ' - 显示改进建议');
    }

    return hints;
  }

  /**
   * 获取 tools 命令的提示
   */
  private getToolsHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--sort-by')) {
      hints.push(chalk.cyan('--sort-by') + chalk.gray(' <usage|efficiency|time>') + ' - 排序方式');
    }
    
    if (!args.includes('--limit')) {
      hints.push(chalk.cyan('--limit') + chalk.gray(' <number>') + ' - 限制显示数量');
    }

    return hints;
  }

  /**
   * 获取 cost 命令的提示
   */
  private getCostHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--breakdown')) {
      hints.push(chalk.cyan('--breakdown') + chalk.gray(' <hourly|daily|tool-based>') + ' - 成本分解方式');
    }
    
    if (!args.includes('--currency')) {
      hints.push(chalk.cyan('--currency') + chalk.gray(' <USD|CNY>') + ' - 货币单位');
    }

    return hints;
  }

  /**
   * 获取 compare 命令的提示
   */
  private getCompareHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--baseline')) {
      hints.push(chalk.cyan('--baseline') + chalk.gray(' <previous-week|previous-month|custom>') + ' - 比较基准');
    }
    
    if (!args.includes('--metrics')) {
      hints.push(chalk.cyan('--metrics') + chalk.gray(' <all|productivity|cost|usage>') + ' - 比较指标');
    }

    return hints;
  }

  /**
   * 获取 trends 命令的提示
   */
  private getTrendsHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--type')) {
      hints.push(chalk.cyan('--type') + chalk.gray(' <productivity|cost|usage|tools>') + ' - 趋势类型');
    }
    
    if (!args.includes('--granularity')) {
      hints.push(chalk.cyan('--granularity') + chalk.gray(' <daily|weekly|monthly>') + ' - 时间粒度');
    }

    return hints;
  }

  /**
   * 获取 insights 命令的提示
   */
  private getInsightsHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--priority')) {
      hints.push(chalk.cyan('--priority') + chalk.gray(' <high|medium|low|all>') + ' - 洞察优先级');
    }
    
    if (!args.includes('--category')) {
      hints.push(chalk.cyan('--category') + chalk.gray(' <productivity|cost|usage|tools>') + ' - 洞察类别');
    }

    return hints;
  }

  /**
   * 获取 export 命令的提示
   */
  private getExportHints(args: string[]): string[] {
    const hints = [];
    
    if (!args.includes('--type')) {
      hints.push(chalk.cyan('--type') + chalk.gray(' <all|stats|trends|insights>') + ' - 导出类型');
    }
    
    if (!args.includes('--export-format')) {
      hints.push(chalk.cyan('--export-format') + chalk.gray(' <json|csv|xlsx|pdf>') + ' - 导出格式');
    }
    
    if (!args.includes('--output')) {
      hints.push(chalk.cyan('--output') + chalk.gray(' <path>') + ' - 输出路径');
    }

    return hints;
  }
}

/**
 * 终端尺寸检测器
 */
export class TerminalSizeDetector {
  /**
   * 获取终端尺寸
   */
  getTerminalSize(): { width: number; height: number } {
    return {
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24
    };
  }

  /**
   * 检查是否为小屏幕终端
   */
  isSmallTerminal(): boolean {
    const { width, height } = this.getTerminalSize();
    return width < 80 || height < 24;
  }

  /**
   * 获取适合终端的文本宽度
   */
  getOptimalTextWidth(): number {
    const { width } = this.getTerminalSize();
    return Math.min(width - 10, 120); // 预留边距
  }

  /**
   * 获取适合终端的表格宽度
   */
  getOptimalTableWidth(): number {
    const { width } = this.getTerminalSize();
    return Math.min(width - 4, 100); // 预留边距
  }
}

/**
 * 输出格式化器
 */
export class OutputFormatter {
  private terminalDetector: TerminalSizeDetector;

  constructor() {
    this.terminalDetector = new TerminalSizeDetector();
  }

  /**
   * 智能换行文本
   */
  wrapText(text: string, maxWidth?: number): string[] {
    const width = maxWidth || this.terminalDetector.getOptimalTextWidth();
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * 格式化数据表格（自适应终端宽度）
   */
  formatTable(headers: string[], rows: string[][], options?: {
    maxWidth?: number;
    compact?: boolean;
  }): string[] {
    const maxWidth = options?.maxWidth || this.terminalDetector.getOptimalTableWidth();
    const compact = options?.compact || this.terminalDetector.isSmallTerminal();
    
    // 计算列宽
    const columnWidths = headers.map((header, index) => {
      const headerWidth = header.length;
      const maxRowWidth = Math.max(...rows.map(row => (row[index] || '').length));
      return Math.max(headerWidth, maxRowWidth);
    });

    // 调整列宽以适应终端
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + 
                       (columnWidths.length - 1) * 3; // 分隔符空间

    if (totalWidth > maxWidth) {
      // 按比例缩小列宽
      const scale = (maxWidth - (columnWidths.length - 1) * 3) / 
                    columnWidths.reduce((sum, width) => sum + width, 0);
      
      for (let i = 0; i < columnWidths.length; i++) {
        columnWidths[i] = Math.max(8, Math.floor(columnWidths[i] * scale));
      }
    }

    const lines: string[] = [];

    // 表头
    if (!compact) {
      const separator = columnWidths.map(width => '─'.repeat(width)).join('┬');
      lines.push('┌' + separator + '┐');
    }

    const headerLine = headers.map((header, index) => 
      header.padEnd(columnWidths[index]).substring(0, columnWidths[index])
    ).join(compact ? ' | ' : ' │ ');
    
    lines.push(compact ? headerLine : '│ ' + headerLine + ' │');

    // 分隔线
    if (compact) {
      lines.push(columnWidths.map(width => '─'.repeat(width)).join('─┼─'));
    } else {
      const separator = columnWidths.map(width => '─'.repeat(width)).join('┼');
      lines.push('├' + separator + '┤');
    }

    // 数据行
    rows.forEach((row, rowIndex) => {
      const rowLine = row.map((cell, index) => 
        (cell || '').padEnd(columnWidths[index]).substring(0, columnWidths[index])
      ).join(compact ? ' | ' : ' │ ');
      
      lines.push(compact ? rowLine : '│ ' + rowLine + ' │');
    });

    // 表尾
    if (!compact) {
      const separator = columnWidths.map(width => '─'.repeat(width)).join('┴');
      lines.push('└' + separator + '┘');
    }

    return lines;
  }

  /**
   * 居中文本
   */
  centerText(text: string, width?: number): string {
    const totalWidth = width || this.terminalDetector.getOptimalTextWidth();
    const padding = Math.max(0, Math.floor((totalWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * 创建分隔线
   */
  createSeparator(char: string = '─', width?: number): string {
    const totalWidth = width || this.terminalDetector.getOptimalTextWidth();
    return char.repeat(totalWidth);
  }
}

/**
 * 键盘快捷键处理器
 */
export class KeyboardHandler {
  private listeners: Map<string, () => void> = new Map();

  /**
   * 注册快捷键
   */
  registerShortcut(key: string, callback: () => void): void {
    this.listeners.set(key.toLowerCase(), callback);
  }

  /**
   * 启动键盘监听
   */
  startListening(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (key: string) => {
        // Ctrl+C 退出
        if (key === '\u0003') {
          console.log(chalk.yellow('\n\n👋 再见！'));
          process.exit(0);
        }

        const listener = this.listeners.get(key.toLowerCase());
        if (listener) {
          listener();
        }
      });
    }
  }

  /**
   * 停止键盘监听
   */
  stopListening(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }

  /**
   * 显示快捷键帮助
   */
  showHelp(): void {
    console.log(chalk.blue('\n⌨️  快捷键:'));
    console.log('  Ctrl+C  - 退出程序');
    console.log('  q       - 退出当前视图');
    console.log('  h       - 显示帮助');
    console.log('  r       - 刷新数据');
  }
}