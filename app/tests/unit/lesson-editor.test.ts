import { expect, it } from 'vitest';
import defaults from '../../.generated/probe.json';
import resources from '../../.generated/resources.json';
import { createProbeStore } from '../../src/app/probe-store';
import { parseConfig, parseState, PLANET_IDS, VISIBLE_PLANETS_2025 } from '../../src/domain/probe';
import { lessonSettings } from '../../src/domain/lesson-settings';
import { parseLessonConfigJson } from '../../src/persistence/lesson-config';
import { reportJson } from '../../src/education/session-report';
import { parseSessionReport } from '../../src/education/report-collection';
import { Body, Equator, Horizon, Observer } from 'astronomy-engine';

it('E8 ma sprawdzone zewnętrzne linki YouTube do polskojęzycznych filmów', () => {
  const films = resources.resources.filter((item) => item.group === 'film');
  expect(films).toHaveLength(3);
  expect(films.every((item) => !item.offline && /^https:\/\/www\.youtube\.com\/watch\?v=/.test(item.url ?? ''))).toBe(true);
});

it('planety nad horyzontem mają powtarzalne kryterium i zapisywane próby', () => {
  const instant = new Date('2025-01-16T20:00:00.000Z');
  const observer = new Observer(52.2297, 21.0122, 100);
  const above = PLANET_IDS.filter((id) => {
    const equator = Equator(Body[id], instant, observer, true, true);
    return Horizon(instant, observer, equator.ra, equator.dec).altitude > 0;
  });
  expect(above).toEqual(VISIBLE_PLANETS_2025);
  const store = createProbeStore(parseConfig(defaults));
  expect(store.startVisiblePlanetsTask()).toBe(true);
  expect(store.checkVisiblePlanetsTask(['Mars'])?.correct).toBe(false);
  expect(store.checkVisiblePlanetsTask(above)?.correct).toBe(true);
  expect(parseSessionReport(reportJson(store.getState())).taskAttempts).toHaveLength(2);
  const forged = store.getState(); forged.taskAttempts[1]!.correct = false;
  expect(() => parseState(forged)).toThrow('invalid-task-attempts');
});

it('konfiguracja nauczyciela działa jako ten sam walidowany plik dla aplikacji i ZPE', () => {
  const base = parseConfig(defaults);
  expect(base.lesson?.sceneOrder).toHaveLength(8);
  const lesson = lessonSettings(base);
  lesson.sceneOrder = ['E2', 'E7']; lesson.levels = ['basic']; lesson.defaultLevel = 'basic';
  lesson.visibleObjects = ['Moon', 'Mars'];
  lesson.questions = [{ id: 'TQ01', sceneId: 'E2', level: 'basic', stem: 'Który obiekt?',
    choices: ['Mars', 'Księżyc', 'Słońce'], correctIndex: 0, hint: 'Sprawdź mapę.', explanation: 'To Mars.' }];
  lesson.tasks = [{ id: 'TZ01', sceneId: 'E2', kind: 'object', title: 'Wskaż Marsa',
    instruction: 'Wybierz Marsa.', hint: 'Użyj listy.', targetObjectId: 'Mars',
    azimuthDeg: null, altitudeDeg: null, toleranceDeg: null }];
  const config = parseConfig({ ...base, initialObservation: { ...base.initialObservation,
    instantUtc: '2025-01-16T20:00:00.000Z', objectId: 'Moon' }, lesson });
  expect(parseLessonConfigJson(JSON.stringify(config))).toEqual(config);
  expect(() => parseConfig({ ...config, lesson: { ...lesson, visibleObjects: ['Moon'] } })).toThrow('invalid-lesson');
  expect(() => parseConfig({ ...config, lesson: { ...lesson, dateFromUtc: '2101-01-01T00:00:00.000Z' } })).toThrow('invalid-lesson');
  expect(() => parseConfig({ ...config, lesson: { ...lesson, dateFromUtc: '2025-02-30T00:00:00.000Z' } })).toThrow('invalid-lesson');
  expect(() => parseConfig({ ...config, lesson: { ...lesson, visibleObjects: ['Moon', 'Mars', 'Sun'],
    tasks: [{ ...lesson.tasks[0], targetObjectId: 'Sun' }] } })).toThrow('invalid-lesson');

  const store = createProbeStore(config);
  expect(store.startMarsTask()).toBe(true);
  expect(store.selectObject('Mars')).toBe(true);
  expect(store.checkPracticalTask('Z01')?.correct).toBe(true);
  expect(store.checkPracticalTask('TZ01')?.correct).toBe(true);
  expect(store.answerQuestion('TQ01', 0)?.correct).toBe(true);
  const orion = createProbeStore(base); orion.navigate('E3');
  expect(orion.checkOrionTask('Ori')?.correct).toBe(true);
  const state = parseState(store.getState());
  expect(parseSessionReport(reportJson(state)).taskAttempts).toHaveLength(2);
  const { taskAttempts: _attempts, ...oldState } = state;
  const migrated = parseState({ ...oldState, schemaVersion: 7, contentVersion: '0.2.0' });
  expect(migrated.schemaVersion).toBe(8);
  expect(migrated.taskAttempts).toEqual([]);
  expect(migrated.assessment.answers).toEqual(state.assessment.answers);
  const earlier = createProbeStore(base);
  earlier.navigate('E3'); earlier.setLevel('expert'); earlier.selectObject('Sun'); earlier.answerQuestion('Q01', 0);
  store.restore(earlier.getState());
  const adapted = store.getState();
  expect(adapted.sceneId).toBe('E2');
  expect(adapted.level).toBe('basic');
  expect(adapted.observation.objectId).toBe('Moon');
  expect(adapted.assessment.answers).toHaveLength(1);
});
