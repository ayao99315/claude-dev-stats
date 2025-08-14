#!/usr/bin/env node

/**
 * Claude Code 开发统计分析工具 CLI 入口点
 * 这是 cc-stats 命令的主入口文件
 */

import { CommandLineInterface } from './commands/cli';

// 创建并启动CLI实例
const cli = new CommandLineInterface();
cli.run();