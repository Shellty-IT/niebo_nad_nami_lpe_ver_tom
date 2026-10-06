import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
import references from '../astronomy/fixtures/horizons.json';
import planetReferences from '../astronomy/fixtures/planets.json';

test.each([...references.sources, ...planetReferences.sources])('integralność oryginalnej odpowiedzi JPL: $path', (source) => {
  const content = readFileSync(new URL(`../astronomy/fixtures/${source.path}`, import.meta.url));
  expect(createHash('sha256').update(content).digest('hex')).toBe(source.sha256);
});
