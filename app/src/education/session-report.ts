import type { ProbeState } from '../domain/probe';
import { questionById, testQuestions } from './question-bank';

export interface ReportRow { section: string; item: string; value: string }

export function sessionReportRows(state: ProbeState): ReportRow[] {
  const rows: ReportRow[] = [
    { section: 'Materiał', item: 'Identyfikator', value: state.lessonId },
    { section: 'Materiał', item: 'Wersja treści', value: state.contentVersion },
    { section: 'Sesja', item: 'Identyfikator sesji', value: state.sessionId },
    { section: 'Sesja', item: 'Ostatnia scena', value: state.sceneId },
    { section: 'Sesja', item: 'Poziom', value: state.level },
    { section: 'Z01', item: 'Próby', value: String(state.taskAttempts.filter((attempt) => attempt.taskId === 'Z01').length) },
    { section: 'Z01', item: 'Ukończono', value: state.taskAttempts.some((attempt) => attempt.taskId === 'Z01' && attempt.correct) ? 'tak' : 'nie' },
    { section: 'Orion', item: 'Próby', value: String(state.taskAttempts.filter((attempt) => attempt.taskId === 'Orion').length) },
    { section: 'Orion', item: 'Ukończono', value: state.taskAttempts.some((attempt) => attempt.taskId === 'Orion' && attempt.correct) ? 'tak' : 'nie' },
    { section: 'Planety nad horyzontem', item: 'Próby', value: String(state.taskAttempts.filter((attempt) => attempt.taskId === 'VisiblePlanets').length) },
    { section: 'Planety nad horyzontem', item: 'Ukończono', value: state.taskAttempts.some((attempt) => attempt.taskId === 'VisiblePlanets' && attempt.correct) ? 'tak' : 'nie' },
    { section: 'Z02', item: 'Ukończono', value: state.coordinateTask.completedAtUtc ?? 'nie' },
    { section: 'Z02', item: 'Próby', value: String(state.coordinateTask.attempts) },
    { section: 'Z02', item: 'Najlepsza odległość kątowa (°)', value: state.coordinateTask.bestSeparationDeg?.toFixed(2) ?? '' },
    { section: 'Z02', item: 'Hipoteza', value: state.coordinateTask.hypothesis },
    { section: 'Z02', item: 'Wniosek', value: state.coordinateTask.conclusion },
    { section: 'Z03', item: 'Pomiary drogi Słońca', value: String(state.p3Tasks.sunRecords.length) },
    { section: 'Z03', item: 'Wniosek', value: state.p3Tasks.sunConclusion },
    { section: 'Z04', item: 'Pomiary faz Księżyca', value: String(state.p3Tasks.moonRecords.length) },
    { section: 'Z04', item: 'Wniosek', value: state.p3Tasks.moonConclusion },
    { section: 'Z06', item: 'Powiększenie', value: state.p3Tasks.telescope?.magnification.toFixed(1) ?? '' },
    { section: 'Z06', item: 'Pole widzenia (°)', value: state.p3Tasks.telescope?.fieldDeg.toFixed(2) ?? '' },
    { section: 'Z06', item: 'Wniosek', value: state.p3Tasks.telescope?.conclusion ?? '' },
    { section: 'Historia', item: 'Liczba miejsc', value: String(state.locationHistory.length) },
    { section: 'Historia', item: 'Liczba obserwacji', value: String(state.observationJournal.length) },
  ];
  const latest = new Map(state.assessment.answers.map((answer) => [answer.questionId, answer]));
  const selected = testQuestions(state.level);
  rows.push(
    { section: 'Test', item: 'Pytania z odpowiedzią', value: `${selected.filter((question) => latest.has(question.id)).length}/${selected.length}` },
    { section: 'Test', item: 'Ostatnie odpowiedzi poprawne', value: `${selected.filter((question) => latest.get(question.id)?.correct).length}/${selected.length}` },
  );
  for (const [questionId, answer] of latest) {
    const question = questionById(questionId);
    rows.push(
      { section: questionId, item: 'Cel', value: question?.objective ?? 'Pytanie nauczyciela' },
      { section: questionId, item: 'Ostatnia odpowiedź', value: question?.choices[answer.choiceIndex] ?? `Wariant ${answer.choiceIndex + 1}` },
      { section: questionId, item: 'Poprawność', value: answer.correct ? 'poprawna' : 'błędna' },
      { section: questionId, item: 'Liczba prób', value: String(state.assessment.answers.filter((item) => item.questionId === questionId).length) },
    );
  }
  for (const [index, attempt] of state.taskAttempts.entries()) {
    rows.push(
      { section: attempt.taskId, item: `Próba ${index + 1}: wynik`, value: attempt.correct ? 'poprawna' : 'błędna' },
      { section: attempt.taskId, item: `Próba ${index + 1}: wybór`, value: attempt.planetIds?.join(', ') ?? attempt.objectId ?? attempt.constellationId ?? (attempt.azimuthDeg === null ? '' : `azymut ${attempt.azimuthDeg.toFixed(2)}°, wysokość ${attempt.altitudeDeg?.toFixed(2)}°, odległość ${attempt.separationDeg?.toFixed(2)}°`) },
    );
  }
  state.observationJournal.forEach((entry, index) => {
    const section = `Obserwacja ${index + 1}`;
    rows.push(
      { section, item: 'Chwila UTC', value: entry.instantUtc },
      { section, item: 'Obiekt', value: entry.objectId },
      { section, item: 'Azymut (°)', value: entry.azimuthDeg.toFixed(2) },
      { section, item: 'Wysokość (°)', value: entry.altitudeDeg.toFixed(2) },
      { section, item: 'Notatka', value: entry.note },
    );
  });
  return rows;
}

function csvCell(value: string): string {
  // Cytowanie CSV samo nie chroni przed uruchomieniem formuły w arkuszu.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function reportCsv(rows: ReportRow[]): string {
  return '\uFEFF' + [['Sekcja', 'Pole', 'Wartość'], ...rows.map((row) => [row.section, row.item, row.value])]
    .map((cells) => cells.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function reportJson(state: ProbeState): string {
  return JSON.stringify({ reportVersion: 2, sessionId: state.sessionId, lessonId: state.lessonId, contentVersion: state.contentVersion,
    rows: sessionReportRows(state), state }, null, 2) + '\n';
}
