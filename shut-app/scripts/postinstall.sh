#!/bin/bash
# Fix expo-modules-jsi Swift 6 compatibility (Xcode 26+)

JSI_DIR="node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI"

if [ -d "$JSI_DIR" ]; then
  # Step 1: weak let -> weak var
  find "$JSI_DIR" -name "*.swift" -exec sed -i '' 's/weak let /weak var /g' {} +

  # Step 2: Fix Sendable classes - add nonisolated(unsafe) to weak var runtime
  # JavaScriptPropNameID.swift
  sed -i '' 's/private weak var runtime/nonisolated(unsafe) private weak var runtime/' \
    "$JSI_DIR/Runtime/JavaScriptPropNameID.swift" 2>/dev/null

  # JavaScriptError.swift
  sed -i '' 's/private weak var runtime/nonisolated(unsafe) private weak var runtime/' \
    "$JSI_DIR/Runtime/Values/JavaScriptError.swift" 2>/dev/null

  # JavaScriptValue.swift
  sed -i '' 's/internal weak var runtime/nonisolated(unsafe) internal weak var runtime/' \
    "$JSI_DIR/Runtime/Values/JavaScriptValue.swift" 2>/dev/null

  echo "[postinstall] Patched expo-modules-jsi for Swift 6 / Xcode 26+"
fi
