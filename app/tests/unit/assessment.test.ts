import { expect, it } from 'vitest';
import defaults from '../../.generated/probe.json';
import questionsData from '../../.generated/questions.json';
import { createProbeStore } from '../../src/app/probe-store';
import { parseConfig, parseState } from '../../src/domain/probe';
import { displayedChoices, questionById, testQuestions } from '../../src/education/question-bank';
import { parseSessionReport, reportKey, collectionCsv } from '../../src/education/report-collection';
import { reportJson } from '../../src/education/session-report';

it('bank zawiera 40 unikatowych pytań, a test każdego poziomu obejmuje E1–E6', () => {
  expect(questionsData.questions).toHaveLength(40);
  expect(new Set(questionsData.questions.map((question) => question.id)).size).toBe(40);
  for (const level of ['basic', 'extended', 'expert'] as const) {
    const selected = testQuestions(level);
    expect(selected).toHaveLength(12);
    expect(new Set(selected.map((question) => question.sceneId)).size).toBe(6);
    expect(selected.every((question) => level === 'expert' || question.level !== 'expert')).toBe(true);
  }
  expect(testQuestions('extended').some((question) => question.level === 'extended')).toBe(true);
  expect(testQuestions('expert').some((question) => question.level === 'expert')).toBe(true);
});

it('odpowiedzi mają ponowne próby, klucz, migrację v6 i ochronę przed fałszywym wynikiem', () => {
  const { lesson: _lesson, ...legacyConfig } = defaults;
  expect(parseConfig({ ...legacyConfig, contentVersion: '0.1.0' }).contentVersion).toBe('0.3.0');
  const store = createProbeStore(parseConfig(defaults));
  const question = questionById('Q01')!;
  expect(displayedChoices(question).map((choice) => choice.originalIndex).sort()).toEqual([0, 1, 2]);
  expect(store.answerQuestion('Q01', 1)?.correct).toBe(false);
  expect(store.answerQuestion('Q01', 0)?.correct).toBe(true);
  expect(store.answerQuestion('Q05', 0)?.correct).toBe(true);
  const state = store.getState();
  expect(state.assessment.answers).toHaveLength(3);
  expect(reportJson(state)).toContain('"section": "Q05"');
  expect(() => parseState({ ...state, assessment: { answers: [{ ...state.assessment.answers[0], correct: true }] } })).toThrow('invalid-assessment');
  const { assessment: _assessment, sessionId: _sessionId, ...v6 } = state;
  const migrated = parseState({ ...v6, schemaVersion: 6, contentVersion: '0.1.0' });
  expect(migrated.schemaVersion).toBe(8);
  expect(migrated.contentVersion).toBe('0.3.0');
  expect(migrated.assessment.answers).toEqual([]);
  expect(migrated.sessionId).toMatch(/^[0-9a-f]{32}$/);
});

it('raporty nauczyciela sprawdzają spójność, deduplikują sesję i neutralizują CSV', () => {
  const store = createProbeStore(parseConfig(defaults));
  store.setTaskNotes('=SUM(1,2)', 'Wniosek');
  const parsed = parseSessionReport(reportJson(store.getState()));
  expect(parsed.sessionId).toBe(store.getState().sessionId);
  expect(reportKey(parsed)).toBe(reportKey(store.getState()));
  expect(collectionCsv([parsed])).toContain('"\'=SUM(1,2)"');
  const forged = JSON.parse(reportJson(store.getState())); forged.sessionId = 'a'.repeat(32);
  expect(() => parseSessionReport(JSON.stringify(forged))).toThrow('report-state-mismatch');
});
