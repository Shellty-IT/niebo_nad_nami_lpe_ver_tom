# P2 — pierwszy fragment E2 / Z02

Data: 03.10.2026. To dowód częściowy, nie protokół odbioru G2.

| Sprawdzenie | Wynik |
|---|---|
| `npm test` | 422/422 testy jednostkowe, w tym geometria Z02, migracja v4→v5, zapis i zamrożenie; 360 referencji JPL bez zmian |
| `npm run build:local` | Zaliczone; ostrzeżenie Vite o paczce renderera >500 kB pozostaje |
| `npm run build:zpe` i `npm run verify:zpe` | Zaliczone; 3 wynikowe pliki JS przechodzą sprawdzenie ES5/UTF-8 |
| `npx playwright test tests/e2e/probe.spec.ts` | 13/13; nowe Z02 obejmuje próbę, trafienie przyciskami, raport, odświeżenie i przywrócenie kamery |
| `git diff --check` | Bez błędów białych znaków |

Pokrycie częściowe: EDU-04, LEARN-01, SIM-06, SAVE-01. G2 nadal wymaga katalogów, E1–E4, zweryfikowanego pełnego modelu, pierwszego kompletnego zadania w rozumieniu scenariusza i właściwego raportu sesji. Lokalny harness ZPE potwierdza kompatybilność techniczną fragmentu, nie działanie na docelowej platformie.

## 04.10.2026 — obserwatorium i E1–E4

| Sprawdzenie | Wynik |
|---|---|
| `npm test` | **539/539** testów. 450 próbek NASA/JPL Horizons dla Słońca, Księżyca i siedmiu planet; maksymalna separacja 1,432761′ RA/Dec i 1,703333′ azymut/wysokość. 54 testy integralności surowych odpowiedzi JPL. |
| Katalog | 8871 gwiazd HIP, 24 obszary RA, 88 nazw IAU, 5 figur i 5 granic. Import odrzuca zmienione SHA-256; testy identyfikatorów, transformacji współrzędnych i ruchu własnego. |
| `npm run build:local` | Zaliczone; paczka zawiera przetworzony katalog i informacje o licencjach. Ostrzeżenie Vite o katalogu 1,45 MB i rendererze 546 kB zapisane jako koszt pobrania/ładowania. |
| `npx playwright test tests/e2e/probe.spec.ts` | **14/14**. Sceny E1–E4, obiekt i gwiazda z listy oraz przywrócenie jej po odświeżeniu, filtry, warstwy, przeciąganie, Z02 z hipotezą/odczytem/wnioskiem, zapis, klawiatura, 320 px i axe A/AA dla próbki. |
| `node tools/measure-p2.mjs` | [Pomiar Chromium headless](performance/p2-headless.json): 8871 punktów HIP; WebGL2 60,00 FPS, P95 CPU render 0,4 ms; Canvas 60,00 FPS, P95 3,4 ms; okno 776×410, DPR 1. Pomiar nie określa pamięci GPU ani wydajności na słabym urządzeniu. |
| `npm run build:zpe` / `verify:zpe` | Silnik, edytor, Worker: ES5/UTF-8 bez BOM; testowy host AMD. Integracja z rzeczywistym ZPE pozostaje zewnętrzną zależnością. |
| `git diff --check` | Bez błędów białych znaków. |

**Techniczne kryterium G2** (zweryfikowane pozycje oraz pierwsze kompletne zadanie z odczytami i raportem) jest spełnione w lokalnej paczce. Odbiór astronomiczny/dydaktyczny, decyzja licencyjna o danych ESA i Stellarium, test rzeczywistego ZPE oraz słabszego urządzenia nie zostały zastąpione automatycznym wynikiem. Bank zadań, raport CSV/druk/LMS i pozostałe typy obiektów są w P3/P4 według harmonogramu.
