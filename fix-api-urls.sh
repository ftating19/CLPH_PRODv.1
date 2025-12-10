#!/bin/bash

# Fix apiUrl calls with fetch options - close apiUrl before options
find frontend/components/pages -name "*.tsx" -exec sed -i 's/fetch(apiUrl(`\([^`]*\)`, {/fetch(apiUrl(`\1`), {/g' {} \;

# Fix apiUrl calls without options - add closing paren for fetch
find frontend/components/pages -name "*.tsx" -exec sed -i 's/\(fetch(apiUrl(`[^`]*`)\)$/\1)/g' {} \;

# Fix ternary expressions with apiUrl
find frontend/components/pages -name "*.tsx" -exec sed -i 's/: apiUrl(`\([^`]*\)`$/: apiUrl(`\1`)/g' {} \;

# Fix Promise.all array with missing closing paren
find frontend/components/pages -name "*.tsx" -exec sed -i 's/fetch(apiUrl(`\([^`]*\)`) :/fetch(apiUrl(`\1`)) :/g' {} \;

echo "Fixed all apiUrl parenthesis issues"
