#!/usr/bin/env node

/**
 * 清理脚本
 * 清理构建产物、缓存文件等
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * 日志工具
 */
const logger = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  step: (msg) => console.log(chalk.cyan('→'), msg)
};

/**
 * 安全删除目录或文件
 */
function safeRemove(targetPath, description) {
  const fullPath = path.join(PROJECT_ROOT, targetPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      logger.success(`已清理: ${description} (${targetPath})`);
      return true;
    } catch (error) {
      logger.error(`清理失败: ${description} - ${error.message}`);
      return false;
    }
  } else {
    logger.info(`跳过: ${description} (不存在)`);
    return true;
  }
}

/**
 * 主清理函数
 */
function clean() {
  logger.info('开始清理项目...');
  
  const cleanTargets = [
    // 构建产物
    { path: 'dist', desc: '构建输出目录' },
    
    // 测试和覆盖率
    { path: 'coverage', desc: '测试覆盖率报告' },
    { path: 'tests/coverage', desc: '测试覆盖率文件' },
    
    // 缓存文件
    { path: '.tscache', desc: 'TypeScript 缓存' },
    { path: '.eslintcache', desc: 'ESLint 缓存' },
    
    // 日志文件
    { path: 'logs', desc: '日志目录' },
    { path: '*.log', desc: '日志文件' },
    
    // 临时文件
    { path: '.tmp', desc: '临时文件目录' },
    { path: 'tmp', desc: '临时目录' }
  ];

  let successCount = 0;
  let totalCount = cleanTargets.length;

  cleanTargets.forEach(target => {
    if (safeRemove(target.path, target.desc)) {
      successCount++;
    }
  });

  // 清理npm缓存和模块（如果指定）
  if (process.argv.includes('--deep')) {
    logger.step('执行深度清理...');
    
    if (safeRemove('node_modules', 'Node.js 模块')) {
      successCount++;
    }
    totalCount++;
    
    if (safeRemove('package-lock.json', '包锁定文件')) {
      successCount++;
    }
    totalCount++;
  }

  logger.info(`清理完成: ${successCount}/${totalCount} 项成功`);
  
  if (successCount === totalCount) {
    logger.success('所有清理任务完成!');
  } else {
    logger.warn('部分清理任务失败，请检查文件权限');
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
${chalk.bold('clean.js')} - 项目清理脚本

${chalk.bold('用法:')}
  node scripts/clean.js [选项]

${chalk.bold('选项:')}
  --deep    深度清理，包括 node_modules 和 package-lock.json
  --help    显示此帮助信息

${chalk.bold('示例:')}
  node scripts/clean.js          # 标准清理
  node scripts/clean.js --deep   # 深度清理
`);
}

// 检查命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 检查是否直接运行此脚本
if (require.main === module) {
  clean();
}

module.exports = { clean };