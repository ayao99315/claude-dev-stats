/**
 * 文本图表生成工具
 * 提供基于ASCII和Unicode字符的简单数据可视化
 */

import { TextChartData, ChartConfig } from '../types/reports';

/**
 * 图表颜色主题
 */
export interface ChartTheme {
  name: string;
  colors: string[];
  background: string;
  border: string;
  text: string;
}

/**
 * 预定义的图表主题
 */
export const CHART_THEMES: Record<string, ChartTheme> = {
  default: {
    name: 'Default',
    colors: ['█', '▓', '▒', '░', '■', '▪', '●', '◆'],
    background: ' ',
    border: '─│┌┐└┘├┤┬┴┼',
    text: ''
  },
  ascii: {
    name: 'ASCII',
    colors: ['#', '*', '+', '=', '-', '.', ':', ';'],
    background: ' ',
    border: '-|++++++++',
    text: ''
  },
  minimal: {
    name: 'Minimal',
    colors: ['▓', '░', '▒', '█', '■', '□', '●', '○'],
    background: ' ',
    border: '─│┌┐└┘├┤┬┴┼',
    text: ''
  }
};

/**
 * 条形图生成器
 */
export class BarChartGenerator {
  private theme: ChartTheme;

  constructor(theme: ChartTheme = CHART_THEMES.default) {
    this.theme = theme;
  }

  /**
   * 生成水平条形图
   * @param data 图表数据
   * @param config 图表配置
   * @returns 生成的条形图字符串
   */
  generateHorizontalBarChart(data: TextChartData, config: ChartConfig): string {
    if (data.labels.length === 0 || data.values.length === 0) {
      return '';
    }

    const { width, height, title, show_legend } = config;
    const { labels, values, unit = '' } = data;

    let chart = '';

    // 添加标题
    if (title) {
      chart += this.centerText(title, width) + '\n';
      chart += '='.repeat(title.length) + '\n\n';
    }

    // 计算最大值和标签宽度
    const maxValue = Math.max(...values);
    const maxLabelWidth = Math.max(...labels.map(l => l.length));
    const barWidth = width - maxLabelWidth - 15; // 预留空间给标签和数值

    // 生成每个条形
    for (let i = 0; i < Math.min(labels.length, values.length); i++) {
      const label = labels[i];
      const value = values[i];
      const normalizedValue = maxValue > 0 ? (value / maxValue) : 0;
      const barLength = Math.round(normalizedValue * barWidth);

      // 标签部分（右对齐）
      const paddedLabel = label.padStart(maxLabelWidth, ' ');
      
      // 条形部分
      const colorIndex = i % this.theme.colors.length;
      const barChar = this.theme.colors[colorIndex];
      const bar = barChar.repeat(barLength).padEnd(barWidth, ' ');
      
      // 数值部分
      const formattedValue = this.formatValue(value, unit);

      chart += `${paddedLabel} │${bar}│ ${formattedValue}\n`;
    }

    // 添加图例（如果需要）
    if (show_legend && data.labels.length > 1) {
      chart += '\n' + this.generateLegend(data.labels, this.theme.colors);
    }

    return chart;
  }

  /**
   * 生成垂直条形图
   * @param data 图表数据
   * @param config 图表配置
   * @returns 生成的条形图字符串
   */
  generateVerticalBarChart(data: TextChartData, config: ChartConfig): string {
    if (data.labels.length === 0 || data.values.length === 0) {
      return '';
    }

    const { width, height, title } = config;
    const { labels, values, unit = '' } = data;

    let chart = '';

    // 添加标题
    if (title) {
      chart += this.centerText(title, width) + '\n';
      chart += '='.repeat(title.length) + '\n\n';
    }

    // 计算最大值和缩放
    const maxValue = Math.max(...values);
    const chartHeight = Math.min(height - 5, 20); // 预留空间给标签和轴
    
    // 生成Y轴刻度
    const yAxisLabels = this.generateYAxisLabels(maxValue, chartHeight, unit);
    const yAxisWidth = Math.max(...yAxisLabels.map(l => l.length));

    // 计算每个条的宽度
    const availableWidth = width - yAxisWidth - 2;
    const barWidth = Math.max(1, Math.floor(availableWidth / values.length));

    // 归一化数值
    const normalizedValues = values.map(v => 
      Math.round((v / maxValue) * chartHeight)
    );

    // 从上到下绘制每一行
    for (let row = chartHeight; row > 0; row--) {
      let line = '';
      
      // Y轴标签
      const yLabel = yAxisLabels[chartHeight - row] || '';
      line += yLabel.padStart(yAxisWidth, ' ') + ' │';

      // 绘制条形
      for (let i = 0; i < normalizedValues.length; i++) {
        const barHeight = normalizedValues[i];
        const colorIndex = i % this.theme.colors.length;
        const barChar = this.theme.colors[colorIndex];
        
        if (barHeight >= row) {
          line += barChar.repeat(barWidth);
        } else {
          line += ' '.repeat(barWidth);
        }
      }

      chart += line + '\n';
    }

    // 绘制X轴
    chart += ' '.repeat(yAxisWidth) + ' └' + '─'.repeat(availableWidth) + '\n';

    // 添加X轴标签
    let xAxisLine = ' '.repeat(yAxisWidth + 2);
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const truncatedLabel = label.length > barWidth ? 
        label.substring(0, barWidth - 1) + '…' : label;
      xAxisLine += truncatedLabel.padEnd(barWidth, ' ');
    }
    chart += xAxisLine + '\n';

    return chart;
  }

  // ===== 私有方法 =====

  /**
   * 居中文本
   * @private
   */
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(padding / 2);
    return ' '.repeat(leftPadding) + text;
  }

  /**
   * 格式化数值
   * @private
   */
  private formatValue(value: number, unit: string): string {
    let formattedValue: string;

    if (value >= 1000000) {
      formattedValue = (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      formattedValue = (value / 1000).toFixed(1) + 'K';
    } else if (value % 1 === 0) {
      formattedValue = value.toString();
    } else {
      formattedValue = value.toFixed(2);
    }

    return unit ? `${formattedValue}${unit}` : formattedValue;
  }

  /**
   * 生成Y轴标签
   * @private
   */
  private generateYAxisLabels(maxValue: number, height: number, unit: string): string[] {
    const labels: string[] = [];
    
    for (let i = 0; i <= height; i++) {
      const value = (maxValue * i) / height;
      labels.push(this.formatValue(value, unit));
    }

    return labels.reverse(); // 从上到下
  }

  /**
   * 生成图例
   * @private
   */
  private generateLegend(labels: string[], colors: string[]): string {
    let legend = 'Legend:\n';
    
    for (let i = 0; i < labels.length; i++) {
      const colorIndex = i % colors.length;
      const colorChar = colors[colorIndex];
      legend += `${colorChar} ${labels[i]}\n`;
    }

    return legend;
  }
}

/**
 * 线形图生成器
 */
export class LineChartGenerator {
  private theme: ChartTheme;

  constructor(theme: ChartTheme = CHART_THEMES.default) {
    this.theme = theme;
  }

  /**
   * 生成线形图
   * @param data 图表数据
   * @param config 图表配置
   * @returns 生成的线形图字符串
   */
  generateLineChart(data: TextChartData, config: ChartConfig): string {
    if (data.labels.length === 0 || data.values.length === 0) {
      return '';
    }

    const { width, height, title } = config;
    const { labels, values, unit = '' } = data;

    let chart = '';

    // 添加标题
    if (title) {
      chart += this.centerText(title, width) + '\n';
      chart += '='.repeat(title.length) + '\n\n';
    }

    // 计算图表尺寸
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const valueRange = maxValue - minValue;
    
    const chartHeight = Math.min(height - 5, 15);
    const yAxisLabels = this.generateYAxisLabels(minValue, maxValue, chartHeight, unit);
    const yAxisWidth = Math.max(...yAxisLabels.map(l => l.length));
    
    const plotWidth = width - yAxisWidth - 3;
    const plotHeight = chartHeight;

    // 创建绘图矩阵
    const plotMatrix: string[][] = [];
    for (let i = 0; i < plotHeight; i++) {
      plotMatrix[i] = new Array(plotWidth).fill(' ');
    }

    // 绘制数据点
    const pointChar = '●';
    const lineChar = '─';
    const connectChar = '│';

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const x = Math.round((i / Math.max(1, values.length - 1)) * (plotWidth - 1));
      let y: number;
      
      if (valueRange > 0) {
        y = Math.round(((value - minValue) / valueRange) * (plotHeight - 1));
        y = plotHeight - 1 - y; // 翻转Y轴
      } else {
        y = Math.floor(plotHeight / 2);
      }

      // 确保坐标在范围内
      const safeX = Math.max(0, Math.min(plotWidth - 1, x));
      const safeY = Math.max(0, Math.min(plotHeight - 1, y));
      
      plotMatrix[safeY][safeX] = pointChar;

      // 连接到上一个点
      if (i > 0) {
        const prevValue = values[i - 1];
        const prevX = Math.round(((i - 1) / Math.max(1, values.length - 1)) * (plotWidth - 1));
        let prevY: number;
        
        if (valueRange > 0) {
          prevY = Math.round(((prevValue - minValue) / valueRange) * (plotHeight - 1));
          prevY = plotHeight - 1 - prevY;
        } else {
          prevY = Math.floor(plotHeight / 2);
        }

        const safePrevX = Math.max(0, Math.min(plotWidth - 1, prevX));
        const safePrevY = Math.max(0, Math.min(plotHeight - 1, prevY));

        // 绘制连接线
        this.drawLine(plotMatrix, safePrevX, safePrevY, safeX, safeY, lineChar, connectChar);
      }
    }

    // 输出图表
    for (let row = 0; row < plotHeight; row++) {
      const yLabel = yAxisLabels[row] || '';
      const line = yLabel.padStart(yAxisWidth, ' ') + ' │' + plotMatrix[row].join('');
      chart += line + '\n';
    }

    // 绘制X轴
    chart += ' '.repeat(yAxisWidth) + ' └' + '─'.repeat(plotWidth) + '\n';

    // 添加X轴标签（简化显示）
    if (labels.length > 0) {
      let xAxisLine = ' '.repeat(yAxisWidth + 2);
      const labelStep = Math.max(1, Math.floor(labels.length / Math.min(8, plotWidth / 8)));
      
      for (let i = 0; i < labels.length; i += labelStep) {
        const x = Math.round((i / Math.max(1, values.length - 1)) * (plotWidth - 1));
        const label = labels[i];
        
        if (x < plotWidth - label.length) {
          xAxisLine = xAxisLine.substring(0, yAxisWidth + 2 + x) + 
                     label + 
                     xAxisLine.substring(yAxisWidth + 2 + x + label.length);
        }
      }
      chart += xAxisLine + '\n';
    }

    return chart;
  }

  // ===== 私有方法 =====

  /**
   * 居中文本
   * @private
   */
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(padding / 2);
    return ' '.repeat(leftPadding) + text;
  }

  /**
   * 生成Y轴标签
   * @private
   */
  private generateYAxisLabels(minValue: number, maxValue: number, height: number, unit: string): string[] {
    const labels: string[] = [];
    
    for (let i = 0; i < height; i++) {
      const value = minValue + ((maxValue - minValue) * (height - 1 - i)) / (height - 1);
      labels.push(this.formatValue(value, unit));
    }

    return labels;
  }

  /**
   * 格式化数值
   * @private
   */
  private formatValue(value: number, unit: string): string {
    let formattedValue: string;

    if (Math.abs(value) >= 1000000) {
      formattedValue = (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
      formattedValue = (value / 1000).toFixed(1) + 'K';
    } else if (value % 1 === 0) {
      formattedValue = value.toString();
    } else {
      formattedValue = value.toFixed(1);
    }

    return unit ? `${formattedValue}${unit}` : formattedValue;
  }

  /**
   * 在矩阵中绘制线段
   * @private
   */
  private drawLine(
    matrix: string[][],
    x1: number, y1: number,
    x2: number, y2: number,
    lineChar: string,
    connectChar: string
  ): void {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      // 确保坐标在范围内
      if (y >= 0 && y < matrix.length && x >= 0 && x < matrix[0].length) {
        if (matrix[y][x] === ' ') {
          matrix[y][x] = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? lineChar : connectChar;
        }
      }

      if (x === x2 && y === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
}

/**
 * 饼图生成器
 */
export class PieChartGenerator {
  private theme: ChartTheme;

  constructor(theme: ChartTheme = CHART_THEMES.default) {
    this.theme = theme;
  }

  /**
   * 生成饼图
   * @param data 图表数据
   * @param config 图表配置
   * @returns 生成的饼图字符串
   */
  generatePieChart(data: TextChartData, config: ChartConfig): string {
    if (data.labels.length === 0 || data.values.length === 0) {
      return '';
    }

    const { width, height, title, show_legend } = config;
    const { labels, values, unit = '' } = data;

    let chart = '';

    // 添加标题
    if (title) {
      chart += this.centerText(title, width) + '\n';
      chart += '='.repeat(title.length) + '\n\n';
    }

    // 计算百分比
    const total = values.reduce((sum, v) => sum + v, 0);
    const percentages = values.map(v => (v / total) * 100);

    // 生成简化的文本饼图（使用条形表示）
    const maxBarWidth = Math.min(40, width - 20);
    
    for (let i = 0; i < Math.min(labels.length, values.length); i++) {
      const label = labels[i];
      const value = values[i];
      const percentage = percentages[i];
      const barWidth = Math.round((percentage / 100) * maxBarWidth);
      
      const colorIndex = i % this.theme.colors.length;
      const barChar = this.theme.colors[colorIndex];
      const bar = barChar.repeat(barWidth);
      
      const formattedValue = this.formatValue(value, unit);
      const percentText = `${percentage.toFixed(1)}%`;
      
      chart += `${label.padEnd(15)} │${bar.padEnd(maxBarWidth)}│ ${formattedValue} (${percentText})\n`;
    }

    // 添加图例（如果需要）
    if (show_legend && data.labels.length > 1) {
      chart += '\n' + this.generateLegend(data.labels, this.theme.colors);
    }

    return chart;
  }

  // ===== 私有方法 =====

  /**
   * 居中文本
   * @private
   */
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(padding / 2);
    return ' '.repeat(leftPadding) + text;
  }

  /**
   * 格式化数值
   * @private
   */
  private formatValue(value: number, unit: string): string {
    let formattedValue: string;

    if (value >= 1000000) {
      formattedValue = (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      formattedValue = (value / 1000).toFixed(1) + 'K';
    } else if (value % 1 === 0) {
      formattedValue = value.toString();
    } else {
      formattedValue = value.toFixed(2);
    }

    return unit ? `${formattedValue}${unit}` : formattedValue;
  }

  /**
   * 生成图例
   * @private
   */
  private generateLegend(labels: string[], colors: string[]): string {
    let legend = 'Legend:\n';
    
    for (let i = 0; i < labels.length; i++) {
      const colorIndex = i % colors.length;
      const colorChar = colors[colorIndex];
      legend += `${colorChar} ${labels[i]}\n`;
    }

    return legend;
  }
}

/**
 * 文本图表工具类
 * 统一的图表生成入口
 */
export class TextChartGenerator {
  private barChartGenerator: BarChartGenerator;
  private lineChartGenerator: LineChartGenerator;
  private pieChartGenerator: PieChartGenerator;

  constructor(theme: ChartTheme = CHART_THEMES.default) {
    this.barChartGenerator = new BarChartGenerator(theme);
    this.lineChartGenerator = new LineChartGenerator(theme);
    this.pieChartGenerator = new PieChartGenerator(theme);
  }

  /**
   * 生成图表
   * @param data 图表数据
   * @param config 图表配置
   * @returns 生成的图表字符串
   */
  generateChart(data: TextChartData, config: ChartConfig): string {
    switch (config.type) {
    case 'bar':
      return this.barChartGenerator.generateHorizontalBarChart(data, config);
    case 'line':
      return this.lineChartGenerator.generateLineChart(data, config);
    case 'pie':
      return this.pieChartGenerator.generatePieChart(data, config);
    case 'histogram':
      return this.barChartGenerator.generateVerticalBarChart(data, config);
    default:
      throw new Error(`不支持的图表类型: ${config.type}`);
    }
  }

  /**
   * 生成工具使用分析图表
   * @param toolUsage 工具使用数据
   * @param config 基础配置
   * @returns 工具使用图表
   */
  generateToolUsageChart(toolUsage: Record<string, number>, config: Partial<ChartConfig> = {}): string {
    const labels = Object.keys(toolUsage);
    const values = Object.values(toolUsage);

    const data: TextChartData = {
      labels,
      values,
      unit: '次'
    };

    const chartConfig: ChartConfig = {
      type: 'bar',
      title: '工具使用统计',
      width: 60,
      height: 15,
      show_legend: false,
      ...config
    };

    return this.generateChart(data, chartConfig);
  }

  /**
   * 生成效率趋势图表
   * @param timeLabels 时间标签
   * @param efficiencyScores 效率评分
   * @param config 基础配置
   * @returns 效率趋势图表
   */
  generateEfficiencyTrendChart(
    timeLabels: string[], 
    efficiencyScores: number[], 
    config: Partial<ChartConfig> = {}
  ): string {
    const data: TextChartData = {
      labels: timeLabels,
      values: efficiencyScores,
      unit: '分'
    };

    const chartConfig: ChartConfig = {
      type: 'line',
      title: '效率趋势分析',
      width: 70,
      height: 12,
      show_legend: false,
      ...config
    };

    return this.generateChart(data, chartConfig);
  }

  /**
   * 生成成本分布图表
   * @param categories 成本类别
   * @param costs 成本数值
   * @param config 基础配置
   * @returns 成本分布图表
   */
  generateCostDistributionChart(
    categories: string[], 
    costs: number[], 
    config: Partial<ChartConfig> = {}
  ): string {
    const data: TextChartData = {
      labels: categories,
      values: costs,
      unit: '$'
    };

    const chartConfig: ChartConfig = {
      type: 'pie',
      title: '成本分布分析',
      width: 60,
      height: 10,
      show_legend: true,
      ...config
    };

    return this.generateChart(data, chartConfig);
  }

  /**
   * 设置图表主题
   * @param theme 新的主题
   */
  setTheme(theme: ChartTheme): void {
    this.barChartGenerator = new BarChartGenerator(theme);
    this.lineChartGenerator = new LineChartGenerator(theme);
    this.pieChartGenerator = new PieChartGenerator(theme);
  }

  /**
   * 获取可用主题列表
   * @returns 主题名称数组
   */
  getAvailableThemes(): string[] {
    return Object.keys(CHART_THEMES);
  }
}

// 导出单例实例
export const textChartGenerator = new TextChartGenerator();