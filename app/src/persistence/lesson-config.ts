import { parseConfig, type ProbeConfig } from '../domain/probe';

export const LESSON_CONFIG_KEY = 'nnb:lesson-config:v1';
export const MAX_LESSON_CONFIG_BYTES = 200_000;

export function parseLessonConfigJson(raw: string): ProbeConfig {
  if (new TextEncoder().encode(raw).byteLength > MAX_LESSON_CONFIG_BYTES) throw new Error('lesson-too-large');
  return parseConfig(JSON.parse(raw) as unknown);
}

export function loadLessonConfig(defaults: ProbeConfig, storage: Pick<Storage, 'getItem'>): ProbeConfig {
  const raw = storage.getItem(LESSON_CONFIG_KEY);
  return raw ? parseLessonConfigJson(raw) : parseConfig(defaults);
}
