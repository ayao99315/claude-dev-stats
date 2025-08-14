/**
 * CLI辅助工具测试
 */

import {
  PaginationManager,
  SmartHintProvider,
  TerminalSizeDetector,
  OutputFormatter,
  KeyboardHandler
} from '../../../src/utils/cli-helpers';

describe('CLI辅助工具', () => {
  describe('SmartHintProvider', () => {
    let hintProvider: SmartHintProvider;

    beforeEach(() => {
      hintProvider = new SmartHintProvider();
    });

    test('应该为stats命令提供参数提示', () => {
      const hints = hintProvider.getParameterHints('stats', []);
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some(hint => hint.includes('--timeframe'))).toBe(true);
    });

    test('应该为已提供的参数排除提示', () => {
      const hints = hintProvider.getParameterHints('stats', ['--timeframe', 'week']);
      expect(hints.some(hint => hint.includes('--timeframe'))).toBe(false);
    });

    test('应该为export命令提供提示', () => {
      const hints = hintProvider.getParameterHints('export', []);
      expect(hints.some(hint => hint.includes('--output'))).toBe(true);
    });

    test('应该处理未知命令', () => {
      const hints = hintProvider.getParameterHints('unknown', []);
      expect(hints).toEqual([]);
    });
  });

  describe('TerminalSizeDetector', () => {
    let detector: TerminalSizeDetector;

    beforeEach(() => {
      detector = new TerminalSizeDetector();
    });

    test('应该返回终端尺寸', () => {
      const size = detector.getTerminalSize();
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    });

    test('应该返回适合的文本宽度', () => {
      const width = detector.getOptimalTextWidth();
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(120);
    });

    test('应该检测小屏幕终端', () => {
      // 备份原始值
      const originalColumns = process.stdout.columns;
      const originalRows = process.stdout.rows;

      // 模拟小屏幕
      (process.stdout as any).columns = 60;
      (process.stdout as any).rows = 20;

      const isSmall = detector.isSmallTerminal();
      expect(isSmall).toBe(true);

      // 恢复原始值
      (process.stdout as any).columns = originalColumns;
      (process.stdout as any).rows = originalRows;
    });
  });

  describe('OutputFormatter', () => {
    let formatter: OutputFormatter;

    beforeEach(() => {
      formatter = new OutputFormatter();
    });

    test('应该正确包装文本', () => {
      const text = 'This is a very long text that should be wrapped to multiple lines when the width is limited';
      const lines = formatter.wrapText(text, 20);
      
      expect(lines.length).toBeGreaterThan(1);
      lines.forEach(line => {
        expect(line.length).toBeLessThanOrEqual(20);
      });
    });

    test('应该格式化表格', () => {
      const headers = ['Name', 'Value', 'Description'];
      const rows = [
        ['Item1', '100', 'First item'],
        ['Item2', '200', 'Second item']
      ];

      const table = formatter.formatTable(headers, rows);
      expect(table.length).toBeGreaterThan(0);
      expect(table[0]).toContain('Name');
    });

    test('应该处理空表格数据', () => {
      const headers = ['Name', 'Value'];
      const rows: string[][] = [];

      const table = formatter.formatTable(headers, rows);
      expect(table.length).toBeGreaterThan(0);
    });

    test('应该居中文本', () => {
      const text = 'Hello';
      const centered = formatter.centerText(text, 20);
      
      expect(centered.length).toBeGreaterThanOrEqual(text.length);
      expect(centered.trim()).toBe(text);
    });

    test('应该创建分隔线', () => {
      const separator = formatter.createSeparator('=', 10);
      expect(separator).toBe('==========');
    });
  });

  describe('KeyboardHandler', () => {
    let handler: KeyboardHandler;

    beforeEach(() => {
      handler = new KeyboardHandler();
    });

    test('应该注册快捷键', () => {
      let called = false;
      const callback = () => { called = true; };
      
      handler.registerShortcut('q', callback);
      
      // 验证注册成功（通过内部状态）
      expect(handler['listeners'].has('q')).toBe(true);
    });

    test('应该显示帮助信息', () => {
      // 模拟console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      handler.showHelp();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('快捷键'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('PaginationManager', () => {
    let manager: PaginationManager;

    beforeEach(() => {
      manager = new PaginationManager(5); // 每页5行用于测试
    });

    test('应该设置正确的页面大小', () => {
      expect(manager['pageSize']).toBe(5);
    });

    test('应该处理少于一页的内容', async () => {
      const content = ['line1', 'line2', 'line3'];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await manager.displayPaginated(content, 'Test');
      
      expect(consoleSpy).toHaveBeenCalledWith('line1');
      expect(consoleSpy).toHaveBeenCalledWith('line2');
      expect(consoleSpy).toHaveBeenCalledWith('line3');
      
      consoleSpy.mockRestore();
    });

    test('应该处理空内容', async () => {
      const content: string[] = [];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await manager.displayPaginated(content, 'Test');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('没有内容'));
      
      consoleSpy.mockRestore();
    });
  });
});