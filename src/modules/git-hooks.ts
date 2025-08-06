/**
 * Git Hooks Integration Module
 * Manages git hook installation, generation, and XP rewards for git activities
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ActivityType } from '../types/Activity';
import { XPSystem } from './xp-system';
import { database } from './database';
import { createHash } from 'crypto';

const execAsync = promisify(exec);

/**
 * Git hook types supported by the system
 */
export enum GitHookType {
  POST_COMMIT = 'post-commit',
  POST_MERGE = 'post-merge',
  POST_CHECKOUT = 'post-checkout',
  PRE_PUSH = 'pre-push',
  COMMIT_MSG = 'commit-msg'
}

/**
 * XP rewards configuration for git activities
 */
export interface GitXPRewards {
  /** Base XP for commits */
  commitBase: number;
  
  /** XP per file changed */
  perFileChanged: number;
  
  /** XP per line added */
  perLineAdded: number;
  
  /** XP per line deleted */
  perLineDeleted: number;
  
  /** Bonus XP for meaningful commit messages */
  meaningfulMessageBonus: number;
  
  /** XP for merges */
  mergeXP: number;
  
  /** XP for new branches */
  newBranchXP: number;
  
  /** XP for PR creation */
  prCreationXP: number;
  
  /** Maximum XP per commit */
  maxCommitXP: number;
  
  /** Minimum commit message length for bonus */
  minMessageLength: number;
  
  /** Quality keywords that trigger bonus XP */
  qualityKeywords: string[];
}

/**
 * Git hook installation options
 */
export interface HookInstallOptions {
  /** Path to git repository */
  repoPath?: string;
  
  /** Whether to preserve existing hooks */
  preserveExisting?: boolean;
  
  /** Whether to create backup of existing hooks */
  createBackup?: boolean;
  
  /** Custom hook directory (if not .git/hooks) */
  hookDir?: string;
  
  /** Whether to make hooks executable */
  makeExecutable?: boolean;
  
  /** Whether to use verbose logging */
  verbose?: boolean;
}

/**
 * Commit analysis result
 */
export interface CommitAnalysis {
  /** Commit hash */
  hash: string;
  
  /** Author name */
  author: string;
  
  /** Commit message */
  message: string;
  
  /** Number of files changed */
  filesChanged: number;
  
  /** Number of insertions */
  insertions: number;
  
  /** Number of deletions */
  deletions: number;
  
  /** Whether it's a merge commit */
  isMerge: boolean;
  
  /** Message quality score (0-100) */
  messageQuality: number;
  
  /** Calculated XP */
  xpReward: number;
}

/**
 * Git hook configuration
 */
interface HookConfig {
  /** Hook type */
  type: GitHookType;
  
  /** Script content */
  script: string;
  
  /** Whether the hook is enabled */
  enabled: boolean;
  
  /** Priority for execution order */
  priority: number;
}

/**
 * Main Git Hooks Manager class
 */
export class GitHooksManager {
  private xpRewards: GitXPRewards;
  private xpSystem: XPSystem;
  private installationLog: Map<string, Date> = new Map();

  constructor(xpRewards?: Partial<GitXPRewards>) {
    this.xpRewards = this.getDefaultXPRewards();
    if (xpRewards) {
      this.xpRewards = { ...this.xpRewards, ...xpRewards };
    }
    this.xpSystem = new XPSystem();
  }

  /**
   * Get default XP rewards configuration
   */
  private getDefaultXPRewards(): GitXPRewards {
    return {
      commitBase: 50,
      perFileChanged: 5,
      perLineAdded: 1,
      perLineDeleted: 0.5,
      meaningfulMessageBonus: 25,
      mergeXP: 75,
      newBranchXP: 30,
      prCreationXP: 100,
      maxCommitXP: 200,
      minMessageLength: 50,
      qualityKeywords: [
        'fix', 'feat', 'refactor', 'perf', 'test', 'docs',
        'style', 'chore', 'build', 'ci', 'revert'
      ]
    };
  }

  /**
   * Generate post-commit hook script
   */
  private generatePostCommitHook(): string {
    return `#!/bin/bash
# DevXP Tracker - Post-commit Hook
# Automatically tracks git commits and awards XP

# Get the path to the devxp CLI
DEVXP_CLI="devxp"

# Check if devxp is installed
if ! command -v $DEVXP_CLI &> /dev/null; then
    # Try to find it in node_modules
    if [ -f "./node_modules/.bin/devxp" ]; then
        DEVXP_CLI="./node_modules/.bin/devxp"
    else
        # Silent fail - don't interrupt git workflow
        exit 0
    fi
fi

# Get commit information
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
AUTHOR_NAME=$(git log -1 --pretty=%an)
AUTHOR_EMAIL=$(git log -1 --pretty=%ae)

# Get commit statistics
STATS=$(git diff --stat HEAD~1 HEAD 2>/dev/null || echo "")
FILES_CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | wc -l)
INSERTIONS=$(git diff --stat HEAD~1 HEAD 2>/dev/null | grep -E '[0-9]+ insertion' | sed 's/.*\\([0-9]\\+\\) insertion.*/\\1/' || echo "0")
DELETIONS=$(git diff --stat HEAD~1 HEAD 2>/dev/null | grep -E '[0-9]+ deletion' | sed 's/.*\\([0-9]\\+\\) deletion.*/\\1/' || echo "0")

# Check if it's a merge commit
PARENT_COUNT=$(git rev-list --parents -n 1 HEAD | wc -w)
IS_MERGE="false"
if [ "$PARENT_COUNT" -gt "2" ]; then
    IS_MERGE="true"
fi

# Track the activity with devxp
$DEVXP_CLI track git-commit \\
    --hash "$COMMIT_HASH" \\
    --message "$COMMIT_MESSAGE" \\
    --author "$AUTHOR_NAME" \\
    --files "$FILES_CHANGED" \\
    --insertions "$INSERTIONS" \\
    --deletions "$DELETIONS" \\
    --merge "$IS_MERGE" \\
    2>/dev/null || true

# Always exit successfully to not interrupt git workflow
exit 0
`;
  }

  /**
   * Generate post-merge hook script
   */
  private generatePostMergeHook(): string {
    return `#!/bin/bash
# DevXP Tracker - Post-merge Hook
# Tracks merge operations and awards XP

# Get the path to the devxp CLI
DEVXP_CLI="devxp"

# Check if devxp is installed
if ! command -v $DEVXP_CLI &> /dev/null; then
    if [ -f "./node_modules/.bin/devxp" ]; then
        DEVXP_CLI="./node_modules/.bin/devxp"
    else
        exit 0
    fi
fi

# Get merge information
CURRENT_BRANCH=$(git branch --show-current)
MERGE_HASH=$(git rev-parse HEAD)
MERGE_MESSAGE=$(git log -1 --pretty=%B)

# Track the merge activity
$DEVXP_CLI track git-merge \\
    --branch "$CURRENT_BRANCH" \\
    --hash "$MERGE_HASH" \\
    --message "$MERGE_MESSAGE" \\
    2>/dev/null || true

exit 0
`;
  }

  /**
   * Generate post-checkout hook script
   */
  private generatePostCheckoutHook(): string {
    return `#!/bin/bash
# DevXP Tracker - Post-checkout Hook
# Tracks branch switches and new branch creation

# Get the path to the devxp CLI
DEVXP_CLI="devxp"

# Check if devxp is installed
if ! command -v $DEVXP_CLI &> /dev/null; then
    if [ -f "./node_modules/.bin/devxp" ]; then
        DEVXP_CLI="./node_modules/.bin/devxp"
    else
        exit 0
    fi
fi

# Get checkout information
# $1 = previous HEAD
# $2 = new HEAD
# $3 = 1 if branch checkout, 0 if file checkout
PREV_HEAD=$1
NEW_HEAD=$2
IS_BRANCH_CHECKOUT=$3

# Only track branch checkouts
if [ "$IS_BRANCH_CHECKOUT" = "1" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    
    # Check if this is a new branch (previous HEAD equals new HEAD)
    if [ "$PREV_HEAD" = "$NEW_HEAD" ]; then
        # New branch created
        $DEVXP_CLI track git-branch-create \\
            --branch "$CURRENT_BRANCH" \\
            2>/dev/null || true
    else
        # Branch switch
        $DEVXP_CLI track git-checkout \\
            --branch "$CURRENT_BRANCH" \\
            --from "$PREV_HEAD" \\
            --to "$NEW_HEAD" \\
            2>/dev/null || true
    fi
fi

exit 0
`;
  }

  /**
   * Generate pre-push hook script
   */
  private generatePrePushHook(): string {
    return `#!/bin/bash
# DevXP Tracker - Pre-push Hook
# Tracks push operations and awards XP

# Get the path to the devxp CLI
DEVXP_CLI="devxp"

# Check if devxp is installed
if ! command -v $DEVXP_CLI &> /dev/null; then
    if [ -f "./node_modules/.bin/devxp" ]; then
        DEVXP_CLI="./node_modules/.bin/devxp"
    else
        exit 0
    fi
fi

# Get push information
REMOTE=$1
URL=$2
CURRENT_BRANCH=$(git branch --show-current)

# Count commits being pushed
COMMIT_COUNT=0
while read local_ref local_sha remote_ref remote_sha; do
    if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
        # New branch being pushed
        COMMIT_COUNT=$(git rev-list --count "$local_sha")
    else
        # Existing branch
        COMMIT_COUNT=$(git rev-list --count "$remote_sha..$local_sha")
    fi
done

# Track the push activity
if [ "$COMMIT_COUNT" -gt "0" ]; then
    $DEVXP_CLI track git-push \\
        --remote "$REMOTE" \\
        --branch "$CURRENT_BRANCH" \\
        --commits "$COMMIT_COUNT" \\
        2>/dev/null || true
fi

# Always allow the push to continue
exit 0
`;
  }

  /**
   * Generate commit-msg hook script for message quality
   */
  private generateCommitMsgHook(): string {
    return `#!/bin/bash
# DevXP Tracker - Commit-msg Hook
# Analyzes commit message quality and provides feedback

# Get the commit message file
COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Get the path to the devxp CLI
DEVXP_CLI="devxp"

# Check if devxp is installed
if ! command -v $DEVXP_CLI &> /dev/null; then
    if [ -f "./node_modules/.bin/devxp" ]; then
        DEVXP_CLI="./node_modules/.bin/devxp"
    else
        exit 0
    fi
fi

# Analyze commit message quality
$DEVXP_CLI analyze-commit-msg "$COMMIT_MSG" 2>/dev/null || true

# Always allow the commit to continue
exit 0
`;
  }

  /**
   * Install git hooks in a repository
   */
  async installHooks(options: HookInstallOptions = {}): Promise<void> {
    const {
      repoPath = process.cwd(),
      preserveExisting = true,
      createBackup = true,
      hookDir,
      makeExecutable = true,
      verbose = false
    } = options;

    // Verify git repository
    const gitDir = path.join(repoPath, '.git');
    try {
      await fs.access(gitDir);
    } catch {
      throw new Error(`Not a git repository: ${repoPath}`);
    }

    // Determine hooks directory
    const hooksDir = hookDir || path.join(gitDir, 'hooks');
    
    // Create hooks directory if it doesn't exist
    await fs.mkdir(hooksDir, { recursive: true });

    // Define hooks to install
    const hooks: HookConfig[] = [
      {
        type: GitHookType.POST_COMMIT,
        script: this.generatePostCommitHook(),
        enabled: true,
        priority: 1
      },
      {
        type: GitHookType.POST_MERGE,
        script: this.generatePostMergeHook(),
        enabled: true,
        priority: 2
      },
      {
        type: GitHookType.POST_CHECKOUT,
        script: this.generatePostCheckoutHook(),
        enabled: true,
        priority: 3
      },
      {
        type: GitHookType.PRE_PUSH,
        script: this.generatePrePushHook(),
        enabled: true,
        priority: 4
      },
      {
        type: GitHookType.COMMIT_MSG,
        script: this.generateCommitMsgHook(),
        enabled: true,
        priority: 5
      }
    ];

    // Install each hook
    for (const hook of hooks) {
      if (!hook.enabled) continue;

      const hookPath = path.join(hooksDir, hook.type);
      
      // Check if hook already exists
      let existingHook: string | null = null;
      try {
        existingHook = await fs.readFile(hookPath, 'utf-8');
      } catch {
        // Hook doesn't exist, which is fine
      }

      if (existingHook) {
        if (preserveExisting) {
          // Append to existing hook or wrap it
          if (verbose) {
            console.log(`Preserving existing ${hook.type} hook`);
          }

          if (createBackup) {
            const backupPath = `${hookPath}.backup.${Date.now()}`;
            await fs.writeFile(backupPath, existingHook);
            if (verbose) {
              console.log(`Created backup: ${backupPath}`);
            }
          }

          // Check if our hook is already installed
          if (existingHook.includes('DevXP Tracker')) {
            if (verbose) {
              console.log(`${hook.type} hook already contains DevXP tracker`);
            }
            continue;
          }

          // Append our hook to the existing one
          const combinedHook = await this.combineHooks(existingHook, hook.script);
          await fs.writeFile(hookPath, combinedHook);
        } else {
          // Replace existing hook
          if (createBackup) {
            const backupPath = `${hookPath}.backup.${Date.now()}`;
            await fs.writeFile(backupPath, existingHook);
            if (verbose) {
              console.log(`Created backup: ${backupPath}`);
            }
          }
          await fs.writeFile(hookPath, hook.script);
        }
      } else {
        // Write new hook
        await fs.writeFile(hookPath, hook.script);
      }

      // Make hook executable
      if (makeExecutable) {
        await fs.chmod(hookPath, 0o755);
      }

      if (verbose) {
        console.log(`Installed ${hook.type} hook`);
      }
    }

    // Record installation
    this.installationLog.set(repoPath, new Date());

    console.log('✅ Git hooks installed successfully!');
    console.log('Your git activities will now be tracked and earn XP automatically.');
  }

  /**
   * Combine existing hook with new hook script
   */
  private async combineHooks(existingHook: string, newHook: string): Promise<string> {
    // Remove shebang from new hook if present
    const newHookContent = newHook.replace(/^#!.*\n/, '');
    
    // If existing hook doesn't have a shebang, add one
    if (!existingHook.startsWith('#!')) {
      existingHook = '#!/bin/bash\n' + existingHook;
    }

    // Combine hooks with a separator comment
    return `${existingHook}

# ===== DevXP Tracker Hook Start =====
${newHookContent}
# ===== DevXP Tracker Hook End =====
`;
  }

  /**
   * Uninstall git hooks
   */
  async uninstallHooks(repoPath: string = process.cwd()): Promise<void> {
    const gitDir = path.join(repoPath, '.git');
    const hooksDir = path.join(gitDir, 'hooks');

    const hookTypes = Object.values(GitHookType);

    for (const hookType of hookTypes) {
      const hookPath = path.join(hooksDir, hookType);

      try {
        const content = await fs.readFile(hookPath, 'utf-8');
        
        if (content.includes('DevXP Tracker')) {
          // Check if it's a combined hook
          if (content.includes('===== DevXP Tracker Hook Start =====')) {
            // Remove only our part
            const cleanedContent = content
              .replace(/# ===== DevXP Tracker Hook Start =====[\s\S]*?# ===== DevXP Tracker Hook End =====/g, '')
              .trim();
            
            if (cleanedContent && cleanedContent !== '#!/bin/bash') {
              await fs.writeFile(hookPath, cleanedContent);
            } else {
              await fs.unlink(hookPath);
            }
          } else {
            // It's entirely our hook, remove it
            await fs.unlink(hookPath);
          }
          console.log(`Uninstalled ${hookType} hook`);
        }
      } catch {
        // Hook doesn't exist or can't be read, skip
      }
    }

    console.log('✅ Git hooks uninstalled successfully');
  }

  /**
   * Analyze commit quality based on message and changes
   */
  async analyzeCommit(commitHash?: string): Promise<CommitAnalysis> {
    const hash = commitHash || 'HEAD';

    try {
      // Get commit information
      const { stdout: logOutput } = await execAsync(
        `git log -1 --pretty=format:"%H|%an|%B" ${hash}`
      );
      const [fullHash, author, ...messageParts] = logOutput.split('|');
      const message = messageParts.join('|');

      // Get commit statistics
      const { stdout: statOutput } = await execAsync(
        `git diff-tree --no-commit-id --numstat -r ${hash}`
      );
      
      let filesChanged = 0;
      let insertions = 0;
      let deletions = 0;

      if (statOutput) {
        const lines = statOutput.trim().split('\n');
        filesChanged = lines.length;
        
        for (const line of lines) {
          const [added, deleted] = line.split('\t');
          insertions += parseInt(added) || 0;
          deletions += parseInt(deleted) || 0;
        }
      }

      // Check if it's a merge commit
      const { stdout: parentCount } = await execAsync(
        `git rev-list --parents -n 1 ${hash} | wc -w`
      );
      const isMerge = parseInt(parentCount.trim()) > 2;

      // Analyze message quality
      const messageQuality = this.analyzeMessageQuality(message);

      // Calculate XP reward
      const xpReward = this.calculateCommitXP({
        filesChanged,
        insertions,
        deletions,
        messageQuality,
        isMerge
      });

      return {
        hash: fullHash,
        author,
        message,
        filesChanged,
        insertions,
        deletions,
        isMerge,
        messageQuality,
        xpReward
      };
    } catch (error) {
      throw new Error(`Failed to analyze commit: ${error}`);
    }
  }

  /**
   * Analyze commit message quality
   */
  private analyzeMessageQuality(message: string): number {
    let score = 0;
    const maxScore = 100;

    // Check message length
    if (message.length >= this.xpRewards.minMessageLength) {
      score += 20;
    } else if (message.length >= 30) {
      score += 10;
    }

    // Check for conventional commit format
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/;
    if (conventionalPattern.test(message)) {
      score += 30;
    }

    // Check for quality keywords
    const lowerMessage = message.toLowerCase();
    const keywordMatches = this.xpRewards.qualityKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    );
    score += Math.min(20, keywordMatches.length * 5);

    // Check for issue references
    if (/(?:#\d+|[A-Z]+-\d+)/.test(message)) {
      score += 10;
    }

    // Check for description body (multi-line commit)
    if (message.split('\n').length > 1) {
      score += 10;
    }

    // Check for proper capitalization
    if (message[0] === message[0].toUpperCase()) {
      score += 5;
    }

    // Check for no trailing period in subject
    const firstLine = message.split('\n')[0];
    if (!firstLine.endsWith('.')) {
      score += 5;
    }

    return Math.min(maxScore, score);
  }

  /**
   * Calculate XP for a commit
   */
  private calculateCommitXP(stats: {
    filesChanged: number;
    insertions: number;
    deletions: number;
    messageQuality: number;
    isMerge: boolean;
  }): number {
    let xp = 0;

    if (stats.isMerge) {
      xp = this.xpRewards.mergeXP;
    } else {
      // Base XP
      xp = this.xpRewards.commitBase;

      // XP for changes
      xp += stats.filesChanged * this.xpRewards.perFileChanged;
      xp += stats.insertions * this.xpRewards.perLineAdded;
      xp += stats.deletions * this.xpRewards.perLineDeleted;

      // Message quality bonus
      if (stats.messageQuality >= 60) {
        xp += this.xpRewards.meaningfulMessageBonus;
      } else if (stats.messageQuality >= 40) {
        xp += this.xpRewards.meaningfulMessageBonus * 0.5;
      }

      // Apply quality multiplier
      const qualityMultiplier = 0.5 + (stats.messageQuality / 100) * 0.5;
      xp *= qualityMultiplier;
    }

    // Cap XP
    return Math.min(Math.round(xp), this.xpRewards.maxCommitXP);
  }

  /**
   * Analyze git log for historical XP calculation
   */
  async analyzeGitHistory(options: {
    since?: string;
    until?: string;
    author?: string;
    maxCommits?: number;
  } = {}): Promise<{ commits: CommitAnalysis[]; totalXP: number }> {
    const { since, until, author, maxCommits = 100 } = options;

    let gitLogCmd = `git log --pretty=format:"%H" --no-merges`;
    
    if (since) {
      gitLogCmd += ` --since="${since}"`;
    }
    if (until) {
      gitLogCmd += ` --until="${until}"`;
    }
    if (author) {
      gitLogCmd += ` --author="${author}"`;
    }
    gitLogCmd += ` -n ${maxCommits}`;

    try {
      const { stdout } = await execAsync(gitLogCmd);
      const commitHashes = stdout.trim().split('\n').filter(h => h);

      const commits: CommitAnalysis[] = [];
      let totalXP = 0;

      for (const hash of commitHashes) {
        try {
          const analysis = await this.analyzeCommit(hash);
          commits.push(analysis);
          totalXP += analysis.xpReward;
        } catch {
          // Skip commits that can't be analyzed
        }
      }

      return { commits, totalXP };
    } catch (error) {
      throw new Error(`Failed to analyze git history: ${error}`);
    }
  }

  /**
   * Check if hooks are installed in a repository
   */
  async checkInstallation(repoPath: string = process.cwd()): Promise<{
    installed: boolean;
    hooks: { [key: string]: boolean };
    version?: string;
  }> {
    const gitDir = path.join(repoPath, '.git');
    const hooksDir = path.join(gitDir, 'hooks');

    const hookTypes = Object.values(GitHookType);
    const hooks: { [key: string]: boolean } = {};
    let anyInstalled = false;

    for (const hookType of hookTypes) {
      const hookPath = path.join(hooksDir, hookType);
      
      try {
        const content = await fs.readFile(hookPath, 'utf-8');
        const isOurs = content.includes('DevXP Tracker');
        hooks[hookType] = isOurs;
        if (isOurs) {
          anyInstalled = true;
        }
      } catch {
        hooks[hookType] = false;
      }
    }

    return {
      installed: anyInstalled,
      hooks
    };
  }

  /**
   * Get XP reward estimation for current staged changes
   */
  async estimateCommitXP(): Promise<{
    estimatedXP: number;
    breakdown: {
      base: number;
      files: number;
      lines: number;
      potential: number;
    };
  }> {
    try {
      // Get staged changes
      const { stdout: diffStat } = await execAsync('git diff --cached --numstat');
      
      let filesChanged = 0;
      let insertions = 0;
      let deletions = 0;

      if (diffStat) {
        const lines = diffStat.trim().split('\n');
        filesChanged = lines.length;
        
        for (const line of lines) {
          const [added, deleted] = line.split('\t');
          insertions += parseInt(added) || 0;
          deletions += parseInt(deleted) || 0;
        }
      }

      const baseXP = this.xpRewards.commitBase;
      const filesXP = filesChanged * this.xpRewards.perFileChanged;
      const linesXP = insertions * this.xpRewards.perLineAdded + 
                      deletions * this.xpRewards.perLineDeleted;
      const potentialBonus = this.xpRewards.meaningfulMessageBonus;

      const estimatedXP = Math.min(
        baseXP + filesXP + linesXP,
        this.xpRewards.maxCommitXP
      );

      return {
        estimatedXP,
        breakdown: {
          base: baseXP,
          files: filesXP,
          lines: Math.round(linesXP),
          potential: potentialBonus
        }
      };
    } catch (error) {
      throw new Error(`Failed to estimate commit XP: ${error}`);
    }
  }

  /**
   * Generate a report of git activity XP
   */
  async generateXPReport(options: {
    days?: number;
    author?: string;
  } = {}): Promise<string> {
    const { days = 30, author } = options;
    const since = `${days} days ago`;

    const { commits, totalXP } = await this.analyzeGitHistory({
      since,
      author
    });

    const avgXP = commits.length > 0 ? Math.round(totalXP / commits.length) : 0;
    const bestCommit = commits.reduce((best, current) => 
      current.xpReward > best.xpReward ? current : best
    , commits[0]);

    let report = `📊 Git Activity XP Report\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `📅 Period: Last ${days} days\n`;
    if (author) {
      report += `👤 Author: ${author}\n`;
    }
    report += `\n`;
    report += `📈 Summary:\n`;
    report += `  • Total Commits: ${commits.length}\n`;
    report += `  • Total XP Earned: ${totalXP}\n`;
    report += `  • Average XP per Commit: ${avgXP}\n`;
    report += `\n`;
    
    if (bestCommit) {
      report += `🏆 Best Commit:\n`;
      report += `  • Hash: ${bestCommit.hash.substring(0, 7)}\n`;
      report += `  • Message: ${bestCommit.message.split('\n')[0]}\n`;
      report += `  • XP Earned: ${bestCommit.xpReward}\n`;
      report += `  • Quality Score: ${bestCommit.messageQuality}/100\n`;
    }

    return report;
  }

  /**
   * Export configuration
   */
  exportConfig(): GitXPRewards {
    return { ...this.xpRewards };
  }

  /**
   * Import configuration
   */
  importConfig(config: Partial<GitXPRewards>): void {
    this.xpRewards = { ...this.xpRewards, ...config };
  }
}

// Export singleton instance
export const gitHooks = new GitHooksManager();

// Export convenience functions
export async function installGitHooks(options?: HookInstallOptions): Promise<void> {
  return gitHooks.installHooks(options);
}

export async function uninstallGitHooks(repoPath?: string): Promise<void> {
  return gitHooks.uninstallHooks(repoPath);
}

export async function analyzeCommit(commitHash?: string): Promise<CommitAnalysis> {
  return gitHooks.analyzeCommit(commitHash);
}

export async function checkGitHooksInstalled(repoPath?: string): Promise<boolean> {
  const result = await gitHooks.checkInstallation(repoPath);
  return result.installed;
}

export async function estimateNextCommitXP(): Promise<number> {
  const result = await gitHooks.estimateCommitXP();
  return result.estimatedXP;
}

export async function generateGitXPReport(options?: { days?: number; author?: string }): Promise<string> {
  return gitHooks.generateXPReport(options);
}
