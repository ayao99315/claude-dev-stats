#!/usr/bin/env node

/**
 * npm包发布脚本
 * 处理版本检查、构建、发布等流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

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
 * 执行命令并返回结果
 */
function execCommand(command, description, options = {}) {
  logger.step(description);
  try {
    const result = execSync(command, { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf8',
      ...options
    });
    logger.success(`${description} 完成`);
    return result.trim();
  } catch (error) {
    logger.error(`${description} 失败: ${error.message}`);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

/**
 * 检查npm认证状态
 */
function checkNpmAuth() {
  logger.step('检查npm认证状态...');
  
  try {
    const result = execSync('npm whoami', { encoding: 'utf8' });
    const username = result.trim();
    logger.success(`已登录npm用户: ${username}`);
    return username;
  } catch (error) {
    logger.error('npm认证失败，请先运行: npm login');
    process.exit(1);
  }
}

/**
 * 检查git状态
 */
function checkGitStatus() {
  logger.step('检查git状态...');
  
  // 检查是否有未提交的更改
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      logger.warn('检测到未提交的更改:');
      console.log(status);
      
      // 询问用户是否继续
      if (!process.argv.includes('--force')) {
        logger.error('请先提交所有更改，或使用 --force 强制发布');
        process.exit(1);
      }
    } else {
      logger.success('工作目录干净');
    }
  } catch (error) {
    logger.warn('无法检查git状态（可能不是git仓库）');
  }
}

/**
 * 检查版本号
 */
function checkVersion() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const currentVersion = packageJson.version;
  
  logger.step(`检查版本号: ${currentVersion}`);
  
  // 检查npm上是否已存在该版本
  try {
    const npmInfo = execSync(`npm view ${packageJson.name} versions --json`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const publishedVersions = JSON.parse(npmInfo);
    
    if (publishedVersions.includes(currentVersion)) {
      logger.error(`版本 ${currentVersion} 已在npm上发布，请更新版本号`);
      process.exit(1);
    } else {
      logger.success(`版本 ${currentVersion} 可用于发布`);
    }
  } catch (error) {
    // 如果包还未发布过，这是正常的
    if (error.message.includes('E404')) {
      logger.info('包尚未发布过，这将是首次发布');
    } else {
      logger.warn('无法检查npm版本，将继续发布');
    }
  }
  
  return currentVersion;
}

/**
 * 执行预发布检查
 */
function prePublishChecks() {
  logger.step('执行预发布检查...');
  
  // 检查关键文件是否存在
  const requiredFiles = [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/cli.js',
    'dist/package.json',
    'README.md',
    'LICENSE'
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) {
      logger.error(`必需文件缺失: ${file}`);
      process.exit(1);
    }
  }

  logger.success('预发布检查通过');
}

/**
 * 执行包大小检查
 */
function checkPackageSize() {
  logger.step('检查包大小...');
  
  try {
    const result = execSync('npm pack --dry-run', { 
      encoding: 'utf8',
      cwd: PROJECT_ROOT
    });
    
    // 提取包大小信息
    const lines = result.split('\n');
    const sizeLine = lines.find(line => line.includes('unpacked size'));
    
    if (sizeLine) {
      logger.info(`包大小: ${sizeLine.trim()}`);
      
      // 检查是否超过建议大小（比如1MB）
      const sizeMatch = sizeLine.match(/(\d+\.?\d*)\s*(kB|MB)/);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2];
        
        if (unit === 'MB' && size > 1) {
          logger.warn(`包大小较大 (${size}MB)，建议优化`);
        } else {
          logger.success('包大小合理');
        }
      }
    }
  } catch (error) {
    logger.warn('无法检查包大小');
  }
}

/**
 * 创建git标签
 */
function createGitTag(version) {
  if (process.argv.includes('--no-git-tag')) {
    logger.info('跳过git标签创建');
    return;
  }

  logger.step(`创建git标签 v${version}...`);
  
  try {
    execSync(`git tag v${version}`, { cwd: PROJECT_ROOT });
    logger.success(`git标签 v${version} 创建成功`);
    
    // 询问是否推送标签
    if (process.argv.includes('--push-tag')) {
      execCommand('git push origin --tags', '推送git标签');
    }
  } catch (error) {
    logger.warn('git标签创建失败（可能已存在）');
  }
}

/**
 * 执行npm发布
 */
function publishToNpm() {
  logger.step('发布到npm...');
  
  // 确定发布标签
  let publishTag = 'latest';
  if (process.argv.includes('--tag')) {
    const tagIndex = process.argv.indexOf('--tag');
    publishTag = process.argv[tagIndex + 1] || 'latest';
  }
  
  // 检查是否为beta或预览版本
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const version = packageJson.version;
  
  if (version.includes('beta') || version.includes('alpha') || version.includes('rc')) {
    publishTag = 'beta';
    logger.info(`检测到预发布版本，使用标签: ${publishTag}`);
  }

  const publishCommand = `npm publish --tag ${publishTag}`;
  
  if (process.argv.includes('--dry-run')) {
    logger.info('执行模拟发布（--dry-run）');
    execCommand(`${publishCommand} --dry-run`, '模拟npm发布');
  } else {
    execCommand(publishCommand, 'npm发布');
    logger.success(`包已成功发布到npm，标签: ${publishTag}`);
  }
}

/**
 * 发布后清理
 */
function postPublishCleanup() {
  logger.step('执行发布后清理...');
  
  // 删除临时文件
  const tempFiles = [
    'claude-dev-stats-*.tgz'
  ];
  
  tempFiles.forEach(pattern => {
    try {
      execSync(`rm -f ${pattern}`, { cwd: PROJECT_ROOT });
    } catch (error) {
      // 忽略文件不存在的错误
    }
  });
  
  logger.success('清理完成');
}

/**
 * 显示发布后信息
 */
function showPostPublishInfo(version) {
  logger.success('发布完成!');
  
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const packageName = packageJson.name;
  
  console.log(`
${chalk.bold('发布信息:')}
📦 包名: ${packageName}
🔖 版本: ${version}
🌐 npm页面: https://www.npmjs.com/package/${packageName}

${chalk.bold('安装命令:')}
npm install -g ${packageName}

${chalk.bold('使用命令:')}
cc-stats --help
`);
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
${chalk.bold('publish.js')} - npm包发布脚本

${chalk.bold('用法:')}
  node scripts/publish.js [选项]

${chalk.bold('选项:')}
  --dry-run     模拟发布，不实际发布到npm
  --force       强制发布，忽略git状态检查
  --tag <tag>   指定npm发布标签（默认：latest）
  --push-tag    发布后推送git标签
  --no-git-tag  不创建git标签
  --help        显示此帮助信息

${chalk.bold('示例:')}
  node scripts/publish.js                     # 正常发布
  node scripts/publish.js --dry-run           # 模拟发布
  node scripts/publish.js --tag beta          # 发布为beta版本
  node scripts/publish.js --force --push-tag  # 强制发布并推送标签
`);
}

/**
 * 主发布函数
 */
function publish() {
  const startTime = Date.now();
  
  logger.info('开始发布流程...');
  
  try {
    // 检查认证
    const npmUser = checkNpmAuth();
    
    // 检查git状态
    checkGitStatus();
    
    // 检查版本
    const version = checkVersion();
    
    // 构建项目
    execCommand('npm run build', '构建项目');
    
    // 预发布检查
    prePublishChecks();
    
    // 检查包大小
    checkPackageSize();
    
    // 发布到npm
    publishToNpm();
    
    // 创建git标签
    createGitTag(version);
    
    // 发布后清理
    postPublishCleanup();
    
    // 显示完成信息
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`发布流程完成，耗时: ${duration}s`);
    
    if (!process.argv.includes('--dry-run')) {
      showPostPublishInfo(version);
    }
    
  } catch (error) {
    logger.error(`发布失败: ${error.message}`);
    process.exit(1);
  }
}

// 检查命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 检查是否直接运行此脚本
if (require.main === module) {
  publish();
}

module.exports = { publish };