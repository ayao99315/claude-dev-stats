/**
 * 参数验证器单元测试
 */

import { ParameterValidator } from '../../../src/commands/validator';
import { ParameterValidationError } from '../../../src/types/commands';

describe('ParameterValidator', () => {
  let validator: ParameterValidator;

  beforeEach(() => {
    validator = new ParameterValidator();
  });

  describe('validateOptions', () => {
    it('应该验证有效的基础选项', () => {
      const options = {
        project: '/path/to/project',
        timeframe: 'today',
        format: 'table',
        language: 'zh-CN'
      };

      const result = validator.validateOptions(options, 'stats');
      
      expect(result.project).toBe('/path/to/project');
      expect(result.timeframe).toBe('today');
      expect(result.format).toBe('table');
      expect(result.language).toBe('zh-CN');
    });

    it('应该验证布尔选项', () => {
      const options = {
        verbose: true,
        noColor: false
      };

      const result = validator.validateOptions(options, 'stats');
      
      expect(result.verbose).toBe(true);
      expect(result.noColor).toBe(false);
    });

    it('应该验证数组选项', () => {
      const options = {
        include: ['basic', 'efficiency'],
        exclude: 'trends,insights'  // 字符串格式
      };

      const result = validator.validateOptions(options, 'stats');
      
      expect(result.include).toEqual(['basic', 'efficiency']);
      expect(result.exclude).toEqual(['trends', 'insights']);
    });
  });

  describe('validateTimeframe', () => {
    it('应该接受有效的时间范围', () => {
      expect(() => validator.validateTimeframe('today')).not.toThrow();
      expect(() => validator.validateTimeframe('week')).not.toThrow();
      expect(() => validator.validateTimeframe('month')).not.toThrow();
    });

    it('应该拒绝无效的时间范围', () => {
      expect(() => validator.validateTimeframe('invalid')).toThrow(ParameterValidationError);
    });

    it('应该验证自定义时间范围', () => {
      const from = '2024-01-01';
      const to = '2024-01-31';

      expect(() => validator.validateTimeframe('custom', from, to)).not.toThrow();
    });

    it('应该拒绝缺少日期的自定义时间范围', () => {
      expect(() => validator.validateTimeframe('custom')).toThrow(ParameterValidationError);
      expect(() => validator.validateTimeframe('custom', '2024-01-01')).toThrow(ParameterValidationError);
    });

    it('应该拒绝无效的日期格式', () => {
      expect(() => validator.validateTimeframe('custom', 'invalid-date', '2024-01-31'))
        .toThrow(ParameterValidationError);
      expect(() => validator.validateTimeframe('custom', '2024-01-01', 'invalid-date'))
        .toThrow(ParameterValidationError);
    });

    it('应该拒绝起始日期晚于结束日期', () => {
      expect(() => validator.validateTimeframe('custom', '2024-01-31', '2024-01-01'))
        .toThrow(ParameterValidationError);
    });

    it('应该拒绝超过365天的时间范围', () => {
      const from = '2023-01-01';
      const to = '2024-01-02'; // 超过365天

      expect(() => validator.validateTimeframe('custom', from, to))
        .toThrow(ParameterValidationError);
    });

    it('应该拒绝未来的日期', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      expect(() => validator.validateTimeframe('custom', today, futureDateStr))
        .toThrow(ParameterValidationError);
    });
  });

  describe('validateFormat', () => {
    it('应该接受有效的输出格式', () => {
      expect(() => validator.validateFormat('table')).not.toThrow();
      expect(() => validator.validateFormat('detailed')).not.toThrow();
      expect(() => validator.validateFormat('summary')).not.toThrow();
      expect(() => validator.validateFormat('json')).not.toThrow();
      expect(() => validator.validateFormat('chart')).not.toThrow();
    });

    it('应该拒绝无效的输出格式', () => {
      expect(() => validator.validateFormat('invalid')).toThrow(ParameterValidationError);
    });

    it('应该允许undefined格式', () => {
      expect(() => validator.validateFormat(undefined)).not.toThrow();
    });
  });

  describe('工具命令选项验证', () => {
    it('应该验证有效的排序选项', () => {
      const options = { sortBy: 'usage' };
      expect(() => validator.validateOptions(options, 'stats:tools')).not.toThrow();
    });

    it('应该拒绝无效的排序选项', () => {
      const options = { sortBy: 'invalid' };
      expect(() => validator.validateOptions(options, 'stats:tools')).toThrow(ParameterValidationError);
    });

    it('应该验证top参数', () => {
      const validOptions = { top: '10' };
      expect(() => validator.validateOptions(validOptions, 'stats:tools')).not.toThrow();

      const invalidOptions = { top: 'invalid' };
      expect(() => validator.validateOptions(invalidOptions, 'stats:tools')).toThrow(ParameterValidationError);

      const outOfRangeOptions = { top: '150' };
      expect(() => validator.validateOptions(outOfRangeOptions, 'stats:tools')).toThrow(ParameterValidationError);
    });
  });

  describe('成本命令选项验证', () => {
    it('应该验证有效的breakdown选项', () => {
      const options = { breakdown: 'daily' };
      expect(() => validator.validateOptions(options, 'stats:cost')).not.toThrow();
    });

    it('应该验证有效的货币选项', () => {
      const options = { currency: 'USD' };
      expect(() => validator.validateOptions(options, 'stats:cost')).not.toThrow();
    });

    it('应该拒绝无效的breakdown选项', () => {
      const options = { breakdown: 'invalid' };
      expect(() => validator.validateOptions(options, 'stats:cost')).toThrow(ParameterValidationError);
    });

    it('应该拒绝无效的货币选项', () => {
      const options = { currency: 'INVALID' };
      expect(() => validator.validateOptions(options, 'stats:cost')).toThrow(ParameterValidationError);
    });
  });

  describe('比较命令选项验证', () => {
    it('应该验证有效的baseline选项', () => {
      const options = { baseline: 'previous-week' };
      expect(() => validator.validateOptions(options, 'stats:compare')).not.toThrow();
    });

    it('应该验证自定义基准的日期', () => {
      const options = {
        baseline: 'custom',
        baselineFrom: '2024-01-01',
        baselineTo: '2024-01-07'
      };
      expect(() => validator.validateOptions(options, 'stats:compare')).not.toThrow();
    });

    it('应该拒绝缺少日期的自定义基准', () => {
      const options = { baseline: 'custom' };
      expect(() => validator.validateOptions(options, 'stats:compare')).toThrow(ParameterValidationError);
    });
  });

  describe('趋势命令选项验证', () => {
    it('应该验证有效的趋势类型', () => {
      const options = { type: 'productivity' };
      expect(() => validator.validateOptions(options, 'stats:trends')).not.toThrow();
    });

    it('应该验证有效的数据粒度', () => {
      const options = { granularity: 'daily' };
      expect(() => validator.validateOptions(options, 'stats:trends')).not.toThrow();
    });

    it('应该验证预测天数', () => {
      const validOptions = { forecast: '7' };
      expect(() => validator.validateOptions(validOptions, 'stats:trends')).not.toThrow();

      const invalidOptions = { forecast: '200' };
      expect(() => validator.validateOptions(invalidOptions, 'stats:trends')).toThrow(ParameterValidationError);
    });
  });

  describe('导出命令选项验证', () => {
    it('应该验证有效的导出类型', () => {
      const options = { type: 'all' };
      expect(() => validator.validateOptions(options, 'stats:export')).not.toThrow();
    });

    it('应该验证有效的导出格式', () => {
      const options = { exportFormat: 'json' };
      expect(() => validator.validateOptions(options, 'stats:export')).not.toThrow();
    });

    it('应该拒绝无效的导出类型', () => {
      const options = { type: 'invalid' };
      expect(() => validator.validateOptions(options, 'stats:export')).toThrow(ParameterValidationError);
    });

    it('应该拒绝无效的导出格式', () => {
      const options = { exportFormat: 'invalid' };
      expect(() => validator.validateOptions(options, 'stats:export')).toThrow(ParameterValidationError);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空选项对象', () => {
      expect(() => validator.validateOptions({}, 'stats')).not.toThrow();
    });

    it('应该处理null和undefined值', () => {
      const options = {
        project: null,
        timeframe: undefined,
        verbose: null
      };

      // 不应该抛出错误，应该过滤掉null/undefined值
      expect(() => validator.validateOptions(options, 'stats')).not.toThrow();
    });

    it('应该验证项目路径不包含危险字符', () => {
      const dangerousPaths = [
        '/path/with<danger',
        '/path/with>danger',
        '/path/with|danger',
        '/path/with"danger',
        '/path/with*danger',
        '/path/with?danger'
      ];

      dangerousPaths.forEach(path => {
        const options = { project: path };
        expect(() => validator.validateOptions(options, 'stats')).toThrow(ParameterValidationError);
      });
    });

    it('应该验证数组参数为空的情况', () => {
      const options = { include: [] };
      expect(() => validator.validateOptions(options, 'stats')).toThrow(ParameterValidationError);
    });
  });

  describe('ParameterValidationError', () => {
    it('应该创建正确的错误信息', () => {
      const error = new ParameterValidationError('test', 'invalid', 'string', '自定义错误消息');
      
      expect(error.parameter).toBe('test');
      expect(error.value).toBe('invalid');
      expect(error.expectedType).toBe('string');
      expect(error.message).toBe('自定义错误消息');
      expect(error.name).toBe('ParameterValidationError');
    });

    it('应该生成默认错误消息', () => {
      const error = new ParameterValidationError('test', 'invalid', 'string');
      
      expect(error.message).toContain('参数 test 的值 invalid 不符合期望的类型 string');
    });
  });
});