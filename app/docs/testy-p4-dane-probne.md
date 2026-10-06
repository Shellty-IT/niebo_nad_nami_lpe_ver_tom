# P4 — weryfikacja danych próbnych

Data: 05.10.2026.

| Sprawdzenie | Wynik |
|---|---|
| `npm run check` | Poprawna walidacja 8 × 3 tekstów, 24 nagrań, sum SHA-256 i TypeScript strict |
| `npm test` | 564/564 testy jednostkowe |
| `npm run build:local` | Pakiet lokalny z narracją zbudowany |
| `npm run build:zpe` | Próbny silnik AMD/ES5 z narracją zbudowany; `verify:zpe` poprawny |
| `npx playwright test` | 24/24 testy Chromium; poziomy i pliki w obu hostach, nawigacja klawiaturą i axe A/AA |
| `ffprobe` | Próbka MP3: mono, 48 kHz, 128 kb/s |
| `git diff --check` | Bez błędów odstępów |

Testy potwierdzają działanie lokalne i w harnessie ZPE. Nie są próbą w
rzeczywistym LMS ani odbiorem praw, treści, głosu czy logo.
