# Zadania implementacyjne — „Niebo nad nami”, VII.6

Wersja 1.1 • 3 października 2026 • rozpoczęto P0; bieżące dowody i statusy w [POSTEP_PRAC.md](POSTEP_PRAC.md)

Dokument wykonawczy do [planu projektu](PLAN_PROJEKTU.md) i [macierzy 74 wymagań](MACIERZ_WYMAGAN.md). Definiuje 28 pakietów prac. Status wykonania dokumentujemy lokalnie; nie utworzono zgłoszeń na GitHubie.

## Zasady realizacji

Najpierw realizujemy lokalną próbę wykonalności P0. Zgodnie z decyzją użytkownika z 03.10.2026 brak odbioru części ZPE w G0 nie blokuje lokalnej implementacji ani jej weryfikacji. Zależności od BL-07 dla prac lokalnych oznaczają sprawdzenie odpowiednich lokalnych kontraktów; odbiór platformowy pozostaje otwarty do integracji. Następnie budujemy działający fragment od wejścia do aplikacji, przez obserwację i zadanie, po zapis i raport. Rozszerzenie na wszystkie osiem ekranów następuje na tej podstawie. Odbiór pełnego materiału nadal wymaga wszystkich obowiązkowych funkcji.

„Zależność” w tabeli oznacza wymagany kontrakt lub działający rezultat poprzedniego pakietu, a nie konieczność zakończenia całej jego dokumentacji. Dopracowanie tekstów, testów i modeli może postępować równolegle. Nie można jednak uznać zadania za ukończone przed odbiorem jego wejść i spełnieniem własnych kryteriów.

Właściciele: **DEV-A** — programista astronomii i grafiki; **DEV-B** — programista UI, lekcji i integracji; **MER** — ekspert astronomii/dydaktyki i redaktor; **UX** — projektant; **QA** — testy i dostępność; **PROD** — multimedia; **LID** — osoba prowadząca materiał. Właściciel odpowiada za rezultat, a pozostałe wskazane role uczestniczą w odbiorze. Integrator ZPE jest partnerem zewnętrznym dla pakietów dotyczących platformy.

Szacunek w tabeli to **osobodni pracy programistycznej**, łącznie dla DEV-A/DEV-B, z przeglądem kodu i testami funkcji. Nie zawiera pracy MER, UX, QA, PROD, oczekiwania na decyzje ani 12 miesięcy utrzymania. Zakresy należy zweryfikować po G0; nie są ofertą cenową ani terminami kalendarzowymi.

## Kolejność i odpowiedzialność

| ID | Pakiet prac | Etap | Zależności | Właściciel / udział | Osobodni DEV |
|---|---|---|---|---|---|
| BL-01 | Zamrożenie zakresu, źródeł i decyzji odbiorowych | P0 | — | LID / MER, QA, DEV-A/B | 2–3 |
| BL-02 | Szkielet projektu i dwa procesy budowania | P0 | BL-01 | DEV-B | 2–3 |
| BL-03 | Prototyp kontraktu ZPE i edytora | P0 | BL-02 | DEV-B / integrator | 3–5 |
| BL-04 | Prototyp obliczeń, czasu i Workera | P0 | BL-02 | DEV-A / MER | 2–3 |
| BL-05 | Prototyp grafiki i pomiar na słabym urządzeniu | P0 | BL-02 | DEV-A / QA | 2–3 |
| BL-06 | Rejestr danych, praw i plan produkcji mediów | P0/P1 | BL-01 | MER / PROD, LID, DEV-A | 1–2 |
| BL-07 | Zamknięcie G0 i zapis decyzji technicznych | P0 | BL-03, BL-04, BL-05, BL-06 | LID / cały zespół, integrator | 1–2 |
| BL-08 | Niebieski interfejs, start, onboarding i dostępność | P1 | BL-07 | DEV-B / UX, QA | 5–8 |
| BL-09 | Model stanu, zegar, miejsce i nawigacja | P1/P2 | BL-07 | DEV-A / DEV-B | 5–8 |
| BL-10 | Import katalogów i repozytorium zasobów | P1/P2 | BL-06, BL-07 | DEV-A / MER | 4–6 |
| BL-11 | Usługi astronomiczne i układy współrzędnych | P2 | BL-09, BL-10 | DEV-A / MER | 6–10 |
| BL-12 | Renderer nieba, warstwy, kamera i wybór obiektów | P2 | BL-08, BL-11 | DEV-A / UX | 8–12 |
| BL-13 | Lista obiektów, odczyty i interakcje semantyczne | P2 | BL-08, BL-11 | DEV-B / QA, MER | 5–8 |
| BL-14 | E1–E2: wprowadzenie i sfera niebieska | P2 | BL-12, BL-13 | DEV-B / MER | 4–6 |
| BL-15 | E3 i E4.1: gwiazdozbiory, ruch gwiazd i precesja | P2 | BL-10, BL-12, BL-13 | DEV-A / MER | 5–8 |
| BL-16 | E4.2: ruch planet i prawa Keplera | P2/P3 | BL-11, BL-12, BL-13 | DEV-A / MER | 7–11 |
| BL-17 | E5: obserwacje, fazy, zaćmienia i meteory | P3 | BL-11, BL-12, BL-13 | DEV-A / MER, QA | 8–12 |
| BL-18 | E6: teleskop, fotografia i narzędzia | P3 | BL-11, BL-12, BL-13 | DEV-A / MER, UX | 6–10 |
| BL-19 | Zadania, dziennik, quizy, słownik i test | P2/P4 | BL-09, BL-13 | DEV-B / MER, QA | 8–12 |
| BL-20 | Pełne treści, nagrania, E7 i E8 | P2/P4 | BL-06, BL-08 | MER / PROD, DEV-B | 4–6 |
| BL-21 | Trwały zapis, migracje i odtwarzanie | P1/P4 | BL-09 | DEV-B / QA | 4–7 |
| BL-22 | Edytor lekcji i własnych zadań nauczyciela | P4 | BL-19, BL-21 | DEV-B / QA, MER | 7–10 |
| BL-23 | Raport ucznia i narzędzia raportowania nauczyciela | P2/P4 | BL-19, BL-21 | DEV-B / integrator, QA | 5–8 |
| BL-24 | Produkcyjny adapter ZPE, pakiety i izolacja | P1/P4 | BL-03, BL-08, BL-09, BL-21 | DEV-B / integrator | 5–8 |
| BL-25 | Walidacja naukowa pełnego zestawu scen | P2/P5 | BL-14, BL-15, BL-16, BL-17, BL-18 | MER / DEV-A, QA | 4–7 |
| BL-26 | Testy pełnych przepływów i audyt techniczny | P1/P5 | BL-14, BL-15, BL-16, BL-17, BL-18, BL-19, BL-20, BL-21, BL-22, BL-23, BL-24 | QA / DEV-A/B | 5–8 |
| BL-27 | Pilotaż, recenzja i poprawki odbiorowe | P5/P6 | BL-25, BL-26 | LID / QA, MER, DEV-A/B | 8–12 |
| BL-28 | Wydanie lokalne/ZPE, dokumentacja i utrzymanie | P6 | BL-27 | DEV-B / LID, integrator | 3–5 |

Wielofazowe pakiety, np. BL-21 i BL-26, mają wczesny fragment wykonywany wraz z fundamentem i późniejsze rozszerzenia. Pełna weryfikacja BL-26 wymaga wskazanych wejść; testy jego wcześniejszych, już dostępnych przepływów rozpoczynają się w P1.

Suma zakresów wynosi **129–203 osobodni programistycznych**. Przy dwóch osobach 20 tygodni odpowiada nominalnie 200 osobodniom przed uwzględnieniem urlopów i innych obowiązków. Górny wariant korzysta z rezerwy; terminy i dostępność zespołu trzeba potwierdzić po G0. Dostępność merytoryki, mediów i integratora decyduje również o czasie kalendarzowym. Harmonogram bazowy pozostaje 20 tygodni plus 4 tygodnie rezerwy z rozdziału 15 planu. Wybór jednej osoby do implementacji wymaga ponownego oszacowania terminu, a nie mechanicznego skopiowania harmonogramu.

## Kryteria ukończenia pakietów

| ID | Konkretny rezultat i dowód ukończenia |
|---|---|
| BL-01 | Lista scen i celów zaakceptowana przez właściciela materiału; rejestr decyzji zawiera zakres przeglądarek, WCAG/ATAG, raporty LMS i brak rozszerzenia na VR. Każda decyzja ma właściciela i termin. Rozbieżności nie są oznaczone jako rozwiązane bez dowodu. |
| BL-02 | `npm ci` i lokalny podgląd działają na czystym checkoutcie; Vite i pipeline AMD mają osobne wejścia; wersje narzędzi i zależności zapisane. Minimalne CI uruchamia sprawdzanie typów, schematów i budowanie. |
| BL-03 | Dwie instancje próbki w testowym hoście; zapis/przywrócenie/zamrożenie, zakładka edytora, pełny ekran, kontrast i destroy. Wszystkie dostarczone pliki JS przechodzą sprawdzenie ES5. Wynik próby w rzeczywistym ZPE zapisany lub wyraźnie wskazany jako zewnętrzna zależność blokująca G0. |
| BL-04 | Słońce, Księżyc i Mars dla ustalonego miejsca/chwili; porównanie z referencją; Worker i wariant bez Workera dają zgodny wynik. Zmiana strefy nie zmienia chwili UTC. |
| BL-05 | Tysiące gwiazd renderowane zbiorczo; zmierzony czas klatki, pamięć i reakcja na zmianę czasu. Brak WebGL2 uruchamia wspólny widok Canvas/SVG. Raport wymienia sprzęt, rozdzielczość i warunki. |
| BL-06 | Rejestr katalogów i mediów z licencjami, atrybucją, źródłami i planem przetwarzania; zatwierdzone liczby/długości nagrań; formaty przekazania z Z13. Wpis „do pozyskania” nie jest dowodem posiadania praw. |
| BL-07 | Zapis ADR: wybór wersji bibliotek, obsługiwanych API, strategii renderowania i obliczeń, macierzy urządzeń, raportowania. Wyniki prób rozstrzygają wykonalność; terminy planu zaktualizowane po poznaniu ryzyk. |
| BL-08 | Zatwierdzone szerokie i mobilne układy; jasne panele/granatowa mapa, czytelny fokus, kontrasty, duże kontrolki. Start i onboarding działają bez myszy, dźwięk wymaga działania użytkownika, preferencje dostępne przed wejściem. |
| BL-09 | Komendy czasu/miejsca/kamery i typowane jednostki; testy daty, DST, pauzy, cofania, granic współrzędnych i przejścia trybów. Historia obserwacji ma stabilny format. |
| BL-10 | Powtarzalny import źródeł do małych katalogów; walidacja identyfikatorów, jednostek, epok i licencji. Każdy obowiązkowy typ obiektu ma zatwierdzone przykłady i zakres ważności. Wczytywanie działa bez internetu. |
| BL-11 | Jeden interfejs pozycji, faz, horyzontu i zdarzeń; status jakości i ważności; numer rewizji odrzuca stare wyniki Workera. Testy jednostek i układów nie opierają się tylko na zrzucie ekranu. |
| BL-12 | Przesuwanie, zoom, śledzenie, warstwy i wybór; nazwy nie zasłaniają całej mapy; dostępne sterowanie przyciskami. Renderer nie zmienia stanu lekcji samodzielnie. |
| BL-13 | Karta obiektu i lista z filtrami korzystają z tego samego modelu co mapa. Czytnik odczytuje wartości i istotne zmiany, nie każdą klatkę. Zadanie można wykonać klawiaturą bez zdradzania poprawnej odpowiedzi przez alternatywny opis. |
| BL-14 | Każda scena E1 i E2 ma treść, działającą interakcję i przynajmniej jedno sprawdzenie celu. Wyświetlane współrzędne odpowiadają pozycji graficznej i opisowi. |
| BL-15 | Pięć wymaganych przykładów gwiazdozbiorów, mity i różnice kultur; ruch własny/pozorny oraz precesja mają prawidłową skalę czasu i oznaczone uproszczenia. Długookresowy model nie udaje precyzyjnych efemeryd dla wszystkich ciał. |
| BL-16 | Ruch prosty/wsteczny i każde z trzech praw Keplera mają eksperyment oraz równoważne odczyty. Schemat heliocentryczny jest odróżniony od widoku ziemskiego obserwatora i podaje skalę. |
| BL-17 | Wszystkie podsceny E5 mają pełne pokrycie; fazy i zaćmienia zweryfikowane, widoczność lokalna poprawna, meteory oznaczone jako model statystyczny. Tekst bezpiecznej obserwacji Słońca przeszedł odbiór merytoryczny. |
| BL-18 | Interaktywny teleskop/lornetka, refraktor/reflektor, powiększenie i pole widzenia; zdjęcia i ekspozycja poprawnie opisane. Materiał o programach astronomicznych dostępny bez ich instalowania. |
| BL-19 | Co najmniej zatwierdzony bank zadań/pytań i pełne pokrycie celów; hipoteza, pomiar, wniosek, podpowiedź, słownik i test. Reguły oceny, tolerancje i ponowne próby mają testy; wypowiedzi otwarte pozostają do oceny człowieka. |
| BL-20 | Teksty wszystkich ekranów i poziomów, nagrania lektora, napisy, audiodeskrypcja i bibliografia; E7/E8 kompletne. Manifest zasobów nie ma zerwanych referencji. Każda poprawka lektury ma odpowiadającą aktualizację transkrypcji i napisów. |
| BL-21 | Zapis po zmianie, odtworzenie, migracja wersji i wybór sesyjny/trwały; brak nadpisania danych uszkodzonym importem. Test odmowy dostępu do pamięci, limitu danych, eksportu i usuwania; stan ucznia nie zawiera zbędnych danych identyfikujących. |
| BL-22 | Nauczyciel zmienia sceny, warstwy, obiekty, daty i poziomy oraz tworzy quiz/zadanie bez programowania. Edytor sprawdza wymagane opisy i dostępność celu. Ten sam plik konfiguracji daje tę samą lekcję lokalnie i w ZPE. |
| BL-23 | Uczeń odczytuje podsumowanie, nauczyciel raport wybranego ucznia; eksport JSON/CSV i druk. Lokalny import kilku raportów ma deduplikację. Przepływ LMS jest sprawdzony na rzeczywistym hoście, a nie deklarowany na podstawie hipotetycznej metody API. |
| BL-24 | Finalne punkty wejścia silnika/edytora, manifesty, ścieżki zasobów, izolacja, kontrast i lifecycle. Zmrożenie blokuje także zegar i automatyczny zapis. Testy wykazują brak żądań zewnętrznych i globalnych modyfikacji. |
| BL-25 | Raport obejmuje próbki referencyjne wszystkich rodzin modeli, daty/granice stref i miejsca skrajne; tolerancje przypisane do konkretnego modelu. Nieznane parametry i okresy poza zakresem są uczciwie prezentowane. |
| BL-26 | Raport pełnych przepływów, obsługi klawiatury/czytników, urządzeń i przeglądarek, 60 FPS, offline, stanów błędów oraz bezpieczeństwa importu. Wszystkie obowiązkowe pozycje macierzy mają dowód i status, nie tylko ogólną ocenę „działa”. |

| BL-27 | Pilotaż z reprezentantami grup docelowych i nauczycielem; rejestr uwag z priorytetem, poprawką i ponownym sprawdzeniem. Brak nierozwiązanych błędów uniemożliwiających naukę, dostępność lub odbiór techniczny. |
| BL-28 | Paczki działają według instrukcji na czystym urządzeniu; źródła, lockfile, licencje, raporty i sumy kontrolne przekazane. Ustalony właściciel wsparcia, aktualizacji i migracji; wdrożenie ZPE dopiero po zakończeniu właściwego procesu wydania. |

### Stan lokalnej implementacji P2 — 04.10.2026

| Pakiet | Wykonane w P2 | Dalszy zakres według planu |
|---|---|---|
| BL-10–11 | Offline import HIP/IAU/figur z SHA-256; pozycje dziewięciu ciał i gwiazd, fazy, średnice, horyzont; 450 referencji JPL | Dostawcy pozostałych typów obiektów w P3; odbiór naukowy P5 |
| BL-12–13 | WebGL2/Canvas, przesuwanie, zoom, śledzenie, warstwy i wybór; lista, filtr, karta ciała/gwiazdy, sterowanie semantyczne | Próby rzeczywistych urządzeń i pełny audyt dostępności P5 |
| BL-14–16 | Działające E1–E4: sfera, współrzędne, pięć przykładów gwiazdozbiorów, ruch dobowy/roczny/własny, precesja, Mars i Kepler | Redakcja i recenzja ekspercka P5; dalsze doświadczenia E4.2 w P3, jeśli wymagane |
| BL-19/23 | Pierwsze pełne Z02: hipoteza, odczyt, wniosek, próby, raport JSON | Bank zadań, słownik, test, raporty zbiorcze/CSV/druk/LMS w P4 |

Dowód: [raport P2](app/docs/testy-p2.md), [ADR 008](app/docs/adr/008-p2-obserwatorium.md), [rejestr źródeł](01-wsad/REJESTR_ZRODEL.md). Techniczna bramka G2 jest spełniona lokalnie; formalne odbiory pozostają otwarte.

### Stan lokalnej implementacji P3 — 04.10.2026

| Pakiet | Wykonane w P3 | Dalszy odbiór według planu |
|---|---|---|
| BL-17 | E5: plan i dziennik, Z03/Z04 z zapisem, lokalna orientacja fazy, kontakty i lokalna widoczność obu zaćmień, 12 miejsc testowych, Syriusz/Betelgeza, Mars, statystyczne roje; tabele i odczyty semantyczne | Formalny odbiór tekstu bezpieczeństwa przez eksperta MER; audyt P5 |
| BL-18 | E6: optyka, pole, powiększenie, schemat i model 3D, ekspozycja, dwa obrazy NASA/JPL z opisem pasm, analiza obrazu, Z06 i wariant bez WebGL2 | Odbiór merytoryczny i produkcyjny mediów Z13 w P5 |
| BL-10–11 | Katalog M31/M42, Ceres/67P i cztery księżyce Jowisza; JPL Horizons 2024–2030, referencje, ważność, atrybucje i źródła | Zatwierdzenie docelowej skali kart i odbiór astronomiczny P5 |

Dowód: [raport P3](app/docs/testy-p3.md), [ADR 009](app/docs/adr/009-p3-obserwacje-instrumenty.md) i [rejestr źródeł](01-wsad/REJESTR_ZRODEL.md). **Techniczna bramka G3 spełniona lokalnie**; podpisy eksperckie i próby docelowe pozostają otwarte w P5/P6.

## Stan lokalnej implementacji P4 — 04.10.2026

| Pakiet | Wykonany fragment | Otwarte kryteria |
|---|---|---|
| BL-19 | 40 wersjonowanych pytań E1–E6, słownik 23 pojęć, test 12 pytań według poziomu, podpowiedzi, wyjaśnienia i ponowne próby | Odbiór MER/LID klucza, pozostałe zadania praktyczne, własne pytania nauczyciela i pełne pokrycie uzgodnionych celów |
| BL-20 | E7 z wynikami, testem i dyskusją; E8 z symulacjami offline oraz bibliografią ze statusem sieciowym | Filmy offline, profesjonalna narracja, napisy, transkrypcje, audiodeskrypcja i redakcja trzech poziomów |
| BL-21 | Zapis sesyjny/trwały IndexedDB, odtworzenie w nowej karcie, migracja v6→v7, walidowany import i komunikaty błędów | Próby limitów danych i odbiór QA na docelowych urządzeniach |
| BL-22 | Brak funkcjonalnego edytora konfiguracji lekcji | Sceny, warstwy, obiekty, daty, poziomy, quizy/zadania własne, walidacja celów oraz wspólny plik lokalny/ZPE |
| BL-23 | Raport ucznia JSON/CSV/druk; lokalna strona nauczyciela importuje, deduplikuje i eksportuje raporty | Podgląd wybranego ucznia oraz próba LMS w rzeczywistym ZPE |

Dowody: [pierwszy raport P4](app/docs/testy-p4-fragment.md),
[raport kontynuacji](app/docs/testy-p4-kontynuacja.md), [ADR 010](app/docs/adr/010-p4-raport-i-zapis.md)
i [ADR 011](app/docs/adr/011-p4-test-slownik-zasoby.md). Bramka G4 pozostaje
otwarta; żaden z powyższych pakietów nie ma pełnego odbioru.

### Aktualizacja P4 — 05.10.2026

| Pakiet | Dodatkowo wykonano | Pozostaje |
|---|---|---|
| BL-19 | Z01, Orion i planety nad horyzontem zapisują próby; edytor dodaje pytania i zadania E2, raport je uwzględnia | Liczba dalszych zadań i odbiór merytoryczny |
| BL-20 | E8.1 ma trzy polskie odsyłacze filmowe bez hostowania; główna treść działa offline | Osobna produkcja narracji i dostępnych odpowiedników, redakcja treści, oznaczenia ORE |
| BL-21 | Stan v8 / treść 0.3.0, migracja v7→v8 i wcześniejszych stanów | Odbiór na docelowych urządzeniach |
| BL-22 | Wspólny edytor lokalny/ZPE z walidacją scen, dat, obiektów, pytań i zadań | Odbiór nauczycieli i ATAG |
| BL-23 | Nowe próby zadań są w raporcie ucznia i lokalnym zbiorczym | Podgląd i raport w rzeczywistym LMS |
| BL-24 | Pełna lekcja E1–E8 i edytor przechodzą próbę w lokalnym hoście ZPE, build ES5 | Test i przekazanie do docelowego ZPE z integratorem |

Dowody: [raport P4](app/docs/testy-p4-edytor.md),
[ADR 012](app/docs/adr/012-p4-edytor-zadania-zpe-filmy.md). G4 pozostaje
otwarta; wcześniejsza tabela dokumentuje stan z 04.10.2026.

## Pokrycie wymagań

Każda pozycja z macierzy występuje poniżej. Wielokrotne wskazanie oznacza, że funkcja ma część implementacyjną oraz osobny odbiór. W testach można stosować identyfikatory `TC-<wymaganie>-<numer>`, np. `TC-SIM-04-01` dla zmiany daty i strefy.

| Pakiet | Powiązane wymagania |
|---|---|
| BL-01 | EDU-21, NFR-03 |
| BL-02 | NFR-01, NFR-03 |
| BL-03 | ZPE-01, ZPE-02, ZPE-03, ZPE-04, ZPE-05, ZPE-06 |
| BL-04 | NFR-06, SIM-03, SIM-04 |
| BL-05 | SIM-13, NFR-05 |
| BL-06 | SIM-01, SIM-02, DEL-01 |
| BL-07 | NFR-01, NFR-05, NFR-06, ZPE-01, TEACH-03 |
| BL-08 | EDU-01, EDU-02, A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, NFR-04, NFR-08 |
| BL-09 | SIM-03, SIM-04, SIM-05, SIM-12, SAVE-01 |
| BL-10 | SIM-01, SIM-02, SIM-09, EDU-20, NFR-02 |
| BL-11 | SIM-07, SIM-08, NFR-06 |
| BL-12 | SIM-06, SIM-11, SIM-13, NFR-05 |
| BL-13 | A11Y-03, A11Y-04, A11Y-06, A11Y-09, SIM-06, SIM-09 |
| BL-14 | EDU-03, EDU-04, SIM-07 |
| BL-15 | EDU-05, EDU-06, EDU-07 |
| BL-16 | EDU-08, EDU-09, SIM-08 |
| BL-17 | EDU-10, EDU-11, EDU-12, EDU-13, EDU-14, SIM-08 |
| BL-18 | EDU-15, EDU-16, EDU-17, SIM-10 |
| BL-19 | LEARN-01, LEARN-02, LEARN-03, LEARN-04, LEARN-05, EDU-21 |
| BL-20 | EDU-02, EDU-18, EDU-19, EDU-20, EDU-21, A11Y-07, A11Y-08, DEL-01, NFR-08 |
| BL-21 | SAVE-01, SAVE-02, SAVE-03, NFR-07 |
| BL-22 | TEACH-01, TEACH-02, A11Y-10 |
| BL-23 | TEACH-03, TEACH-04, TEACH-05, EDU-18 |
| BL-24 | ZPE-01, ZPE-02, ZPE-03, ZPE-04, ZPE-05, ZPE-06, NFR-02 |
| BL-25 | NFR-06 |
| BL-26 | A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, A11Y-06, A11Y-07, A11Y-08, A11Y-09, A11Y-10, NFR-04, NFR-05, NFR-07 |
| BL-27 | EDU-21, A11Y-01, DEL-02 |
| BL-28 | NFR-01, NFR-02, DEL-02, DEL-03 |

## Pierwsze dwa tygodnie

| Okres | DEV-A | DEV-B | Wejście merytoryczne / organizacyjne |
|---|---|---|---|
| Dni 1–2 | Spis modeli, źródeł i referencyjnych przypadków | Szkielet, skrypty i lokalny host | Właściciel materiału ustala zakres, konta testowe i osoby rozstrzygające decyzje |
| Dni 3–5 | Próbka efemeryd, czasu/stref i Workera | AMD/ES5, dwie instancje, stan i edytor w hoście | Ekspert sprawdza wartości przykładowe; integrator potwierdza ścieżkę testu ZPE |
| Dni 6–8 | Benchmark grafiki, Canvas/SVG i obsługa utraty kontekstu | Próba docelowego ZPE, izolacja, kontrast i raport ucznia | UX/QA sprawdzają klawiaturę, semantykę i sprzęt; producent zamyka plan mediów |
| Dni 9–10 | Przegląd wyników i ograniczeń modeli | Przegląd builda, hosta i dokumentacji | G0: decyzje, korekta estymat i wskazanie pakietów możliwych do rozpoczęcia |

Jeśli dostęp do środowiska ZPE nie jest gotowy, zespół może rozwijać lokalny host testowy, domenę i dane. Próby hosta nie wolno wtedy opisać jako potwierdzonej integracji docelowej, a G0 pozostaje częściowo otwarte w tym konkretnym zakresie.

## P4 — aktualizacja 05.10.2026

Implementacja demonstracyjnej bety obejmuje BL-19–BL-24: siedem przykładowych
ćwiczeń, 40 pytań, 23 hasła, edytor nauczyciela, wyniki i raporty, E1–E8,
teksty trzech poziomów oraz 24 lokalne nagrania próbne. Linki filmowe E8.1
są zewnętrzne i opcjonalne. Dowód techniczny: 564 testy jednostkowe, 24 testy
Chromium, oba buildy i kontrola ES5; szczegóły w
`app/docs/testy-p4-dane-probne.md`.

Formalne zamknięcie G4 nadal wymaga przeglądu merytorycznego i dydaktycznego,
potwierdzenia praw do narracji, oznaczeń ORE oraz demonstracji w rzeczywistym
ZPE/LMS. Szczegółowy wykaz jest w `app/docs/P4_POZOSTALO.md`. P5 i P6 nie
są oznaczone jako wykonane.

## P5 — audyt techniczny rozpoczęty 05.10.2026

BL-26 ma pierwszy dowód: osiem scen, trzy poziomy i sześć szerokości
320–1920 px bez poziomego przewijania całej strony, axe A/AA i kontrolę
automatycznych żądań zewnętrznych. Naprawiono kontenery tabel E3/E4.
Wynik: 564 testy jednostkowe, 26 testów Chromium, oba buildy i ES5.
[Raport P5](app/docs/testy-p5-fragment.md) opisuje ograniczenia prób.
BL-25, pozostały zakres BL-26 i BL-27 są otwarte; G5 nie została odebrana.

### P6 — fragment techniczny BL-28, 05.10.2026

Paczka demonstracyjna otrzymała poprawną obsługę lokalnych nagrań MP3,
zaktualizowaną instrukcję oraz manifest SHA-256 z weryfikatorem. Build,
kontrola 372 plików i próbka HTTP przeszły. [Raport P6](app/docs/testy-p6-fragment.md)
opisuje dowód. BL-28 pozostaje otwarty: zależy od BL-27, świeżej instalacji,
pełnego testu offline, kompletnego przekazania źródeł i wyników, rzeczywistego
ZPE oraz organizacyjnego właściciela utrzymania (DEL-03).

## Obsługa decyzji i zmian

Każda decyzja G0 otrzymuje krótki zapis: problem, źródło wymagania, rozpatrzone warianty, wynik próby, wybrany wariant, ograniczenia, odpowiedzialny i data. Rekomendowane pliki: `docs/adr/001-hosty.md`, `002-renderer.md`, `003-astronomia.md`, `004-przegladarki.md`, `005-raportowanie.md` i `006-dane-media.md` w przyszłym katalogu aplikacji.

Zmiana zakresu aktualizuje jednocześnie plan, macierz i zależne pakiety. Każda zmiana ma wskazany wpływ na dydaktykę, dostępność, dane, testy i termin. Usunięcie sceny z pełnego wydania nie może zostać ukryte pod etykietą „MVP”.

Przed rozpoczęciem pakietu muszą istnieć jego dane wejściowe, zrozumiałe kryterium odbioru i osoba odpowiedzialna. Przed zamknięciem muszą istnieć: działający rezultat, właściwe testy, wynik przeglądu, potrzebna dokumentacja oraz powiązania do wymagań. Wykonanie skryptu lub utworzenie pliku nie jest samo w sobie dowodem realizacji celu.
