# P4 — weryfikacja kontynuacji

Data: 04.10.2026. Zakres: test E7, słownik, E8 i lokalny raport nauczyciela.

| Sprawdzenie | Wynik |
|---|---|
| `npm run check` | Walidacja danych/schematów i TypeScript strict: OK |
| `npm test -- --reporter=dot` | 561/561 testów jednostkowych; bank 40 pytań, poziomy, migracja v6→v7, poprawność prób, spójność raportu i zabezpieczenie CSV |
| `npm run build:local` | OK; `teacher.html` w paczce lokalnej |
| `npm run build:zpe` w `npm run test:e2e` | OK; wynikowy JS sprawdzony jako ES5/UTF-8. Nadal tylko próbny host obserwatorium |
| `npx playwright test` po poprawce kontrastu | 20/20 testów Chromium; E7, słownik, E8, import/deduplikacja i CSV nauczyciela oraz wcześniejsze przepływy P1–P3 |
| axe-core A/AA | W E7, E8 i stronie nauczyciela bez automatycznie wykrytych naruszeń; audyt czytników i urządzeń nadal potrzebny |

W pierwszym pełnym przebiegu 19/20 testów przeszło: nowy odsyłacz do strony
nauczyciela miał zbyt niski kontrast w trybie wysokiego kontrastu. Kolor linku
powiązano z tokenem motywu i ponowiono pełne 20/20 testów. Wynik axe nie jest
pełnym potwierdzeniem WCAG ani ATAG.

Po podniesieniu `contentVersion` z 0.1.0 do 0.2.0 testy obejmują migrację
starej konfiguracji i sesji bez utraty wcześniejszych pomiarów. Klucz
sessionStorage zachowano dla odczytu zapisów z poprzedniej wersji.
W tym przebiegu wykryto też, że próbny edytor ZPE inicjalizował stan numerem
schematu konfiguracji. Poprawiono inicjalizację przez `initialState(config)`;
ponowny pełny przebieg zakończył się wynikiem 20/20, w tym testem AMD
edytora i zamrożenia stanu.

Granice funkcjonalne i decyzje: [ADR 011](adr/011-p4-test-slownik-zasoby.md).
