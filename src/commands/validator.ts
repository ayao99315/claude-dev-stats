/**
 * 命令参数验证器
 * 提供类型安全的参数验证和错误处理
 */

import {
  CommandOptions,
  CommandName,
  ParameterValidator as IParameterValidator,
  ParameterValidationError
} from '../types/commands';
import { Logger } from '../utils/logger';

export class ParameterValidator implements IParameterValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ 
      level: 'debug', 
      colorize: true, 
      file_output: false,
      max_file_size: 10 * 1024 * 1024,
      max_files: 5
    });
  }

  /**
   * 验证命令选项
   */
  validateOptions(options: any, commandName: CommandName): CommandOptions {
    this.logger.debug('验证命令选项', { commandName, options });

    const validatedOptions: CommandOptions = {};

    // 验证项目路径
    if (options.project !== undefined && options.project !== null) {
      validatedOptions.project = this.validateProjectPath(options.project);
    }

    // 验证时间范围
    this.validateTimeframe(options.timeframe, options.from, options.to);
    validatedOptions.timeframe = options.timeframe;
    if (options.from) validatedOptions.from = options.from;
    if (options.to) validatedOptions.to = options.to;

    // 验证输出格式
    this.validateFormat(options.format);
    validatedOptions.format = options.format;

    // 验证语言
    if (options.language !== undefined) {
      validatedOptions.language = this.validateLanguage(options.language);
    }

    // 验证输出文件路径
    if (options.output !== undefined) {
      validatedOptions.output = this.validateOutputPath(options.output);
    }

    // 验证布尔选项
    if (options.verbose !== undefined) {
      validatedOptions.verbose = Boolean(options.verbose);
    }

    if (options.noColor !== undefined) {
      validatedOptions.noColor = Boolean(options.noColor);
    }

    // 验证数组选项
    if (options.include !== undefined) {
      validatedOptions.include = this.validateStringArray(options.include, 'include');
    }

    if (options.exclude !== undefined) {
      validatedOptions.exclude = this.validateStringArray(options.exclude, 'exclude');
    }

    // 根据命令类型验证特定选项
    this.validateCommandSpecificOptions(options, commandName);

    this.logger.debug('参数验证完成', { validatedOptions });
    return validatedOptions;
  }

  /**
   * 验证时间范围
   */
  validateTimeframe(timeframe?: string, from?: string, to?: string): void {
    if (!timeframe) return;

    const validTimeframes = ['today', 'week', 'month', 'custom'];
    if (!validTimeframes.includes(timeframe)) {
      throw new ParameterValidationError(
        'timeframe',
        timeframe,
        'today|week|month|custom',
        `时间范围必须是: ${validTimeframes.join('|')}`
      );
    }

    // 自定义时间范围需要提供起止日期
    if (timeframe === 'custom') {
      if (!from || !to) {
        throw new ParameterValidationError(
          'timeframe',
          'custom',
          'with from and to dates',
          '自定义时间范围需要同时提供 --from 和 --to 参数'
        );
      }

      this.validateDateString(from, 'from');
      this.validateDateString(to, 'to');

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (fromDate >= toDate) {
        throw new ParameterValidationError(
          'timeframe',
          `${from} to ${to}`,
          'from < to',
          '起始日期必须早于结束日期'
        );
      }

      // 检查日期范围是否合理（不超过1年）
      const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        throw new ParameterValidationError(
          'timeframe',
          `${daysDiff} days`,
          '≤ 365 days',
          '时间范围不能超过365天'
        );
      }
    }
  }

  /**
   * 验证输出格式
   */
  validateFormat(format?: string): void {
    if (!format) return;

    const validFormats = ['table', 'detailed', 'summary', 'json', 'chart'];
    if (!validFormats.includes(format)) {
      throw new ParameterValidationError(
        'format',
        format,
        'table|detailed|summary|json|chart',
        `输出格式必须是: ${validFormats.join('|')}`
      );
    }
  }

  /**
   * 验证项目路径
   */
  private validateProjectPath(path: string): string {
    if (typeof path !== 'string' || path.trim().length === 0) {
      throw new ParameterValidationError(
        'project',
        path,
        'non-empty string',
        '项目路径不能为空'
      );
    }

    // 基本路径格式验证
    const cleanPath = path.trim();
    
    // 检查是否包含危险字符
    const dangerousChars = ['<', '>', '|', '"', '*', '?'];
    for (const char of dangerousChars) {
      if (cleanPath.includes(char)) {
        throw new ParameterValidationError(
          'project',
          path,
          'valid path',
          `项目路径包含无效字符: ${char}`
        );
      }
    }

    return cleanPath;
  }

  /**
   * 验证语言设置
   */
  private validateLanguage(language: string): 'zh-CN' | 'en-US' {
    const validLanguages = ['zh-CN', 'en-US'];
    if (!validLanguages.includes(language)) {
      throw new ParameterValidationError(
        'language',
        language,
        'zh-CN|en-US',
        `语言设置必须是: ${validLanguages.join('|')}`
      );
    }
    return language as 'zh-CN' | 'en-US';
  }

  /**
   * 验证输出文件路径
   */
  private validateOutputPath(outputPath: string): string {
    if (typeof outputPath !== 'string' || outputPath.trim().length === 0) {
      throw new ParameterValidationError(
        'output',
        outputPath,
        'non-empty string',
        '输出文件路径不能为空'
      );
    }

    const cleanPath = outputPath.trim();
    
    // 检查文件扩展名是否合理
    const supportedExtensions = ['.json', '.csv', '.txt', '.md', '.html'];
    const hasValidExtension = supportedExtensions.some(ext => 
      cleanPath.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension && cleanPath.includes('.')) {
      // 如果包含点但不是支持的扩展名，给出警告而不是错误
      this.logger.warn('输出文件扩展名可能不受支持', { 
        path: cleanPath, 
        supportedExtensions 
      });
    }

    return cleanPath;
  }

  /**
   * 验证日期字符串
   */
  private validateDateString(dateStr: string, paramName: string): void {
    if (typeof dateStr !== 'string') {
      throw new ParameterValidationError(
        paramName,
        dateStr,
        'string',
        `${paramName} 必须是字符串格式`
      );
    }

    // 验证日期格式 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      throw new ParameterValidationError(
        paramName,
        dateStr,
        'YYYY-MM-DD',
        `${paramName} 必须是 YYYY-MM-DD 格式`
      );
    }

    // 验证日期是否有效
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new ParameterValidationError(
        paramName,
        dateStr,
        'valid date',
        `${paramName} 不是有效的日期`
      );
    }

    // 验证日期不能是未来
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (date > today) {
      throw new ParameterValidationError(
        paramName,
        dateStr,
        'not future date',
        `${paramName} 不能是未来的日期`
      );
    }

    // 验证日期不能太久远（2年内）
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (date < twoYearsAgo) {
      throw new ParameterValidationError(
        paramName,
        dateStr,
        'within 2 years',
        `${paramName} 不能早于2年前`
      );
    }
  }

  /**
   * 验证字符串数组
   */
  private validateStringArray(value: any, paramName: string): string[] {
    if (!Array.isArray(value)) {
      // 如果不是数组，尝试分割字符串
      if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      throw new ParameterValidationError(
        paramName,
        value,
        'array of strings',
        `${paramName} 必须是字符串数组或逗号分隔的字符串`
      );
    }

    const stringArray = value.map((item, index) => {
      if (typeof item !== 'string') {
        throw new ParameterValidationError(
          `${paramName}[${index}]`,
          item,
          'string',
          `${paramName} 数组中的第${index + 1}个元素必须是字符串`
        );
      }
      return item.trim();
    }).filter(s => s.length > 0);

    if (stringArray.length === 0) {
      throw new ParameterValidationError(
        paramName,
        value,
        'non-empty array',
        `${paramName} 不能为空数组`
      );
    }

    return stringArray;
  }

  /**
   * 验证命令特定选项
   */
  private validateCommandSpecificOptions(options: any, commandName: CommandName): void {
    switch (commandName) {
    case 'stats:tools':
      this.validateToolsOptions(options);
      break;
    case 'stats:cost':
      this.validateCostOptions(options);
      break;
    case 'stats:compare':
      this.validateCompareOptions(options);
      break;
    case 'stats:trends':
      this.validateTrendsOptions(options);
      break;
    case 'stats:export':
      this.validateExportOptions(options);
      break;
    default:
      // 其他命令无特殊验证需求
      break;
    }
  }

  /**
   * 验证工具分析选项
   */
  private validateToolsOptions(options: any): void {
    if (options.sortBy) {
      const validSortBy = ['usage', 'efficiency', 'time'];
      if (!validSortBy.includes(options.sortBy)) {
        throw new ParameterValidationError(
          'sortBy',
          options.sortBy,
          'usage|efficiency|time',
          `排序方式必须是: ${validSortBy.join('|')}`
        );
      }
    }

    if (options.top !== undefined) {
      const topNumber = parseInt(options.top, 10);
      if (isNaN(topNumber) || topNumber < 1 || topNumber > 100) {
        throw new ParameterValidationError(
          'top',
          options.top,
          '1-100',
          'top 参数必须是1-100之间的数字'
        );
      }
    }
  }

  /**
   * 验证成本分析选项
   */
  private validateCostOptions(options: any): void {
    if (options.breakdown) {
      const validBreakdowns = ['hourly', 'daily', 'tool-based'];
      if (!validBreakdowns.includes(options.breakdown)) {
        throw new ParameterValidationError(
          'breakdown',
          options.breakdown,
          'hourly|daily|tool-based',
          `成本分解方式必须是: ${validBreakdowns.join('|')}`
        );
      }
    }

    if (options.currency) {
      const validCurrencies = ['USD', 'CNY'];
      if (!validCurrencies.includes(options.currency)) {
        throw new ParameterValidationError(
          'currency',
          options.currency,
          'USD|CNY',
          `货币单位必须是: ${validCurrencies.join('|')}`
        );
      }
    }
  }

  /**
   * 验证比较分析选项
   */
  private validateCompareOptions(options: any): void {
    if (options.baseline) {
      const validBaselines = ['previous-week', 'previous-month', 'custom'];
      if (!validBaselines.includes(options.baseline)) {
        throw new ParameterValidationError(
          'baseline',
          options.baseline,
          'previous-week|previous-month|custom',
          `比较基准必须是: ${validBaselines.join('|')}`
        );
      }

      // 自定义基准需要提供日期
      if (options.baseline === 'custom') {
        if (!options.baselineFrom || !options.baselineTo) {
          throw new ParameterValidationError(
            'baseline',
            'custom',
            'with baseline dates',
            '自定义基准需要提供 --baseline-from 和 --baseline-to 参数'
          );
        }

        this.validateDateString(options.baselineFrom, 'baselineFrom');
        this.validateDateString(options.baselineTo, 'baselineTo');
      }
    }
  }

  /**
   * 验证趋势分析选项
   */
  private validateTrendsOptions(options: any): void {
    if (options.type) {
      const validTypes = ['productivity', 'cost', 'usage', 'tools'];
      if (!validTypes.includes(options.type)) {
        throw new ParameterValidationError(
          'type',
          options.type,
          'productivity|cost|usage|tools',
          `趋势类型必须是: ${validTypes.join('|')}`
        );
      }
    }

    if (options.granularity) {
      const validGranularities = ['daily', 'weekly', 'monthly'];
      if (!validGranularities.includes(options.granularity)) {
        throw new ParameterValidationError(
          'granularity',
          options.granularity,
          'daily|weekly|monthly',
          `数据粒度必须是: ${validGranularities.join('|')}`
        );
      }
    }

    if (options.forecast !== undefined) {
      const forecastDays = parseInt(options.forecast, 10);
      if (isNaN(forecastDays) || forecastDays < 1 || forecastDays > 90) {
        throw new ParameterValidationError(
          'forecast',
          options.forecast,
          '1-90',
          '预测天数必须是1-90之间的数字'
        );
      }
    }
  }

  /**
   * 验证导出选项
   */
  private validateExportOptions(options: any): void {
    if (options.type) {
      const validTypes = ['all', 'stats', 'trends', 'insights'];
      if (!validTypes.includes(options.type)) {
        throw new ParameterValidationError(
          'type',
          options.type,
          'all|stats|trends|insights',
          `导出类型必须是: ${validTypes.join('|')}`
        );
      }
    }

    if (options.exportFormat) {
      const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
      if (!validFormats.includes(options.exportFormat)) {
        throw new ParameterValidationError(
          'exportFormat',
          options.exportFormat,
          'json|csv|xlsx|pdf',
          `导出格式必须是: ${validFormats.join('|')}`
        );
      }
    }
  }
}