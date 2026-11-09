#!/usr/bin/env node
// Validate the locally generated EMI subset against emi-recipe-renderer's
// schema contract before the site build consumes it.

import { resolve } from 'node:path';

import { printValidationOk, validateBundleRoot } from 'emi-recipe-renderer/validate';

const root = resolve(process.argv[2] || 'docs/data/emi');

try {
  printValidationOk(validateBundleRoot(root));
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
