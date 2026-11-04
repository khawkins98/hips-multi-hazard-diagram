#!/bin/sh
# Check a commit subject or PR title against the project convention.
#
# We squash merge, so the PR title becomes the commit subject on main.
# Both the local commit-msg hook and the PR title CI check call this script,
# so the rule lives in one place.
#
# Usage: scripts/check-commit-subject.sh "<subject>" ["<label>"]

subject=$1
label=${2:-Commit subject}

types='feat|fix|docs|chore|refactor|test|ci|build|perf|style|revert'
pattern="^($types)(\([a-z0-9-]+\))?!?: [^ ].{2,}$"
max=72

fail() {
  printf '\n%s does not match the project convention:\n\n  %s\n\n%s\n\n' "$label" "$subject" "$1" >&2
  cat >&2 <<HELP
Expected:  <type>: <description>   (or <type>(<scope>): <description>)
Types:     feat, fix, docs, chore, refactor, test, ci, build, perf, style, revert
Examples:  feat: add Mangrove theming
           fix(embed): stop diagrams rendering twice
           chore(deps): update vite to 8.3.5
Max $max characters. See CONTRIBUTING.md.

HELP
  exit 1
}

printf '%s' "$subject" | grep -Eq "$pattern" || fail "It should start with a type and a colon."
[ "$(printf '%s' "$subject" | wc -m)" -le "$max" ] || fail "It is longer than $max characters."
exit 0
