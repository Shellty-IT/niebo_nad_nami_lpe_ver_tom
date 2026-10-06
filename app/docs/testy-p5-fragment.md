# P5 — pierwszy fragment audytu technicznego

Data: 05.10.2026. Zakres: BL-26, wymagania A11Y-01, A11Y-03,
NFR-02 i NFR-04. Stan wejściowy: demonstracyjna beta P4, formalne G4 otwarte.

| Próba | Wynik | Granica dowodu |
|---|---|---|
| `npm test` | 564/564 testy jednostkowe | Obejmuje istniejące porównania astronomiczne, nie zastępuje recenzji MER/BL-25. |
| `npm run build:local` | Zaliczone, TypeScript strict i walidacja treści | Build lokalny. |
| `npm run build:zpe` | Zaliczone, kontrola ES5/UTF-8 trzech plików JS | Harness, bez rzeczywistego ZPE/LMS. |
| `npx playwright test` | 26/26 testów Chromium | Dwa nowe przypadki P5 oraz 24 wcześniejsze; brak próby na docelowych urządzeniach. |
| Przepływ responsywny P5 | E1–E8 × trzy poziomy × 320, 360, 768, 1024, 1366 i 1920 px; brak poziomego przewijania strony | Desktop Chromium z ustawioną szerokością okna; nie jest testem dotyku, iOS ani powiększenia 200%/400%. |
| Przewijanie tabeli | Tabela E3 w 320 px przewija się klawiszem po ustawieniu fokusa | Jedna próbka sterowania klawiaturą; nie jest audytem czytnika. |
| axe A/AA i sieć | Osiem pełnych scen: zero wykrytych naruszeń A/AA i zero automatycznych żądań poza `127.0.0.1` | Axe nie dowodzi pełnej zgodności WCAG/ATAG; lokalny serwer nadal dostarcza zasoby. Odsyłacze E8 wymagają świadomego otwarcia. |
| `git diff --check` | Bez błędów odstępów | Kontrola zmian źródłowych. |

Podczas audytu znaleziono poziome przewijanie całej strony przy tabeli gwiazd
E3 na 320 px. Tabele E4 miały taki sam układ bez własnego kontenera.
Dodano przewijane kontenery z fokusem do E3 i trzech tabel E4. Ten sam
mechanizm był już używany w innych częściach aplikacji. Odczyty i model
astronomiczny nie zostały zmienione.

**P5 trwa; G5 pozostaje otwarta.** Do BL-25 potrzebny jest podpisany przegląd
modeli, treści i bezpieczeństwa obserwacji przez eksperta. Do BL-26 nadal
potrzebne są rzeczywiste urządzenia i przeglądarki z zatwierdzonej macierzy,
NVDA/VoiceOver, dotyk, powiększenie, wszystkie warianty kontrastu, pomiar
60 FPS/pamięci oraz pełne przypadki dla każdej pozycji macierzy wymagań.
BL-27 wymaga lekcji pilotażowej z uczniami i nauczycielem, rejestru uwag,
poprawek i ponownego sprawdzenia. Bez tych wyników nie sporządza się
protokołu odbioru G5. Formalne zależności G4 pozostają w
[P4_POZOSTALO.md](P4_POZOSTALO.md).
