# P4 — edytor, zadania, E8.1 i pełna lekcja w hoście testowym ZPE

Stan 05.10.2026. Zakres i ograniczenia aktualnej implementacji; nie jest to
deklaracja ukończenia bramki G4 ani certyfikat docelowej platformy.

## Zaimplementowane

- Z01 „Gdzie jest Mars?”, rozpoznanie Oriona i wybór planet nad horyzontem
  mają podpowiedzi, powtórki, wyniki oraz zapis w stanie i raporcie. Dla
  Warszawy 16.01.2025 20:00 UTC wysokości z Astronomy Engine wskazują Marsa,
  Jowisza, Urana i Neptuna. Zadanie nie utożsamia tej geometrii z obserwacją
  gołym okiem.
- Edytor `teacher.html` i zakładka ZPE używają jednego modelu konfiguracji:
  sceny/kolejność, poziomy, warstwy, widoczne obiekty, początkowa obserwacja,
  daty, pytania i zadania E2. Import/eksport JSON ma walidację; interfejs
  ucznia respektuje te ustawienia.
- Domyślna konfiguracja przekazywana do ZPE zawiera pełne E1–E8. Starsza
  konfiguracja bez pola `lesson` nadal obsługuje dotychczasowy wariant
  obserwatorium. Manifest deklaruje drukowanie, a walidację LMS zostawia jako
  `none` do ustalenia reguły zaliczenia. Stan v8 i `contentVersion: 0.3.0`
  mają migracje z v6/v7.
- E8.1 pokazuje trzy polskojęzyczne odsyłacze YouTube bez lokalnych kopii;
  aplikacja oznacza je jako wymagające internetu.

## Weryfikacja

| Przebieg | Wynik |
|---|---|
| `npm run check` | Poprawna konfiguracja, generowanie treści i TypeScript strict |
| `npm test -- --reporter=dot` | 564/564 testy jednostkowe; migracje, walidacja edytora, zadania i efemerydy |
| `npm run build:local`, `npm run build:zpe`, `npm run verify:zpe` | Build lokalny i AMD; pełny JS ZPE przechodzi kontrolę ES5 oraz UTF-8 |
| `npm run test:e2e` | 23/23 testy Chromium po zmianie domyślnej konfiguracji |
| `git diff --check` | Bez błędów odstępów |

Testy przeglądarkowe obejmują import pliku nauczyciela, zastosowanie scen i
obiektów, własne pytanie i zadanie, zapis Z01 i planet, raport, pełny silnik
ZPE w lokalnym hoście, edytor i zamrożenie stanu. Istniejące próby axe A/AA
obejmują E7, E8 i stronę nauczyciela; szeroki audyt został odłożony na prośbę
użytkownika.

## Otwarte warunki G4

Docelowa liczba dalszych zadań i recenzja treści wymagają decyzji MER/LID.
Narracja, odpowiedniki dostępnościowe dla tworzonych mediów i oznaczenia ORE
nie zostały dostarczone. Rzeczywisty LMS/ZPE wymaga dostępu integratora;
lokalny harness nie może potwierdzić raportu klasy. Zakres odbiorów
urządzeń/ATAG pozostaje odłożony. Szczegółowe działania są w
`app/docs/P4_POZOSTALO.md`.
