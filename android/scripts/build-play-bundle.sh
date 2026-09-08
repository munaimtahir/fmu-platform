#!/usr/bin/env bash
set -euo pipefail

sign_dir="$HOME/.config/vexel/medsims-signing"
props="$sign_dir/signing.properties"
key="$sign_dir/medsims-upload.jks"
if [[ ! -f "$props" || ! -f "$key" ]]; then
  echo "MedSIMS canonical Play signing configuration not found: $sign_dir" >&2
  exit 1
fi

./gradlew test lint bundleRelease
bundle="app/build/outputs/bundle/release/app-release.aab"
test -s "$bundle"
jarsigner -verify -certs "$bundle" >/dev/null
sha256sum "$bundle"
echo "Signed Play bundle: $bundle"
