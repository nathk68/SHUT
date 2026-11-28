#!/bin/bash
# Post-install patches for expo-modules-jsi

BUILD_SCRIPT="node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh"

# Disable code signing in build-xcframework.sh to avoid
# "resource fork, Finder information, or similar detritus" CodeSign errors
if [ -f "$BUILD_SCRIPT" ] && ! grep -q "CODE_SIGNING_ALLOWED=NO" "$BUILD_SCRIPT"; then
  sed -i '' 's/CLANG_COVERAGE_MAPPING=NO \\/CLANG_COVERAGE_MAPPING=NO \\\n    CODE_SIGNING_ALLOWED=NO \\/' "$BUILD_SCRIPT"
  echo "[postinstall] Patched build-xcframework.sh with CODE_SIGNING_ALLOWED=NO"
fi
