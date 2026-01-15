#!/bin/bash
# Force Push Commands for Security Cleanup
# Execute this script after coordinating with your team

set -e

echo "⚠️  WARNING: This will rewrite remote git history!"
echo "⚠️  All collaborators must delete and re-clone the repository!"
echo ""
read -p "Have you coordinated with your team? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted. Coordinate with your team first."
    exit 1
fi

cd /home/munaim/srv/apps/fmu-platform

echo ""
echo "📤 Force pushing all branches..."
git push origin --force --all

echo ""
echo "📤 Force pushing all tags..."
git push origin --force --tags

echo ""
echo "✅ Force push complete!"
echo ""
echo "📋 Next steps for collaborators:"
echo "   1. Delete their local repository"
echo "   2. Re-clone: git clone https://github.com/munaimtahir/fmu-platform.git"
echo "   3. Update environment variables with rotated secrets"
echo ""
echo "🔐 Rotated secrets (update in production environment):"
echo "   DJANGO_SECRET_KEY=82ZtE&OyVfn9t&of!-WfTtEuG7is5FEa2_\$nSV2w5512P_^1lf"
echo "   DB_PASSWORD=oGusIvfGDQ9N9NaMj898AOrplfvu9gTFddd3876mKKo="
echo "   POSTGRES_PASSWORD=gZtb6D0r/eL9wS4vB0r7q0xg9wQN/L8NrU3l9t0JkJ0="
echo "   JWT_SECRET=fNnO6rLFwWrBYjYLzJQqE7NdHJtl3S337kLe8WfXaIA="
echo "   SMTP_PASSWORD=COn58QbZR/QkgWUVZOnqxLyNjqe3kacBavfHT0TG+N8="
