/**
 * 交互式辅助功能单元测试
 */

import { InteractiveHelper, CommandCompletionProvider } from '../../../src/commands/interactive';

// Mock console methods
const mockConsoleLog = jest.fn();
const mockProcessStdoutWrite = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  console.log = mockConsoleLog;
  process.stdout.write = mockProcessStdoutWrite;
});

describe('InteractiveHelper', () => {
  let helper: InteractiveHelper;

  beforeEach(() => {
    helper = new InteractiveHelper();
  });

  afterEach(() => {
    // 确保清理任何活动的spinner
    helper.hideSpinner();
  });

  describe('showSpinner', () => {
    it('应该启动加载动画', (done) => {
      helper.showSpinner('测试加载中...');
      
      // 等待一小段时间让spinner开始
      setTimeout(() => {
        expect(mockProcessStdoutWrite).toHaveBeenCalled();
        helper.hideSpinner();
        done();
      }, 150);
    });

    it('应该显示正确的消息', (done) => {
      const message = '正在分析数据...';
      helper.showSpinner(message);
      
      setTimeout(() => {
        const calls = mockProcessStdoutWrite.mock.calls;
        const hasMessage = calls.some(call => 
          call[0] && call[0].includes(message)
        );
        expect(hasMessage).toBe(true);
        helper.hideSpinner();
        done();
      }, 150);
    });
  });

  describe('hideSpinner', () => {
    it('应该清除spinner显示', () => {
      helper.showSpinner('测试');
      helper.hideSpinner();
      
      // 应该调用清除命令
      expect(mockProcessStdoutWrite).toHaveBeenCalledWith('\r\x1B[K');
      expect(mockProcessStdoutWrite).toHaveBeenCalledWith('\x1B[?25h');
    });
  });

  describe('消息显示方法', () => {
    it('应该显示成功消息', () => {
      helper.showSuccess('操作成功');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ 操作成功'));
    });

    it('应该显示警告消息', () => {
      helper.showWarning('注意事项');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('⚠️  注意事项'));
    });

    it('应该显示错误消息', () => {
      helper.showError('错误信息');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('❌ 错误信息'));
    });

    it('应该显示信息消息', () => {
      helper.showInfo('提示信息');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('ℹ️  提示信息'));
    });
  });

  describe('showProgressBar', () => {
    it('应该显示正确的进度', () => {
      helper.showProgressBar(5, 10, '处理中');
      
      const calls = mockProcessStdoutWrite.mock.calls;
      const progressCall = calls.find(call => 
        call[0] && call[0].includes('50%') && call[0].includes('(5/10)')
      );
      expect(progressCall).toBeDefined();
    });

    it('应该处理完成状态', () => {
      helper.showProgressBar(10, 10);
      
      // 完成时应该有换行
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('格式化方法', () => {
    it('应该格式化大数字', () => {
      expect(helper.formatNumber(1234567)).toBe('1.2M');
      expect(helper.formatNumber(12345)).toBe('12.3K');
      expect(helper.formatNumber(123)).toBe('123');
    });

    it('应该格式化百分比', () => {
      expect(helper.formatPercentage(85.67)).toBe('85.7%');
      expect(helper.formatPercentage(100)).toBe('100.0%');
    });

    it('应该格式化时长', () => {
      expect(helper.formatDuration(0.5)).toBe('30分钟');
      expect(helper.formatDuration(2.5)).toBe('2.5小时');
      expect(helper.formatDuration(25.5)).toBe('1天1.5小时');
    });
  });

  describe('showTableHeader', () => {
    it('应该显示格式化的表格标题', () => {
      helper.showTableHeader('测试标题');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      const calls = mockConsoleLog.mock.calls;
      
      // 检查是否包含边框字符
      expect(calls.some(call => call[0].includes('╔'))).toBe(true);
      expect(calls.some(call => call[0].includes('测试标题'))).toBe(true);
      expect(calls.some(call => call[0].includes('╚'))).toBe(true);
    });
  });

  describe('showSectionHeader', () => {
    it('应该显示分段标题', () => {
      helper.showSectionHeader('数据分析');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      const calls = mockConsoleLog.mock.calls;
      
      expect(calls.some(call => call[0].includes('📊 数据分析'))).toBe(true);
      expect(calls.some(call => call[0].includes('─'))).toBe(true);
    });
  });

  describe('showKeyValue', () => {
    it('应该显示键值对', () => {
      helper.showKeyValue('总计', '100', 'green');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('总计:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('100'));
    });
  });

  describe('showStatistic', () => {
    it('应该显示统计数据', () => {
      helper.showStatistic('处理速度', 1500, 'tokens/h', 'up');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('处理速度:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('1,500 tokens/h')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('↗️')
      );
    });

    it('应该处理不同的趋势', () => {
      helper.showStatistic('成本', 50, 'USD', 'down');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('↘️'));

      helper.showStatistic('效率', 85, '%', 'stable');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('➡️'));
    });
  });

  describe('showTimeInfo', () => {
    it('应该显示时间信息', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      helper.showTimeInfo('最后更新', testDate);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('最后更新:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('2024')
      );
    });

    it('应该处理字符串日期', () => {
      helper.showTimeInfo('创建时间', '2024-01-15T10:30:00Z');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('创建时间:')
      );
    });
  });

  describe('createBarChart', () => {
    it('应该创建ASCII柱状图', () => {
      const data = [
        { label: '工具A', value: 100 },
        { label: '工具B', value: 75 },
        { label: '工具C', value: 50 }
      ];

      const chart = helper.createBarChart(data, 20);
      
      expect(chart).toHaveLength(3);
      expect(chart[0]).toContain('工具A');
      expect(chart[0]).toContain('100.0%');
      expect(chart[1]).toContain('工具B');
      expect(chart[1]).toContain('75.0%');
      expect(chart[2]).toContain('工具C');
      expect(chart[2]).toContain('50.0%');
    });

    it('应该处理空数据', () => {
      const chart = helper.createBarChart([]);
      expect(chart).toHaveLength(0);
    });
  });

  describe('showChart', () => {
    it('应该显示图表', () => {
      const data = [
        { label: '测试项', value: 10 }
      ];

      helper.showChart('测试图表', data);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📊 测试图表')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('测试项')
      );
    });
  });

  describe('其他辅助方法', () => {
    it('应该显示分隔线', () => {
      helper.showDivider('=', 30);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('='.repeat(30))
      );
    });

    it('应该显示欢迎信息', () => {
      helper.showWelcome();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Claude Code 开发统计分析工具')
      );
    });

    it('应该显示执行时间', () => {
      const startTime = Date.now() - 1500; // 1.5秒前
      helper.showExecutionTime(startTime);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('执行时间:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('1.5')
      );
    });

    it('应该显示内存使用情况', () => {
      helper.showMemoryUsage();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('💾 内存使用:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('RSS:')
      );
    });
  });
});

describe('CommandCompletionProvider', () => {
  let provider: CommandCompletionProvider;

  beforeEach(() => {
    provider = new CommandCompletionProvider();
  });

  describe('getCommandCompletions', () => {
    it('应该返回匹配的命令', () => {
      const completions = provider.getCommandCompletions('stat');
      
      expect(completions).toContain('stats');
      expect(completions).toContain('stats:basic');
      expect(completions).toContain('stats:efficiency');
    });

    it('应该返回别名', () => {
      const completions = provider.getCommandCompletions('st');
      
      expect(completions).toContain('st');
    });

    it('应该处理空输入', () => {
      const completions = provider.getCommandCompletions('');
      
      expect(completions.length).toBeGreaterThan(0);
      expect(completions).toContain('stats');
    });

    it('应该处理无匹配的情况', () => {
      const completions = provider.getCommandCompletions('xyz');
      
      expect(completions).toHaveLength(0);
    });

    it('应该忽略大小写', () => {
      const completions = provider.getCommandCompletions('STAT');
      
      expect(completions).toContain('stats');
    });

    it('应该按字母顺序排序', () => {
      const completions = provider.getCommandCompletions('');
      
      for (let i = 1; i < completions.length; i++) {
        expect(completions[i - 1].localeCompare(completions[i])).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('getOptionCompletions', () => {
    it('应该返回stats命令的选项补全', () => {
      const completions = provider.getOptionCompletions('stats', '--timeframe', '');
      
      expect(completions).toContain('today');
      expect(completions).toContain('week');
      expect(completions).toContain('month');
      expect(completions).toContain('custom');
    });

    it('应该返回format选项的补全', () => {
      const completions = provider.getOptionCompletions('stats', '--format', '');
      
      expect(completions).toContain('table');
      expect(completions).toContain('detailed');
      expect(completions).toContain('summary');
      expect(completions).toContain('json');
      expect(completions).toContain('chart');
    });

    it('应该返回tools命令的排序选项', () => {
      const completions = provider.getOptionCompletions('tools', '--sort-by', '');
      
      expect(completions).toContain('usage');
      expect(completions).toContain('efficiency');
      expect(completions).toContain('time');
    });

    it('应该返回cost命令的breakdown选项', () => {
      const completions = provider.getOptionCompletions('cost', '--breakdown', '');
      
      expect(completions).toContain('hourly');
      expect(completions).toContain('daily');
      expect(completions).toContain('tool-based');
    });

    it('应该过滤匹配的选项', () => {
      const completions = provider.getOptionCompletions('stats', '--timeframe', 'to');
      
      expect(completions).toContain('today');
      expect(completions).not.toContain('week');
      expect(completions).not.toContain('month');
    });

    it('应该处理未知命令', () => {
      const completions = provider.getOptionCompletions('unknown', '--option', '');
      
      expect(completions).toHaveLength(0);
    });

    it('应该处理未知选项', () => {
      const completions = provider.getOptionCompletions('stats', '--unknown', '');
      
      expect(completions).toHaveLength(0);
    });

    it('应该忽略大小写匹配', () => {
      const completions = provider.getOptionCompletions('stats', '--timeframe', 'TO');
      
      expect(completions).toContain('today');
    });

    it('应该按字母顺序排序', () => {
      const completions = provider.getOptionCompletions('stats', '--format', '');
      
      for (let i = 1; i < completions.length; i++) {
        expect(completions[i - 1].localeCompare(completions[i])).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('getPathCompletions', () => {
    it('应该返回路径补全建议', () => {
      const completions = provider.getPathCompletions('./');
      
      expect(completions).toContain('./');
      expect(completions).toContain('./src/');
    });

    it('应该过滤匹配的路径', () => {
      const completions = provider.getPathCompletions('./s');
      
      expect(completions).toContain('./src/');
      expect(completions).not.toContain('./dist/');
    });

    it('应该处理相对路径', () => {
      const completions = provider.getPathCompletions('../');
      
      expect(completions).toContain('../');
    });

    it('应该排序结果', () => {
      const completions = provider.getPathCompletions('');
      
      for (let i = 1; i < completions.length; i++) {
        expect(completions[i - 1].localeCompare(completions[i])).toBeLessThanOrEqual(0);
      }
    });
  });
});