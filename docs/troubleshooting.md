# 故障排除指南

本文档提供 Claude Code Stats 系统常见问题的详细解决方案，包括安装、配置、运行和性能问题的诊断与修复。

## 📚 目录

- [快速诊断](#快速诊断)
- [安装问题](#安装问题)
- [配置问题](#配置问题)
- [数据源问题](#数据源问题)
- [运行时错误](#运行时错误)
- [性能问题](#性能问题)
- [网络问题](#网络问题)
- [权限问题](#权限问题)
- [平台兼容性](#平台兼容性)
- [开发调试](#开发调试)
- [常用诊断命令](#常用诊断命令)

---

## 🚨 快速诊断

在遇到问题时，首先运行系统自带的诊断工具：

```bash
# 运行完整的系统诊断
claude-stats /stats check --diagnose --verbose

# 自动修复常见问题
claude-stats /stats check --auto-fix

# 生成诊断报告
claude-stats /stats check --report > diagnostic-report.txt
```

### 系统健康状态说明

| 状态 | 含义 | 建议操作 |
|------|------|---------|
| ✅ 健康 | 系统运行正常 | 继续使用 |
| ⚠️ 警告 | 有轻微问题但可继续运行 | 查看建议并考虑优化 |
| ❌ 错误 | 系统无法正常工作 | 必须修复后才能使用 |
| 🔧 修复中 | 系统正在自动修复 | 等待修复完成 |

---

## 🛠️ 安装问题

### Q1: npm 安装失败

**症状**: `npm install` 报错或卡住

**原因分析**:
- 网络连接问题
- npm 缓存损坏
- Node.js 版本不兼容
- 权限问题

**解决方案**:

```bash
# 1. 检查Node.js版本
node --version
# 确保 >= 16.0.0

# 2. 清理npm缓存
npm cache clean --force

# 3. 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 4. 使用cnpm（如果在中国）
npm install -g cnpm --registry=https://registry.npm.taobao.org
cnpm install

# 5. 临时解决权限问题
sudo npm install --unsafe-perm=true --allow-root
```

### Q2: TypeScript 编译失败

**症状**: `npm run build` 报错

**常见错误**:
```
error TS2307: Cannot find module '@/types'
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**解决方案**:

```bash
# 1. 检查TypeScript版本
npx tsc --version
# 确保版本 >= 5.0

# 2. 清理构建缓存
npm run clean
rm -rf dist/

# 3. 重新安装TypeScript
npm uninstall typescript
npm install -D typescript@latest

# 4. 检查tsconfig.json配置
npx tsc --showConfig

# 5. 逐步构建查找问题
npx tsc --noEmit  # 只做类型检查
npx tsc --build   # 增量构建
```

### Q3: 安装脚本失败

**症状**: `./scripts/install.sh` 执行失败

**解决方案**:

```bash
# 1. 确保脚本有执行权限
chmod +x scripts/install.sh

# 2. 检查脚本语法
bash -n scripts/install.sh

# 3. 调试模式运行
bash -x scripts/install.sh

# 4. 手动执行关键步骤
npm install
npm run build
npm run setup

# 5. 检查系统依赖
which node npm git claude
```

---

## ⚙️ 配置问题

### Q4: 配置文件无效

**症状**: 
- 系统使用默认配置而不是用户配置
- 配置修改不生效

**诊断步骤**:

```bash
# 1. 检查配置文件位置
ls -la ~/.claude/settings.json

# 2. 验证JSON格式
cat ~/.claude/settings.json | jq '.'

# 3. 查看当前生效的配置
claude-stats /stats check --config

# 4. 重置配置到默认状态
claude-stats --reset-config
```

**配置文件模板**:

```json
{
  "cc-stats": {
    "enabled": true,
    "language": "zh-CN",
    "data_sources": {
      "cost_api": true,
      "opentelemetry": false,
      "opentelemetry_endpoint": "http://localhost:4317"
    },
    "analysis": {
      "project_level": true,
      "trend_analysis": true,
      "estimation_model": "conservative",
      "cache_enabled": true,
      "cache_ttl": 300
    },
    "reporting": {
      "default_format": "table",
      "include_charts": false,
      "color_output": true
    },
    "privacy": {
      "level": "standard",
      "anonymize_paths": true,
      "collect_errors": true
    }
  }
}
```

### Q5: 环境变量不生效

**症状**: 设置的环境变量没有被系统读取

**解决方案**:

```bash
# 1. 检查环境变量是否设置
echo $CLAUDE_PROJECT_DIR
echo $CC_STATS_LANG
echo $CC_STATS_DEBUG

# 2. 在当前shell中设置
export CLAUDE_PROJECT_DIR="/path/to/project"
export CC_STATS_LANG="zh-CN"

# 3. 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export CLAUDE_PROJECT_DIR="/path/to/project"' >> ~/.bashrc
source ~/.bashrc

# 4. 验证变量生效
claude-stats /stats basic --verbose
```

---

## 📊 数据源问题

### Q6: Cost API 不可用

**症状**: 
```
❌ Cost API: 不可用
错误: claude cost command not found
```

**解决方案**:

```bash
# 1. 检查Claude Code CLI是否安装
claude --version
which claude

# 2. 检查Cost API功能
claude cost --help

# 3. 如果CLI未安装，安装Claude Code
# 参考: https://docs.anthropic.com/claude-code

# 4. 检查API权限
claude auth status

# 5. 重新认证
claude auth login

# 6. 测试Cost API
claude cost --project . --format json
```

### Q7: OpenTelemetry 连接失败

**症状**: 
```
⚠️ OpenTelemetry: 连接失败
错误: ECONNREFUSED 127.0.0.1:4317
```

**解决方案**:

```bash
# 1. 检查OpenTelemetry Collector是否运行
netstat -tuln | grep 4317
curl -I http://localhost:4317

# 2. 启动OpenTelemetry Collector (如果需要)
# 安装并配置OTEL Collector...

# 3. 暂时禁用OpenTelemetry数据源
cat > ~/.claude/settings.json << 'EOF'
{
  "cc-stats": {
    "data_sources": {
      "cost_api": true,
      "opentelemetry": false
    }
  }
}
EOF

# 4. 验证系统可以只使用Cost API工作
claude-stats /stats check
```

### Q8: 数据目录权限问题

**症状**: 
```
❌ 数据目录: 权限被拒绝
错误: EACCES: permission denied
```

**解决方案**:

```bash
# 1. 检查数据目录权限
ls -la ~/.claude/

# 2. 修复权限
sudo chown -R $(whoami):$(whoami) ~/.claude/
chmod -R 755 ~/.claude/

# 3. 检查父目录权限
ls -la ~/

# 4. 重新创建数据目录结构
mkdir -p ~/.claude/data/{projects,system}
chmod 755 ~/.claude/data/{projects,system}

# 5. 验证权限修复
claude-stats /stats check --diagnose
```

---

## 🏃‍♂️ 运行时错误

### Q9: 内存不足错误

**症状**: 
```
❌ JavaScript heap out of memory
FATAL ERROR: Reached heap limit Allocation failed
```

**解决方案**:

```bash
# 1. 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"  # 4GB

# 2. 使用内存优化模式
claude-stats /stats export --memory-optimized

# 3. 限制数据处理范围
claude-stats /stats basic --period 7d --limit 1000

# 4. 清理系统缓存
claude-stats --clear-cache
npm run clean

# 5. 分批处理大数据
claude-stats /stats export --format json --batch-size 100
```

### Q10: 模块加载失败

**症状**: 
```
Error: Cannot find module '@/types/usage-data'
Error: Module not found: Can't resolve '../src/analytics'
```

**解决方案**:

```bash
# 1. 检查模块路径映射
cat tsconfig.json | grep -A 10 '"paths"'

# 2. 重新构建项目
npm run clean
npm run build

# 3. 检查dist目录结构
ls -la dist/
find dist/ -name "*.js" | head -10

# 4. 使用绝对路径测试
node -e "console.log(require('./dist/src/index.js'))"

# 5. 检查package.json导出配置
cat package.json | grep -A 5 '"main"'
```

### Q11: 异步操作超时

**症状**: 
```
❌ 操作超时: Promise在30000ms后未完成
Error: Timeout of 30000ms exceeded
```

**解决方案**:

```bash
# 1. 增加超时时间
export CC_STATS_TIMEOUT=60000  # 60秒

# 2. 检查网络连接
ping claude.ai
curl -I https://api.claude.ai

# 3. 使用较小的数据集测试
claude-stats /stats basic --period 1d

# 4. 启用调试模式查看详细信息
export CC_STATS_DEBUG=true
claude-stats /stats basic --verbose

# 5. 检查系统负载
top -n 1 | head -5
free -h
```

---

## 🚀 性能问题

### Q12: 分析速度慢

**症状**: 分析过程耗时过长，超过预期时间

**优化方案**:

```bash
# 1. 启用缓存
claude-stats /stats basic --cache --cache-ttl 600

# 2. 限制数据范围
claude-stats /stats basic --period 7d
claude-stats /stats basic --limit 500

# 3. 使用简化模式
claude-stats /stats basic --format simple

# 4. 并行处理（如果支持）
claude-stats /stats basic --parallel --max-workers 4

# 5. 清理缓存和临时文件
rm -rf ~/.claude/cache/
rm -rf /tmp/claude-stats-*
```

### Q13: 内存使用过高

**症状**: 系统内存占用不断增长

**解决方案**:

```bash
# 1. 监控内存使用
watch -n 2 'ps aux | grep claude-stats'

# 2. 启用内存优化模式
export NODE_OPTIONS="--max-old-space-size=2048"
claude-stats /stats basic --memory-optimized

# 3. 分批处理数据
claude-stats /stats export --batch-size 50 --stream

# 4. 定期清理缓存
# 添加到crontab
# 0 2 * * * claude-stats --clear-cache

# 5. 检查内存泄漏
node --inspect-brk dist/src/cli.js /stats basic
# 使用Chrome DevTools分析内存使用
```

---

## 🌐 网络问题

### Q14: API 请求失败

**症状**: 
```
❌ 网络请求失败: ENOTFOUND claude.ai
❌ SSL证书验证失败
```

**解决方案**:

```bash
# 1. 检查网络连接
ping google.com
nslookup claude.ai

# 2. 检查代理设置
echo $HTTP_PROXY $HTTPS_PROXY
unset HTTP_PROXY HTTPS_PROXY  # 临时取消代理

# 3. 检查防火墙设置
# Windows: 检查Windows Defender防火墙
# macOS: 检查系统防火墙设置
# Linux: 检查iptables规则

# 4. 临时禁用SSL验证（不推荐用于生产）
export NODE_TLS_REJECT_UNAUTHORIZED=0

# 5. 使用系统代理
export HTTP_PROXY=http://your-proxy:8080
export HTTPS_PROXY=https://your-proxy:8080
```

### Q15: 企业网络限制

**症状**: 在企业网络环境中无法正常访问

**解决方案**:

```bash
# 1. 配置企业代理
export HTTP_PROXY=http://corporate-proxy:8080
export HTTPS_PROXY=http://corporate-proxy:8080

# 2. 配置认证代理
export HTTP_PROXY=http://username:password@proxy:8080

# 3. 跳过证书验证（临时）
export NODE_TLS_REJECT_UNAUTHORIZED=0

# 4. 使用企业CA证书
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem

# 5. 联系IT部门添加白名单
# claude.ai, *.claude.ai, api.claude.ai
```

---

## 🔐 权限问题

### Q16: 文件权限被拒绝

**症状**: 
```
❌ EACCES: permission denied, open '/path/to/file'
❌ EPERM: operation not permitted
```

**解决方案**:

```bash
# 1. 检查文件所有者和权限
ls -la ~/.claude/
ls -la /usr/local/bin/claude-stats

# 2. 修复权限
sudo chown $(whoami):$(whoami) ~/.claude/ -R
chmod 755 ~/.claude/
chmod 644 ~/.claude/settings.json

# 3. 修复可执行文件权限
sudo chmod +x /usr/local/bin/claude-stats
chmod +x ./dist/src/cli.js

# 4. 使用sudo运行（不推荐）
sudo claude-stats /stats basic

# 5. 更改安装位置到用户目录
npm install --prefix ~/.local @claude/code-stats
export PATH="$HOME/.local/bin:$PATH"
```

### Q17: macOS 安全限制

**症状**: macOS 阻止运行未签名的可执行文件

**解决方案**:

```bash
# 1. 允许运行未签名应用
# 系统偏好设置 > 安全性与隐私 > 通用 > 允许从以下位置下载的应用

# 2. 使用命令行临时授权
sudo xattr -rd com.apple.quarantine /path/to/claude-stats

# 3. 禁用Gatekeeper（不推荐）
sudo spctl --master-disable

# 4. 从源码编译安装
git clone https://github.com/your-repo/claude-dev-stats.git
cd claude-dev-stats
npm install && npm run build

# 5. 使用Homebrew安装（如果可用）
brew install claude-dev-stats
```

---

## 💻 平台兼容性

### Q18: Windows 兼容性问题

**症状**: 在Windows上运行异常

**解决方案**:

```powershell
# 1. 使用PowerShell而非CMD
# 确保使用PowerShell 5.0+
$PSVersionTable.PSVersion

# 2. 路径问题修复
# 使用反斜杠或双引号
claude-stats /stats basic --project "C:\Users\Username\Project"

# 3. 权限问题
# 以管理员身份运行PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 4. 安装Windows构建工具
npm install --global windows-build-tools

# 5. 使用WSL（推荐）
wsl --install
# 在WSL中安装和使用
```

### Q19: macOS 版本兼容

**症状**: 在旧版macOS上运行问题

**解决方案**:

```bash
# 1. 检查macOS版本
sw_vers

# 2. 安装适配的Node.js版本
# macOS 10.15+ 使用Node.js 16+
# macOS 10.13-10.14 使用Node.js 14

# 3. 使用nvm管理Node.js版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16.20.0
nvm use 16.20.0

# 4. 检查Xcode命令行工具
xcode-select --install

# 5. 更新系统（如果可能）
softwareupdate -l
```

---

## 🐛 开发调试

### Q20: 调试模式启用

**启用详细日志**:

```bash
# 1. 环境变量方式
export CC_STATS_DEBUG=true
export CC_STATS_LOG_LEVEL=debug

# 2. 命令行参数
claude-stats /stats basic --debug --verbose --log-level debug

# 3. 配置文件方式
{
  "cc-stats": {
    "debug": {
      "enabled": true,
      "log_level": "debug",
      "trace_performance": true
    }
  }
}

# 4. 查看日志文件
tail -f ~/.claude/logs/debug.log
```

### Q21: 性能分析

**分析性能瓶颈**:

```bash
# 1. 启用性能追踪
export CC_STATS_TRACE=true
claude-stats /stats basic --trace

# 2. 使用Node.js profiler
node --prof dist/src/cli.js /stats basic
node --prof-process isolate-*.log > profile.txt

# 3. 内存使用分析
node --inspect dist/src/cli.js /stats basic
# 在Chrome中打开 chrome://inspect

# 4. 时间分析
time claude-stats /stats basic
/usr/bin/time -v claude-stats /stats basic

# 5. 系统调用追踪（Linux）
strace -c claude-stats /stats basic
```

---

## 🛠️ 常用诊断命令

### 系统状态检查

```bash
# 完整系统诊断
claude-stats /stats check --diagnose --verbose --report

# 数据源状态
claude-stats /stats check --data-sources

# 配置验证
claude-stats /stats check --config

# 性能测试
claude-stats /stats check --performance
```

### 环境信息收集

```bash
# 系统信息
uname -a
cat /etc/os-release  # Linux
sw_vers             # macOS
systeminfo          # Windows

# Node.js和npm信息
node --version
npm --version
npm list -g --depth=0

# Claude Code信息
claude --version
claude auth status

# 网络测试
ping claude.ai
curl -I https://api.claude.ai
```

### 日志和错误追踪

```bash
# 查看系统日志
tail -f ~/.claude/logs/system.log
tail -f ~/.claude/logs/error.log

# 清理日志
rm -rf ~/.claude/logs/*

# 错误报告
claude-stats --generate-error-report > error-report.json

# 上传诊断信息（如果支持）
claude-stats --upload-diagnostics
```

### 缓存和数据管理

```bash
# 查看缓存状态
claude-stats --cache-status

# 清理缓存
claude-stats --clear-cache

# 数据验证
claude-stats --validate-data

# 重建索引
claude-stats --rebuild-index
```

---

## 📞 获取进一步帮助

如果以上解决方案无法解决你的问题，可以通过以下渠道获取帮助：

### 1. GitHub Issues
- **新问题**: [创建新Issue](https://github.com/your-repo/claude-dev-stats/issues/new)
- **已知问题**: [查看现有Issues](https://github.com/your-repo/claude-dev-stats/issues)

### 2. 社区支持
- **讨论**: [GitHub Discussions](https://github.com/your-repo/claude-dev-stats/discussions)
- **FAQ**: [常见问题解答](https://github.com/your-repo/claude-dev-stats/wiki/FAQ)

### 3. 提交问题时的信息清单

请在提交问题时包含以下信息：

```bash
# 生成完整的诊断报告
claude-stats /stats check --diagnose --report > diagnostic-report.txt

# 系统环境信息
{
  "os": "$(uname -s)",
  "version": "$(uname -r)",
  "node": "$(node --version)",
  "npm": "$(npm --version)",
  "claude_cli": "$(claude --version 2>/dev/null || echo 'not installed')"
}

# 错误重现步骤
1. 执行的具体命令
2. 预期的结果
3. 实际的错误信息
4. 错误发生的环境（开发/生产）

# 相关配置文件
cat ~/.claude/settings.json
cat package.json  # 如果是开发环境
```

### 4. 应急联系方式

如果遇到严重的生产环境问题：

- **安全问题**: security@your-domain.com
- **紧急支持**: support@your-domain.com
- **技术咨询**: tech@your-domain.com

---

## 📋 常见错误码参考

| 错误码 | 含义 | 解决方案 |
|-------|------|---------|
| `E_DATA_SOURCE` | 数据源不可用 | 检查Claude CLI和Cost API |
| `E_CONFIG_INVALID` | 配置文件无效 | 验证JSON格式和配置项 |
| `E_PERMISSION` | 权限被拒绝 | 修复文件和目录权限 |
| `E_NETWORK` | 网络连接失败 | 检查网络和代理设置 |
| `E_MEMORY` | 内存不足 | 增加内存限制或优化数据处理 |
| `E_TIMEOUT` | 操作超时 | 增加超时时间或检查性能 |
| `E_PARSE` | 数据解析失败 | 检查数据格式和完整性 |
| `E_MODULE` | 模块加载失败 | 重新构建项目或检查依赖 |

---

**💡 提示**: 这个故障排除指南会持续更新。如果你发现新的问题和解决方案，欢迎提交PR来完善这个文档！