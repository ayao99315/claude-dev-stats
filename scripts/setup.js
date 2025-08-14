#!/usr/bin/env node

/**
 * Claude Code 智能开发统计与分析工具 - 配置向导
 * 交互式配置系统，引导用户完成初始设置
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

// 配置常量
const INSTALL_DIR = path.join(os.homedir(), '.claude');
const CONFIG_FILE = path.join(INSTALL_DIR, 'settings.json');
const DATA_DIR = path.join(INSTALL_DIR, 'data');
const LOGS_DIR = path.join(INSTALL_DIR, 'logs');
const CACHE_DIR = path.join(INSTALL_DIR, 'cache');

// ANSI 颜色代码
const colors = {
    reset: '\033[0m',
    bright: '\033[1m',
    red: '\033[31m',
    green: '\033[32m',
    yellow: '\033[33m',
    blue: '\033[34m',
    magenta: '\033[35m',
    cyan: '\033[36m',
    white: '\033[37m'
};

// 图标定义
const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    question: '❓',
    config: '⚙️',
    folder: '📁',
    rocket: '🚀',
    wizard: '🧙‍♂️',
    check: '✔️',
    cross: '✖️'
};

// 日志函数
function log(level, message, icon = null) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const color = colors[level] || colors.reset;
    const displayIcon = icon || icons[level] || '';
    
    console.log(`${color}${displayIcon} [${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message, icon = icons.success) {
    log('green', message, icon);
}

function logError(message, icon = icons.error) {
    log('red', message, icon);
}

function logWarning(message, icon = icons.warning) {
    log('yellow', message, icon);
}

function logInfo(message, icon = icons.info) {
    log('blue', message, icon);
}

function logConfig(message, icon = icons.config) {
    log('cyan', message, icon);
}

// 创建 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 提问函数
function askQuestion(question, defaultValue = '') {
    return new Promise((resolve) => {
        const prompt = defaultValue ? `${question} (默认: ${defaultValue}): ` : `${question}: `;
        rl.question(`${colors.yellow}${icons.question} ${prompt}${colors.reset}`, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

// 确认函数
function askConfirm(question, defaultValue = false) {
    return new Promise((resolve) => {
        const defaultText = defaultValue ? 'Y/n' : 'y/N';
        rl.question(`${colors.yellow}${icons.question} ${question} (${defaultText}): ${colors.reset}`, (answer) => {
            const normalized = answer.trim().toLowerCase();
            if (normalized === '') {
                resolve(defaultValue);
            } else {
                resolve(normalized === 'y' || normalized === 'yes');
            }
        });
    });
}

// 选择函数
function askChoice(question, choices, defaultIndex = 0) {
    return new Promise((resolve) => {
        console.log(`${colors.yellow}${icons.question} ${question}${colors.reset}`);
        choices.forEach((choice, index) => {
            const marker = index === defaultIndex ? '●' : '○';
            console.log(`  ${colors.cyan}${index + 1}${colors.reset}. ${marker} ${choice}`);
        });
        
        rl.question(`请选择 (1-${choices.length}, 默认: ${defaultIndex + 1}): `, (answer) => {
            const choice = parseInt(answer.trim()) - 1;
            if (isNaN(choice) || choice < 0 || choice >= choices.length) {
                resolve(defaultIndex);
            } else {
                resolve(choice);
            }
        });
    });
}

// 系统环境检查
class SystemChecker {
    static checkNodeVersion() {
        try {
            const version = process.version;
            const major = parseInt(version.substring(1).split('.')[0]);
            
            if (major >= 16) {
                logSuccess(`Node.js 版本检查通过: ${version}`);
                return true;
            } else {
                logError(`Node.js 版本过低: ${version}，需要 v16.0.0 或更高版本`);
                return false;
            }
        } catch (error) {
            logError(`Node.js 版本检查失败: ${error.message}`);
            return false;
        }
    }
    
    static checkNpmVersion() {
        try {
            const version = execSync('npm --version', { encoding: 'utf8' }).trim();
            logSuccess(`npm 版本检查通过: v${version}`);
            return true;
        } catch (error) {
            logError(`npm 检查失败: ${error.message}`);
            return false;
        }
    }
    
    static checkClaudeCode() {
        try {
            execSync('claude --version', { encoding: 'utf8', stdio: 'ignore' });
            logSuccess('Claude Code CLI 检测通过');
            return true;
        } catch (error) {
            logWarning('未检测到 Claude Code CLI');
            return false;
        }
    }
    
    static async runSystemCheck() {
        logInfo('开始系统环境检查...');
        
        const nodeOk = this.checkNodeVersion();
        const npmOk = this.checkNpmVersion();
        const claudeOk = this.checkClaudeCode();
        
        if (!nodeOk || !npmOk) {
            logError('系统环境检查失败，请检查 Node.js 和 npm 安装');
            return false;
        }
        
        if (!claudeOk) {
            const installClaude = await askConfirm(
                '建议安装 Claude Code CLI 以获得最佳体验，是否继续？',
                true
            );
            if (!installClaude) {
                logInfo('用户选择退出设置');
                return false;
            }
        }
        
        logSuccess('系统环境检查完成');
        return true;
    }
}

// 目录管理器
class DirectoryManager {
    static ensureDirectoryExists(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                logSuccess(`创建目录: ${dirPath}`);
            } else {
                logInfo(`目录已存在: ${dirPath}`);
            }
            return true;
        } catch (error) {
            logError(`创建目录失败 ${dirPath}: ${error.message}`);
            return false;
        }
    }
    
    static async setupDirectories() {
        logInfo('创建必要的目录结构...');
        
        const directories = [
            INSTALL_DIR,
            DATA_DIR,
            path.join(DATA_DIR, 'projects'),
            path.join(DATA_DIR, 'system'),
            LOGS_DIR,
            CACHE_DIR
        ];
        
        let allSuccess = true;
        for (const dir of directories) {
            if (!this.ensureDirectoryExists(dir)) {
                allSuccess = false;
            }
        }
        
        if (allSuccess) {
            logSuccess('目录结构创建完成');
        } else {
            logError('部分目录创建失败');
        }
        
        return allSuccess;
    }
}

// 配置管理器
class ConfigManager {
    static getDefaultConfig() {
        return {
            'cc-stats': {
                enabled: true,
                language: 'zh-CN',
                data_sources: {
                    cost_api: true,
                    opentelemetry: false
                },
                analysis: {
                    project_level: true,
                    trend_analysis: true,
                    smart_insights: true
                },
                reports: {
                    default_format: 'table',
                    cache_enabled: true,
                    cache_ttl: 300
                },
                logging: {
                    level: 'info',
                    file_enabled: true,
                    max_files: 10,
                    max_size: '10m'
                },
                privacy: {
                    error_reporting: 'minimal',
                    anonymous_usage: false
                }
            }
        };
    }
    
    static async loadExistingConfig() {
        if (!fs.existsSync(CONFIG_FILE)) {
            return null;
        }
        
        try {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(content);
            logInfo('找到现有配置文件');
            return config;
        } catch (error) {
            logWarning(`读取现有配置失败: ${error.message}`);
            return null;
        }
    }
    
    static async backupConfig() {
        if (fs.existsSync(CONFIG_FILE)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = `${CONFIG_FILE}.backup.${timestamp}`;
            
            try {
                fs.copyFileSync(CONFIG_FILE, backupFile);
                logSuccess(`配置文件已备份: ${path.basename(backupFile)}`);
                return true;
            } catch (error) {
                logError(`配置备份失败: ${error.message}`);
                return false;
            }
        }
        return true;
    }
    
    static async interactiveConfig() {
        logConfig('开始交互式配置...');
        
        const config = this.getDefaultConfig();
        const ccStats = config['cc-stats'];
        
        // 语言配置
        console.log('\n' + '='.repeat(50));
        logConfig('语言设置');
        const languages = ['中文 (zh-CN)', '英文 (en-US)'];
        const langIndex = await askChoice('选择界面语言', languages, 0);
        ccStats.language = langIndex === 0 ? 'zh-CN' : 'en-US';
        
        // 数据源配置
        console.log('\n' + '='.repeat(50));
        logConfig('数据源配置');
        
        ccStats.data_sources.cost_api = await askConfirm(
            '启用 Cost API 数据源 (推荐，提供基础统计)', 
            true
        );
        
        ccStats.data_sources.opentelemetry = await askConfirm(
            '启用 OpenTelemetry 数据源 (可选，提供详细监控)', 
            false
        );
        
        // 分析功能配置
        console.log('\n' + '='.repeat(50));
        logConfig('分析功能配置');
        
        ccStats.analysis.project_level = await askConfirm(
            '启用项目级分析', 
            true
        );
        
        ccStats.analysis.trend_analysis = await askConfirm(
            '启用趋势分析', 
            true
        );
        
        ccStats.analysis.smart_insights = await askConfirm(
            '启用智能洞察', 
            true
        );
        
        // 报告格式配置
        console.log('\n' + '='.repeat(50));
        logConfig('报告格式配置');
        
        const formats = ['表格 (table)', '详细 (detailed)', '简要 (compact)', '图表 (chart)'];
        const formatIndex = await askChoice('选择默认报告格式', formats, 0);
        const formatMap = ['table', 'detailed', 'compact', 'chart'];
        ccStats.reports.default_format = formatMap[formatIndex];
        
        ccStats.reports.cache_enabled = await askConfirm(
            '启用报告缓存 (提升性能)', 
            true
        );
        
        if (ccStats.reports.cache_enabled) {
            const ttl = await askQuestion('缓存有效时间 (秒)', '300');
            ccStats.reports.cache_ttl = parseInt(ttl) || 300;
        }
        
        // 日志配置
        console.log('\n' + '='.repeat(50));
        logConfig('日志配置');
        
        const logLevels = ['错误 (error)', '警告 (warn)', '信息 (info)', '调试 (debug)'];
        const levelIndex = await askChoice('选择日志级别', logLevels, 2);
        const levelMap = ['error', 'warn', 'info', 'debug'];
        ccStats.logging.level = levelMap[levelIndex];
        
        ccStats.logging.file_enabled = await askConfirm(
            '启用文件日志记录', 
            true
        );
        
        // 隐私配置
        console.log('\n' + '='.repeat(50));
        logConfig('隐私设置');
        
        const errorReportLevels = ['无 (none)', '最小 (minimal)', '标准 (standard)', '详细 (detailed)'];
        const reportIndex = await askChoice('错误报告级别', errorReportLevels, 1);
        const reportMap = ['none', 'minimal', 'standard', 'detailed'];
        ccStats.privacy.error_reporting = reportMap[reportIndex];
        
        ccStats.privacy.anonymous_usage = await askConfirm(
            '允许匿名使用统计 (帮助改进工具)', 
            false
        );
        
        return config;
    }
    
    static async saveConfig(config) {
        try {
            const configJson = JSON.stringify(config, null, 2);
            fs.writeFileSync(CONFIG_FILE, configJson, 'utf8');
            logSuccess(`配置已保存: ${CONFIG_FILE}`);
            return true;
        } catch (error) {
            logError(`保存配置失败: ${error.message}`);
            return false;
        }
    }
    
    static async displayConfigSummary(config) {
        const ccStats = config['cc-stats'];
        
        console.log('\n' + '='.repeat(60));
        logConfig('配置摘要');
        console.log('='.repeat(60));
        
        console.log(`${colors.cyan}语言:${colors.reset} ${ccStats.language}`);
        console.log(`${colors.cyan}Cost API:${colors.reset} ${ccStats.data_sources.cost_api ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`${colors.cyan}OpenTelemetry:${colors.reset} ${ccStats.data_sources.opentelemetry ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`${colors.cyan}项目级分析:${colors.reset} ${ccStats.analysis.project_level ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`${colors.cyan}趋势分析:${colors.reset} ${ccStats.analysis.trend_analysis ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`${colors.cyan}智能洞察:${colors.reset} ${ccStats.analysis.smart_insights ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`${colors.cyan}默认格式:${colors.reset} ${ccStats.reports.default_format}`);
        console.log(`${colors.cyan}缓存:${colors.reset} ${ccStats.reports.cache_enabled ? `✅ 启用 (${ccStats.reports.cache_ttl}s)` : '❌ 禁用'}`);
        console.log(`${colors.cyan}日志级别:${colors.reset} ${ccStats.logging.level}`);
        console.log(`${colors.cyan}文件日志:${colors.reset} ${ccStats.logging.file_enabled ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`${colors.cyan}错误报告:${colors.reset} ${ccStats.privacy.error_reporting}`);
        console.log(`${colors.cyan}使用统计:${colors.reset} ${ccStats.privacy.anonymous_usage ? '✅ 允许' : '❌ 拒绝'}`);
        
        console.log('='.repeat(60));
    }
}

// 安装验证器
class InstallationValidator {
    static async validateInstallation() {
        logInfo('开始安装验证...');
        
        let passed = 0;
        let failed = 0;
        
        // 检查目录结构
        const requiredDirs = [INSTALL_DIR, DATA_DIR, LOGS_DIR, CACHE_DIR];
        for (const dir of requiredDirs) {
            if (fs.existsSync(dir)) {
                logSuccess(`目录存在: ${path.basename(dir)}`);
                passed++;
            } else {
                logError(`目录缺失: ${path.basename(dir)}`);
                failed++;
            }
        }
        
        // 检查配置文件
        if (fs.existsSync(CONFIG_FILE)) {
            try {
                const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
                if (config['cc-stats']) {
                    logSuccess('配置文件格式正确');
                    passed++;
                } else {
                    logError('配置文件格式错误');
                    failed++;
                }
            } catch (error) {
                logError(`配置文件解析失败: ${error.message}`);
                failed++;
            }
        } else {
            logError('配置文件不存在');
            failed++;
        }
        
        // 检查命令可用性
        try {
            execSync('cc-stats --version', { stdio: 'ignore' });
            logSuccess('cc-stats 命令可用');
            passed++;
        } catch (error) {
            logError('cc-stats 命令不可用');
            failed++;
        }
        
        // 权限检查
        try {
            fs.accessSync(INSTALL_DIR, fs.constants.R_OK | fs.constants.W_OK);
            logSuccess('目录权限正常');
            passed++;
        } catch (error) {
            logError('目录权限不足');
            failed++;
        }
        
        console.log('\n' + '='.repeat(40));
        logInfo(`验证结果: ${colors.green}${passed} 通过${colors.reset}, ${colors.red}${failed} 失败${colors.reset}`);
        
        return failed === 0;
    }
}

// 主向导类
class SetupWizard {
    static async showWelcome() {
        console.clear();
        console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║  ${colors.bright}${icons.wizard} Claude Code 智能开发统计与分析工具 - 配置向导${colors.reset}${colors.cyan}     ║
║                                                              ║
║  ${colors.bright}欢迎使用交互式配置系统！${colors.reset}${colors.cyan}                             ║
║                                                              ║
║  本向导将引导您完成以下配置：                                  ║
║  • 系统环境检查                                              ║
║  • 目录结构创建                                              ║
║  • 功能配置定制                                              ║
║  • 安装验证测试                                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
        
        const proceed = await askConfirm('是否开始配置向导？', true);
        if (!proceed) {
            logInfo('用户取消配置');
            process.exit(0);
        }
    }
    
    static async run() {
        try {
            // 显示欢迎信息
            await this.showWelcome();
            
            // 系统环境检查
            const systemOk = await SystemChecker.runSystemCheck();
            if (!systemOk) {
                process.exit(1);
            }
            
            // 创建目录结构
            const dirsOk = await DirectoryManager.setupDirectories();
            if (!dirsOk) {
                process.exit(1);
            }
            
            // 配置管理
            const existingConfig = await ConfigManager.loadExistingConfig();
            if (existingConfig) {
                const useExisting = await askConfirm(
                    '检测到现有配置，是否重新配置？', 
                    false
                );
                
                if (!useExisting) {
                    logInfo('使用现有配置');
                    await ConfigManager.displayConfigSummary(existingConfig);
                    return;
                }
                
                await ConfigManager.backupConfig();
            }
            
            // 交互式配置
            const newConfig = await ConfigManager.interactiveConfig();
            await ConfigManager.displayConfigSummary(newConfig);
            
            const confirmSave = await askConfirm('保存此配置？', true);
            if (!confirmSave) {
                logInfo('配置未保存，退出向导');
                return;
            }
            
            const saveOk = await ConfigManager.saveConfig(newConfig);
            if (!saveOk) {
                process.exit(1);
            }
            
            // 安装验证
            const validationOk = await InstallationValidator.validateInstallation();
            if (!validationOk) {
                logWarning('安装验证发现问题，请检查配置');
            }
            
            // 显示完成信息
            this.showCompletionInfo();
            
        } catch (error) {
            logError(`配置向导失败: ${error.message}`);
            process.exit(1);
        } finally {
            rl.close();
        }
    }
    
    static showCompletionInfo() {
        console.log(`\n${colors.green}
╔══════════════════════════════════════════════════════════════╗
║  ${colors.bright}${icons.rocket} 配置完成！${colors.reset}${colors.green}                                         ║
║                                                              ║
║  ${colors.bright}快速开始：${colors.reset}${colors.green}                                             ║
║  cc-stats stats              # 查看开发统计                 ║
║  cc-stats efficiency         # 查看效率分析                 ║
║  cc-stats insights           # 查看智能洞察                 ║
║  cc-stats check              # 检查环境配置                 ║
║                                                              ║
║  ${colors.bright}配置文件：${colors.reset}${colors.green}                                             ║
║  ${CONFIG_FILE.replace(os.homedir(), '~')}                 ║
║                                                              ║
║  ${colors.bright}获取帮助：${colors.reset}${colors.green}                                             ║
║  cc-stats --help             # 显示帮助信息                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
    }
}

// 主函数
async function main() {
    // 检查命令行参数
    if (process.argv.includes('--help')) {
        console.log(`
Claude Code 智能开发统计与分析工具 - 配置向导

使用方法: 
  node setup.js              # 运行交互式配置向导
  node setup.js --help       # 显示帮助信息
  node setup.js --validate   # 仅运行验证检查

选项:
  --validate    仅运行安装验证，不进行配置
  --help        显示帮助信息
        `);
        process.exit(0);
    }
    
    if (process.argv.includes('--validate')) {
        logInfo('运行安装验证...');
        const valid = await InstallationValidator.validateInstallation();
        process.exit(valid ? 0 : 1);
    }
    
    // 运行配置向导
    await SetupWizard.run();
}

// 错误处理
process.on('uncaughtException', (error) => {
    logError(`未捕获的异常: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(`未处理的 Promise 拒绝: ${reason}`);
    process.exit(1);
});

// SIGINT 处理 (Ctrl+C)
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}${icons.warning} 用户中断操作${colors.reset}`);
    rl.close();
    process.exit(0);
});

// 执行主函数
if (require.main === module) {
    main().catch((error) => {
        logError(`配置向导异常: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    SystemChecker,
    DirectoryManager,
    ConfigManager,
    InstallationValidator,
    SetupWizard
};