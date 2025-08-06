#!/usr/bin/env bash
# setup_wizard.sh - Interactive wizard for initial configuration
set -e

echo "======================================="
echo " Welcome to Project Setup Wizard "
echo "======================================="
echo

# 1. Shell Integration
echo "Step 1: Shell Integration"
read -p "Would you like to auto-integrate with your shell (e.g., add alias/function to your shell profile)? [y/N]: " integrate_shell
if [[ "$integrate_shell" =~ ^[Yy]$ ]]; then
  SHELL_RC="$HOME/.bashrc"
  [ -n "$ZSH_VERSION" ] && SHELL_RC="$HOME/.zshrc"
  [ -n "$FISH_VERSION" ] && SHELL_RC="$HOME/.config/fish/config.fish"
  echo "# Added by Project Setup" >> "$SHELL_RC"
  echo "alias myproject='bash $(pwd)/install.sh'" >> "$SHELL_RC"
  echo "Integrated with $SHELL_RC!"
else
  echo "Shell integration skipped.\nAdd 'alias myproject="bash $(pwd)/install.sh"' to your shell profile if desired."
fi

echo
# 2. Git Hooks
echo "Step 2: Git Hooks Installation"
if [ -d .git ]; then
  read -p "Install pre-commit Git hook for project formatting/checks? [y/N]: " install_hook
  if [[ "$install_hook" =~ ^[Yy]$ ]]; then
    cat <<'EOL' > .git/hooks/pre-commit
#!/usr/bin/env bash
echo 'Running project pre-commit checks...'
# (Add actual checks here)
EOL
    chmod +x .git/hooks/pre-commit
    echo "Pre-commit Git hook installed."
  else
    echo "Git hooks skipped."
  fi
else
  echo "No .git directory found. Skipping Git hooks."
fi

echo
# 3. Welcome Message & Tutorial
echo "======================================="
echo " Setup Complete! "
echo "======================================="
echo "To get started, try running:"
echo
  echo "  ./install.sh"
echo "  or the 'myproject' alias, if added."
echo
echo "Key commands you should know:"
echo "- ./install.sh         # Run installation or setup again"
echo "- ./uninstall.sh       # Uninstall all project scripts/settings"
echo
echo "Happy hacking! Check README.md for more."
echo "======================================="

exit 0

