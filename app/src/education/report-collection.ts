import { parseState, type ProbeState } from '../domain/probe';
import { sessionReportRows } from './session-report';

export const MAX_REPORT_BYTES = 1_000_000;

export function parseSessionReport(raw: string): ProbeState {
  if (new TextEncoder().encode(raw).byteLength > MAX_REPORT_BYTES) throw new Error('report-too-large');
  const input = JSON.parse(raw) as unknown;
  if (!input || typeof input !== 'object') throw new Error('invalid-report');
  const report = input as Record<string, unknown>;
  if (report.reportVersion !== 2 || typeof report.sessionId !== 'string') throw new Error('invalid-report');
  const state = parseState(report.state);
  if (report.sessionId !== state.sessionId || report.lessonId !== state.lessonId ||
      report.contentVersion !== state.contentVersion) throw new Error('report-state-mismatch');
  return state;
}

export function reportKey(state: ProbeState): string { return `${state.sessionId}:${state.contentVersion}`; }

function csvCell(value: string): string {
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function collectionCsv(states: ProbeState[]): string {
  const header = ['Identyfikator sesji', 'Wersja treści', 'Sekcja', 'Pole', 'Wartość'];
  const lines = [header];
  for (const state of states) {
    for (const row of sessionReportRows(state)) lines.push([state.sessionId, state.contentVersion, row.section, row.item, row.value]);
  }
  return '\uFEFF' + lines.map((values) => values.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
