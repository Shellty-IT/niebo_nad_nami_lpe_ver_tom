# P3 — weryfikacja E5–E6 i dostawców pozycji

Data: 04.10.2026. Implementacja lokalna i techniczna bramka G3.

| Sprawdzenie | Wynik |
|---|---|
| `npm run check` | Typy, przygotowanie danych z kontrolą SHA oraz walidatory JSON Schema zaliczone. |
| `npm test` | 554/554 testów jednostkowych. W tym niezależne próbki JPL pomiędzy węzłami Ceres/67P (<0,1′), księżyce Jowisza (<5′), fazy i spójność cyklu Z04, górowanie Z03, kontakty zaćmień w 12 miejscach i maksima względem NASA GSFC (<2 min). |
| `npm run build:local` | Zaliczone, obrazy działają offline. Ostrzeżenie Vite o dużych paczkach katalogu gwiazd, obrazów i renderera jest jawne. |
| `npm run build:zpe` / `verify:zpe` | Zaliczone; 3 pliki JS jako ES5/UTF-8 bez BOM. Próbka nie jest testem rzeczywistego ZPE. |
| `npm run test:e2e` | 17/17: E5, E6, katalog i wybór karty, Z03/Z04 po odświeżeniu, Z06, tabele semantyczne, klawiatura, axe A/AA, Worker/fallback, Canvas i utrata WebGL. Polecenie wykonuje oba buildy. |
| `git diff --check` | Bez błędów białych znaków. |

Testy modeli porównują wektory JPL z osobnych zapytań; lokalizacja, źródła, hashe i okresy są w [rejestrze](../../01-wsad/REJESTR_ZRODEL.md). Semantyczne tabele, opisy modeli, sterowanie i testy automatyczne spełniają lokalne kryterium G3. Próby czytników ekranowych i urządzeń docelowych, formalna recenzja astronomiczna/bezpieczeństwa, odbiór zdjęć według Z13 oraz integracja ZPE należą do oddzielnych odbiorów P5/P6. Granice modeli: [ADR 009](adr/009-p3-obserwacje-instrumenty.md).
