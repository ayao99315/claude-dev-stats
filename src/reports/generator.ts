/**
 * 报告生成器主类
 * 实现完整的报告生成功能，支持双语、多格式、缓存等特性
 */

import { 
  ReportGenerator as IReportGenerator,
  ReportConfig, 
  ReportTemplate,
  ReportType,
  ReportFormat,
  Language,
  Report,
  ReportHeader,
  ReportFooter,
  ReportSection,
  ExportOptions,
  ReportCacheConfig,
  ReportValidationResult,
  TableConfig,
  ChartConfig
} from '../types/reports';
import { 
  AnalysisResult, 
  BasicStats, 
  EfficiencyMetrics, 
  SmartInsights,
  TrendAnalysis 
} from '../types/analytics';
import { reportTemplates, ReportTemplates } from './templates';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * 报告缓存管理器
 * 管理报告生成的缓存机制，提高性能
 */
class ReportCache {
  private cache = new Map<string, { content: string; timestamp: number; }>();
  private config: ReportCacheConfig;

  constructor(config: ReportCacheConfig) {
    this.config = config;
  }

  /**
   * 生成缓存键
   * @param data 原始数据
   * @param config 报告配置
   * @returns 缓存键
   */
  private generateCacheKey(data: any, config: ReportConfig): string {
    // 创建基于数据和配置的唯一键
    const dataHash = this.simpleHash(JSON.stringify({
      timeframe: data.timeframe,
      projectPath: data.project_path,
      generatedAt: data.generated_at,
      dataSource: data.data_source
    }));

    const configHash = this.simpleHash(JSON.stringify({
      type: config.type,
      format: config.format,
      language: config.language,
      includeCharts: config.include_charts,
      includeInsights: config.include_insights
    }));

    return `${this.config.key_prefix}:${config.type}:${dataHash}:${configHash}`;
  }

  /**
   * 简单哈希函数
   * @param str 输入字符串
   * @returns 哈希值
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  /**
   * 获取缓存的报告
   * @param data 原始数据
   * @param config 报告配置
   * @returns 缓存的报告内容，如果不存在或过期则返回null
   */
  get(data: any, config: ReportConfig): string | null {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.generateCacheKey(data, config);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - cached.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  /**
   * 设置缓存
   * @param data 原始数据
   * @param config 报告配置
   * @param content 报告内容
   */
  set(data: any, config: ReportConfig, content: string): void {
    if (!this.config.enabled) {
      return;
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.config.max_size) {
      this.cleanupOldest();
    }

    const key = this.generateCacheKey(data, config);
    this.cache.set(key, {
      content,
      timestamp: Date.now()
    });
  }

  /**
   * 清理最旧的缓存项
   * @private
   */
  private cleanupOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    hitRate: number;
    oldestAge: number;
    } {
    const now = Date.now();
    let oldestAge = 0;

    for (const value of this.cache.values()) {
      const age = now - value.timestamp;
      if (age > oldestAge) {
        oldestAge = age;
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0, // 需要在实际使用中追踪命中率
      oldestAge
    };
  }
}

/**
 * 表格渲染器
 * 负责将表格配置渲染为文本格式
 */
class TableRenderer {
  /**
   * 渲染表格
   * @param tableConfig 表格配置
   * @param data 表格数据
   * @returns 渲染后的表格字符串
   */
  render(tableConfig: TableConfig, data: Array<Record<string, any>>): string {
    if (data.length === 0) {
      return '';
    }

    const { columns, border, title, style = 'ascii' } = tableConfig;
    let result = '';

    // 添加标题
    if (title) {
      result += `${title}\n`;
    }

    // 计算列宽
    const columnWidths = this.calculateColumnWidths(columns, data);

    // 渲染表头
    if (border && style !== 'compact') {
      result += this.renderBorder(columnWidths, style, 'top');
    }

    result += this.renderRow(
      columns.map(col => col.title),
      columnWidths,
      columns.map(col => col.align || 'left'),
      style
    );

    if (border && style !== 'compact') {
      result += this.renderBorder(columnWidths, style, 'middle');
    } else if (style === 'compact') {
      result += '-'.repeat(columnWidths.reduce((sum, w) => sum + w + 3, -1)) + '\n';
    }

    // 渲染数据行
    for (const row of data) {
      const values = columns.map(col => {
        const value = row[col.key];
        return col.formatter ? col.formatter(value) : String(value);
      });
      
      result += this.renderRow(
        values,
        columnWidths,
        columns.map(col => col.align || 'left'),
        style
      );
    }

    // 渲染底部边框
    if (border && style !== 'compact') {
      result += this.renderBorder(columnWidths, style, 'bottom');
    }

    result += '\n';
    return result;
  }

  /**
   * 计算列宽
   * @private
   */
  private calculateColumnWidths(
    columns: TableConfig['columns'], 
    data: Array<Record<string, any>>
  ): number[] {
    return columns.map(col => {
      // 从配置中获取宽度，或者计算最佳宽度
      if (col.width) {
        return col.width;
      }

      let maxWidth = col.title.length;
      
      for (const row of data) {
        const value = row[col.key];
        const displayValue = col.formatter ? col.formatter(value) : String(value);
        if (displayValue.length > maxWidth) {
          maxWidth = displayValue.length;
        }
      }

      return Math.min(maxWidth, 50); // 限制最大宽度
    });
  }

  /**
   * 渲染单行
   * @private
   */
  private renderRow(
    values: string[], 
    widths: number[], 
    alignments: Array<'left' | 'center' | 'right'>,
    style: 'ascii' | 'unicode' | 'compact'
  ): string {
    const separator = style === 'compact' ? ' ' : (style === 'unicode' ? '│' : '|');
    const padding = style === 'compact' ? 2 : 1;

    let row = style === 'compact' ? '' : separator;
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const width = widths[i];
      const align = alignments[i];
      
      const paddedValue = this.padString(value, width, align);
      row += ' '.repeat(padding) + paddedValue + ' '.repeat(padding);
      
      if (style !== 'compact') {
        row += separator;
      } else if (i < values.length - 1) {
        row += ' ';
      }
    }

    return row + '\n';
  }

  /**
   * 渲染边框
   * @private
   */
  private renderBorder(
    widths: number[], 
    style: 'ascii' | 'unicode' | 'compact',
    position: 'top' | 'middle' | 'bottom'
  ): string {
    if (style === 'compact') {
      return '';
    }

    const chars = style === 'unicode' 
      ? {
        horizontal: '─',
        vertical: '│',
        topLeft: '┌', topRight: '┐', topJoin: '┬',
        middleLeft: '├', middleRight: '┤', middleJoin: '┼',
        bottomLeft: '└', bottomRight: '┘', bottomJoin: '┴'
      }
      : {
        horizontal: '-',
        vertical: '|',
        topLeft: '+', topRight: '+', topJoin: '+',
        middleLeft: '+', middleRight: '+', middleJoin: '+',
        bottomLeft: '+', bottomRight: '+', bottomJoin: '+'
      };

    let line = '';

    // 左边框
    if (position === 'top') {
      line += chars.topLeft;
    } else if (position === 'middle') {
      line += chars.middleLeft;
    } else {
      line += chars.bottomLeft;
    }

    // 中间部分
    for (let i = 0; i < widths.length; i++) {
      line += chars.horizontal.repeat(widths[i] + 2); // +2 for padding
      
      if (i < widths.length - 1) {
        if (position === 'top') {
          line += chars.topJoin;
        } else if (position === 'middle') {
          line += chars.middleJoin;
        } else {
          line += chars.bottomJoin;
        }
      }
    }

    // 右边框
    if (position === 'top') {
      line += chars.topRight;
    } else if (position === 'middle') {
      line += chars.middleRight;
    } else {
      line += chars.bottomRight;
    }

    return line + '\n';
  }

  /**
   * 字符串对齐和填充
   * @private
   */
  private padString(str: string, width: number, align: 'left' | 'center' | 'right'): string {
    if (str.length >= width) {
      return str.substring(0, width);
    }

    const padding = width - str.length;

    switch (align) {
    case 'right':
      return ' '.repeat(padding) + str;
    case 'center':
      const leftPadding = Math.floor(padding / 2);
      const rightPadding = padding - leftPadding;
      return ' '.repeat(leftPadding) + str + ' '.repeat(rightPadding);
    default: // 'left'
      return str + ' '.repeat(padding);
    }
  }
}

/**
 * 报告生成器主类
 * 实现完整的报告生成功能
 */
export class ReportGenerator implements IReportGenerator {
  private logger: Logger;
  private configManager: ConfigManager;
  private templates: Map<ReportType, ReportTemplate>;
  private cache: ReportCache;
  private tableRenderer: TableRenderer;

  constructor() {
    this.logger = new Logger({ level: 'info', colorize: false, file_output: false, max_file_size: 10 * 1024 * 1024, max_files: 5 });
    this.configManager = new ConfigManager();
    this.templates = new Map();
    this.tableRenderer = new TableRenderer();

    // 初始化缓存
    const cacheConfig: ReportCacheConfig = {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5分钟
      key_prefix: 'cc-stats-report',
      max_size: 100
    };
    this.cache = new ReportCache(cacheConfig);

    // 注册默认模板
    this.registerDefaultTemplates();
    
    this.logger.info('报告生成器初始化完成');
  }

  /**
   * 生成报告
   * @param data 分析数据
   * @param config 报告配置
   * @returns 生成的报告内容
   */
  async generateReport(data: AnalysisResult, config: ReportConfig): Promise<string> {
    this.logger.info('开始生成报告', { type: config.type, format: config.format, language: config.language });

    try {
      // 验证配置
      const validation = this.validateReportConfig(config);
      if (!validation.valid) {
        throw new Error(`报告配置无效: ${validation.errors.join(', ')}`);
      }

      // 检查缓存
      const cachedReport = this.cache.get(data, config);
      if (cachedReport) {
        this.logger.debug('使用缓存报告');
        return cachedReport;
      }

      // 获取模板
      const template = this.templates.get(config.type);
      if (!template) {
        throw new Error(`未找到报告模板: ${config.type}`);
      }

      // 检查格式支持
      if (!template.supported_formats.includes(config.format)) {
        throw new Error(`模板 ${config.type} 不支持格式 ${config.format}`);
      }

      // 渲染报告
      const reportContent = template.render(data, config);

      // 后处理报告内容
      const finalReport = await this.postProcessReport(reportContent, config);

      // 缓存结果
      this.cache.set(data, config, finalReport);

      this.logger.info('报告生成完成', { 
        contentLength: finalReport.length,
        cached: false
      });

      return finalReport;
    } catch (error) {
      this.logger.error('报告生成失败', error);
      throw new Error(`报告生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 注册报告模板
   * @param template 报告模板
   */
  registerTemplate(template: ReportTemplate): void {
    this.logger.debug('注册报告模板', { name: template.name, type: template.type });
    this.templates.set(template.type, template);
  }

  /**
   * 获取支持的报告类型
   * @returns 支持的报告类型列表
   */
  getSupportedTypes(): ReportType[] {
    return Array.from(this.templates.keys());
  }

  /**
   * 获取支持的格式
   * @param type 报告类型
   * @returns 支持的格式列表
   */
  getSupportedFormats(type: ReportType): ReportFormat[] {
    const template = this.templates.get(type);
    return template ? template.supported_formats : [];
  }

  /**
   * 导出报告到文件
   * @param report 报告内容
   * @param options 导出选项
   * @returns 导出的文件路径
   */
  async exportReport(report: string, options: ExportOptions): Promise<string> {
    this.logger.info('导出报告到文件', { options });

    try {
      // 确定输出路径
      const outputDir = options.output_dir || path.join(os.homedir(), '.claude', 'reports');
      await fs.mkdir(outputDir, { recursive: true });

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.filename || `claude-stats-report-${timestamp}.txt`;
      const filePath = path.join(outputDir, filename);

      // 准备文件内容
      let content = report;
      
      // 添加元数据（如果提供）
      if (options.metadata) {
        const metadataComment = this.formatMetadata(options.metadata);
        content = metadataComment + '\n\n' + content;
      }

      // 写入文件
      await fs.writeFile(filePath, content, 'utf-8');

      // 压缩（如果需要）
      if (options.compress) {
        // TODO: 实现压缩功能
        this.logger.warn('压缩功能尚未实现');
      }

      this.logger.info('报告导出完成', { filePath, size: content.length });
      return filePath;
    } catch (error) {
      this.logger.error('报告导出失败', error);
      throw new Error(`报告导出失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成完整的报告结构
   * @param data 分析数据
   * @param config 报告配置
   * @returns 完整的报告对象
   */
  async generateFullReport(data: AnalysisResult, config: ReportConfig): Promise<Report> {
    this.logger.debug('生成完整报告结构');

    try {
      // 生成报告内容
      const content = await this.generateReport(data, config);

      // 构建报告结构
      const report: Report = {
        title: this.generateReportTitle(config),
        subtitle: this.generateReportSubtitle(data, config),
        header: this.generateReportHeader(data, config),
        sections: this.parseContentToSections(content, config),
        footer: this.generateReportFooter(config),
        config
      };

      return report;
    } catch (error) {
      this.logger.error('完整报告生成失败', error);
      throw error;
    }
  }

  /**
   * 渲染表格
   * @param tableConfig 表格配置
   * @param data 表格数据
   * @returns 渲染后的表格字符串
   */
  renderTable(tableConfig: TableConfig, data: Array<Record<string, any>>): string {
    return this.tableRenderer.render(tableConfig, data);
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  getCacheStats(): ReturnType<ReportCache['getStats']> {
    return this.cache.getStats();
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('报告缓存已清理');
  }

  // ===== 私有方法 =====

  /**
   * 注册默认模板
   * @private
   */
  private registerDefaultTemplates(): void {
    const templates = reportTemplates.getAllTemplates();
    templates.forEach(template => {
      this.registerTemplate(template);
    });
    
    this.logger.debug('默认模板注册完成', { count: templates.length });
  }

  /**
   * 验证报告配置
   * @private
   */
  private validateReportConfig(config: ReportConfig): ReportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必要字段
    if (!config.type) {
      errors.push('报告类型不能为空');
    }

    if (!config.format) {
      errors.push('报告格式不能为空');
    }

    if (!config.language) {
      errors.push('语言设置不能为空');
    }

    // 检查类型有效性
    const validTypes: ReportType[] = ['daily', 'weekly', 'monthly', 'project', 'efficiency', 'trends', 'tools', 'cost', 'insights'];
    if (config.type && !validTypes.includes(config.type)) {
      errors.push(`无效的报告类型: ${config.type}`);
    }

    // 检查格式有效性
    const validFormats: ReportFormat[] = ['table', 'detailed', 'brief', 'insights', 'chart', 'pie', 'financial', 'json', 'markdown'];
    if (config.format && !validFormats.includes(config.format)) {
      errors.push(`无效的报告格式: ${config.format}`);
    }

    // 检查语言有效性
    if (config.language && !['zh-CN', 'en-US'].includes(config.language)) {
      errors.push(`无效的语言设置: ${config.language}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 后处理报告内容
   * @private
   */
  private async postProcessReport(content: string, config: ReportConfig): Promise<string> {
    let processed = content;

    // 添加时间戳
    const timestamp = new Date().toLocaleString(config.language === 'zh-CN' ? 'zh-CN' : 'en-US');
    processed = processed.replace(/{{timestamp}}/g, timestamp);

    // 添加版本信息
    const version = this.getVersion();
    processed = processed.replace(/{{version}}/g, version);

    // 格式化特殊字符（根据输出格式）
    if (config.format === 'markdown') {
      processed = this.formatForMarkdown(processed);
    }

    return processed;
  }

  /**
   * 格式化元数据
   * @private
   */
  private formatMetadata(metadata: Record<string, any>): string {
    const lines = ['# Report Metadata'];
    
    for (const [key, value] of Object.entries(metadata)) {
      lines.push(`# ${key}: ${JSON.stringify(value)}`);
    }

    return lines.join('\n');
  }

  /**
   * 生成报告标题
   * @private
   */
  private generateReportTitle(config: ReportConfig): string {
    const titleKey = `report.title.${config.type}`;
    // 这里应该使用 BilingualTextManager，但为了简化，直接返回
    switch (config.type) {
    case 'daily':
      return config.language === 'zh-CN' ? '📊 Claude Code 日报' : '📊 Claude Code Daily Report';
    case 'efficiency':
      return config.language === 'zh-CN' ? '⚡ 效率分析报告' : '⚡ Efficiency Analysis Report';
    case 'trends':
      return config.language === 'zh-CN' ? '📈 趋势分析报告' : '📈 Trend Analysis Report';
    case 'insights':
      return config.language === 'zh-CN' ? '🔍 智能洞察报告' : '🔍 Smart Insights Report';
    case 'cost':
      return config.language === 'zh-CN' ? '💰 成本分析报告' : '💰 Cost Analysis Report';
    default:
      return config.language === 'zh-CN' ? '📊 统计报告' : '📊 Statistics Report';
    }
  }

  /**
   * 生成报告副标题
   * @private
   */
  private generateReportSubtitle(data: AnalysisResult, config: ReportConfig): string {
    return `${data.timeframe} | ${data.project_path}`;
  }

  /**
   * 生成报告头部
   * @private
   */
  private generateReportHeader(data: AnalysisResult, config: ReportConfig): ReportHeader {
    return {
      project_name: path.basename(data.project_path),
      timeframe: data.timeframe,
      data_source: data.data_source,
      generated_at: new Date().toISOString(),
      data_quality: data.data_quality?.completeness
    };
  }

  /**
   * 生成报告尾部
   * @private
   */
  private generateReportFooter(config: ReportConfig): ReportFooter {
    return {
      version: this.getVersion(),
      contact: 'https://github.com/anthropics/claude-code/issues',
      disclaimer: config.language === 'zh-CN' 
        ? '本报告基于Claude Code使用数据生成，仅供参考。'
        : 'This report is generated based on Claude Code usage data for reference only.',
      notes: []
    };
  }

  /**
   * 解析内容为报告节
   * @private
   */
  private parseContentToSections(content: string, config: ReportConfig): ReportSection[] {
    // 简化实现：将内容按标题分割为节
    const lines = content.split('\n');
    const sections: ReportSection[] = [];
    let currentSection: ReportSection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // 检测是否为标题行
      if (line.match(/^[#=\-]{3,}/) || line.match(/^[📊📈💡🔧⚡💰]/)) {
        // 保存上一个节
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        // 开始新节
        currentSection = {
          title: line.replace(/[#=\-]/g, '').trim(),
          content: '',
          type: 'text'
        };
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // 保存最后一个节
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * 获取版本信息
   * @private
   */
  private getVersion(): string {
    return '1.0.0'; // TODO: 从package.json读取
  }

  /**
   * 格式化为Markdown
   * @private
   */
  private formatForMarkdown(content: string): string {
    // 简单的Markdown格式化
    return content
      .replace(/^([📊📈💡🔧⚡💰].*?)$/gm, '## $1') // 节标题
      .replace(/^([=]{3,})$/gm, '') // 移除分隔线
      .replace(/^([-]{3,})$/gm, '') // 移除分隔线
      .replace(/^([✅❌⚠️ℹ️] .*?)$/gm, '- $1'); // 列表项
  }
}

// 导出单例实例
export const reportGenerator = new ReportGenerator();