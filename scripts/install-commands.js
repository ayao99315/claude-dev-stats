#!/usr/bin/env node

/**
 * Claude Code 智能开发统计与分析工具 - 命令安装器
 * 用于将 cc-stats 命令集成到用户的 shell 环境中
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// 配置常量
const PACKAGE_NAME = 'claude-dev-stats';
const BINARY_NAME = 'cc-stats';
const INSTALL_DIR = path.join(os.homedir(), '.claude');
const CONFIG_FILE = path.join(INSTALL_DIR, 'settings.json');

// ANSI 颜色代码
const colors = {
    reset: '\033[0m',
    red: '\033[31m',
    green: '\033[32m',
    yellow: '\033[33m',
    blue: '\033[34m',
    cyan: '\033[36m'
};

const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    check: '🔍',
    install: '📦',
    config: '⚙️'
};

// 日志函数
function log(level, message, icon) {
    const color = colors[level] || colors.reset;
    console.log(`${color}${icon} ${message}${colors.reset}`);
}

// 命令安装验证器
class CommandInstaller {
    
    /**
     * 检查命令是否已安装
     */
    static checkCommandAvailable() {
        try {
            execSync(`which ${BINARY_NAME}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 检查 npm 包是否已安装
     */
    static checkPackageInstalled() {
        try {
            execSync(`npm list -g ${PACKAGE_NAME}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 获取命令路径
     */
    static getCommandPath() {
        try {
            return execSync(`which ${BINARY_NAME}`, { encoding: 'utf8' }).trim();
        } catch {
            return null;
        }
    }
    
    /**
     * 获取 npm 包信息
     */
    static getPackageInfo() {
        try {
            const output = execSync(`npm list -g ${PACKAGE_NAME} --json`, { encoding: 'utf8' });
            const packageInfo = JSON.parse(output);
            return packageInfo.dependencies?.[PACKAGE_NAME];
        } catch {
            return null;
        }
    }
    
    /**
     * 检查命令功能
     */
    static async testCommandFunctionality() {
        const tests = [];
        
        // 基本命令测试
        const basicTests = [
            { name: '帮助信息', cmd: `${BINARY_NAME} --help` },
            { name: '版本信息', cmd: `${BINARY_NAME} --version` },
            { name: '环境检查', cmd: `${BINARY_NAME} check` }
        ];
        
        for (const test of basicTests) {
            try {
                execSync(test.cmd, { stdio: 'ignore', timeout: 10000 });
                tests.push({ name: test.name, passed: true });
                log('green', `${test.name} 测试通过`, icons.success);
            } catch (error) {
                tests.push({ name: test.name, passed: false, error: error.message });
                log('red', `${test.name} 测试失败`, icons.error);
            }
        }
        
        return tests;
    }
    
    /**
     * 检查配置文件
     */
    static validateConfiguration() {
        if (!fs.existsSync(CONFIG_FILE)) {
            log('yellow', '配置文件不存在，将使用默认配置', icons.warning);
            return false;
        }
        
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            if (config['cc-stats']) {
                log('green', '配置文件验证通过', icons.success);
                return true;
            } else {
                log('red', '配置文件格式错误', icons.error);
                return false;
            }
        } catch (error) {
            log('red', `配置文件解析失败: ${error.message}`, icons.error);
            return false;
        }
    }
    
    /**
     * 检查数据目录权限
     */
    static checkDirectoryPermissions() {
        const directories = [
            INSTALL_DIR,
            path.join(INSTALL_DIR, 'data'),
            path.join(INSTALL_DIR, 'logs'),
            path.join(INSTALL_DIR, 'cache')
        ];
        
        let allOk = true;
        
        for (const dir of directories) {
            if (!fs.existsSync(dir)) {
                log('yellow', `目录不存在: ${path.basename(dir)}`, icons.warning);
                allOk = false;
                continue;
            }
            
            try {
                fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
                log('green', `目录权限正常: ${path.basename(dir)}`, icons.success);
            } catch (error) {
                log('red', `目录权限不足: ${path.basename(dir)}`, icons.error);
                allOk = false;
            }
        }
        
        return allOk;
    }
    
    /**
     * 运行完整安装验证
     */
    static async runFullValidation() {
        console.log(`${colors.blue}${icons.check} 开始安装验证...${colors.reset}\n`);
        
        const results = {
            commandAvailable: this.checkCommandAvailable(),
            packageInstalled: this.checkPackageInstalled(),
            configValid: this.validateConfiguration(),
            permissionsOk: this.checkDirectoryPermissions(),
            functionalityTests: []
        };
        
        // 基本检查
        log(results.commandAvailable ? 'green' : 'red', 
            `命令可用性: ${results.commandAvailable ? '通过' : '失败'}`, 
            results.commandAvailable ? icons.success : icons.error);
        
        log(results.packageInstalled ? 'green' : 'red', 
            `包安装检查: ${results.packageInstalled ? '通过' : '失败'}`, 
            results.packageInstalled ? icons.success : icons.error);
        
        // 功能测试
        if (results.commandAvailable) {
            console.log(`\n${colors.cyan}${icons.check} 运行功能测试...${colors.reset}`);
            results.functionalityTests = await this.testCommandFunctionality();
        }
        
        // 命令路径信息
        const commandPath = this.getCommandPath();
        if (commandPath) {
            log('blue', `命令路径: ${commandPath}`, icons.info);
        }
        
        // 包信息
        const packageInfo = this.getPackageInfo();
        if (packageInfo) {
            log('blue', `包版本: ${packageInfo.version}`, icons.info);
            log('blue', `安装位置: ${packageInfo.from || '未知'}`, icons.info);
        }
        
        return results;
    }
    
    /**
     * 生成诊断报告
     */
    static generateDiagnosticReport(results) {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                npmVersion: this.getNpmVersion()
            },
            installation: results,
            recommendations: this.generateRecommendations(results)
        };
        
        const reportFile = path.join(INSTALL_DIR, 'diagnostic-report.json');
        try {
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            log('green', `诊断报告已生成: ${reportFile}`, icons.success);
        } catch (error) {
            log('red', `生成诊断报告失败: ${error.message}`, icons.error);
        }
        
        return report;
    }
    
    /**
     * 获取 npm 版本
     */
    static getNpmVersion() {
        try {
            return execSync('npm --version', { encoding: 'utf8' }).trim();
        } catch {
            return 'unknown';
        }
    }
    
    /**
     * 生成修复建议
     */
    static generateRecommendations(results) {
        const recommendations = [];
        
        if (!results.commandAvailable) {
            recommendations.push({
                issue: '命令不可用',
                solution: `请重新安装: npm install -g ${PACKAGE_NAME}`,
                priority: 'high'
            });
        }
        
        if (!results.packageInstalled) {
            recommendations.push({
                issue: 'npm 包未安装',
                solution: `运行: npm install -g ${PACKAGE_NAME}`,
                priority: 'high'
            });
        }
        
        if (!results.configValid) {
            recommendations.push({
                issue: '配置文件问题',
                solution: '运行: node scripts/setup.js 重新配置',
                priority: 'medium'
            });
        }
        
        if (!results.permissionsOk) {
            recommendations.push({
                issue: '目录权限不足',
                solution: `检查 ${INSTALL_DIR} 目录权限`,
                priority: 'medium'
            });
        }
        
        const failedTests = results.functionalityTests?.filter(test => !test.passed);
        if (failedTests && failedTests.length > 0) {
            recommendations.push({
                issue: '功能测试失败',
                solution: '检查系统环境和依赖项',
                priority: 'high',
                details: failedTests.map(test => test.name)
            });
        }
        
        return recommendations;
    }
    
    /**
     * 显示验证摘要
     */
    static displayValidationSummary(results, recommendations) {
        console.log('\n' + '='.repeat(60));
        log('cyan', '安装验证摘要', icons.check);
        console.log('='.repeat(60));
        
        const passed = [
            results.commandAvailable,
            results.packageInstalled,
            results.configValid,
            results.permissionsOk,
            results.functionalityTests?.every(test => test.passed) ?? true
        ].filter(Boolean).length;
        
        const total = 5;
        const successRate = Math.round((passed / total) * 100);
        
        console.log(`${colors.blue}验证结果: ${colors.green}${passed}/${total} 通过${colors.reset} (${successRate}%)`);
        
        if (recommendations.length > 0) {
            console.log(`\n${colors.yellow}${icons.warning} 发现问题和建议:${colors.reset}`);
            recommendations.forEach((rec, index) => {
                const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
                console.log(`  ${priority} ${rec.issue}: ${rec.solution}`);
            });
        } else {
            console.log(`\n${colors.green}${icons.success} 所有检查通过，安装正常！${colors.reset}`);
        }
        
        console.log('='.repeat(60));
    }
}

// 主函数
async function main() {
    try {
        // 解析命令行参数
        const args = process.argv.slice(2);
        
        if (args.includes('--help')) {
            console.log(`
Claude Code 智能开发统计与分析工具 - 命令安装器

使用方法:
  node install-commands.js           # 运行完整安装验证
  node install-commands.js --quick   # 快速检查
  node install-commands.js --report  # 生成详细报告
  node install-commands.js --help    # 显示帮助

选项:
  --quick     仅运行基本检查，跳过功能测试
  --report    生成诊断报告文件
  --help      显示帮助信息
            `);
            return;
        }
        
        const quick = args.includes('--quick');
        const generateReport = args.includes('--report');
        
        // 运行验证
        const results = await CommandInstaller.runFullValidation();
        
        // 生成建议
        const recommendations = CommandInstaller.generateRecommendations(results);
        
        // 显示摘要
        CommandInstaller.displayValidationSummary(results, recommendations);
        
        // 生成报告
        if (generateReport) {
            CommandInstaller.generateDiagnosticReport(results);
        }
        
        // 退出码
        const allPassed = results.commandAvailable && 
                         results.packageInstalled && 
                         (results.functionalityTests?.every(test => test.passed) ?? true);
        
        process.exit(allPassed ? 0 : 1);
        
    } catch (error) {
        log('red', `安装验证失败: ${error.message}`, icons.error);
        process.exit(1);
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = { CommandInstaller };