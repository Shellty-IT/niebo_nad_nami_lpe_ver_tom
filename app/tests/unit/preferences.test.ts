import { expect, it } from 'vitest';
import { defaultPreferences, parsePreferences, PreferenceStorage } from '../../src/accessibility/preferences';

function storage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
it('rozróżnia preferencje karty i przyszłych sesji bez modyfikacji starszych ustawień', () => {
  const persistent = storage();
  const current = new PreferenceStorage(() => storage(), () => persistent);
  const future = { ...defaultPreferences(), contrast: 'yellowOnBlack' as const };
  current.save(future, true);
  const session = storage();
  const next = new PreferenceStorage(() => session, () => persistent);
  expect(next.load(defaultPreferences()).value).toEqual(future);
  next.save(defaultPreferences(), false);
  expect(next.load(future).value).toEqual(defaultPreferences());
  expect(new PreferenceStorage(() => storage(), () => persistent).load(defaultPreferences()).value).toEqual(future);
});
it('odrzuca uszkodzony zapis i obsługuje zablokowaną pamięć', () => {
  expect(() => parsePreferences({ ...defaultPreferences(), textScale: 100 })).toThrow();
  expect(() => parsePreferences({ ...defaultPreferences(), unknown: true })).toThrow();
  const denied = new PreferenceStorage(() => { throw new Error('denied'); }, storage);
  expect(denied.load(defaultPreferences(true))).toEqual({ value: defaultPreferences(true), failed: true });
  expect(() => denied.save(defaultPreferences(), true)).toThrow('denied');
});
