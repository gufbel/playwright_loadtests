#!/bin/bash

echo "🚀 Starting Tuma UK Remittance onboarding Mock test environment..."
PROJECT_ROOT=$(pwd)

TUMA_API="$PROJECT_ROOT/Tests/mock_tuma_api.js"
ONFIDO_API="$PROJECT_ROOT/Tests/mock_onfido_api.js"
SEON_API="$PROJECT_ROOT/Tests/mock_seon_api.js"
PLAYWRIGHT_DIR="$PROJECT_ROOT"

if [ "$MODE" == "load" ]; then
  SPEC="specs/tuma_onboarding_load.spec.ts"
elif [ "$MODE" == "functional" ]; then
  SPEC="specs/tuma_onboarding_uk.spec.ts"
else
  SPEC="specs"
fi

node $ONFIDO_API > logs/onfido_api.log 2>&1 &
ONFIDO_PID=$!

node $SEON_API > logs/seon_api.log 2>&1 &
SEON_PID=$!

echo "📡 Starting Mock Tuma API..."
node $TUMA_API > logs/tuma_api.log 2>&1 &
TUMA_PID=$!

echo "⏳ Waiting for APIs to boot..."
sleep 2

echo "🧪 Running Playwright tests..."
cd $PLAYWRIGHT_DIR
npx playwright test $SPEC --config=config/playwright.config.js
TEST_STATUS=$?

echo "🛑 Stopping Mock APIs..."
kill $TUMA_PID $ONFIDO_PID $SEON_PID 2>/dev/null

echo "📨 Sending Slack report..."
node slack-report.js

echo "📊 Playwright report generated"
echo "Report Attached"

exit $TEST_STATUS
