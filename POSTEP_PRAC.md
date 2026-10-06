# Postęp implementacji „Niebo nad nami”

Aktualizacja: 05.10.2026. **Rozpoczęto techniczny audyt P5; G4 i G5 są formalnie otwarte.** Lokalna beta P4 działa, a lokalne bramki techniczne G1–G3 są spełnione. Odbiory eksperckie, urządzeń i rzeczywistego ZPE/LMS pozostają otwarte. Poniższe wpisy zachowują historię wcześniejszych etapów.

## Ustalenia użytkownika

- „Etap 1” oznacza P0, co użytkownik potwierdził w tej rozmowie.
- Najpierw uruchomienie i weryfikacja lokalna. Niepełna zgodność ZPE nie blokuje lokalnych prac. Zmianę kolejności odbioru zapisano w planie, macierzy i zależnościach pakietów.
- Nie wykonujemy publikacji ani push bez potwierdzenia. Repozytorium Git powstało lokalnie; dokumentacja bazowa jest zachowana w commicie `800c4a2`.

## Stan pakietów P0

| Pakiet | Stan | Wykonany fragment / pozostały warunek |
|---|---|---|
| BL-01 | W toku | Przeczytano plan, macierz, listę prac i kontrakt ZPE. Rejestr decyzji wskazuje role, terminy i rozbieżności. Brak zatwierdzenia całego zakresu przez właściciela i ekspertów. |
| BL-02 | Zaimplementowany i zweryfikowany lokalnie | `app/`, TypeScript strict, dwa wejścia/buildy, Node i lockfile, przygotowanie treści, schematy, lokalny podgląd, konfiguracja CI. Czysta instalacja i wszystkie bieżące testy zaliczone. Pełny odbiór wejść BL-01 pozostaje otwarty. |
| BL-03 | Częściowo wykonany | Silnik/edytor AMD/ES5, dwie instancje, stan, zamrożenie, kontrast, delegowanie pełnego ekranu, init/destroy, buforowanie w czasie ładowania. Pozostaje klawiatura ekranowa oraz rzeczywisty host ZPE/LMS, zasoby i CSP. |
| BL-04 | Zaimplementowany i zweryfikowany lokalnie | Trzy ciała, dowolne współrzędne naziemne, UTC/IANA i jawna refrakcja; Worker/fallback, odrzucanie starych rewizji. 360 referencji JPL spełnia próg 2′. Odbiór ekspercki pełnych modeli nadal otwarty. |
| BL-05 | Lokalny prototyp wykonany; odbiór urządzeniowy otwarty | WebGL2/Canvas, wspólna kamera i odczyty, utrata kontekstu, benchmark 8000 syntetycznych punktów. Pomiar headless ok. 60 FPS; użytkownik odroczył próbę słabego urządzenia do końca. Katalog naukowy nie jest częścią benchmarku. |
| BL-06 | W toku — rejestr wstępny | Rejestr źródeł i praw, licencje kodu narzędzi. Nie pozyskano katalogów ani mediów; wolumen nagrań wymaga decyzji. |
| BL-07 | Otwarty | Zapisano decyzje i lokalne wyniki BL-04/05. Odbiory urządzeniowe i zewnętrzne pozostają otwarte; nie zamknięto G0. |
| BL-08 | Częściowo wykonany | Start lokalny, sześć kroków tekstowych, fotografia NASA z prawami, preferencje i powrót; zapisany poziom, układ szeroki/wąski. Brak logotypów ORE, pełnych multimediów/nagrań i końcowego odbioru UX/QA. |
| BL-09 | Fragment P1 technicznie wykonany | Zegar, miejsce, kamera, routing E1–E8, poziom/tryb w stanie v4, historia miejsc do 100. Pełne sceny i tryb „Ucz się” należą do P2–P4. |
| BL-21 | Fragment P1 technicznie wykonany | Zapis sesyjny, odtworzenie, migracje v1–v4, eksport/import z limitem i atomową walidacją, reset. Produkcyjne IndexedDB i wyniki pozostają na P4. |
| BL-10–BL-28 | Nierozpoczęte jako pełne pakiety produkcyjne | Próba nie zastępuje E1–E8, pełnego zapisu, raportów, edytora ani audytów. |

## Gotowe elementy próbki

- Semantyczny polski formularz wyboru obiektu, chwili UTC i strefy IANA, niebieskie tokeny z planu, odczyt tekstowy, widoczny fokus i kontrolki co najmniej 44 px.
- Oddzielony od DOM model danych i store; walidacja konfiguracji/stanu, odmowa zmiany podczas zamrożenia, kopie danych izolujące instancje.
- Zapis w `sessionStorage` lokalnej karty, odtworzenie po odświeżeniu, komunikaty błędów zapisu/odczytu. To zapis próbki, nie produkcyjne IndexedDB z BL-21.
- Źródło konfiguracji w numerowanym katalogu; walidatory JSON Schema wygenerowane w buildzie bez eval/require w runtime.
- Próbny adapter ZPE, edytor konfiguracji początkowej i kontrolowany host AMD. Manifest deklaruje istniejący WebGL; bez druku i oceny zadań.
- Skrypty testów, budowania i weryfikacji ES5/UTF-8, konfiguracja CI oraz instrukcja uruchomienia.

## Weryfikacja i ograniczenia

Wyniki: czysta instalacja `npm ci` na Node 22.22.0, typy i schematy, oba buildy, ES5/UTF-8, **7 testów jednostkowych i 4 testy przeglądarkowe — zaliczone**. Sprawdzono również zrzut lokalnego widoku. Szczegóły: [raport próby P0](app/docs/testy-p0.md). Wszystkie pełne wymagania macierzy pozostają otwarte do odbioru; pozytywny test próbki jest wyłącznie dowodem częściowym.

Niejasności wymagające decyzji przed zależnymi pracami: dokładna liczba obiektów i treści, zakres epok, prawa do danych, produkcja lektora/mediów, docelowe urządzenia, podstawa kontraktowa dostępności i integracja LMS. Szczegóły: [DECYZJE_G0.md](app/docs/DECYZJE_G0.md). Nie założono fikcyjnych danych, nazw silnika ani akceptacji eksperckich.

## Kontynuacja — BL-04

Dodano Astronomy Engine 2.1.19 i licencję, kontrakt wspólnego wyniku, tabelę odczytów, wybór obserwatora, opcjonalną refrakcję, Worker ze ścieżką zastępczą, kontrolę rewizji i migrację stanu v1→v2. Zakres i ograniczenia: [ADR 003](app/docs/adr/003-astronomia.md).

Weryfikacja: **375 testów jednostkowych (w tym 360 referencji JPL), 5 przeglądarkowych, oba buildy, 3 pliki JS ZPE zgodne składniowo z ES5**. Maksymalne różnice kierunków: RA/Dec 1.432761′, azymut/wysokość 1.703333′ (próg 2′). Rzeczywisty Worker i wariant bez Workera dają identyczne odczyty. Surowe referencje, URL i hashe są w repozytorium, testy nie potrzebują sieci.

## Kontynuacja — BL-05

Dodano mapę Three.js 0.186.1/WebGL2 i wspólny widok Canvas, sterowanie kierunkiem/polem widzenia, wybór i osobne centrowanie. Utrata kontekstu zachowuje odczyty i uruchamia Canvas. Benchmark 8000 syntetycznych punktów jest osobną stroną; nie zastępuje katalogu gwiazd. [ADR 002](app/docs/adr/002-renderer.md) zawiera pomiary i ograniczenia.

Weryfikacja: **413 testów jednostkowych, 7 przeglądarkowych i oba buildy zaliczone**, ES5 obejmuje silnik, edytor i Worker. Testy obejmują brak WebGL2, rzeczywistą utratę kontekstu i brak nowych globali po użyciu Three. Sprawdzono zrzut mapy.

Zgodnie z kolejnym ustaleniem użytkownika próby słabszych urządzeń wykonamy na końcu; optymalizacje obowiązują już podczas implementacji. Najbliższe prace: lokalny fundament P1 — zegar, start, dostępność i prowadzenie użytkownika. G0 platformowa, prawa/treści i zewnętrzne odbiory pozostają otwarte.

## Kontynuacja — BL-09, zegar i widok

Zegar niezależny od klatek, 11 temp łącznie z pauzą, kroki dobowe, „Teraz”,
granice modelu i zamrożenie. Kamera i tempo są częścią stanu v3; migracja
zachowuje starsze zapisy. Wspólna tabela nie ogłasza każdej klatki.
Obliczenia do 10 Hz, zapis co 5 sekund podczas ruchu, brak pracy zegara
w ukrytej karcie. Szczegóły: [ADR 004](app/docs/adr/004-zegar-i-stan.md).

Weryfikacja: 9 testów przeglądarkowych, typy, oba buildy i ES5 zaliczone.

## Kontynuacja — BL-08, lokalne wejście i dostępność

Ekran startowy, sześciokrokowe wprowadzenie z pomijaniem/powtarzaniem i
przywracaniem kroku po odświeżeniu. Ustawienia przed wejściem: kontrast,
tekst 100–200%, większe kontrolki, prosty krój i odstępy, ograniczenie ruchu,
celownik. Preferencje zapisują się dla karty albo na przyszłość, przez osobny
adapter. Odmowa zapisu jest widoczna. Mapa i Worker powstają dopiero po wejściu;
powrót do startu zwalnia zasoby. [ADR 005](app/docs/adr/005-start-i-preferencje.md).

Testy jednostkowe: **417 zaliczonych**. Test przepływu startu i preferencji
obejmuje 320 px, tekst 200%, axe A/AA, fokus, sześć kroków, powrót i nową kartę.
Wykryte przepełnienie tekstu zostało poprawione.

Końcowa regresja tego fragmentu: **10/10 testów przeglądarkowych zaliczonych**,
typy i oba buildy zaliczone, wszystkie 3 pliki JS ZPE przechodzą ES5/UTF-8.
Ostrzeżenie Vite o module grafiki >500 kB pozostaje zapisanym ograniczeniem
do optymalizacji ładowania; nie jest błędem testów ani dowodem wydajności na
słabszym urządzeniu.

### Punkt przerwania na życzenie użytkownika

Użytkownik poprosił o dokończenie bieżącej pracy i przerwę. Zamykamy lokalny
fragment startu/dostępności, bez rozpoczynania kolejnych pakietów. **Pełne P1
i bramka G1 nie są zamknięte.** Przy wznowieniu: nawigacja i szkielety E1–E8,
reset, bezpieczny import/eksport i dalszy zapis sesji; następnie pionowy fragment
jednego zadania i raportu zgodnie z planem. Wprowadzenie multimedialne, poziomy,
dostarczone logotypy, docelowy layout i ręczny audyt pozostają do wykonania.

Odbiór słabszego urządzenia nadal odroczony do końca przez użytkownika.
Katalogi/treści/prawa i rzeczywiste ZPE nadal wymagają wskazanych wejść.

## Wznowienie — domknięcie technicznego G1

Na wyraźne polecenie użytkownika wznowiono P1. Dodano stan v4 z walidacją
sceny/poziomu/trybu, migrację v3, historię 100 miejsc, walidowany indeks E1–E8
i schemat docelowej treści scen. Wszystkie osiem ekranów ma nawigowalny
szkielet; tylko E2 uruchamia istniejącą próbkę obserwatorium. Poziom podstawowy
ogranicza liczbę kontrolek, wyższe poziomy pokazują pełen formularz. Wersja
lokalna ładuje renderer dopiero w E2. Dodano eksport/import JSON, reset z
potwierdzeniem, samodzielny serwer i launchery paczki G1.

Wyniki: lokalny build demonstracyjny i ZPE/ES5, 419 testów jednostkowych;
przeglądarkowy przepływ P1 eksport→błędny import→poprawny import→reset,
nawigacja ośmiu ekranów i przywrócenie poziomu. Serwer paczki zwraca 200 dla
HTML/JS, 404 przy próbie wyjścia poza katalog. W samodzielnej paczce 8 ekranów
otworzyło się bez żądań zewnętrznych, a renderer nie został pobrany na starcie.
Pełny wynik regresji przeglądarkowej po ostatnich zmianach: [raport G1](app/docs/testy-g1.md).

## Zamknięcie P1 według bramki G1

Po doprecyzowaniu harmonogramu przez użytkownika odbiory UX/QA i słabszego
urządzenia przeniesiono na koniec. G1 z planu wymaga lokalnej paczki, obsługi
klawiaturą, resetu, zapisu i powrotu; wszystkie te ścieżki działają lokalnie.
Osiem ekranów ma wymagane szkielety, a E2 próbkę. Na starcie dodano fotografię
NASA z opisem alternatywnym, podpisem i [rejestrem praw](app/docs/REJESTR_MEDIOW.md).
P1 zamknięto jako etap implementacji, bez deklarowania końcowego odbioru BL-08.

Źródłowe wymagania mówią, że oznaczenia projektu dostarczy ORE. Nie otrzymano
ich i bez nazwy/programu nie ma podstaw, by wybrać prawidłowy pakiet znaków.
Pełne media oraz profesjonalna polska narracja należą do P4, po zatwierdzeniu
tekstów; ręczna ocena dostępności, UX i urządzeń do odbioru końcowego P5.
Rzeczywista integracja ZPE pozostaje osobną bramką. Żadnej z tych akceptacji
nie uznano za wykonaną na podstawie samych testów automatycznych.

## P2 — pierwszy fragment E2 / Z02

Dodano zadanie ustawienia azymutu 90° i wysokości 30° przyciskami mapy. Ocena
używa separacji sferycznej i progu 2°. Wynik, liczba prób i najlepszy pomiar są
widoczne w raporcie oraz zapisywane w stanie v5 i eksporcie JSON. Start zatrzymuje
zegar, wyjście przywraca kierunek, a zamrożenie blokuje próby. Stare poprawne
stany v4 migrują atomowo. Fragment jest dostępny również w testowym hoście AMD.
Szczegóły: [ADR 007](app/docs/adr/007-zadanie-wspolrzedne.md).

Weryfikacja: **422/422 testy jednostkowe, 13/13 przeglądarkowych**, oba buildy,
3 pliki ES5/UTF-8. [Raport P2](app/docs/testy-p2.md). Jest to część BL-13/14/19/23,
a nie ukończenie tych pakietów ani bramki G2.

Pozostają wejścia z planu: zatwierdzony zakres katalogu Hipparcos/Tycho i prawo
redystrybucji; konkretne dane/epoki granic i figur IAU oraz prawa do tekstów;
zatwierdzone treści E1–E4, przykłady długookresowych modeli i skala ich
uproszczeń. Decyzje D09/D10 nadal są otwarte. Nie importowano katalogu bez tych
danych. E1, E3 i E4 pozostają szkieletami; E2 nie ma jeszcze siatek równikowych,
pełnych opisów i całego pakietu ćwiczeń. Pełny raport sesji/LMS należy do dalszej
pracy BL-23. G2 nie jest zamknięta.

## P2 — lokalne domknięcie implementacji E1–E4 i technicznego G2

Stan 04.10.2026. Na prośbę użytkownika samodzielnie wybrano i pozyskano dane
astronomiczne. Powtarzalny import obejmuje 8871 gwiazd ESA Hipparcos-1,
88 nazw gwiazdozbiorów, pięć granic IAU i pięć figur Stellarium. Źródła,
licencje, atrybucje, daty, zakres zmian i SHA-256 zapisano w
[rejestrze](01-wsad/REJESTR_ZRODEL.md); decyzje techniczne w
[ADR 008](app/docs/adr/008-p2-obserwatorium.md).

E1 ma tekstowy wykład, przełączane warstwy sfery i sprawdzenie celu. E2
pokazuje Słońce, Księżyc, siedem planet oraz gwiazdy z katalogu; siatkę
horyzontalną i równikową daty, figury, listę i kartę z odczytami. Można
zmieniać czas, miejsce, warstwy, kierunek i zoom; jest śledzenie, sterowanie
myszą/dotykiem oraz semantyczne przyciski. E3 porównuje pięć przykładów i
dwie półkule przy tej samej chwili UTC. E4 pokazuje ruch dobowy, roczny,
własny, model precesji, ślad ruchu wstecznego Marsa oraz trzy prawa Keplera.
Wyniki graficzne mają odpowiedniki liczbowe. Z02 zapisuje hipotezę, próbę,
ostatni pomiar, najlepszą separację, chwilę ukończenia i wniosek w stanie v6;
migracje v1–v5 zachowują istniejące dane bez dopowiadania brakujących pomiarów.

[Raport P2](app/docs/testy-p2.md) podaje: 539/539 testów jednostkowych,
14/14 przeglądarkowych, 450 utrwalonych referencji JPL dla dziewięciu ciał,
oba buildy i ES5/UTF-8, a także pomiar 8871 gwiazd w Chromium headless.
Techniczny warunek G2 z planu jest spełniony lokalnie. Zgodnie z decyzją
użytkownika próby słabego urządzenia wykonamy na końcu. Rzeczywiste ZPE,
odbiór naukowy/dydaktyczny, licencja CC BY-SA Stellarium bez numeru wersji i
ograniczenie NC ESA pozostają jawne; nie oznaczamy ich jako zatwierdzone.
Pakiety BL-19/23 mają w P2 tylko pierwszy pionowy fragment — ich pełny bank
zadań i raporty nauczyciela przypadają na P4. Kolejny etap implementacji: P3.

## P3 — implementacja E5–E6 i lokalna bramka G3 ukończone

Stan 04.10.2026. E5 zawiera plan i dziennik, Syriusza i Betelgezę, porównanie
wschodu, górowania i zachodu Słońca w czterech porach roku (Z03), lokalnie
zorientowaną tarczę oraz cztery kolejne fazy Księżyca (Z04), separację Marsa
od Słońca, kontakty i lokalną widoczność zaćmień oraz statystyczne modele
Perseidów i Leonidów. Tekst bezpieczeństwa oparto na NASA. E6 obejmuje
lornetkę, refraktor, reflektor, schemat i model 3D, obliczenia pola,
powiększenia oraz limitu szczegółowości (Z06), porównanie oka/okularu z
ekspozycją, analizę dwóch obrazów NASA/JPL i materiał o programach
astronomicznych. Modele mają odczyty semantyczne i wariant bez WebGL2.

Do katalogu i mapy dodano M31, M42, Ceres, 67P oraz cztery księżyce Jowisza.
Efemerydy małych ciał pobrano z JPL Horizons na lata 2024–2030 i zweryfikowano
na niezależnych próbkach; poza zakresem pokazujemy brak danych. Obrazy M31/M42
są osadzone offline z podpisami i kontrolą SHA. Pochodzenie i prawa:
[rejestr źródeł](01-wsad/REJESTR_ZRODEL.md); decyzje i ograniczenia:
[ADR 009](app/docs/adr/009-p3-obserwacje-instrumenty.md).

Weryfikacja: **554/554 testy jednostkowe**, oba buildy i ES5/UTF-8,
**17/17 testów przeglądarkowych** (w tym axe A/AA), `git diff --check`.
Szczegóły: [raport P3](app/docs/testy-p3.md). Techniczny warunek G3 jest
spełniony lokalnie. Formalny odbiór bezpieczeństwa tekstu BL-17, recenzja
astronomiczna, próby czytników i urządzeń, odbiór mediów Z13 oraz rzeczywista
integracja ZPE nie zostały przeprowadzone; to zależności eksperckie P5/P6,
a nie brakujące funkcje P3. Kolejny etap implementacji: P4.

## P4 — pierwszy fragment: E7, raport i trwały zapis

Stan 04.10.2026. E7 pokazuje przegląd sześciu wcześniejszych ekranów i pytania
do dyskusji, a z danych sesji buduje czytelne podsumowanie Z02, Z03, Z04, Z06
oraz dziennika. Uczeń wraca do lekcji bez utraty wyników. Raport można pobrać
jako JSON/CSV albo wydrukować; eksport CSV zabezpiecza treść notatek przed
interpretacją jako formuł.

Lokalny zapis ma teraz wybór trybu sesyjnego lub trwałego w IndexedDB. Trwały
stan odtwarza się po otwarciu nowej karty. Wyłączenie trwałego zapisu wymaga
potwierdzenia w UI i usuwa tę migawkę. Błędy pamięci są widoczne; import
pozostaje walidowany przed zmianą stanu. Szczegóły: [ADR 010](app/docs/adr/010-p4-raport-i-zapis.md).

Weryfikacja: **558/558 testów jednostkowych**, **19/19 przeglądarkowych**,
build lokalny i ZPE, kontrola ES5/UTF-8. Dowody i ograniczenia:
[raport fragmentu P4](app/docs/testy-p4-fragment.md).

**P4 trwa; G4 nie jest spełniona.** Nadal potrzebne są: pełny bank zadań i
pytań, słownik, test i przegląd błędów, E8 z obowiązkowymi mediami, treści dla
trzech poziomów, nagrania i odpowiedniki dostępnościowe, edytor nauczyciela,
lokalny raport zbiorczy oraz produkcyjny adapter ZPE. Zatwierdzone materiały
audio/wideo, logotypy i prawa do dystrybucji nie zostały dostarczone; decyzja
o ich zakresie i odbiór wymagają LID/PROD/MER. Nie oznaczamy szkieletu E8 ani
próbnego hosta ZPE jako gotowego produktu.

## P4 — kontynuacja: test, słownik, E8 i raporty nauczyciela

Stan 04.10.2026 po dalszej implementacji. Bank zawiera 40 wersjonowanych
pytań E1–E6, słownik 23 pojęcia z prostymi i rozwiniętymi definicjami.
E7 wybiera 12 pytań odpowiednich do poziomu, zapisuje próby w stanie v7,
pozwala je ponawiać i wracać do błędnych odpowiedzi. Migracja v6→v7 zachowuje
wcześniejsze wyniki. Raport ucznia zawiera teraz odpowiedzi, ich poprawność,
liczbę prób, identyfikator sesji i wersję treści.

E8 pokazuje trzy symulacje dostępne offline i trzy opisane pozycje IAU/NASA,
których pełne strony wymagają świadomego otwarcia online. Filmy nadal nie są
dostarczone; sekcja wskazuje ten brak zamiast udawać materiał obowiązkowy.
`teacher.html` pozwala lokalnie importować raporty JSON, deduplikować je według
sesji i wersji, przeglądać tylko do odczytu oraz eksportować zbiorczy CSV.
Źródła i prawa: [rejestr](01-wsad/REJESTR_ZRODEL.md); decyzje:
[ADR 011](app/docs/adr/011-p4-test-slownik-zasoby.md).

Weryfikacja: **561/561 testów jednostkowych**, **20/20 testów Chromium**,
lokalny build, próbny build ZPE i kontrola ES5/UTF-8. Automatyczne axe A/AA
dla E7, E8 i strony nauczyciela nie wykazało naruszeń. Szczegóły:
[raport kontynuacji](app/docs/testy-p4-kontynuacja.md).

**G4 nadal otwarta.** Technicznie brakuje edytora konfiguracji i własnych
zadań nauczyciela, praktycznych Z01 i trwałego wyniku wyszukania Oriona oraz
widocznych planet, pozostałych zadań do uzgodnionej liczby, pełnego adaptera
ZPE dla E1–E8 i podglądu ucznia w LMS. Treści 40 pytań i słownika wymagają
odbioru MER/LID. Do ukończenia E8 i pełnego wprowadzenia potrzebne są
zatwierdzone filmy, narracja człowieka, napisy, transkrypcje, audiodeskrypcja,
metadane praw i logotypy ORE. Brak decyzji o wolumenie mediów, docelowej
liczbie zadań oraz docelowych przeglądarkach nie jest zastępowany założeniem
programistycznym. Odbiór P5 i rzeczywista integracja ZPE/P6 pozostają osobne.
Lista działań i warunki ich ukończenia: [P4 — prace do G4](app/docs/P4_POZOSTALO.md).

## P4 — edytor, zadania i odsyłacze E8.1

Stan 05.10.2026. Doprecyzowanie użytkownika zmienia realizację E8.1: sekcja
zawiera trzy polskojęzyczne linki YouTube ESA/Politechniki Wrocławskiej,
bez kopiowania i hostowania filmów. Są jawnie opcjonalne i wymagają internetu.
Wcześniejsze stwierdzenie o braku filmów w E8 pozostaje historycznym stanem
z 04.10.2026, a nie bieżącą listą braków.

Powstał wspólny edytor konfiguracji lokalnej i ZPE: wybór/kolejność scen,
poziomów i obiektów, warstwy E3, data/miejsce/obiekt startowy, zakres dat,
własne pytania E7 oraz zadania E2 wyboru obiektu lub współrzędnych. Walidacja
odrzuca ukryte cele, cele obiektowe pod horyzontem na starcie, daty poza
ważnością, brak treści/podpowiedzi i niepoprawne pola. Import/eksport JSON
nie wykonuje kodu. Lekcja ucznia stosuje konfigurację.

Z01 „Gdzie jest Mars?” ma powtarzalny widok i zapis prób, podobnie jak
wskazanie Oriona w E3. Zadanie planet przyjmuje geometryczne kryterium
położenia nad horyzontem (Warszawa, 16.01.2025 20:00 UTC: Mars, Jowisz,
Uran i Neptun) i zaznacza, że nie jest ono równoznaczne z widocznością gołym
okiem. Własne zadania i pytania zapisują próby w stanie v8;
`contentVersion` podniesiono do 0.3.0, dodano migrację v7→v8 i zachowano
wcześniejsze migracje. Raport ucznia i zbiorczy raport nauczyciela uwzględniają
wyniki. Próbny silnik ZPE uruchamia pełną lekcję, gdy otrzyma konfigurację
`lesson`; starszy tryb samego obserwatorium pozostaje dla dotychczasowych
instancji. Lokalny harness potwierdza pełną lekcję i zamrożenie stanu.

Weryfikacja bieżącego zakresu: **564/564 testy jednostkowe, 23/23 testy
Chromium**, build lokalny i ZPE, kontrola ES5/UTF-8 oraz `git diff --check`.

**G4 nadal otwarta.** Do rozstrzygnięcia merytorycznego pozostaje docelowa liczba
zadań i recenzja treści. Osobno wymagane są materiały narracyjne przewidziane
w planie, oznaczenia ORE i próba z rzeczywistym ZPE/LMS; lokalny harness nie
ma dostępu do wyników klasy. Szeroki audyt urządzeń i dostępności odłożono
zgodnie z decyzją użytkownika. Szczegóły: [ADR 012](app/docs/adr/012-p4-edytor-zadania-zpe-filmy.md),
[raport](app/docs/testy-p4-edytor.md) i [lista pozostałych prac](app/docs/P4_POZOSTALO.md).

## P4 — działająca beta z danymi próbnymi

Stan 05.10.2026. Zgodnie z najnowszą decyzją właściciela materiału uzupełniono
brakujące dane przykładowymi wartościami. Wszystkie E1–E8 mają osobny tekst
podstawowy, rozszerzony i ekspercki. Powstały 24 lokalne nagrania MP3 syntezy
mowy, po jednym na scenę i poziom. Tekst jest widoczną transkrypcją, audio
włącza uczeń. Status scen zmieniono z `prototype` na `sample`, żeby nie
przedstawiać wersji demonstracyjnej jako treści odebranej. Rejestr rozmiarów i
SHA-256 pilnuje kompletności obu pakietów. Jako próbny zakres przyjęto siedem
istniejących ćwiczeń; astronomiczne odczyty pozostają wynikiem modelu.

Weryfikacja: **564/564 testy jednostkowe, 24/24 testy Chromium**, build lokalny
i próbny ZPE, kontrola ES5/UTF-8, sprawdzenie profilu MP3 oraz
`git diff --check`. Szczegóły: [ADR 013](app/docs/adr/013-p4-dane-probne-narracja.md)
i [raport](app/docs/testy-p4-dane-probne.md).

**Implementacja demonstracyjnej bety P4 jest ukończona lokalnie. Formalny
odbiór G4 jest otwarty.** Do wydania potrzebne są: recenzja treści i pytań,
potwierdzone prawa do narracji lub jej wymiana, materiały identyfikacyjne ORE
oraz próba w rzeczywistym ZPE/LMS z integratorem. Audyt urządzeń,
dostępności i ATAG został odłożony decyzją użytkownika. Aktualną listę
zależności zawiera [P4 — pozostały odbiór](app/docs/P4_POZOSTALO.md).

## P5 — rozpoczęcie audytu BL-26

Stan 05.10.2026. Dodano próbę E1–E8 dla trzech poziomów i sześciu szerokości
od 320 do 1920 px, automatyczny skan axe A/AA ośmiu scen oraz kontrolę
automatycznych żądań poza lokalny serwer. Znaleziono i poprawiono poziome
przewijanie strony spowodowane tabelą E3; trzy tabele E4 otrzymały ten sam
przewijany kontener. Przewijanie tabeli E3 klawiszem zostało sprawdzone.

Weryfikacja: **564/564 testy jednostkowe, 26/26 testów Chromium**, build lokalny
i ZPE, kontrola ES5/UTF-8. Szczegółowy zakres i granice dowodu:
[raport fragmentu P5](app/docs/testy-p5-fragment.md). **G5 pozostaje otwarta**:
BL-25 wymaga recenzji MER, BL-26 prób rzeczywistych urządzeń, czytników,
wydajności i pełnej macierzy, a BL-27 pilotażu z uczniami i nauczycielem.

## P6 — przygotowanie paczki demonstracyjnej

Stan 05.10.2026. Rozpoczęto techniczny fragment BL-28. Dołączony serwer
udostępnia teraz lokalne MP3 jako `audio/mpeg` oraz rozpoznaje MP4 i WebVTT.
Instrukcja paczki została uaktualniona do stanu demonstracyjnej bety P4.
`build:demo` tworzy manifest wersji, daty, rozmiarów i SHA-256; osobne
`verify:demo` sprawdza kompletność oraz integralność wszystkich plików.
Build i kontrola 372 plików przeszły, a próbka HTTP potwierdziła stronę
ucznia, nauczyciela i nagranie. [Raport P6](app/docs/testy-p6-fragment.md)
zawiera zakres oraz granice dowodu.

**G6 pozostaje otwarta.** P5/G5 nie ma odbioru; nie wykonano czystej
instalacji, pełnej próby offline, archiwum wydaniowego ani integracji w
rzeczywistym ZPE. Katalog `dist/local` może zawierać zasoby starszych buildów,
gdyż Vite nie czyści go automatycznie. Wymagane są też recenzje treści,
prawa/oznaczenia mediów i ustalenie właściciela 12 miesięcy wsparcia.
