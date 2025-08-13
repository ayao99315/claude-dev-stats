/**
 * 报告生成器单元测试
 * 测试报告生成功能的各个方面：缓存、格式化、导出等
 */

import { ReportGenerator } from '../../../src/reports/generator';
import { ReportConfig, ReportTemplate, ReportType, ReportFormat, Language } from '../../../src/types/reports';
import { AnalysisResult, BasicStats, EfficiencyMetrics } from '../../../src/types/analytics';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock fs 模块
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  let mockAnalysisResult: AnalysisResult;
  let mockReportConfig: ReportConfig;

  beforeEach(() => {
    generator = new ReportGenerator();
    
    // 创建模拟分析结果
    mockAnalysisResult = {
      timeframe: '今日',
      project_path: '/test/project',
      basic_stats: {
        total_time_hours: 2.5,
        total_tokens: 1500,
        total_cost: 0.05,
        files_modified: 3,
        sessions_count: 2,
        tool_usage: {
          'Edit': 10,
          'Read': 5,
          'Write': 2
        }
      } as BasicStats,
      efficiency: {
        productivity_score: 7.5,
        efficiency_rating: 'Good',
        tokens_per_hour: 600,
        estimated_lines_per_hour: 120,
        estimated_lines_generated: 300,
        tool_analysis: []
      } as EfficiencyMetrics,
      data_source: 'cost_api',
      generated_at: '2025-08-13T10:00:00.000Z',
      data_quality: {
        completeness: 0.9,
        reliability: 0.8,
        freshness: 0.95
      }
    };

    // 创建模拟报告配置
    mockReportConfig = {
      type: 'daily',
      format: 'table',
      language: 'zh-CN',
      include_charts: false,
      include_insights: false
    };

    // 重置所有mocks
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('应该成功生成日报', async () => {
      const result = await generator.generateReport(mockAnalysisResult, mockReportConfig);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Claude Code 日报');
      expect(result).toContain('今日');
      expect(result).toContain('/test/project');
    });

    it('应该支持英文报告生成', async () => {
      const englishConfig: ReportConfig = {
        ...mockReportConfig,
        language: 'en-US'
      };

      const result = await generator.generateReport(mockAnalysisResult, englishConfig);
      
      expect(result).toBeDefined();
      expect(result).toContain('Claude Code Daily Report');
    });

    it('应该支持不同的报告格式', async () => {
      const formats: ReportFormat[] = ['table', 'detailed', 'brief'];
      
      for (const format of formats) {
        const config: ReportConfig = {
          ...mockReportConfig,
          format
        };

        const result = await generator.generateReport(mockAnalysisResult, config);
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('应该正确处理效率报告类型', async () => {
      const efficiencyConfig: ReportConfig = {
        ...mockReportConfig,
        type: 'efficiency',
        format: 'detailed'
      };

      const result = await generator.generateReport(mockAnalysisResult, efficiencyConfig);
      
      expect(result).toContain('效率分析报告');
      expect(result).toContain('生产力评分');
    });

    it('应该在无效配置时抛出错误', async () => {
      const invalidConfig = {
        ...mockReportConfig,
        type: 'invalid' as ReportType
      };

      await expect(generator.generateReport(mockAnalysisResult, invalidConfig))
        .rejects.toThrow('报告配置无效');
    });

    it('应该在不支持的格式时抛出错误', async () => {
      const unsupportedConfig: ReportConfig = {
        type: 'trends',
        format: 'brief', // trends不支持brief格式
        language: 'zh-CN',
        include_charts: false,
        include_insights: false
      };

      await expect(generator.generateReport(mockAnalysisResult, unsupportedConfig))
        .rejects.toThrow('不支持格式');
    });
  });

  describe('registerTemplate', () => {
    it('应该成功注册自定义模板', () => {
      const customTemplate: ReportTemplate = {
        name: 'custom',
        type: 'project',
        supported_formats: ['table'],
        render: (data, config) => 'Custom Report',
        description: '自定义模板'
      };

      expect(() => {
        generator.registerTemplate(customTemplate);
      }).not.toThrow();

      // 验证模板已注册
      const supportedTypes = generator.getSupportedTypes();
      expect(supportedTypes).toContain('project');
    });

    it('应该允许覆盖现有模板', () => {
      const newDailyTemplate: ReportTemplate = {
        name: 'new-daily',
        type: 'daily',
        supported_formats: ['table'],
        render: (data, config) => 'New Daily Report'
      };

      expect(() => {
        generator.registerTemplate(newDailyTemplate);
      }).not.toThrow();
    });
  });

  describe('getSupportedTypes', () => {
    it('应该返回所有支持的报告类型', () => {
      const types = generator.getSupportedTypes();
      
      expect(types).toBeInstanceOf(Array);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('daily');
      expect(types).toContain('efficiency');
    });
  });

  describe('getSupportedFormats', () => {
    it('应该返回指定类型支持的格式', () => {
      const formats = generator.getSupportedFormats('daily');
      
      expect(formats).toBeInstanceOf(Array);
      expect(formats).toContain('table');
      expect(formats).toContain('detailed');
      expect(formats).toContain('brief');
    });

    it('应该在未知类型时返回空数组', () => {
      const formats = generator.getSupportedFormats('unknown' as ReportType);
      
      expect(formats).toBeInstanceOf(Array);
      expect(formats.length).toBe(0);
    });
  });

  describe('exportReport', () => {
    const mockReport = '# 测试报告\n这是一个测试报告。';

    beforeEach(() => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('应该成功导出报告到默认位置', async () => {
      const exportOptions = {};

      const filePath = await generator.exportReport(mockReport, exportOptions);
      
      expect(filePath).toBeDefined();
      expect(path.dirname(filePath)).toBe(path.join(os.homedir(), '.claude', 'reports'));
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(os.homedir(), '.claude', 'reports'), 
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        filePath, 
        mockReport, 
        'utf-8'
      );
    });

    it('应该支持自定义输出目录和文件名', async () => {
      const exportOptions = {
        output_dir: '/custom/dir',
        filename: 'custom-report.txt'
      };

      const filePath = await generator.exportReport(mockReport, exportOptions);
      
      expect(filePath).toBe('/custom/dir/custom-report.txt');
      expect(mockFs.mkdir).toHaveBeenCalledWith('/custom/dir', { recursive: true });
    });

    it('应该在写入失败时抛出错误', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('写入失败'));

      const exportOptions = {};

      await expect(generator.exportReport(mockReport, exportOptions))
        .rejects.toThrow('报告导出失败');
    });

    it('应该添加元数据到报告内容', async () => {
      const exportOptions = {
        metadata: {
          version: '1.0.0',
          author: 'test'
        }
      };

      await generator.exportReport(mockReport, exportOptions);
      
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenContent = writeCall[1] as string;
      
      expect(writtenContent).toContain('# Report Metadata');
      expect(writtenContent).toContain('# version: "1.0.0"');
      expect(writtenContent).toContain('# author: "test"');
      expect(writtenContent).toContain(mockReport);
    });
  });

  describe('generateFullReport', () => {
    it('应该生成完整的报告结构', async () => {
      const fullReport = await generator.generateFullReport(mockAnalysisResult, mockReportConfig);
      
      expect(fullReport).toBeDefined();
      expect(fullReport.title).toContain('Claude Code 日报');
      expect(fullReport.subtitle).toContain('今日');
      expect(fullReport.header).toBeDefined();
      expect(fullReport.header.project_name).toBe('project');
      expect(fullReport.header.timeframe).toBe('今日');
      expect(fullReport.sections).toBeInstanceOf(Array);
      expect(fullReport.footer).toBeDefined();
      expect(fullReport.config).toEqual(mockReportConfig);
    });

    it('应该正确解析内容为报告节', async () => {
      const fullReport = await generator.generateFullReport(mockAnalysisResult, mockReportConfig);
      
      expect(fullReport.sections.length).toBeGreaterThan(0);
      
      // 验证节的结构
      fullReport.sections.forEach(section => {
        expect(section.title).toBeDefined();
        expect(section.content).toBeDefined();
        expect(section.type).toBeDefined();
      });
    });
  });

  describe('renderTable', () => {
    it('应该正确渲染简单表格', () => {
      const tableConfig = {
        title: '测试表格',
        border: true,
        style: 'unicode' as const,
        columns: [
          { key: 'name', title: '名称', width: 10, align: 'left' as const },
          { key: 'value', title: '数值', width: 8, align: 'right' as const }
        ]
      };

      const data = [
        { name: '项目1', value: 100 },
        { name: '项目2', value: 200 }
      ];

      const result = generator.renderTable(tableConfig, data);
      
      expect(result).toBeDefined();
      expect(result).toContain('测试表格');
      expect(result).toContain('项目1');
      expect(result).toContain('项目2');
      expect(result).toContain('100');
      expect(result).toContain('200');
      expect(result).toContain('┌');
      expect(result).toContain('│');
    });

    it('应该处理空数据', () => {
      const tableConfig = {
        title: '空表格',
        border: true,
        style: 'ascii' as const,
        columns: [
          { key: 'name', title: '名称', width: 10, align: 'left' as const }
        ]
      };

      const result = generator.renderTable(tableConfig, []);
      
      expect(result).toBe('');
    });

    it('应该支持自定义格式化函数', () => {
      const tableConfig = {
        title: '格式化表格',
        border: false,
        style: 'compact' as const,
        columns: [
          { 
            key: 'value', 
            title: '百分比', 
            width: 10, 
            align: 'right' as const,
            formatter: (value: number) => `${(value * 100).toFixed(1)}%`
          }
        ]
      };

      const data = [{ value: 0.75 }, { value: 0.85 }];

      const result = generator.renderTable(tableConfig, data);
      
      expect(result).toContain('75.0%');
      expect(result).toContain('85.0%');
    });
  });

  describe('缓存功能', () => {
    it('应该在第二次请求时使用缓存', async () => {
      // 第一次生成报告
      const result1 = await generator.generateReport(mockAnalysisResult, mockReportConfig);
      
      // 第二次生成相同配置的报告
      const result2 = await generator.generateReport(mockAnalysisResult, mockReportConfig);
      
      expect(result1).toBe(result2);
    });

    it('应该在配置不同时不使用缓存', async () => {
      const result1 = await generator.generateReport(mockAnalysisResult, mockReportConfig);
      
      const differentConfig = {
        ...mockReportConfig,
        language: 'en-US' as Language
      };
      
      const result2 = await generator.generateReport(mockAnalysisResult, differentConfig);
      
      expect(result1).not.toBe(result2);
    });

    it('应该提供缓存统计信息', () => {
      const stats = generator.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.oldestAge).toBe('number');
    });

    it('应该支持清理缓存', () => {
      expect(() => {
        generator.clearCache();
      }).not.toThrow();
    });
  });

  describe('配置验证', () => {
    it('应该拒绝空配置', async () => {
      const emptyConfig = {} as ReportConfig;

      await expect(generator.generateReport(mockAnalysisResult, emptyConfig))
        .rejects.toThrow('报告配置无效');
    });

    it('应该拒绝无效的报告类型', async () => {
      const invalidConfig = {
        ...mockReportConfig,
        type: 'invalid-type' as ReportType
      };

      await expect(generator.generateReport(mockAnalysisResult, invalidConfig))
        .rejects.toThrow('无效的报告类型');
    });

    it('应该拒绝无效的报告格式', async () => {
      const invalidConfig = {
        ...mockReportConfig,
        format: 'invalid-format' as ReportFormat
      };

      await expect(generator.generateReport(mockAnalysisResult, invalidConfig))
        .rejects.toThrow('无效的报告格式');
    });

    it('应该拒绝无效的语言设置', async () => {
      const invalidConfig = {
        ...mockReportConfig,
        language: 'invalid-lang' as Language
      };

      await expect(generator.generateReport(mockAnalysisResult, invalidConfig))
        .rejects.toThrow('无效的语言设置');
    });
  });

  describe('后处理功能', () => {
    it('应该在Markdown格式时正确格式化', async () => {
      const markdownConfig: ReportConfig = {
        ...mockReportConfig,
        type: 'insights',
        format: 'markdown'
      };

      // 为insights模板添加必要的数据
      const resultWithInsights = {
        ...mockAnalysisResult,
        insights: {
          insights: [
            {
              type: 'positive' as const,
              title: '测试洞察',
              content: '这是一个测试洞察',
              priority: 'medium' as const
            }
          ],
          recommendations: ['测试建议'],
          confidence_score: 0.8,
          generated_at: '2025-08-13T10:00:00.000Z'
        }
      };

      const result = await generator.generateReport(resultWithInsights, markdownConfig);
      
      expect(result).toContain('##');
    });

    it('应该替换时间戳占位符', async () => {
      // 注册一个包含占位符的测试模板
      const testTemplate: ReportTemplate = {
        name: 'timestamp-test',
        type: 'project',
        supported_formats: ['table'],
        render: () => '生成时间: {{timestamp}}'
      };

      generator.registerTemplate(testTemplate);

      const config: ReportConfig = {
        type: 'project',
        format: 'table',
        language: 'zh-CN',
        include_charts: false,
        include_insights: false
      };

      const result = await generator.generateReport(mockAnalysisResult, config);
      
      expect(result).not.toContain('{{timestamp}}');
      expect(result).toMatch(/生成时间: \d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/);
    });
  });

  describe('基本功能验证', () => {
    it('应该包含所有必要的报告元素', async () => {
      const result = await generator.generateReport(mockAnalysisResult, mockReportConfig);
      
      // 验证基本统计信息
      expect(result).toContain('2.5');  // 总时间
      expect(result).toContain('1500'); // Token数量
      expect(result).toContain('0.05'); // 成本
      expect(result).toContain('3');    // 文件数量
      
      // 验证效率指标
      expect(result).toContain('7.5');  // 生产力评分
      expect(result).toContain('600');  // tokens/小时
      expect(result).toContain('120');  // 行/小时
    });

    it('应该正确显示工具使用统计', async () => {
      const result = await generator.generateReport(mockAnalysisResult, mockReportConfig);
      
      expect(result).toContain('Edit');
      expect(result).toContain('Read');
      expect(result).toContain('Write');
      expect(result).toContain('10'); // Edit次数
      expect(result).toContain('5');  // Read次数
      expect(result).toContain('2');  // Write次数
    });

    it('应该包含数据质量信息', async () => {
      const result = await generator.generateReport(mockAnalysisResult, mockReportConfig);
      
      expect(result).toContain('cost_api'); // 数据源
    });
  });
});