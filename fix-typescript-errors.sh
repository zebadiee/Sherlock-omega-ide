#!/bin/bash

# Fix error.message references in all AI files
find src/ai -name "*.ts" -exec sed -i '' 's/error\.message/error instanceof Error ? error.message : String(error)/g' {} \;

# Fix recordMetric calls that are missing MetricType parameter
find src/ai -name "*.ts" -exec sed -i '' "s/recordMetric('\([^']*\)', \([^,)]*\));/recordMetric('\1', \2, MetricType.EXECUTION_TIME);/g" {} \;

echo "Fixed common TypeScript errors in AI files"