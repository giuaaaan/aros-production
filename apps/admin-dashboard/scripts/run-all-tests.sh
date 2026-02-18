#!/bin/bash

# Run all tests script
# Usage: ./scripts/run-all-tests.sh [options]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_E2E=false
RUN_LOAD=false
RUN_COVERAGE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --unit-only)
      RUN_INTEGRATION=false
      shift
      ;;
    --with-e2e)
      RUN_E2E=true
      shift
      ;;
    --with-load)
      RUN_LOAD=true
      shift
      ;;
    --coverage)
      RUN_COVERAGE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --unit-only      Run only unit tests"
      echo "  --with-e2e       Include E2E tests"
      echo "  --with-load      Include load tests"
      echo "  --coverage       Generate coverage report"
      echo "  --help           Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "${BLUE}========================================${NC}"
echo "${BLUE}  AI-AROS Admin Dashboard Test Suite   ${NC}"
echo "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "${RED}Error: package.json not found. Are you in the right directory?${NC}"
    exit 1
fi

# Unit Tests
if [ "$RUN_UNIT" = true ]; then
    echo "${YELLOW}🧪 Running Unit Tests...${NC}"
    if [ "$RUN_COVERAGE" = true ]; then
        pnpm test:unit:coverage
    else
        pnpm test:unit
    fi
    echo "${GREEN}✅ Unit Tests passed${NC}"
    echo ""
fi

# Integration Tests
if [ "$RUN_INTEGRATION" = true ]; then
    echo "${YELLOW}🔌 Running Integration Tests...${NC}"
    pnpm test:integration
    echo "${GREEN}✅ Integration Tests passed${NC}"
    echo ""
fi

# E2E Tests
if [ "$RUN_E2E" = true ]; then
    echo "${YELLOW}🎭 Running E2E Tests...${NC}"
    pnpm test:e2e
    echo "${GREEN}✅ E2E Tests passed${NC}"
    echo ""
fi

# Load Tests
if [ "$RUN_LOAD" = true ]; then
    echo "${YELLOW}🚀 Running Load Tests...${NC}"
    pnpm test:load:smoke
    echo "${GREEN}✅ Load Tests passed${NC}"
    echo ""
fi

# Summary
echo "${BLUE}========================================${NC}"
echo "${GREEN}✅ All tests completed successfully!${NC}"
echo "${BLUE}========================================${NC}"

if [ "$RUN_COVERAGE" = true ]; then
    echo ""
    echo "${BLUE}Coverage report available at:${NC}"
    echo "  - coverage/lcov-report/index.html"
fi
