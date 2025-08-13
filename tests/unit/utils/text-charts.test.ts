/**
 * 文本图表生成器单元测试
 * 测试各种类型的文本图表生成功能
 */

import { 
  TextChartGenerator, 
  BarChartGenerator, 
  LineChartGenerator, 
  PieChartGenerator,
  CHART_THEMES 
} from '../../../src/utils/text-charts';
import { TextChartData, ChartConfig } from '../../../src/types/reports';

describe('TextChartGenerator', () => {
  let generator: TextChartGenerator;

  beforeEach(() => {
    generator = new TextChartGenerator();
  });

  describe('基础图表生成', () => {
    const mockData: TextChartData = {
      labels: ['Edit', 'Read', 'Write', 'Bash'],
      values: [25, 15, 10, 5],
      unit: '次'
    };

    it('应该生成条形图', () => {
      const config: ChartConfig = {
        type: 'bar',
        title: '工具使用统计',
        width: 60,
        height: 10,
        show_legend: false
      };

      const result = generator.generateChart(mockData, config);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('工具使用统计');
      expect(result).toContain('Edit');
      expect(result).toContain('Read');
      expect(result).toContain('Write');
      expect(result).toContain('│');
    });

    it('应该生成线形图', () => {
      const timeData: TextChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        values: [7.2, 8.1, 6.5, 9.0, 7.8],
        unit: '分'
      };

      const config: ChartConfig = {
        type: 'line',
        title: '效率趋势',
        width: 70,
        height: 12,
        show_legend: false
      };

      const result = generator.generateChart(timeData, config);
      
      expect(result).toContain('效率趋势');
      expect(result).toContain('●'); // 数据点
      expect(result).toContain('─'); // 连接线
      expect(result).toContain('└'); // X轴
    });

    it('应该生成饼图', () => {
      const config: ChartConfig = {
        type: 'pie',
        title: '工具分布',
        width: 60,
        height: 10,
        show_legend: true
      };

      const result = generator.generateChart(mockData, config);
      
      expect(result).toContain('工具分布');
      expect(result).toContain('%'); // 百分比
      expect(result).toContain('Legend:'); // 图例
    });

    it('应该生成直方图', () => {
      const config: ChartConfig = {
        type: 'histogram',
        title: '垂直条形图',
        width: 60,
        height: 12,
        show_legend: false
      };

      const result = generator.generateChart(mockData, config);
      
      expect(result).toContain('垂直条形图');
      expect(result).toContain('└'); // X轴
      expect(result).toContain('│'); // Y轴
    });

    it('应该在不支持的图表类型时抛出错误', () => {
      const invalidConfig = {
        type: 'invalid' as any,
        title: '无效图表',
        width: 60,
        height: 10,
        show_legend: false
      };

      expect(() => {
        generator.generateChart(mockData, invalidConfig);
      }).toThrow('不支持的图表类型');
    });
  });

  describe('预设图表生成方法', () => {
    it('应该生成工具使用分析图表', () => {
      const toolUsage = {
        'Edit': 50,
        'Read': 40,
        'Write': 30,
        'MultiEdit': 20,
        'Bash': 10
      };

      const result = generator.generateToolUsageChart(toolUsage);
      
      expect(result).toContain('工具使用统计');
      expect(result).toContain('Edit');
      expect(result).toContain('50次');
    });

    it('应该生成效率趋势图表', () => {
      const timeLabels = ['Day1', 'Day2', 'Day3', 'Day4', 'Day5'];
      const efficiencyScores = [6.5, 7.2, 7.8, 8.1, 7.9];

      const result = generator.generateEfficiencyTrendChart(timeLabels, efficiencyScores);
      
      expect(result).toContain('效率趋势分析');
      expect(result).toContain('●'); // 数据点
    });

    it('应该生成成本分布图表', () => {
      const categories = ['模型调用', '数据传输', '存储'];
      const costs = [0.45, 0.05, 0.02];

      const result = generator.generateCostDistributionChart(categories, costs);
      
      expect(result).toContain('成本分布分析');
      expect(result).toContain('%');
      expect(result).toContain('Legend:');
    });
  });

  describe('主题支持', () => {
    it('应该支持设置不同主题', () => {
      const defaultTheme = CHART_THEMES.default;
      const asciiTheme = CHART_THEMES.ascii;

      // 使用默认主题
      generator.setTheme(defaultTheme);
      
      const data: TextChartData = {
        labels: ['A', 'B'],
        values: [10, 20]
      };

      const config: ChartConfig = {
        type: 'bar',
        title: 'Test',
        width: 40,
        height: 5,
        show_legend: false
      };

      const result1 = generator.generateChart(data, config);
      
      // 使用ASCII主题
      generator.setTheme(asciiTheme);
      const result2 = generator.generateChart(data, config);
      
      expect(result1).not.toBe(result2); // 不同主题应产生不同输出
    });

    it('应该返回可用主题列表', () => {
      const themes = generator.getAvailableThemes();
      
      expect(themes).toBeInstanceOf(Array);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain('default');
      expect(themes).toContain('ascii');
      expect(themes).toContain('minimal');
    });
  });
});

describe('BarChartGenerator', () => {
  let generator: BarChartGenerator;

  beforeEach(() => {
    generator = new BarChartGenerator();
  });

  describe('水平条形图', () => {
    it('应该正确生成基础条形图', () => {
      const data: TextChartData = {
        labels: ['项目A', '项目B', '项目C'],
        values: [100, 75, 50],
        unit: '次'
      };

      const config: ChartConfig = {
        type: 'bar',
        title: '项目统计',
        width: 50,
        height: 8,
        show_legend: false
      };

      const result = generator.generateHorizontalBarChart(data, config);
      
      expect(result).toContain('项目统计');
      expect(result).toContain('项目A');
      expect(result).toContain('100次');
      expect(result).toContain('│');
    });

    it('应该处理空数据', () => {
      const emptyData: TextChartData = {
        labels: [],
        values: [],
        unit: '次'
      };

      const config: ChartConfig = {
        type: 'bar',
        title: '空图表',
        width: 50,
        height: 8,
        show_legend: false
      };

      const result = generator.generateHorizontalBarChart(emptyData, config);
      
      expect(result).toBe('');
    });

    it('应该正确对齐标签', () => {
      const data: TextChartData = {
        labels: ['短', '中等长度', '这是一个很长的标签名称'],
        values: [10, 20, 30],
        unit: ''
      };

      const config: ChartConfig = {
        type: 'bar',
        title: '标签对齐测试',
        width: 60,
        height: 10,
        show_legend: false
      };

      const result = generator.generateHorizontalBarChart(data, config);
      
      expect(result).toContain('短');
      expect(result).toContain('中等长度');
      expect(result).toContain('这是一个很长的标签名称');
      
      // 验证所有行都包含条形图边框字符
      const lines = result.split('\n').filter(line => line.includes('│'));
      expect(lines.length).toBe(3); // 三个数据项
    });
  });

  describe('垂直条形图', () => {
    it('应该正确生成垂直条形图', () => {
      const data: TextChartData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        values: [25, 40, 35, 50],
        unit: 'K'
      };

      const config: ChartConfig = {
        type: 'histogram',
        title: '季度报告',
        width: 50,
        height: 15,
        show_legend: false
      };

      const result = generator.generateVerticalBarChart(data, config);
      
      expect(result).toContain('季度报告');
      expect(result).toContain('└'); // X轴
      expect(result).toContain('Q1');
      expect(result).toContain('Q2');
      expect(result).toContain('Q3');
      expect(result).toContain('Q4');
    });

    it('应该正确处理单一数据点', () => {
      const data: TextChartData = {
        labels: ['Single'],
        values: [100],
        unit: ''
      };

      const config: ChartConfig = {
        type: 'histogram',
        title: '单数据点',
        width: 30,
        height: 10,
        show_legend: false
      };

      const result = generator.generateVerticalBarChart(data, config);
      
      expect(result).toContain('单数据点');
      expect(result).toContain('Single');
    });
  });
});

describe('LineChartGenerator', () => {
  let generator: LineChartGenerator;

  beforeEach(() => {
    generator = new LineChartGenerator();
  });

  it('应该生成基础线形图', () => {
    const data: TextChartData = {
      labels: ['1月', '2月', '3月', '4月', '5月'],
      values: [10, 15, 12, 18, 20],
      unit: '分'
    };

    const config: ChartConfig = {
      type: 'line',
      title: '月度趋势',
      width: 60,
      height: 12,
      show_legend: false
    };

    const result = generator.generateLineChart(data, config);
    
    expect(result).toContain('月度趋势');
    expect(result).toContain('●'); // 数据点
    expect(result).toContain('└'); // X轴
    expect(result).toContain('│'); // Y轴
  });

  it('应该处理平直线数据', () => {
    const flatData: TextChartData = {
      labels: ['A', 'B', 'C'],
      values: [5, 5, 5], // 相同数值
      unit: ''
    };

    const config: ChartConfig = {
      type: 'line',
      title: '平直线',
      width: 40,
      height: 10,
      show_legend: false
    };

    const result = generator.generateLineChart(flatData, config);
    
    expect(result).toContain('平直线');
    expect(result).toContain('●');
  });

  it('应该正确处理空数据', () => {
    const emptyData: TextChartData = {
      labels: [],
      values: [],
      unit: ''
    };

    const config: ChartConfig = {
      type: 'line',
      title: '空线图',
      width: 40,
      height: 10,
      show_legend: false
    };

    const result = generator.generateLineChart(emptyData, config);
    
    expect(result).toBe('');
  });

  it('应该处理负数和正数混合', () => {
    const mixedData: TextChartData = {
      labels: ['A', 'B', 'C', 'D'],
      values: [-5, 10, -2, 8],
      unit: ''
    };

    const config: ChartConfig = {
      type: 'line',
      title: '混合数据',
      width: 50,
      height: 12,
      show_legend: false
    };

    const result = generator.generateLineChart(mixedData, config);
    
    expect(result).toContain('混合数据');
    expect(result).toContain('●');
  });
});

describe('PieChartGenerator', () => {
  let generator: PieChartGenerator;

  beforeEach(() => {
    generator = new PieChartGenerator();
  });

  it('应该生成基础饼图', () => {
    const data: TextChartData = {
      labels: ['类型A', '类型B', '类型C'],
      values: [30, 45, 25],
      unit: '个'
    };

    const config: ChartConfig = {
      type: 'pie',
      title: '分类统计',
      width: 60,
      height: 10,
      show_legend: true
    };

    const result = generator.generatePieChart(data, config);
    
    expect(result).toContain('分类统计');
    expect(result).toContain('类型A');
    expect(result).toContain('类型B');
    expect(result).toContain('类型C');
    expect(result).toContain('%'); // 百分比显示
    expect(result).toContain('Legend:'); // 图例
  });

  it('应该正确计算百分比', () => {
    const data: TextChartData = {
      labels: ['A', 'B'],
      values: [25, 75], // 应该是25%和75%
      unit: ''
    };

    const config: ChartConfig = {
      type: 'pie',
      title: '百分比测试',
      width: 50,
      height: 8,
      show_legend: false
    };

    const result = generator.generatePieChart(data, config);
    
    expect(result).toContain('25.0%');
    expect(result).toContain('75.0%');
  });

  it('应该处理空数据', () => {
    const emptyData: TextChartData = {
      labels: [],
      values: [],
      unit: ''
    };

    const config: ChartConfig = {
      type: 'pie',
      title: '空饼图',
      width: 50,
      height: 8,
      show_legend: false
    };

    const result = generator.generatePieChart(emptyData, config);
    
    expect(result).toBe('');
  });

  it('应该处理单个数据项', () => {
    const singleData: TextChartData = {
      labels: ['全部'],
      values: [100],
      unit: '%'
    };

    const config: ChartConfig = {
      type: 'pie',
      title: '单项数据',
      width: 40,
      height: 5,
      show_legend: false
    };

    const result = generator.generatePieChart(singleData, config);
    
    expect(result).toContain('单项数据');
    expect(result).toContain('全部');
    expect(result).toContain('100.0%');
  });
});

describe('CHART_THEMES', () => {
  it('应该包含所有必要的主题', () => {
    expect(CHART_THEMES.default).toBeDefined();
    expect(CHART_THEMES.ascii).toBeDefined();
    expect(CHART_THEMES.minimal).toBeDefined();
  });

  it('每个主题应该包含必要的属性', () => {
    Object.values(CHART_THEMES).forEach(theme => {
      expect(theme.name).toBeDefined();
      expect(theme.colors).toBeInstanceOf(Array);
      expect(theme.colors.length).toBeGreaterThan(0);
      expect(theme.background).toBeDefined();
      expect(theme.border).toBeDefined();
    });
  });

  it('主题颜色应该足够使用', () => {
    Object.values(CHART_THEMES).forEach(theme => {
      expect(theme.colors.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('数据处理和边界情况', () => {
  let generator: TextChartGenerator;

  beforeEach(() => {
    generator = new TextChartGenerator();
  });

  it('应该处理极大数值', () => {
    const largeData: TextChartData = {
      labels: ['Big1', 'Big2'],
      values: [1000000, 2000000],
      unit: ''
    };

    const config: ChartConfig = {
      type: 'bar',
      title: '大数值测试',
      width: 60,
      height: 8,
      show_legend: false
    };

    const result = generator.generateChart(largeData, config);
    
    expect(result).toContain('1.0M'); // 应该格式化为M单位
    expect(result).toContain('2.0M');
  });

  it('应该处理极小数值', () => {
    const smallData: TextChartData = {
      labels: ['Small1', 'Small2'],
      values: [0.001, 0.002],
      unit: ''
    };

    const config: ChartConfig = {
      type: 'bar',
      title: '小数值测试',
      width: 60,
      height: 8,
      show_legend: false
    };

    const result = generator.generateChart(smallData, config);
    
    expect(result).toContain('0.00'); // 应该保留小数
  });

  it('应该处理零值数据', () => {
    const zeroData: TextChartData = {
      labels: ['Zero', 'Normal'],
      values: [0, 10],
      unit: ''
    };

    const config: ChartConfig = {
      type: 'bar',
      title: '零值测试',
      width: 40,
      height: 8,
      show_legend: false
    };

    const result = generator.generateChart(zeroData, config);
    
    expect(result).toContain('Zero');
    expect(result).toContain('Normal');
    expect(result).toContain('0');
    expect(result).toContain('10');
  });

  it('应该处理数据和标签长度不匹配', () => {
    const mismatchedData: TextChartData = {
      labels: ['A', 'B', 'C'], // 3个标签
      values: [10, 20], // 2个值
      unit: ''
    };

    const config: ChartConfig = {
      type: 'bar',
      title: '不匹配测试',
      width: 40,
      height: 8,
      show_legend: false
    };

    // 应该处理数据不匹配，不抛出错误
    expect(() => {
      generator.generateChart(mismatchedData, config);
    }).not.toThrow();
  });

  it('应该处理Unicode字符的标签', () => {
    const unicodeData: TextChartData = {
      labels: ['📊 数据', '⚡ 效率', '💰 成本'],
      values: [10, 15, 8],
      unit: ''
    };

    const config: ChartConfig = {
      type: 'pie',
      title: 'Unicode测试',
      width: 50,
      height: 8,
      show_legend: true
    };

    const result = generator.generateChart(unicodeData, config);
    
    expect(result).toContain('📊 数据');
    expect(result).toContain('⚡ 效率');
    expect(result).toContain('💰 成本');
  });
});