import * as fs from 'node:fs';
import { runValidate } from './validate.js';

export function runWatch(root: string = process.cwd()): void {
  runValidate(root);
  fs.watch(root, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (/\.(ts|tsx|js|jsx|json)$/.test(String(filename))) runValidate(root);
  });
}
