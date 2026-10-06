# Raport próby P0

Data: 03.10.2026. Zakres: szkielet BL-02 i część kontraktu BL-03. Środowisko Windows x64, runtime do skryptów Node 22.22.0, Chromium 153.0.8010.12 z Playwright 1.63.0. Zależności: package-lock.json. Systemowy Node 24.12.0 pozostawiono bez zmian.

| Sprawdzenie | Wynik / granica dowodu |
|---|---|
| TypeScript strict + przygotowanie konfiguracji | Zaliczone; schemat oraz poprawność chwili UTC i strefy |
| Vitest | 7/7 zaliczone: obcy/uszkodzony stan, data/strefa, atomowe przywrócenie, zamrożenie, izolacja, UTC na granicy DST, stan podczas init i destroy przed końcem ładowania |
| Build lokalny Vite | Zaliczone; statyczny HTML/CSS/JS, brak zależności od usług runtime |
| Build ZPE Rollup/Babel/Terser/PostCSS | Zaliczone; osobne fabryki silnika i edytora AMD |
| Acorn ES5 + kodowanie | Zaliczone: 2 pliki JS, tekst UTF-8 bez BOM; nie jest to dowód obsługi API starszych przeglądarek |
| Playwright, lokalny build | Zaliczone: zapis/odświeżenie, zachowanie UTC przy zmianie strefy, błędna data nie nadpisuje stanu, zero zewnętrznych żądań przy blokowaniu zewnętrznych domen |
| Playwright, dwie instancje AMD | Zaliczone: niezależne stany, odtworzenie, zamrożenie bez zapisu, fabryka edytora i konfiguracja, delegowanie pełnego ekranu, CSS przez host, destroy jednej instancji zachowuje drugą, brak nowych globali |
| Playwright, klawiatura i 320 px | Zaliczone: formularz dostępny klawiaturą, brak poziomego overflow; axe A/AA nie zgłasza naruszeń dla tego lokalnego widoku |
| Playwright, odmowa zapisu | Zaliczone: widoczny komunikat i działający stan w pamięci |
| Czysta instalacja z lockfile | Zaliczone: świeży eksport indeksu Git do ignorowanego `app/.verification/clean-p0`, bez node_modules/.generated/dist; `npm ci` (207 pakietów), 7/7 testów jednostkowych, oba buildy i 4/4 E2E, kod wyjścia 0 na Node 22.22.0 |
| Kontrola wizualna | Obejrzany zrzut lokalnego podglądu 1100×950; formularz i komunikaty czytelne, bez ucięć |
| Konfiguracja GitHub Actions | Przygotowana; nie uruchamiano zdalnego CI ani nie publikowano repozytorium |

W trakcie pracy znaleziono i poprawiono: brak pluginu JSON w Rollup; pomocniczy import CommonJS z wygenerowanej walidacji długości tekstu; helpery Babel emitowane przed `define` i naruszające izolację. Walidatory dla ASCII identyfikatorów IANA używają ograniczonego wzorca, a build odrzuca nieobsłużone `require`. Wynik ZPE jest zamknięty w IIFE. Testowy loader obsługuje oba dozwolone zapisy AMD. Selektory testowe korzystają z semantycznej roli combobox. Usunięto też zawieszanie zamykania procesu serwera testowego na Windows: globalSetup uruchamia Vite w procesie i zwraca jawne `server.close()`. Końcowy pełny przebieg kończy się kodem 0.

Nie wykonano: prawdziwego odbioru ZPE i raportów LMS, rzeczywistego pełnego ekranu platformy (test sprawdza delegowanie do API), klawiatury ekranowej ZPE, Edge 94/Safari/iOS i starszych konfiguracji, NVDA/VoiceOver, audytu pełnych przepływów WCAG/ATAG, obliczeń astronomicznych, Workera, WebGL/Canvas, utraty kontekstu, pomiarów FPS/pamięci oraz weryfikacji mediów. Test DST obejmuje zachowanie istniejącej chwili UTC; nie obejmuje przyszłego wprowadzania niejednoznacznej lokalnej godziny.

Paczki pozostają prototypem. Powtarzane buildy nie usuwają wcześniejszych plików wyjściowych (`emptyOutDir: false`); do przekazania należy budować w świeżym katalogu. Produkcyjne pakowanie i czyszczenie artefaktów należą do późniejszych prac wydaniowych.
