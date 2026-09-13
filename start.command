#!/bin/bash
# Double-click this. It sets the Playground up on a Mac.
#
# Why a .command file: it opens in Terminal.app when double-clicked, which is
# the difference between "a designer can start" and "a designer files a ticket".
# Open it that way, NOT with `bash start.command` from inside an editor — an
# editor's terminal can time out on a long install and will not have the PATH
# a fresh Homebrew or Node install writes.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  cat <<'MSG'

  Node.js is not installed, and everything else needs it.

  Install it, then double-click this file again:

      brew install node

  No Homebrew? Get the installer from https://nodejs.org (choose LTS).

MSG
  read -r -p "  Press return to close."
  exit 1
fi

node scripts/setup.mjs
status=$?
echo
read -r -p "  Press return to close this window."
exit $status
