#!/usr/bin/env node

/**
 * Claude Code 智能开发统计与分析工具 - 安装测试套件
 * 综合测试安装脚本、配置向导和卸载脚本的功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色定义
const colors = {
    reset: '\033[0m',
    red: '\033[31m',
    green: '\033[32m',
    yellow: '\033[33m',
    blue: '\033[34m',
    cyan: '\033[36m',
    bright: '\033[1m'
};

const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    test: '🧪',
    check: '🔍',
    script: '📜'
};

// 日志函数
function log(level, message, icon) {
    const color = colors[level] || colors.reset;
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`${color}${icon} [${timestamp}] ${message}${colors.reset}`);
}

// 脚本测试器
class InstallationTester {
    constructor() {
        this.testResults = [];
        this.scriptsDir = path.join(__dirname);
    }
    
    // 运行单个测试
    async runTest(testName, testFunction) {
        log('blue', `开始测试: ${testName}`, icons.test);
        
        try {
            const result = await testFunction();
            this.testResults.push({ name: testName, passed: true, result });
            log('green', `测试通过: ${testName}`, icons.success);
            return result;
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            log('red', `测试失败: ${testName} - ${error.message}`, icons.error);
            return null;
        }
    }
    
    // 测试脚本文件存在性
    async testScriptFilesExist() {
        const requiredScripts = [
            'install.sh',
            'setup.js',
            'install-commands.js', 
            'uninstall.sh'
        ];
        
        const missing = [];
        
        for (const script of requiredScripts) {
            const scriptPath = path.join(this.scriptsDir, script);
            if (!fs.existsSync(scriptPath)) {
                missing.push(script);
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`缺少脚本文件: ${missing.join(', ')}`);
        }
        
        return { scriptsFound: requiredScripts.length };
    }
    
    // 测试脚本权限
    async testScriptPermissions() {
        const executableScripts = ['install.sh', 'uninstall.sh'];
        const permissionIssues = [];
        
        for (const script of executableScripts) {
            const scriptPath = path.join(this.scriptsDir, script);
            try {
                fs.accessSync(scriptPath, fs.constants.X_OK);
            } catch {
                permissionIssues.push(script);
            }
        }
        
        if (permissionIssues.length > 0) {
            throw new Error(`脚本无执行权限: ${permissionIssues.join(', ')}`);
        }
        
        return { executableScripts: executableScripts.length };
    }
    
    // 测试安装脚本帮助功能
    async testInstallScriptHelp() {
        const scriptPath = path.join(this.scriptsDir, 'install.sh');
        
        try {
            const output = execSync(`${scriptPath} --help`, { 
                encoding: 'utf8',
                timeout: 10000
            });
            
            if (!output.includes('使用方法') || !output.includes('选项')) {
                throw new Error('帮助信息格式不正确');
            }
            
            return { helpOutputLength: output.length };
            
        } catch (error) {
            if (error.status === 0) {
                // 正常退出但没有输出
                throw new Error('安装脚本帮助功能未响应');
            }
            throw error;
        }
    }
    
    // 测试配置向导帮助功能
    async testSetupWizardHelp() {
        const scriptPath = path.join(this.scriptsDir, 'setup.js');
        
        try {
            const output = execSync(`node ${scriptPath} --help`, { 
                encoding: 'utf8',
                timeout: 10000
            });
            
            if (!output.includes('配置向导') || !output.includes('使用方法')) {
                throw new Error('配置向导帮助信息格式不正确');
            }
            
            return { helpOutputLength: output.length };
            
        } catch (error) {
            throw new Error(`配置向导测试失败: ${error.message}`);
        }
    }
    
    // 测试安装验证脚本
    async testInstallCommandsScript() {
        const scriptPath = path.join(this.scriptsDir, 'install-commands.js');
        
        try {
            const output = execSync(`node ${scriptPath} --help`, { 
                encoding: 'utf8',
                timeout: 10000
            });
            
            if (!output.includes('命令安装器') || !output.includes('使用方法')) {
                throw new Error('安装验证脚本帮助信息格式不正确');
            }
            
            return { helpOutputLength: output.length };
            
        } catch (error) {
            throw new Error(`安装验证脚本测试失败: ${error.message}`);
        }
    }
    
    // 测试卸载脚本帮助功能
    async testUninstallScriptHelp() {
        const scriptPath = path.join(this.scriptsDir, 'uninstall.sh');
        
        try {
            const output = execSync(`${scriptPath} --help`, { 
                encoding: 'utf8',
                timeout: 10000
            });
            
            if (!output.includes('使用方法') || !output.includes('选项')) {
                throw new Error('卸载脚本帮助信息格式不正确');
            }
            
            return { helpOutputLength: output.length };
            
        } catch (error) {
            if (error.status === 0) {
                // 正常退出
                return { helpOutputLength: output?.length || 0 };
            }
            throw error;
        }
    }
    
    // 测试脚本语法
    async testScriptSyntax() {
        const scripts = [
            { file: 'setup.js', command: 'node -c' },
            { file: 'install-commands.js', command: 'node -c' },
            { file: 'install.sh', command: 'bash -n' },
            { file: 'uninstall.sh', command: 'bash -n' }
        ];
        
        const syntaxErrors = [];
        
        for (const script of scripts) {
            const scriptPath = path.join(this.scriptsDir, script.file);
            
            try {
                execSync(`${script.command} ${scriptPath}`, { 
                    stdio: 'ignore',
                    timeout: 5000
                });
            } catch (error) {
                syntaxErrors.push(`${script.file}: ${error.message}`);
            }
        }
        
        if (syntaxErrors.length > 0) {
            throw new Error(`语法错误: ${syntaxErrors.join('; ')}`);
        }
        
        return { scriptsChecked: scripts.length };
    }
    
    // 测试package.json脚本集成
    async testPackageJsonIntegration() {
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('package.json 文件不存在');
        }
        
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageJson.scripts || {};
        
        const requiredScripts = [
            'setup:wizard',
            'setup:validate', 
            'uninstall'
        ];
        
        const missingScripts = requiredScripts.filter(script => !scripts[script]);
        
        if (missingScripts.length > 0) {
            throw new Error(`package.json中缺少脚本: ${missingScripts.join(', ')}`);
        }
        
        return { scriptsInPackageJson: Object.keys(scripts).length };
    }
    
    // 运行所有测试
    async runAllTests() {
        console.log(`${colors.cyan}${icons.test} 开始安装脚本测试套件...${colors.reset}\n`);
        
        const tests = [
            ['脚本文件存在性检查', () => this.testScriptFilesExist()],
            ['脚本执行权限检查', () => this.testScriptPermissions()],
            ['脚本语法检查', () => this.testScriptSyntax()],
            ['安装脚本帮助功能', () => this.testInstallScriptHelp()],
            ['配置向导帮助功能', () => this.testSetupWizardHelp()],
            ['安装验证脚本功能', () => this.testInstallCommandsScript()],
            ['卸载脚本帮助功能', () => this.testUninstallScriptHelp()],
            ['package.json集成检查', () => this.testPackageJsonIntegration()]
        ];
        
        for (const [testName, testFunction] of tests) {
            await this.runTest(testName, testFunction);
        }
        
        this.displayTestSummary();
    }
    
    // 显示测试摘要
    displayTestSummary() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n' + '='.repeat(60));
        log('cyan', '测试摘要', icons.check);
        console.log('='.repeat(60));
        
        console.log(`${colors.blue}总测试数: ${totalTests}${colors.reset}`);
        console.log(`${colors.green}通过: ${passedTests}${colors.reset}`);
        console.log(`${colors.red}失败: ${failedTests}${colors.reset}`);
        console.log(`${colors.cyan}成功率: ${successRate}%${colors.reset}`);
        
        if (failedTests > 0) {
            console.log(`\n${colors.red}失败的测试:${colors.reset}`);
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  ${icons.error} ${test.name}: ${test.error}`);
                });
        }
        
        if (passedTests === totalTests) {
            console.log(`\n${colors.green}${icons.success} 所有测试通过！安装脚本系统就绪。${colors.reset}`);
        } else {
            console.log(`\n${colors.yellow}${icons.warning} 部分测试失败，请检查相关脚本。${colors.reset}`);
        }
        
        console.log('='.repeat(60));
    }
}

// 主函数
async function main() {
    const tester = new InstallationTester();
    
    try {
        await tester.runAllTests();
        
        const passedTests = tester.testResults.filter(test => test.passed).length;
        const totalTests = tester.testResults.length;
        
        process.exit(passedTests === totalTests ? 0 : 1);
        
    } catch (error) {
        log('red', `测试套件异常: ${error.message}`, icons.error);
        process.exit(1);
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = { InstallationTester };