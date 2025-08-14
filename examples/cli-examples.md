# CLI 使用示例

本文档提供 Claude Code Stats 命令行界面的详细使用示例，涵盖所有支持的命令和参数组合。

## 📋 命令概览

| 命令 | 功能 | 复杂度 |
|------|------|--------|
| `/stats basic` | 基础统计信息 | ⭐ |
| `/stats efficiency` | 效率分析 | ⭐⭐ |
| `/stats tools` | 工具使用分析 | ⭐⭐ |
| `/stats cost` | 成本分析 | ⭐⭐ |
| `/stats trends` | 趋势分析 | ⭐⭐⭐ |
| `/stats insights` | 智能洞察 | ⭐⭐⭐ |
| `/stats compare` | 数据比较 | ⭐⭐⭐ |
| `/stats export` | 数据导出 | ⭐⭐ |
| `/stats check` | 系统检查 | ⭐ |

---

## 🚀 基础命令示例

### 1. 系统健康检查

```bash
# 基础健康检查
claude-stats /stats check

# 详细诊断信息
claude-stats /stats check --verbose

# 运行完整诊断并自动修复
claude-stats /stats check --diagnose --auto-fix

# 生成诊断报告
claude-stats /stats check --report > system-health.txt
```

**预期输出:**
```
✅ 系统健康检查完成
├─ Cost API: ✅ 可用
├─ 数据目录: ✅ 可访问
├─ 配置文件: ✅ 有效
└─ 依赖项: ✅ 正常

💡 系统运行正常，无需修复
```

### 2. 基础统计信息

```bash
# 当前项目的基础统计
claude-stats /stats basic

# 指定项目路径
claude-stats /stats basic --project /path/to/project

# 中文输出
claude-stats /stats basic --lang zh-CN

# 英文输出
claude-stats /stats basic --lang en-US

# 详细格式
claude-stats /stats basic --format detailed

# 导出到文件
claude-stats /stats basic --output basic-stats.txt
```

**预期输出:**
```
📊 基础统计报告

时间统计:
├─ 总会话数: 15
├─ 总活跃时间: 8.5 小时
├─ 平均会话时长: 34 分钟
└─ 最长会话: 2.3 小时

Token统计:
├─ 输入Token: 12,340
├─ 输出Token: 8,760
├─ 总Token数: 21,100
└─ 平均Token/小时: 2,482

成本统计:
├─ 总成本: $0.0523
├─ 输入成本: $0.0185
├─ 输出成本: $0.0338
└─ 平均成本/小时: $0.0062

文件统计:
├─ 处理文件数: 23
├─ 新建文件: 8
├─ 编辑文件: 15
└─ 删除文件: 0
```

---

## ⚡ 效率分析示例

### 3. 效率指标分析

```bash
# 基础效率分析
claude-stats /stats efficiency

# 详细效率报告
claude-stats /stats efficiency --format detailed

# 包含图表的效率分析
claude-stats /stats efficiency --format chart

# 指定时间范围
claude-stats /stats efficiency --period 7d

# 效率趋势分析
claude-stats /stats efficiency --trends --duration 30d
```

**预期输出:**
```
⚡ 效率分析报告

生产力指标:
├─ Token效率: 2,482 tokens/小时
├─ 预估代码行数: 156 行/小时
├─ 生产力评分: 7.2/10
└─ 效率等级: Good (良好)

工具使用效率:
├─ 最常用工具: Edit (45%)
├─ 工具切换频率: 3.2 次/小时
├─ 平均工具会话: 12 分钟
└─ 工具效率指数: 0.78

代码生成分析:
├─ 估算代码行数: 1,328 行
├─ 平均行数/文件: 58 行
├─ 复杂度估算: 中等
└─ 质量指数: 0.85

🎯 效率评估: 您的开发效率处于良好水平，建议继续保持当前的工作模式。
```

### 4. 工具使用分析

```bash
# 工具使用统计
claude-stats /stats tools

# 工具使用图表
claude-stats /stats tools --chart

# 工具效率分析
claude-stats /stats tools --efficiency

# 按时间段分析
claude-stats /stats tools --period 1w --breakdown daily
```

**预期输出:**
```
🔧 工具使用分析

工具使用分布:
Edit       ████████████████████░░ 67% (156 次)
Read       ████████████░░░░░░░░░░ 23% (54 次)
Write      ████░░░░░░░░░░░░░░░░░░  8% (19 次)
Delete     ░░░░░░░░░░░░░░░░░░░░░░  2% (5 次)

工具效率指标:
├─ 最高效工具: Edit (0.89)
├─ 最低效工具: Delete (0.34)
├─ 工具切换延时: 平均 3.2 秒
└─ 工具学习曲线: 稳定上升

使用模式分析:
├─ 主要工作流: Read → Edit → Write
├─ 高峰使用时段: 14:00-16:00
├─ 工具组合效率: 0.76
└─ 建议: 可考虑更多使用批量编辑功能
```

---

## 💰 成本分析示例

### 5. 成本统计和优化

```bash
# 基础成本分析
claude-stats /stats cost

# 按模型分解成本
claude-stats /stats cost --breakdown model

# 成本优化建议
claude-stats /stats cost --suggestions

# 成本趋势分析
claude-stats /stats cost --trends --period 30d

# 成本对比分析
claude-stats /stats cost --compare --period1 "2024-07-01,2024-07-31" --period2 "2024-08-01,2024-08-31"
```

**预期输出:**
```
💰 成本分析报告

总成本概览:
├─ 总支出: $0.1247
├─ 平均日成本: $0.0041
├─ 预估月成本: $0.1230
└─ 成本趋势: 📈 上升 12%

按模型分解:
Claude Sonnet   ████████████████░░ $0.0892 (71.5%)
Claude Haiku    ████░░░░░░░░░░░░░░ $0.0234 (18.8%)
Claude Opus     ██░░░░░░░░░░░░░░░░ $0.0121 (9.7%)

成本效率分析:
├─ 每小时成本: $0.0147
├─ 每1K Token: $0.0059
├─ 每行代码: $0.0001
└─ ROI 指数: 很好 (4.2/5)

💡 优化建议:
1. 可考虑更多使用 Haiku 模型处理简单任务 (节省 23%)
2. 批量处理相似任务可提高效率
3. 当前成本控制良好，继续保持
```

---

## 📈 高级分析示例

### 6. 趋势分析

```bash
# 基础趋势分析
claude-stats /stats trends

# 长期趋势（30天）
claude-stats /stats trends --duration 30d

# 包含异常检测
claude-stats /stats trends --include-anomalies

# 季节性分析
claude-stats /stats trends --seasonal-analysis

# 详细趋势报告
claude-stats /stats trends --format detailed --charts
```

**预期输出:**
```
📈 趋势分析报告 (30天数据)

整体趋势:
├─ 使用频率: 📈 上升 18% (稳定增长)
├─ 效率指标: 📊 持平 +2% (稳定)
├─ 成本控制: 📉 下降 8% (优化成功)
└─ 活跃度: 📈 上升 15% (积极)

异常检测:
├─ 检测到 3 个异常点
├─ 8月15日: Token使用异常高 (+340%)
├─ 8月22日: 会话时长异常长 (4.2小时)
└─ 异常影响: 轻微 (< 5%)

趋势预测:
├─ 下周预测: 使用量持续温和增长
├─ 月末预测: 成本控制在 $0.15 以内
├─ 效率预测: 预计提升 5-10%
└─ 置信度: 85%

📊 趋势图表:
Token使用量 (7天移动平均):
Week1 ████████░░░░░░░░░░░░░░░ 2,100
Week2 ██████████████░░░░░░░░ 2,800
Week3 ████████████████░░░░░░ 3,200
Week4 ███████████████████░░░ 3,650
```

### 7. 智能洞察生成

```bash
# 生成智能洞察
claude-stats /stats insights

# 高优先级洞察
claude-stats /stats insights --priority high

# 包含具体建议
claude-stats /stats insights --include-recommendations

# 自定义洞察规则
claude-stats /stats insights --custom-rules efficiency,cost

# 详细洞察报告
claude-stats /stats insights --format detailed --lang zh-CN
```

**预期输出:**
```
🧠 智能洞察报告

🎯 主要洞察:
1. 💡 工作效率洞察
   您在周二和周三的工作效率最高，Token产出比平均水平高32%。
   建议：将复杂任务安排在这两天。

2. 💰 成本优化洞察  
   最近7天的成本下降了8%，主要得益于更合理的模型选择。
   成果：继续当前的模型使用策略。

3. ⏰ 时间管理洞察
   您的平均会话时长为34分钟，略高于推荐的25-30分钟。
   建议：考虑更频繁的休息以保持专注度。

🔧 优化建议:
├─ 效率优化: 在14:00-16:00时段安排重要工作
├─ 成本控制: 继续当前的Haiku/Sonnet混合使用策略  
├─ 工具使用: 可以尝试更多的批量编辑功能
└─ 工作模式: 建议采用25分钟工作+5分钟休息的节奏

⚠️ 注意事项:
├─ 检测到连续3天的长时间会话，注意休息
├─ Token使用在上周有异常峰值，可能影响成本预算
└─ 建议定期查看月度趋势报告

🏆 成就解锁:
├─ 🎯 效率达人: 连续5天保持高生产力
├─ 💰 成本控制专家: 本月成本控制在预算内
└─ ⚡ 工具大师: 熟练使用所有主要工具
```

---

## 🔄 比较分析示例

### 8. 数据对比分析

```bash
# 周对比分析
claude-stats /stats compare --period1 "last-week" --period2 "this-week"

# 月对比分析  
claude-stats /stats compare --period1 "2024-07-01,2024-07-31" --period2 "2024-08-01,2024-08-31"

# 项目对比
claude-stats /stats compare --project1 /path/to/project1 --project2 /path/to/project2

# 详细对比报告
claude-stats /stats compare --format detailed --include-charts
```

**预期输出:**
```
🔄 数据对比分析

比较周期:
├─ 期间1: 2024-07-01 至 2024-07-31 (31天)
└─ 期间2: 2024-08-01 至 2024-08-31 (31天)

📊 关键指标对比:

使用量对比:
                期间1    期间2    变化
总会话数:        42       58     +38% ⬆️
总活跃时间:      28h      35h    +25% ⬆️  
总Token数:      85.2K    94.8K   +11% ⬆️
总成本:         $0.31    $0.28   -10% ⬇️

效率对比:
                期间1    期间2    变化
Token/小时:     3,043    2,708   -11% ⬇️
行/小时:        183      162     -11% ⬇️
生产力评分:     7.8      7.2     -0.6 ⬇️
工具效率:       0.82     0.79    -4%  ⬇️

📈 趋势分析:
✅ 积极变化:
├─ 使用频率显著提升 (+38%)
├─ 活跃时间增加，投入度提高
└─ 成本控制优秀，支出下降10%

⚠️ 需要关注:
├─ 单位效率有所下降
├─ 可能是任务复杂度增加导致
└─ 建议优化工作流程

💡 建议:
1. 虽然使用量增加，但要保持效率
2. 成本控制表现优秀，继续保持
3. 考虑分析效率下降的具体原因
```

---

## 📤 导出和集成示例

### 9. 数据导出

```bash
# 导出JSON格式数据
claude-stats /stats export --format json --output data.json

# 导出CSV格式用于Excel分析
claude-stats /stats export --format csv --output stats.csv

# 导出详细报告
claude-stats /stats export --format detailed --output report.txt

# 导出指定时间范围的数据
claude-stats /stats export --period "2024-08-01,2024-08-31" --format json

# 导出特定类型的数据
claude-stats /stats export --data-type efficiency --format json
```

**生成的文件示例:**

`data.json`:
```json
{
  "metadata": {
    "generatedAt": "2024-08-14T10:30:00Z",
    "version": "1.0.0",
    "projectPath": "/path/to/project",
    "totalDataPoints": 156
  },
  "summary": {
    "totalSessions": 58,
    "totalActiveTime": 35.2,
    "totalTokens": 94800,
    "totalCost": 0.28,
    "productivityScore": 7.2
  },
  "details": { ... }
}
```

### 10. 批量操作和脚本集成

```bash
# 批量分析多个项目
for project in /path/to/projects/*; do
  claude-stats /stats basic --project "$project" --format json > "stats-$(basename $project).json"
done

# 定时任务集成
# 添加到 crontab: 每天22:00生成报告
0 22 * * * claude-stats /stats export --format detailed --output ~/daily-report-$(date +%Y%m%d).txt

# CI/CD 集成示例
claude-stats /stats check --format json > build-stats.json
if [ $(jq -r '.health.overall' build-stats.json) = "healthy" ]; then
  echo "✅ Stats system healthy"
else
  echo "❌ Stats system issues detected"
  exit 1
fi
```

---

## 🎛️ 高级配置示例

### 11. 环境变量配置

```bash
# 设置默认语言
export CC_STATS_LANG=zh-CN

# 设置默认项目路径
export CLAUDE_PROJECT_DIR=/path/to/default/project

# 启用调试模式
export CC_STATS_DEBUG=true

# 设置OpenTelemetry端点
export CC_STATS_OTEL_ENDPOINT=http://localhost:4317

# 运行命令（使用环境变量配置）
claude-stats /stats basic --verbose
```

### 12. 配置文件自定义

```bash
# 创建自定义配置
mkdir -p ~/.claude/
cat > ~/.claude/settings.json << 'EOF'
{
  "cc-stats": {
    "enabled": true,
    "language": "zh-CN",
    "data_sources": {
      "cost_api": true,
      "opentelemetry": true,
      "opentelemetry_endpoint": "http://localhost:4317"
    },
    "analysis": {
      "project_level": true,
      "trend_analysis": true,
      "estimation_model": "aggressive",
      "cache_enabled": true,
      "cache_ttl": 600
    },
    "reporting": {
      "default_format": "detailed",
      "include_charts": true,
      "color_output": true
    },
    "privacy": {
      "level": "standard",
      "anonymize_paths": true,
      "collect_errors": true
    }
  }
}
EOF

# 验证配置
claude-stats /stats check --config
```

---

## 🚨 故障排除示例

### 13. 常见问题解决

```bash
# 数据源问题诊断
claude-stats /stats check --diagnose --verbose

# 权限问题修复
chmod +x ~/.claude/claude-stats
sudo chown -R $(whoami) ~/.claude/

# 清理缓存
claude-stats --clear-cache

# 重置配置
claude-stats --reset-config

# 查看详细日志
claude-stats /stats basic --debug --log-level debug
```

### 14. 性能优化

```bash
# 启用缓存模式
claude-stats /stats efficiency --cache --cache-ttl 300

# 限制数据范围提升性能
claude-stats /stats trends --period 7d --limit 1000

# 并行处理（如果系统支持）
claude-stats /stats basic --parallel --max-workers 4

# 内存优化模式
claude-stats /stats export --format json --memory-optimized
```

---

## 💡 最佳实践建议

### 15. 日常使用建议

```bash
# 每日快速检查
alias daily-check='claude-stats /stats basic --format simple'

# 每周详细分析
alias weekly-analysis='claude-stats /stats efficiency --format detailed --period 7d'

# 月度完整报告
alias monthly-report='claude-stats /stats export --format detailed --period 30d --output monthly-$(date +%Y%m).txt'

# 快速故障排除
alias stats-health='claude-stats /stats check --diagnose'
```

### 16. 自动化脚本示例

```bash
#!/bin/bash
# daily-stats-automation.sh

echo "📊 开始每日统计分析..."

# 1. 健康检查
if ! claude-stats /stats check --quiet; then
  echo "❌ 系统健康检查失败"
  exit 1
fi

# 2. 生成基础报告
claude-stats /stats basic --format json > daily-basic.json

# 3. 检查异常情况
COST=$(jq -r '.summary.totalCost' daily-basic.json)
if (( $(echo "$COST > 0.1" | bc -l) )); then
  echo "⚠️  成本异常: $COST"
  claude-stats /stats cost --suggestions
fi

# 4. 生成洞察
claude-stats /stats insights --priority high > daily-insights.txt

echo "✅ 每日分析完成"
```

通过这些详细的CLI使用示例，用户可以充分利用Claude Code Stats系统的所有功能，实现高效的开发数据分析和监控。