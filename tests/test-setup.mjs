import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

registerHooks({
  resolve(specifier, context, next) {
    // Handle @/ path aliases -> src/ + .ts
    if (specifier.startsWith('@/')) {
      const resolvedPath = path.resolve('src', specifier.slice(2)) + '.ts';
      return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
    }

    // Handle next/cache and next/headers -> node_modules/next/*.js
    if (specifier === 'next/cache' || specifier === 'next/headers') {
      const resolvedPath = path.resolve('node_modules', 'next', specifier.replace('next/', '') + '.js');
      return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
    }

    // Handle @/lib as a package (bare import) -> src/lib/index.ts
    if (specifier === '@/lib') {
      const resolvedPath = path.resolve('src', 'lib', 'index.ts');
      return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
    }

    // Handle relative imports from src/ without .ts extension
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate.href, shortCircuit: true };
      }
    }

    return next(specifier, context);
  }
});