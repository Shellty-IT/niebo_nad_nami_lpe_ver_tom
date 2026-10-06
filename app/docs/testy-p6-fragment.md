# P6 — przygotowanie lokalnej paczki demonstracyjnej

Data: 05.10.2026. Zakres: techniczny fragment BL-28 (NFR-01, NFR-02,
DEL-02). Wejście: demonstracyjna beta P4; G4 i G5 pozostają otwarte.

| Próba | Wynik | Granica dowodu |
|---|---|---|
| `npm run build:demo` | Zaliczone: walidacja treści, TypeScript strict, build lokalny i kopiowanie launchera | Uruchomiono na obecnym stanowisku z istniejącymi zależnościami, bez czystej instalacji. |
| `npm run verify:demo` | SHA-256 i rozmiar zgodne dla 372 plików, brak plików spoza manifestu | Manifest opisuje bieżący `dist/local`; nie jest podpisem ani dowodem praw do materiałów. |
| Serwer paczki | `HEAD /` i `/teacher.html`: 200; lokalne MP3: 200 `audio/mpeg`; brakujące MP3: 404 | Próba HTTP na 127.0.0.1, bez pełnego przebiegu ucznia i bez odcięcia internetu. |
| `git diff --check` | Bez błędów odstępów | Kontrola źródeł. |

Naprawiono obsługę MP3 w dołączonym serwerze. Dodano typy MP4 i WebVTT dla
profili mediów przewidzianych planem. Instrukcja paczki opisuje obecny zakres
E1–E8, nagrania próbne, stronę nauczyciela i opcjonalne linki E8.1.
`PACZKA_SHA256.json` zapisuje wersję, czas UTC, ścieżki, rozmiary i sumy.

**P6 rozpoczęta technicznie, G6 otwarta.** Vite ma `emptyOutDir: false`, więc
istniejący katalog `dist/local` może zawierać pliki z poprzednich buildów;
manifest obejmuje także je. Przed przekazaniem wydania trzeba zbudować i
sprawdzić paczkę w świeżym katalogu, wykonać pełny test offline scen,
zapis/odtworzenie, zasoby i raport, przygotować ZIP ze źródłami, lockfile,
licencjami i raportami oraz sprawdzić sumy archiwum. Brak zatwierdzonych
materiałów, recenzji MER/LID, pilotażu, pomiarów urządzeń i próby w docelowym
ZPE/LMS uniemożliwia formalne zamknięcie BL-27, BL-28 i G6. Właściciel
minimum 12 miesięcy wsparcia, procesu aktualizacji i migracji stanu nie został
organizacyjnie wskazany.
