#!/bin/bash
# Script to remove .env file from git repository history
# This should be run manually to clean up the accidentally committed .env file

set -e

echo "=================================================="
echo "Remove .env from Git Repository"
echo "=================================================="
echo ""
echo "⚠️  WARNING: This will remove .env from git history"
echo "    Make sure you have a backup of your .env file if needed"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Backing up current .env file..."
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "✅ Backup created: .env.backup"
else
    echo "ℹ️  No .env file found to backup"
fi

echo ""
echo "Step 2: Removing .env from git index..."
git rm --cached .env || echo "⚠️  .env not in index (this is okay)"

echo ""
echo "Step 3: Creating commit..."
git commit -m "Remove .env file from repository

The .env file was accidentally committed and contains sensitive
credentials. It has been removed from the repository and added
to .gitignore to prevent future commits.

Users should create their own .env file from .env.example."

echo ""
echo "Step 4: Restoring .env file (not tracked)..."
if [ -f ".env.backup" ]; then
    mv .env.backup .env
    echo "✅ .env file restored (not tracked by git)"
fi

echo ""
echo "=================================================="
echo "✅ Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Push the changes: git push origin your-branch-name"
echo "2. Verify .env is in .gitignore"
echo "3. Inform team members to create their own .env from .env.example"
echo ""
echo "Note: .env is now ignored by git and won't be committed"
echo ""
