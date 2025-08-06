#!/bin/bash

# DevXP CLI Quick Install Script
# This script installs DevXP CLI globally and sets up shell integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# ASCII Art Banner
cat << "EOF"
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     ╔╦╗┌─┐┬  ┬╔═╗ ╦╔═╗    ╔═╗╦  ╦                  ║
║      ║║├┤ └┐┌┘╔╩╦╝╠═╝    ║  ║  ║                   ║
║     ═╩╝└─┘ └┘ ╩ ╚═╩      ╚═╝╩═╝╩                   ║
║                                                      ║
║     Gamify Your Development Experience!             ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
EOF

echo ""
print_info "Starting DevXP CLI installation..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js (v18 or higher) from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required!"
    echo "Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi

print_success "npm $(npm -v) detected"

# Install DevXP CLI globally
print_info "Installing DevXP CLI globally..."
npm install -g devxp-cli

if [ $? -eq 0 ]; then
    print_success "DevXP CLI installed successfully!"
else
    print_error "Failed to install DevXP CLI"
    exit 1
fi

# Detect shell
SHELL_NAME=$(basename "$SHELL")
print_info "Detected shell: $SHELL_NAME"

# Setup shell integration
setup_shell_integration() {
    case "$1" in
        bash)
            SHELL_RC="$HOME/.bashrc"
            ;;
        zsh)
            SHELL_RC="$HOME/.zshrc"
            ;;
        fish)
            SHELL_RC="$HOME/.config/fish/config.fish"
            ;;
        *)
            print_error "Unsupported shell: $1"
            print_info "Please manually add shell integration"
            return 1
            ;;
    esac

    if [ "$1" = "fish" ]; then
        INTEGRATION_CMD='devxp shell-integration fish | source'
    else
        INTEGRATION_CMD='eval "$(devxp shell-integration '"$1"')"'
    fi

    # Check if integration already exists
    if grep -q "devxp shell-integration" "$SHELL_RC" 2>/dev/null; then
        print_info "Shell integration already configured in $SHELL_RC"
    else
        print_info "Adding shell integration to $SHELL_RC..."
        echo "" >> "$SHELL_RC"
        echo "# DevXP CLI Shell Integration" >> "$SHELL_RC"
        echo "$INTEGRATION_CMD" >> "$SHELL_RC"
        print_success "Shell integration added to $SHELL_RC"
    fi
}

# Ask for shell integration
echo ""
read -p "Would you like to set up shell integration for $SHELL_NAME? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_shell_integration "$SHELL_NAME"
fi

# Ask for Git hooks
echo ""
read -p "Would you like to install Git hooks for automatic tracking? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing Git hooks..."
    devxp install --git-hooks
    print_success "Git hooks installed"
fi

# Run initial setup
echo ""
print_info "Running initial setup..."
devxp install

# Display success message
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║     🎉 DevXP CLI Installation Complete! 🎉          ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
print_success "DevXP CLI has been successfully installed!"
echo ""
echo "Next steps:"
echo "  1. Restart your terminal or run: source $SHELL_RC"
echo "  2. Check your status: devxp status"
echo "  3. View achievements: devxp achievements"
echo "  4. See all commands: devxp --help"
echo ""
echo "Happy coding! 🚀"
