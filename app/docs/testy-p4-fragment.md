# P4 — raport pierwszego fragmentu

Data: 04.10.2026. Zakres: E7, eksport raportu i lokalny zapis sesyjny/trwały.

| Sprawdzenie | Wynik |
|---|---|
| `npm run check` | TypeScript strict, schematy i przygotowanie danych: OK |
| `npm test -- --reporter=dot` | 558/558 testów jednostkowych; w tym raport, CSV i odmowa lokalnego zapisu preferencji |
| `npm run test:e2e`, następnie `npx playwright test` | 19/19 testów w Chromium; nowa karta odtwarza zapis IndexedDB, raport CSV się pobiera, powrót do trybu sesyjnego usuwa trwały zapis, odmowa IndexedDB pozostawia zapis sesyjny |
| `npm run build:local` | OK |
| `npm run build:zpe`, `npm run verify:zpe` | OK; 3 wynikowe pliki JS ES5/UTF-8. To nie dowodzi integracji z rzeczywistym ZPE |
| `git diff --check` | OK przed aktualizacją dokumentacji |

Nowe testy E7 sprawdzają, że raport odczytuje faktyczne notatki i historię, a
CSV neutralizuje komórki mogące zostać odczytane przez arkusz jako formuły.
Test przeglądarkowy sprawdza axe A/AA w E7, wybór trwałego zapisu, odtworzenie E7 w nowej
karcie i powrót do trybu sesyjnego. Wcześniejsze przepływy P1–P3 pozostają
zielone. Bramka G4 pozostaje otwarta z powodu zakresu opisanego w ADR 010.
