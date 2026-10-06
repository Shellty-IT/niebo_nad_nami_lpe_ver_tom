# Niebo nad nami - silnik i instancja LPE

To repozytorium jest samodzielnym źródłem scenariusza **„Niebo nad nami”**
przygotowanym do budowy jako własny komponent interaktywny LPE. Zawiera pełną
aplikację E1-E8, adapter platformy, edytor nauczyciela, zasoby lokalne, testy
oraz proces wydania wzorowany na działającym silniku VII.02 z repozytorium
`lpe-edu-pl/emateria-y`.

Identyfikator silnika ustawiono w [`lpe/config.json`](lpe/config.json) na
`aplikacje_obszar_7._lpe/niebo_nad_nami`. Przed pierwszym wgraniem administrator
LPE musi zarezerwować dokładnie tę nazwę albo wpisać do pliku nazwę faktycznie
zarezerwowaną. Jest to jedyny parametr zależny od administracji platformy.

## Szybkie przygotowanie wydania LPE

Wymagany jest Node.js 22.22.0 (co najmniej 22.12, wyłącznie linia 22).

```powershell
npm run setup
npm run release
```

Polecenie `release` waliduje treści, kompiluje pełny JavaScript do AMD/ES5,
minifikuje kod, izoluje CSS od motywu platformy, kopiuje zasoby offline,
buduje repozytorium silnika i paczkę instancji, a następnie sprawdza UTF-8 bez
BOM, składnię ES5, punkty AMD, selektory CSS, manifest i sumy SHA-256.

Wyniki:

- `build/repo/` - dokładna zawartość repozytorium silnika LPE;
- `build/instance/manifest.json` - jawna zawartość przykładowej instancji;
- `build/artifacts/niebo-nad-nami-silnik-lpe.zip` - paczka repozytorium silnika;
- `build/artifacts/niebo-nad-nami-instancja-lpe.zip` - ZIP instancji z
  `manifest.json` w korzeniu;
- `build/artifacts/SHA256SUMS.json` - rozmiary i sumy obu archiwów.

`build/repo/` należy skopiować do repozytorium utworzonego przez LPE i wypchnąć
zgodnie z procedurą administratora. Instancję można utworzyć z edytora
komponentu albo wgrać przygotowany ZIP. Sam skrypt niczego nie publikuje i nie
używa danych logowania.

## Kontrakt platformy

- `engine.json` wskazuje `dist/entry.js` oraz `dist/editor.js`;
- oba punkty wejścia są modułami AMD, a wszystkie dostarczane pliki JS są ES5;
- silnik implementuje `init`, `destroy`, `setState`, `getState` i
  `setStateFrozen` oraz wywołuje `api.triggerStateSave()` po zmianach;
- style są ładowane przez `api.loadCss(api.enginePath(...))`, wszystkie zasoby
  przez `api.enginePath()`, a grafika, Worker i 24 nagrania są lokalne;
- DOM i style są izolowane prefiksem `.nnb`; komponent obsługuje wiele instancji,
  trzy tryby kontrastu, WebGL z wariantem Canvas, druk i pełny ekran przez API;
- dane konfiguracji i przywracany stan są walidowane przed użyciem.

Pełny zestaw kontroli projektu:

```powershell
npm run check
npm test
npm run test:e2e
```

Testy przeglądarkowe wymagają zainstalowanego Chromium Playwright
(`npx --prefix app playwright install chromium`). Próba w lokalnym hoście nie
zastępuje końcowego testu na rzeczywistym koncie LPE/LMS.

## Stan produktu

Stan na 5 października 2026: **etapy P1–P3 i lokalne bramki techniczne G1–G3 ukończone**. Implementacja demonstracyjnej bety P4 działa lokalnie i w próbnym hoście ZPE: E1–E8, edytor nauczyciela, zadania, raporty, trzy poziomy tekstów, przykładowa narracja oraz linki do polskojęzycznych filmów E8.1. Rozpoczęto techniczny audyt P5 i przygotowanie paczki P6. **Formalne bramki G4–G6 pozostają otwarte** do odbiorów eksperckich, prób na urządzeniach, pilotażu oraz próby w rzeczywistym ZPE/LMS.

## Uruchomienie

Wymagany Node.js **22.22.0**, zgodnie z `app/.node-version` (linia 22, minimum 22.12 z planu). Pierwsza instalacja zależności wymaga internetu lub cache npm.

```powershell
cd app
npm ci
npm run dev
```

Podgląd otwiera się na `http://127.0.0.1:5173`. W tym środowisku systemowy Node ma wersję 24.12.0; na potrzeby weryfikacji użyto osobno Node 22.22.0 bez zmiany instalacji systemowej. Nie należy otwierać HTML przez `file://`.

Ekran startowy pozwala ustawić dostępność przed wejściem i przejść sześć kroków tekstowego wprowadzenia. Można je pominąć i powtórzyć. Każda scena E1–E8 ma tekst dla trzech poziomów i lokalną przykładową narrację z transkrypcją; nagrania nie uruchamiają się automatycznie. E1–E4 zawierają lekcje o sferze, współrzędnych, gwiazdozbiorach i ruchach; obserwatorium pokazuje 8871 gwiazd Hipparcos oraz główne ciała. E5–E6 obejmują plan i dziennik obserwacji, fazy, zaćmienia, meteory, instrumenty i analizę dwóch zdjęć NASA/JPL. E7 pokazuje wyniki, test przekrojowy z banku 40 pytań, podpowiedzi, ponowne próby i powrót do błędnych odpowiedzi. Słownik 23 pojęć jest dostępny z każdej sceny. E8 opisuje lokalne symulacje, źródła zewnętrzne i opcjonalne linki do polskojęzycznych filmów YouTube. Filmy wymagają internetu i nie są hostowane przez projekt. Benchmark katalogu jest dostępny pod `/benchmark.html`.

Lokalna strona nauczyciela jest dostępna pod `/teacher.html`. Importuje wyeksportowane raporty E7, usuwa duplikaty sesji i tworzy zbiorczy CSV. Zawiera także edytor konfiguracji scen, poziomów, warstw, obiektów, dat oraz własnych pytań i zadań E2. Konfigurację można pobrać jako JSON lub zastosować na tym urządzeniu. Ten sam model otwiera zakładka edytora ZPE. Strona lokalna nie łączy się z LMS.

## Weryfikacja

```powershell
cd app
npm run check
npm test
npx playwright install chromium
npm run test:e2e
```

`npm run build:local` buduje statyczną próbkę do `app/dist/local`; `npm run serve:local` udostępnia ją lokalnie. `npm run build:zpe` tworzy próbną paczkę silnika i edytora AMD/ES5. `npm run verify:zpe` sprawdza cały dostarczony JS i kodowanie. Nie jest to potwierdzenie integracji z rzeczywistym ZPE. Harness dwóch instancji jest dostępny po zbudowaniu ZPE przez `npm run test:host` pod `http://127.0.0.1:5174/tests/zpe-host/`.

Samodzielną paczkę demonstracyjną tworzy `npm run build:demo`. Pliki są w `app/dist/local`: `URUCHOM.cmd`, `start.sh`, `server.mjs`, instrukcja, aplikacja i `PACZKA_SHA256.json`. `npm run verify:demo` sprawdza rozmiary oraz SHA-256. Gotowa paczka wymaga Node 22, lecz nie wymaga `npm install`. Domyślnie stan zapisuje się sesyjnie; w aplikacji można włączyć trwały zapis na urządzeniu. Przy zmianie adresu użyj Eksportuj/Importuj stan. Katalog wyjściowy może zawierać zasoby starszych buildów; przed wydaniem potrzebny jest czysty build i pełna próba offline. Szczegóły wcześniejszych bramek w [raporcie G1](app/docs/testy-g1.md), [raporcie P2](app/docs/testy-p2.md) i [raporcie P3](app/docs/testy-p3.md); bieżący zakres opisują [raport P5](app/docs/testy-p5-fragment.md) i [raport P6](app/docs/testy-p6-fragment.md).

## Dokumentacja

| Dokument | Zawartość |
|---|---|
| [PLAN_PROJEKTU.md](PLAN_PROJEKTU.md) | Zakres ośmiu ekranów, technologie, architektura, struktura katalogów, dane astronomiczne, UI/UX, dostępność, lokalne uruchomienie, ZPE, multimedia, testy, harmonogram i ryzyka |
| [MACIERZ_WYMAGAN.md](MACIERZ_WYMAGAN.md) | 74 wymagania powiązane ze scenariuszem i dokumentacją ZPE, z kryteriami odbioru |
| [ZADANIA_IMPLEMENTACYJNE.md](ZADANIA_IMPLEMENTACYJNE.md) | 28 pakietów prac, ich zależności, odpowiedzialności, szacunki, dowody ukończenia i plan pierwszych dwóch tygodni |
| [POSTEP_PRAC.md](POSTEP_PRAC.md) | Bieżący etap, wykonane fragmenty, wyniki sprawdzeń i następne prace |
| [Rejestr decyzji G0](app/docs/DECYZJE_G0.md) | Decyzje techniczne i nierozstrzygnięte wejścia merytoryczne/organizacyjne |
| [Raport próby P0](app/docs/testy-p0.md) | Zakres i ograniczenia testów |
| [Raport P2](app/docs/testy-p2.md) | Testy pozycji, katalogu, lekcji, zadania i wydajności |
| [Raport P3](app/docs/testy-p3.md) | Testy obserwacji, instrumentów, katalogu i lokalna bramka G3 |
| [Raport fragmentu P4](app/docs/testy-p4-fragment.md) | E7, eksport i trwały zapis; zakres nieukończonej bramki G4 |
| [Raport kontynuacji P4](app/docs/testy-p4-kontynuacja.md) | Test, słownik, E8, raport nauczyciela i otwarte warunki G4 |
| [Raport kolejnej części P4](app/docs/testy-p4-edytor.md) | Edytor, zadania, filmy E8.1, adapter ZPE i aktualny wynik testów |
| [Raport danych próbnych P4](app/docs/testy-p4-dane-probne.md) | Teksty i narracja trzech poziomów oraz końcowy wynik testów demonstracyjnej bety |
| [Raport fragmentu P5](app/docs/testy-p5-fragment.md) | Pierwszy audyt responsywności, axe i żądań zewnętrznych; zakres otwarty do G5 |
| [Prace do G4](app/docs/P4_POZOSTALO.md) | Konkretny zakres pozostałych funkcji, mediów, decyzji i dowodów odbioru |
| [ADR 011](app/docs/adr/011-p4-test-slownik-zasoby.md) | Decyzje dotyczące treści i raportowania P4 |
| [ADR 012](app/docs/adr/012-p4-edytor-zadania-zpe-filmy.md) | Konfiguracja nauczyciela, zadania i doprecyzowanie E8.1 |
| [ADR 013](app/docs/adr/013-p4-dane-probne-narracja.md) | Przykładowe treści, nagrania i granice odbioru G4 |
| [ADR 009](app/docs/adr/009-p3-obserwacje-instrumenty.md) | Modele, źródła i granice P3 |
| [Rejestr źródeł](01-wsad/REJESTR_ZRODEL.md) | Pochodzenie, prawa i integralność danych P2–P3 |
| [ADR 008](app/docs/adr/008-p2-obserwatorium.md) | Decyzje o katalogu, modelach i prezentacji P2 |

Zaimplementowany fundament: TypeScript strict, semantyczny DOM/CSS, Vite oraz osobny Rollup/Babel/Terser/Acorn. Zależności są przypięte w `app/package.json` i lockfile. Obliczenia zapewnia Astronomy Engine 2.1.19 z lokalnym Workerem. Konwencje opisuje [ADR 003](app/docs/adr/003-astronomia.md); P2 poszerza porównania do 450 próbek NASA/JPL Horizons dla dziewięciu ciał.

Bieżący katalog jest samodzielnym lokalnym repozytorium Git materiału VII.06, nie klonem `emateria-y`. Zgodnie z rozdziałem 6 planu traktujemy go jako korzeń materiału: `app/` zawiera implementację, a numerowane katalogi źródła treści. Pierwsza konfiguracja próbki znajduje się w `02-scenariusz/prototyp-g0.json`; `.generated/` jest odtwarzane automatycznie. Dotychczasowe dokumenty pozostają w głównym folderze. Brak powiązania z remote i brak publikacji.

Podstawą jest załączony 13-stronicowy scenariusz VII.6 oraz dokumentacja repozytorium w commicie `c99d53bca40fe5d68b7a29aefb6201b4d13d1cc3`. Data i zakres przeglądu, źródła publiczne i rozbieżności wymagające rozstrzygnięcia podczas realizacji są zapisane w planie.

Zegar obsługuje pauzę, cofanie, kroki dobowe i zapis widoku. Lokalny start z ilustracją NASA, preferencje, sześciokrokowe wprowadzenie tekstowe, routing E1–E8, reset i eksport/import są dostępne. Bramka G2 jest spełniona technicznie lokalnie: pozycje zweryfikowano z JPL, a zadanie Z02 zapisuje odczyty, próby i raport. Pełne media i nagrania należą do P4; odbiory UX/QA oraz słabszego urządzenia odbędą się na końcu zgodnie z decyzją użytkownika. Oznaczenia projektu muszą zostać dostarczone przez ORE. Wszystkie otwarte wymagania pozostają w zakresie projektu.
