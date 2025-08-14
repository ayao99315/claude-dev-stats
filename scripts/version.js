#!/usr/bin/env node

/**
 * 版本管理脚本
 * 自动化版本号更新、变更日志生成等
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const CHANGELOG_PATH = path.join(PROJECT_ROOT, 'CHANGELOG.md');

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
 * 解析语义化版本号
 */
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`无效的版本号格式: ${version}`);
  }
  
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    prerelease: match[4] || null,
    full: version
  };
}

/**
 * 生成新版本号
 */
function generateNewVersion(currentVersion, type) {
  const parsed = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    case 'beta':
      if (parsed.prerelease && parsed.prerelease.startsWith('beta')) {
        const betaNum = parseInt(parsed.prerelease.split('.')[1]) || 0;
        return `${parsed.major}.${parsed.minor}.${parsed.patch}-beta.${betaNum + 1}`;
      } else {
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-beta.1`;
      }
    case 'alpha':
      if (parsed.prerelease && parsed.prerelease.startsWith('alpha')) {
        const alphaNum = parseInt(parsed.prerelease.split('.')[1]) || 0;
        return `${parsed.major}.${parsed.minor}.${parsed.patch}-alpha.${alphaNum + 1}`;
      } else {
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-alpha.1`;
      }
    default:
      throw new Error(`未知的版本类型: ${type}`);
  }
}

/**
 * 更新package.json版本号
 */
function updatePackageVersion(newVersion) {
  logger.step('更新package.json版本号...');
  
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const oldVersion = packageJson.version;
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
  
  logger.success(`版本号已更新: ${oldVersion} → ${newVersion}`);
  return oldVersion;
}

/**
 * 获取git提交信息
 */
function getGitCommits(fromTag) {
  try {
    let command;
    if (fromTag) {
      command = `git log ${fromTag}..HEAD --oneline --no-merges`;
    } else {
      command = 'git log --oneline --no-merges -n 20';
    }
    
    const result = execSync(command, { encoding: 'utf8', cwd: PROJECT_ROOT });
    return result.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    logger.warn('无法获取git提交记录');
    return [];
  }
}

/**
 * 分类提交信息
 */
function categorizeCommits(commits) {
  const categories = {
    features: [],
    fixes: [],
    improvements: [],
    docs: [],
    tests: [],
    build: [],
    others: []
  };

  const patterns = {
    features: /^[a-f0-9]+\s+(feat|feature|add|新增|添加)/i,
    fixes: /^[a-f0-9]+\s+(fix|bug|修复|修正)/i,
    improvements: /^[a-f0-9]+\s+(improve|enhance|update|优化|改进|更新)/i,
    docs: /^[a-f0-9]+\s+(docs?|doc|文档)/i,
    tests: /^[a-f0-9]+\s+(test|测试)/i,
    build: /^[a-f0-9]+\s+(build|ci|构建|发布)/i
  };

  commits.forEach(commit => {
    let categorized = false;
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(commit)) {
        categories[category].push(commit);
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      categories.others.push(commit);
    }
  });

  return categories;
}

/**
 * 生成变更日志条目
 */
function generateChangelogEntry(version, categories) {
  const now = new Date().toISOString().split('T')[0];
  let entry = `\n## [${version}] - ${now}\n`;

  const sectionTitles = {
    features: '### ✨ 新功能',
    fixes: '### 🐛 问题修复',
    improvements: '### ⚡ 性能优化',
    docs: '### 📚 文档更新',
    tests: '### 🧪 测试',
    build: '### 🔧 构建系统',
    others: '### 📦 其他更改'
  };

  Object.entries(categories).forEach(([category, commits]) => {
    if (commits.length > 0) {
      entry += `\n${sectionTitles[category]}\n`;
      commits.forEach(commit => {
        // 移除commit hash，只保留消息
        const message = commit.replace(/^[a-f0-9]+\s+/, '');
        entry += `- ${message}\n`;
      });
    }
  });

  return entry;
}

/**
 * 更新变更日志
 */
function updateChangelog(version, commits) {
  logger.step('更新变更日志...');

  const categories = categorizeCommits(commits);
  const newEntry = generateChangelogEntry(version, categories);

  if (!fs.existsSync(CHANGELOG_PATH)) {
    // 创建新的变更日志文件
    const content = `# 变更日志\n\n本文件记录项目的所有重要更改。\n\n格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，\n版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。\n${newEntry}`;
    
    fs.writeFileSync(CHANGELOG_PATH, content);
    logger.success('变更日志文件已创建');
  } else {
    // 更新现有的变更日志文件
    const existingContent = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    
    // 在第一个版本条目前插入新条目
    const lines = existingContent.split('\n');
    let insertIndex = lines.findIndex(line => line.match(/^## \[/));
    
    if (insertIndex === -1) {
      // 如果没找到版本条目，在文件末尾添加
      const updatedContent = existingContent + newEntry;
      fs.writeFileSync(CHANGELOG_PATH, updatedContent);
    } else {
      // 在找到的位置插入新条目
      lines.splice(insertIndex, 0, ...newEntry.split('\n'));
      fs.writeFileSync(CHANGELOG_PATH, lines.join('\n'));
    }
    
    logger.success('变更日志已更新');
  }
}

/**
 * 获取最后一个git标签
 */
function getLastGitTag() {
  try {
    const result = execSync('git describe --tags --abbrev=0', { 
      encoding: 'utf8',
      cwd: PROJECT_ROOT 
    });
    return result.trim();
  } catch (error) {
    return null;
  }
}

/**
 * 创建git提交
 */
function createGitCommit(version, oldVersion) {
  if (process.argv.includes('--no-commit')) {
    logger.info('跳过git提交');
    return;
  }

  logger.step('创建git提交...');
  
  try {
    // 添加修改的文件
    execSync('git add package.json', { cwd: PROJECT_ROOT });
    
    if (fs.existsSync(CHANGELOG_PATH)) {
      execSync('git add CHANGELOG.md', { cwd: PROJECT_ROOT });
    }
    
    // 创建提交
    const commitMessage = `chore: 发布版本 ${version}`;
    execSync(`git commit -m "${commitMessage}"`, { cwd: PROJECT_ROOT });
    
    logger.success(`git提交已创建: ${commitMessage}`);
  } catch (error) {
    logger.warn('git提交失败，请手动提交更改');
  }
}

/**
 * 显示版本更新摘要
 */
function showVersionSummary(oldVersion, newVersion, type, commits) {
  logger.success('版本更新完成!');
  
  console.log(`
${chalk.bold('版本更新摘要:')}
📦 项目: claude-dev-stats
🏷️  类型: ${type}
📈 版本: ${oldVersion} → ${newVersion}
📝 提交数: ${commits.length}

${chalk.bold('下一步操作:')}
1. 检查生成的 CHANGELOG.md
2. 运行构建: npm run build
3. 发布版本: npm run publish:npm
`);
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
${chalk.bold('version.js')} - 版本管理脚本

${chalk.bold('用法:')}
  node scripts/version.js <type> [选项]

${chalk.bold('版本类型:')}
  major     主版本号 (x.0.0) - 重大变更
  minor     次版本号 (x.y.0) - 新功能
  patch     修订号 (x.y.z) - 问题修复
  beta      Beta版本 (x.y.z-beta.n)
  alpha     Alpha版本 (x.y.z-alpha.n)

${chalk.bold('选项:')}
  --no-commit    不创建git提交
  --dry-run      预览更改，不实际修改文件
  --help         显示此帮助信息

${chalk.bold('示例:')}
  node scripts/version.js patch         # 更新修订号
  node scripts/version.js minor         # 更新次版本号
  node scripts/version.js beta          # 创建beta版本
  node scripts/version.js major --dry-run  # 预览主版本更新
`);
}

/**
 * 主版本管理函数
 */
function manageVersion() {
  const args = process.argv.slice(2);
  const type = args[0];
  
  if (!type || type === '--help' || type === '-h') {
    showHelp();
    process.exit(0);
  }

  const validTypes = ['major', 'minor', 'patch', 'beta', 'alpha'];
  if (!validTypes.includes(type)) {
    logger.error(`无效的版本类型: ${type}`);
    logger.info('有效类型: ' + validTypes.join(', '));
    process.exit(1);
  }

  logger.info(`开始 ${type} 版本更新...`);

  try {
    // 读取当前版本
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const currentVersion = packageJson.version;
    
    // 生成新版本号
    const newVersion = generateNewVersion(currentVersion, type);
    
    logger.info(`当前版本: ${currentVersion}`);
    logger.info(`新版本: ${newVersion}`);

    // 获取提交记录
    const lastTag = getLastGitTag();
    const commits = getGitCommits(lastTag);
    
    if (process.argv.includes('--dry-run')) {
      logger.info('预览模式，不会修改文件');
      showVersionSummary(currentVersion, newVersion, type, commits);
      return;
    }

    // 更新版本号
    const oldVersion = updatePackageVersion(newVersion);
    
    // 更新变更日志
    if (commits.length > 0) {
      updateChangelog(newVersion, commits);
    } else {
      logger.warn('未找到新的提交记录，跳过变更日志更新');
    }
    
    // 创建git提交
    createGitCommit(newVersion, oldVersion);
    
    // 显示摘要
    showVersionSummary(oldVersion, newVersion, type, commits);
    
  } catch (error) {
    logger.error(`版本更新失败: ${error.message}`);
    process.exit(1);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  manageVersion();
}

module.exports = { 
  manageVersion,
  generateNewVersion,
  parseVersion
};