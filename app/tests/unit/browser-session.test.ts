import { expect, it } from 'vitest';
import defaults from '../../.generated/probe.json';
import { createProbeStore } from '../../src/app/probe-store';
import { parseConfig } from '../../src/domain/probe';
import { BrowserSession } from '../../src/persistence/browser-session';
import { LocalSession } from '../../src/persistence/local-session';

it('odmowa dostępu do preferencji trwałych pozostawia tryb sesyjny', async () => {
  const store = createProbeStore(parseConfig(defaults));
  const data = new Map<string, string>();
  const session = new LocalSession(store, () => ({
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: (key) => { data.delete(key); },
  }));
  const browser = new BrowserSession(store, session, {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); },
  });
  expect(browser.isDurable()).toBe(false);
  expect(await browser.load()).toBe(true);
  store.navigate('E7'); await browser.save();
  expect(data.size).toBe(1);
});
