#!/bin/bash

# Claude Code 智能开发统计与分析工具 - 一键安装脚本
# 支持 macOS, Linux, Windows (WSL)

set -e

# 脚本配置
PACKAGE_NAME="claude-dev-stats"
BINARY_NAME="cc-stats"
VERSION="latest"
INSTALL_DIR="${HOME}/.claude"
CONFIG_FILE="${INSTALL_DIR}/settings.json"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 图标定义
SUCCESS_ICON="✅"
ERROR_ICON="❌"
WARNING_ICON="⚠️"
INFO_ICON="ℹ️"
PACKAGE_ICON="📦"
SETTINGS_ICON="⚙️"

# 日志函数
log_success() {
    echo -e "${GREEN}${SUCCESS_ICON} $1${NC}"
}

log_error() {
    echo -e "${RED}${ERROR_ICON} $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${WARNING_ICON} $1${NC}"
}

log_info() {
    echo -e "${BLUE}${INFO_ICON} $1${NC}"
}

log_package() {
    echo -e "${BLUE}${PACKAGE_ICON} $1${NC}"
}

log_settings() {
    echo -e "${BLUE}${SETTINGS_ICON} $1${NC}"
}

# 检查系统兼容性
check_system() {
    log_info "检查系统兼容性..."
    
    # 检测操作系统
    OS="$(uname -s)"
    case "${OS}" in
        Linux*)     MACHINE=Linux;;
        Darwin*)    MACHINE=Mac;;
        CYGWIN*)    MACHINE=Cygwin;;
        MINGW*)     MACHINE=MinGw;;
        MSYS_NT*)   MACHINE=Windows;;
        *)          MACHINE="UNKNOWN:${OS}"
    esac
    
    log_info "检测到操作系统: ${MACHINE}"
    
    # 检查是否支持
    if [[ "${MACHINE}" == "UNKNOWN"* ]]; then
        log_error "不支持的操作系统: ${OS}"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 16.0.0 或更高版本"
        log_info "安装指南: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$NODE_MAJOR" -lt 16 ]; then
        log_error "Node.js 版本过低 (当前: v$NODE_VERSION)，需要 v16.0.0 或更高版本"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过 (v$NODE_VERSION)"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请确保 npm 可用"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log_success "npm 版本检查通过 (v$NPM_VERSION)"
    
    # 检查 Claude Code
    if ! command -v claude &> /dev/null; then
        log_warning "未检测到 Claude Code CLI，建议先安装 Claude Code"
        log_info "安装指南: https://docs.anthropic.com/en/docs/claude-code"
        read -p "是否继续安装? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "安装已取消"
            exit 0
        fi
    else
        log_success "Claude Code CLI 检测通过"
    fi
}

# 创建必要目录
setup_directories() {
    log_info "创建必要目录..."
    
    if [ ! -d "$INSTALL_DIR" ]; then
        mkdir -p "$INSTALL_DIR"
        log_success "创建目录: $INSTALL_DIR"
    else
        log_info "目录已存在: $INSTALL_DIR"
    fi
    
    # 创建数据目录
    mkdir -p "$INSTALL_DIR/data/projects"
    mkdir -p "$INSTALL_DIR/data/system"
    mkdir -p "$INSTALL_DIR/logs"
    mkdir -p "$INSTALL_DIR/cache"
    
    log_success "目录结构创建完成"
}

# 安装 npm 包
install_package() {
    log_package "开始安装 $PACKAGE_NAME..."
    
    # 检查是否已安装
    if npm list -g "$PACKAGE_NAME" &> /dev/null; then
        log_warning "检测到已安装的版本，将进行升级"
        npm uninstall -g "$PACKAGE_NAME"
    fi
    
    # 安装包
    if [ "$VERSION" = "latest" ]; then
        log_package "安装最新版本..."
        npm install -g "$PACKAGE_NAME"
    else
        log_package "安装指定版本: $VERSION"
        npm install -g "$PACKAGE_NAME@$VERSION"
    fi
    
    # 验证安装
    if command -v "$BINARY_NAME" &> /dev/null; then
        INSTALLED_VERSION=$($BINARY_NAME --version 2>/dev/null || echo "未知")
        log_success "安装成功！版本: $INSTALLED_VERSION"
    else
        log_error "安装验证失败，命令 $BINARY_NAME 不可用"
        exit 1
    fi
}

# 创建默认配置
setup_config() {
    log_settings "创建默认配置..."
    
    if [ -f "$CONFIG_FILE" ]; then
        log_warning "配置文件已存在，正在备份..."
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "备份完成: $CONFIG_FILE.backup.*"
    fi
    
    # 创建默认配置
    cat > "$CONFIG_FILE" << 'EOF'
{
  "cc-stats": {
    "enabled": true,
    "language": "zh-CN",
    "data_sources": {
      "cost_api": true,
      "opentelemetry": false
    },
    "analysis": {
      "project_level": true,
      "trend_analysis": true,
      "smart_insights": true
    },
    "reports": {
      "default_format": "table",
      "cache_enabled": true,
      "cache_ttl": 300
    },
    "logging": {
      "level": "info",
      "file_enabled": true,
      "max_files": 10,
      "max_size": "10m"
    },
    "privacy": {
      "error_reporting": "minimal",
      "anonymous_usage": false
    }
  }
}
EOF
    
    log_success "默认配置已创建: $CONFIG_FILE"
}

# 配置 PATH 环境变量
setup_path() {
    log_info "配置环境变量..."
    
    # 获取 npm 全局目录
    NPM_PREFIX=$(npm prefix -g)
    NPM_BIN_DIR="$NPM_PREFIX/bin"
    
    # 检查是否已在 PATH 中
    if echo "$PATH" | grep -q "$NPM_BIN_DIR"; then
        log_success "npm 全局目录已在 PATH 中"
        return
    fi
    
    # 检测 shell 类型
    SHELL_TYPE=$(basename "$SHELL")
    
    case "$SHELL_TYPE" in
        bash)
            PROFILE_FILE="$HOME/.bashrc"
            if [[ "$MACHINE" == "Mac" ]]; then
                PROFILE_FILE="$HOME/.bash_profile"
            fi
            ;;
        zsh)
            PROFILE_FILE="$HOME/.zshrc"
            ;;
        fish)
            PROFILE_FILE="$HOME/.config/fish/config.fish"
            ;;
        *)
            log_warning "未识别的 Shell 类型: $SHELL_TYPE"
            log_info "请手动添加 $NPM_BIN_DIR 到您的 PATH 环境变量"
            return
            ;;
    esac
    
    # 添加到配置文件
    if [ -f "$PROFILE_FILE" ]; then
        echo "export PATH=\"$NPM_BIN_DIR:\$PATH\"" >> "$PROFILE_FILE"
        log_success "已添加到 $PROFILE_FILE"
        log_info "请运行 'source $PROFILE_FILE' 或重新打开终端"
    else
        log_warning "配置文件不存在: $PROFILE_FILE"
        log_info "请手动创建并添加: export PATH=\"$NPM_BIN_DIR:\$PATH\""
    fi
}

# 运行安装验证
run_validation() {
    log_info "运行安装验证..."
    
    # 基本命令测试
    if ! "$BINARY_NAME" --help &> /dev/null; then
        log_error "命令验证失败: $BINARY_NAME --help"
        return 1
    fi
    
    # 版本检查
    if ! "$BINARY_NAME" --version &> /dev/null; then
        log_error "版本检查失败"
        return 1
    fi
    
    # 数据源检查
    if ! "$BINARY_NAME" check &> /dev/null; then
        log_warning "数据源检查失败，可能需要配置 Claude Code"
    else
        log_success "数据源检查通过"
    fi
    
    # 配置验证
    if [ -f "$CONFIG_FILE" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'))" 2>/dev/null; then
            log_success "配置文件格式验证通过"
        else
            log_error "配置文件格式错误"
            return 1
        fi
    fi
    
    log_success "安装验证完成"
    return 0
}

# 显示安装后信息
show_post_install_info() {
    echo
    echo "🎉 安装完成！"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "📋 快速开始："
    echo "   $BINARY_NAME stats              # 查看开发统计"
    echo "   $BINARY_NAME efficiency         # 查看效率分析"
    echo "   $BINARY_NAME trends             # 查看趋势分析"
    echo "   $BINARY_NAME insights           # 查看智能洞察"
    echo
    echo "🔧 配置文件："
    echo "   $CONFIG_FILE"
    echo
    echo "📁 数据目录："
    echo "   $INSTALL_DIR/data/"
    echo
    echo "📚 获取帮助："
    echo "   $BINARY_NAME --help             # 显示帮助信息"
    echo "   $BINARY_NAME check              # 检查环境和配置"
    echo
    echo "🌐 更多信息："
    echo "   GitHub: https://github.com/your-username/claude-dev-stats"
    echo "   文档: https://docs.anthropic.com/en/docs/claude-code"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
}

# 错误处理
cleanup_on_error() {
    log_error "安装过程中发生错误，正在清理..."
    
    # 如果包已部分安装，尝试卸载
    if npm list -g "$PACKAGE_NAME" &> /dev/null; then
        npm uninstall -g "$PACKAGE_NAME" 2>/dev/null || true
    fi
    
    # 恢复配置文件备份
    if [ -f "$CONFIG_FILE.backup.*" ]; then
        cp "$CONFIG_FILE.backup.*" "$CONFIG_FILE" 2>/dev/null || true
    fi
    
    log_error "安装失败，环境已恢复"
    exit 1
}

# 主函数
main() {
    echo "🚀 Claude Code 智能开发统计与分析工具 - 安装程序"
    echo "=================================================="
    echo
    
    # 设置错误处理
    trap cleanup_on_error ERR
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --version)
                VERSION="$2"
                shift 2
                ;;
            --help)
                echo "使用方法: $0 [选项]"
                echo
                echo "选项:"
                echo "  --version VERSION    安装指定版本 (默认: latest)"
                echo "  --help              显示帮助信息"
                echo
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                echo "使用 $0 --help 查看帮助信息"
                exit 1
                ;;
        esac
    done
    
    # 执行安装步骤
    check_system
    setup_directories
    install_package
    setup_config
    setup_path
    
    # 运行验证
    if run_validation; then
        show_post_install_info
        log_success "安装成功完成！"
    else
        log_error "安装验证失败，请检查配置"
        exit 1
    fi
}

# 执行主函数
main "$@"