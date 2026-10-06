import { expect, it } from 'vitest';
import defaults from '../../.generated/probe.json';
import { createProbeStore } from '../../src/app/probe-store';
import { parseConfig } from '../../src/domain/probe';
import { reportCsv, reportJson, sessionReportRows } from '../../src/education/session-report';

it('raport E7 pokazuje rzeczywiste wyniki, wnioski i historię obserwacji', () => {
  const store = createProbeStore(parseConfig(defaults));
  store.setTaskNotes('Mars może zmienić kierunek', 'Sprawdzę położenie w kolejnych dniach');
  const observation = store.getState().observation;
  store.addObservationEntry({ instantUtc: observation.instantUtc, observer: observation.observer,
    objectId: 'Mars', azimuthDeg: 122, altitudeDeg: 30, phaseFraction: null, note: 'Pierwszy pomiar' });
  const rows = sessionReportRows(store.getState());
  expect(rows).toContainEqual({ section: 'Z02', item: 'Próby', value: '0' });
  expect(rows).toContainEqual({ section: 'Obserwacja 1', item: 'Notatka', value: 'Pierwszy pomiar' });
  const exported = JSON.parse(reportJson(store.getState()));
  expect(exported.contentVersion).toBe(store.getState().contentVersion);
  expect(exported.state.observationJournal).toHaveLength(1);
});

it('eksport CSV neutralizuje formuły i poprawnie cytuje znaki specjalne', () => {
  const csv = reportCsv([{ section: 'Uczeń', item: 'Notatka', value: '=HYPERLINK("x", "y")' },
    { section: 'Uczeń', item: 'Wniosek', value: '\t+SUM(1,2)\nnowa linia' }]);
  expect(csv).toContain('"\'=HYPERLINK(""x"", ""y"")"');
  expect(csv).toContain('"\'\t+SUM(1,2)\nnowa linia"');
  expect(csv.startsWith('\uFEFF')).toBe(true);
});
