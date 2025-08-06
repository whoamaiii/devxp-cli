#!/usr/bin/env bash
# uninstall.sh - Clean removal of all project integration
set -e

# Remove shell integration (alias from rc files)
SHELL_RCS=("$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.config/fish/config.fish")
for RC in "${SHELL_RCS[@]}"; do
  if [ -f "$RC" ]; then
    sed -i.bak '/# Added by Project Setup/,+1d' "$RC"
  fi
done

echo "Shell integration entries removed from shell rc files."

# Remove git hooks if present
if [ -f .git/hooks/pre-commit ]; then
  rm .git/hooks/pre-commit
  echo "Pre-commit Git hook removed."
fi

echo "Uninstallation is complete. Project configs/scripts are removed."

exit 0

