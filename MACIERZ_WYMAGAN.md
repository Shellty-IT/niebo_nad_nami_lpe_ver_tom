# Macierz wymagań — „Niebo nad nami”, VII.6

Wersja 1.3 • 4 października 2026 • uzupełnienie [planu projektu](PLAN_PROJEKTU.md)

**Formalny status odbioru wszystkich pozycji: otwarty.** Wykonano lokalne próby P0–P3, demonstracyjną betę P4 i pierwszy fragment audytu technicznego P5. Dowody są śledzone w [POSTEP_PRAC.md](POSTEP_PRAC.md), [raporcie P4](app/docs/testy-p4-dane-probne.md) i [raporcie P5](app/docs/testy-p5-fragment.md). Nie oznacza to odbioru całego wydania. Zgodnie z decyzją użytkownika z 03.10.2026 najpierw weryfikujemy aplikację lokalną; wymagania ZPE mogą pozostawać niespełnione i nie blokują prac lokalnych. Kryteria docelowego odbioru pozostają bez zmian. „Wydanie” oznacza pełny materiał, a nie pierwszy prototyp.

Źródła: **S** — załączony scenariusz VII.6, 13 stron; **U** — wymagania użytkownika; **API** — dokumentacja komponentów ZPE z 03.02.2026; **Z11** — załącznik nr 11 z repozytorium; **Z13** — załącznik nr 13 z 24.06.2024, 7 stron; **R** — konwencje i layout repozytorium. Numery stron oznaczają strony PDF. P0–P6 odpowiadają etapom planu. Powiązanie wszystkich 74 pozycji z konkretnymi pakietami prac znajduje się w [ZADANIA_IMPLEMENTACYJNE.md](ZADANIA_IMPLEMENTACYJNE.md).

## Ekrany i treści

| ID | Wymaganie i źródło | Moduł / etap | Kryterium odbioru |
|---|---|---|---|
| EDU-01 | Start, ustawienia przed wejściem, centralny przycisk i logotypy; Z11 3, S 9 | `ui`, `accessibility`; P1 | Ekran startowy działa klawiaturą; ustawienia są dostępne przed odtworzeniem multimediów; komplet dostarczonych oznaczeń projektu |
| EDU-02 | Sześć scen wprowadzenia: przestrzeń, interfejs, lokalizacja, obiekt, efekty, podsumowanie; S 3–4 | `education`, multimedia; P1/P4 | Wszystkie sześć kroków można przejść, pominąć i powtórzyć; narracja ma równoważną treść tekstową |
| EDU-03 | E1, scena 1: podstawowe pojęcia; S 5–6 | `education`, `rendering`; P2 | Sfera, ekliptyka, równik, zenit i horyzont mają definicję, ilustrację i dostępną interakcję |
| EDU-04 | E2: 2.1 sfera, 2.2 współrzędne, 2.2.1 RA/Dec, 2.2.2 wysokość/azymut; S 6 | `astronomy`, `education`; P2 | Jedno ciało ma zgodne odczyty w obu układach; zmiana miejsca i czasu daje poprawną zmianę wartości |
| EDU-05 | E3: 3.1 historia, 3.2 przykłady, 3.2.1 północ, 3.2.2 południe; S 6 | katalog gwiazdozbiorów, `education`; P2/P4 | Wszystkie wskazane przykłady i mity są omówione; sceny porównania półkul działają i nie mylą półkuli obserwatora z granicami konstelacji |
| EDU-06 | E4.1 ruch własny i pozorny, Gwiazda Barnarda; S 6 | `astronomy`, ślady ruchu; P2 | Przełączenie modelu pokazuje różnicę mechanizmów; czas i skala są jawne, a wniosek można sformułować bez odczytu samej grafiki |
| EDU-07 | Precesja i ruch roczny; S 4 | `orbital`, `education`; P2 | Długookresowy model ma oznaczone uproszczenia i osobny zakres; pokazuje zmianę osi/biegunów oraz roczny ruch Słońca |
| EDU-08 | E4.2.1 ruch prosty i wsteczny; S 6 | efemerydy i tory; P2 | Dla zatwierdzonego okresu pętla Marsa odpowiada referencji; jej przyczyna ma poprawne wyjaśnienie |
| EDU-09 | E4.2.2 trzy prawa Keplera; S 6 | schemat orbitalny; P2/P3 | Elipsa, równe pola i T²/a³ mają działającą manipulację, pomiar i omówienie; dydaktyczne zmiany orbity nie zmieniają rzeczywistych efemeryd |
| EDU-10 | E5.1 przygotowanie obserwacji; S 6 | plan obserwacji; P3 | Wybór miejsca, czasu i sprzętu kończy się zapisanym planem; omówione światło, horyzont i warunki obserwacji |
| EDU-11 | E5.2 identyfikacja gwiazd, Syriusz, Betelgeza; S 6 | katalog, karty, zadania; P3 | Uczeń rozpoznaje wskazane obiekty mapą lub semantycznym interfejsem; karty zawierają zweryfikowane cechy |
| EDU-12 | E5.3 fazy, koniunkcje i opozycje; S 6 | `astronomy`, fazy; P3 | Zmiana daty aktualizuje fazę i geometrię; zadania działają dla okresów referencyjnych |
| EDU-13 | E5.4.1 zaćmienia i bezpieczeństwo; S 7 | zdarzenia, model geometrii; P3 | Co najmniej zatwierdzone przykłady obu rodzajów zaćmień, widoczność lokalna i poprawna informacja o bezpiecznej obserwacji |
| EDU-14 | E5.4.2 meteory, Perseidy, Leonidy; S 7 | model dydaktyczny rojów; P3 | Radiant i sezon aktywności opisane; smugi oznaczone jako symulacja, nie przewidywanie konkretnych meteorów |
| EDU-15 | E6.1 teleskopy, refraktor, reflektor, lornetka; S 7 | `telescope`, treści; P3 | Zmiana ogniskowej/okularu wpływa zgodnie z modelem na powiększenie i pole widzenia; porównanie budowy narzędzi |
| EDU-16 | E6.2 fotografia i analiza obrazów; S 7 | treści, model ekspozycji; P3/P4 | Przykłady mają źródło, opis i informację o sposobie obrazowania; uczeń rozróżnia zdjęcie od widoku przez okular |
| EDU-17 | E6.3 oprogramowanie, Stellarium i SkySafari; S 7 | `education`; P4 | Dostępne opisy zastosowania do planowania obserwacji; wykonanie lekcji nie wymaga instalowania tych programów |
| EDU-18 | E7.1 podsumowanie i E7.2 dyskusja; S 7 | `education`, `reports`; P4 | Przegląd celów, wyników i pytania do refleksji; możliwość powrotu do scen bez utraty wyników |
| EDU-19 | E8.1 filmy, E8.2 symulacje, E8.3 literatura; S 7 | zasoby, bibliografia; P4 | Wszystkie trzy grupy istnieją; pozycje mają opisy i status offline; treści obowiązkowe nie zależą od zewnętrznego serwera |
| EDU-20 | Menu tematyczne i kategorie ciał; S 4–5, U | nawigacja, katalog; P2/P4 | Dostępne sfera, gwiazdozbiory, ruchy, ciała, obserwacje, narzędzia; linki prowadzą do właściwej sceny lub karty |
| EDU-21 | Zróżnicowanie poziomów i prosty język; S 1–2, 5, 8, 11 | treści i konfiguracja; P1/P4 | Treści podstawowe, rozszerzone i eksperckie odpowiadają celom; zmiana poziomu nie resetuje sesji; redakcja dydaktyczna |

## Obserwatorium i interakcje

| ID | Wymaganie i źródło | Moduł / etap | Kryterium odbioru |
|---|---|---|---|
| SIM-01 | Gwiazdy, Słońce, Księżyc, planety, obiekty mgławicowe; S 2, 5, U | katalogi, astronomia, rendering; P2/P3 | Zatwierdzony zestaw obiektów widoczny we właściwych kierunkach i chwilach; katalog rozpoznaje wszystkie wymagane typy |
| SIM-02 | Klikalne księżyce, planetoidy, komety i galaktyki; S 4, U | karty i dostawcy pozycji; P3/P4 | Co najmniej zatwierdzone przykłady każdej kategorii mają kartę i interakcję; obiekty z ograniczonymi efemerydami podają ważność |
| SIM-03 | Czas rzeczywisty, zwalnianie, przyspieszanie i pauza; S 2, 5, 12 | zegar symulacji; P2 | Tempo odpowiada upływowi czasu symulowanego; pauza stabilna; odtworzenie wyniku niezależne od FPS |
| SIM-04 | Zmiana daty, czasu i lokalizacji; S 3, 12 | formularze, strefy, astronomia; P2 | Dowolne poprawne współrzędne; jawna strefa/UTC; obsługa DST, roku przestępnego i granic zakresów |
| SIM-05 | Lista miejsc i szybki dostęp; S 12 | lokalizacje i historia; P2/P4 | Wybór miejsca z listy lub mapy, powrót do historii, równoważne pola liczbowe; brak zależności od zewnętrznej mapy |
| SIM-06 | Swobodne przesuwanie, zoom i wybór; S 12 | kamera i sterowanie; P2 | Mysz, dotyk, klawiatura i przyciski; brak wymaganych gestów wielopunktowych i konieczności trafienia w mały punkt |
| SIM-07 | Sfera, równik, ekliptyka, zenit, nadir, horyzont, bieguny; S 4, 6, U | warstwy; P2 | Każdy element można pokazać/ukryć i odczytać jego znaczenie; prawidłowa orientacja dla obserwatora |
| SIM-08 | Dobowy/roczny ruch, fazy i trajektorie; S 2, 4, U | astronomia i ślady; P2/P3 | Referencyjne scenariusze i porównanie danych; brak błędów na przejściu 0°/360° |
| SIM-09 | Informacje: rozmiar, masa, odległość, warunki, zdjęcia; S 3, 12 | `ObjectInspector`; P2/P4 | Dane mają jednostkę, źródło i status niepewności; brak danych nie jest zastępowany wymyśloną wartością |
| SIM-10 | Symulacja teleskopu i różne powiększenia; S 2, U | renderer teleskopu; P3 | Pole widzenia i rozmiar kątowy spójne; ograniczenia szczegółowości i różnica foto/okular są widoczne |
| SIM-11 | Nazwy, linie, warstwy, jasność i kolory; S 5, 12 | rendering, preferencje; P2/P4 | Ustawienia działają niezależnie i zapisują się; żaden tryb nie usuwa dostępu do koniecznych informacji |
| SIM-12 | Eksploracja i tryb edukacyjny; S 12–13 | runner scen, konfiguracja; P1/P4 | Oba tryby dostępne; zadania mają odtwarzalne warunki początkowe i zachowują widok po powrocie |
| SIM-13 | Realistyczne grafiki i modele 3D; S 5, 8, U | Three.js i zasoby; P2/P3 | Model sfery/orbit/instrumentów jest interaktywny, dane i schematy poprawnie oznaczone; brak WebGL nie odcina celów lekcji |

## Nauka, nauczyciel i zapis

| ID | Wymaganie i źródło | Moduł / etap | Kryterium odbioru |
|---|---|---|---|
| LEARN-01 | Wykłady, eksperymenty, zadania praktyczne, dyskusja; S 2, 5, 7–8 | `education`; P2–P4 | Każda metoda występuje w materiale i ma cel; aktywności wymagają zastosowania wiedzy |
| LEARN-02 | Pomiary, analiza, hipotezy i wnioski; S 2–3, 7–8 | notebook i zadania; P3/P4 | Uczeń zapisuje warunki i wynik, porównuje pomiary, formułuje wniosek i może go odtworzyć |
| LEARN-03 | Podpowiedzi, dodatkowe materiały i notatki; S 8 | pomoc, notebook; P4 | Pomoc dostępna w kontekście i na żądanie, notatka zapisywana, brak limitu czasu |
| LEARN-04 | Quizy, zadania lokalizacyjne i scenariusze poszukiwań; S 12–13 | task/quiz runner; P4 | Wskazanie Marsa, odnalezienie Oriona i znalezienie widocznych planet mają poprawne kryteria; ponowne próby możliwe |
| LEARN-05 | Test przekrojowy i słownik; U, R | bank pytań, słownik; P4 | Pokrycie celów, uzasadnienia odpowiedzi, prosta wersja pojęć, konfiguracja poziomu i zasad testu |
| SAVE-01 | Historia miejsc, obiektów i postępów; S 13 | persistence; P1/P4 | Po zamknięciu i ponownym wejściu poprawne odtworzenie; możliwość powrotu do zapisanej obserwacji |
| SAVE-02 | Preferencje dostępności; S 9, Z11 4 | preferencje i host; P1 | Użytkownik wybiera pamiętanie na sesję lub dłużej; ustawienia obowiązują przed startem lekcji |
| SAVE-03 | Odpowiedzi, wyniki i osiągnięcia; S 13 | stan i raporty; P4 | Wynik powiązany z zadaniem i wersją treści; osiągnięcia opisują cele, a nie czas spędzony w aplikacji |
| TEACH-01 | Wybór warstw i punktów interakcji; S 13 | edytor lokalny/ZPE; P4 | Konfiguracja nauczyciela zmienia instancję lekcji; walidator wykrywa ukryty obiekt wymagany w zadaniu |
| TEACH-02 | Tworzenie własnych quizów i zadań; S 13 | edytor; P4 | Autor tworzy pytanie, cel, tolerancję, opis i podpowiedź; zapis/odtworzenie konfiguracji bez kodu |
| TEACH-03 | Analiza wyników i interakcji ucznia; S 13 | reports i LMS; P0/P4 | Raport wybranego ucznia z rzeczywistym stanem; podgląd tylko do odczytu; przepływ potwierdzony w ZPE |
| TEACH-04 | Generowanie raportów; S 13 | eksport, lokalny import zbiorczy; P4 | JSON/CSV i wydruk sesji; agregacja jawnie zaimportowanych raportów lokalnie; odbiór funkcji zbiorczych ZPE po demonstracji z integratorem |
| TEACH-05 | Podsumowanie wyników i historii dla ucznia; S 13 | E7, reports; P4 | Dostępne w aplikacji, zawiera błędne odpowiedzi i historię oraz pozwala wrócić do nauki |

## Dostępność, jakość i dostarczenie

| ID | Wymaganie i źródło | Moduł / etap | Kryterium odbioru |
|---|---|---|---|
| A11Y-01 | UDL, WCAG, obsługa wszystkich funkcji; S 9–12 | całe rozwiązanie; P0–P5 | Audyt pełnych przepływów na wszystkich poziomach, nie tylko strony startowej; usunięte blokery |
| A11Y-02 | Tutorial i pomoc prostym językiem; S 9–10 | onboarding i pomoc; P1/P4 | Przed nauką można poznać sterowanie i dostosowania; instrukcja dostępna z każdej sceny |
| A11Y-03 | Klawiatura, dotyk, technologie asystujące; S 9–11 | UI, kontrolery; P1–P5 | Przejście zadania bez myszy; logiczny fokus i brak pułapek; nazwy kontrolek działają z systemowym sterowaniem głosowym |
| A11Y-04 | Brak QTE, złożonych gestów i presji czasu; S 10–11 | zadania, kamera; P1–P5 | Każda akcja przeciągania ma proste sterowanie; zadanie i okno nie wygasają; ponowne próby dostępne |
| A11Y-05 | Kontrast, font, rozmiar, kursor i barwy; S 10–11 | tokeny i preferencje; P1/P5 | Audyt kontrastu w każdym wariancie, duże kontrolki, czytelny celownik i brak znaczeń wyłącznie kolorem |
| A11Y-06 | Opisy grafik i dynamicznych zmian; S 10–11 | model semantyczny, komunikaty; P2–P5 | Czytnik odczytuje stan i istotną zmianę po pauzie; brak lawiny komunikatów podczas animacji |
| A11Y-07 | Napisy, transkrypcje, audiodeskrypcja; S 10–11 | multimedia; P4/P5 | Wszystkie znaczące treści audio/wideo mają wymagane odpowiedniki; napisy można skonfigurować przed dźwiękiem |
| A11Y-08 | Dźwięk mono/stereo i niezależna regulacja; S 10–11 | audio; P3/P4 | Muzyka, narracja i sygnały mają osobną głośność; znaczenie sygnału dostępne tekstowo |
| A11Y-09 | Zintegrowany dostęp do funkcji i konsultacje ORE; S 10, 12 | UI i proces odbioru; P1/P5 | Mapa, odczyty i zadanie używają tego samego stanu; alternatywa nie usuwa celów; dokumentacja konsultacji |
| A11Y-10 | ATAG dla narzędzi autorskich; S 9, Z11 4 | edytor; P4/P5 | Dostępna edycja; walidacja opisów obrazów i pytań; autor otrzymuje pomoc w tworzeniu dostępnej treści |
| NFR-01 | Łatwe lokalne uruchomienie; U | standalone i launcher; P1/P6 | Działa opisana ścieżka developerska i gotowa paczka z serwerem statycznym; jasno podane wymaganie Node |
| NFR-02 | Offline i brak zewnętrznych zależności runtime; API 2, 6; Z11 10, 14 | assets i host; P0/P6 | Obowiązkowe funkcje działają przy odciętej sieci; brak CDN/API/map online i brak automatycznie ładowanych zewnętrznych mediów |
| NFR-03 | Modularność i rozszerzalność; U, Z11 5, 8 | architektura; P1–P4 | Obliczenia testowalne bez DOM; nowa scena dodawana jako dane; host ZPE nie przenika do domeny |
| NFR-04 | Niebieski, przejrzysty UI i responsywność; U, S 8 | design system; P1/P5 | Zatwierdzona makieta i test szerokości kontenera, małych ekranów, powiększenia oraz dotyku |
| NFR-05 | Płynność i oszczędne zasoby; U, Z11 12 | rendering i harmonogram; P0/P2/P5 | Raport 60 FPS na uzgodnionych urządzeniach, rozmiarów i pamięci; udokumentowane warunki pomiaru |
| NFR-06 | Poprawność astronomiczna; U, S 5 | astronomy; P2/P5 | Referencyjne porównania z jawnymi jednostkami i konwencjami; zgodne tolerancje i ważność danych |
| NFR-07 | Ochrona danych i stabilny zapis; Z11 6–9 | persistence, host; P1/P5 | Walidacja importu i stanu, brak niepotrzebnych danych osobowych, kasowanie/eksport, błędy zapisu widoczne |
| NFR-08 | Przygotowanie wielojęzyczne; Z11 5, 10 | i18n i treści; P1/P4 | Teksty oddzielone od kodu; identyfikatory stabilne; polska wersja kompletna i instrukcja dodania języka |
| ZPE-01 | Komponent własnego silnika i edytor; Z11 9–10, API 2–7, 23–26 | host i build; P0/P4/P6 | Silnik rejestrowalny w platformie, instancja tworzona przez edytor; wymagane manifesty poprawne |
| ZPE-02 | ES5, AMD/UMD, UTF-8 bez BOM; API 2, 5 | pipeline ZPE; P0/P6 | Acorn parsuje wszystkie dostarczone pliki JS jako ES5; moduł uruchamia się w hoście AMD |
| ZPE-03 | Izolacja DOM/CSS, brak globali i polyfilli; API 6 | UI i pipeline; P0/P5 | Dwie instancje i reszta strony zachowują działanie/wygląd; brak patchowania globalnego środowiska |
| ZPE-04 | Stan, zamrożenie i walidacja; API 8–10 | adapter i store; P0/P4 | Przywrócenie przez host, brak zmian przy zamrożeniu, poprawność zadania z wersją konfiguracji |
| ZPE-05 | Zasoby, fonty, pełny ekran i klawiatura ekranowa; API 11–13 | host; P1/P5 | Użycie właściwych metod hosta; dostępność w oknie i pełnym ekranie; brak własnych fontów w głównej ramce |
| ZPE-06 | Cykl życia i WebGL; API 3, 6–8 | rendering, host; P0/P5 | `useWebGL` zadeklarowane; destroy zwalnia zasoby; utrata kontekstu ma kontrolowaną obsługę |
| DEL-01 | Profesjonalna narracja i wymagania mediów; Z11 10–11, Z13 3–7 | produkcja; P0/P4 | Profile grafik, MP4, MP3 i WebVTT zgodne z rozdziałem 12 planu; komplet napisów/audiodeskrypcji, praw, metadanych i źródeł; odbiór techniczny oraz ręczna ocena jakości |
| DEL-02 | Testy, źródła, dokumentacja i przekazanie; Z11 10–13, 17 | QA i wydanie; P5/P6 | Instrukcja czystej instalacji, raporty, komplet źródeł i licencji oraz odtwarzalny build |
| DEL-03 | Utrzymanie po projekcie; Z11 11 | proces utrzymania; P6 | Właściciel zgłoszeń, aktualizacji i migracji; organizacyjnie zapewnione minimum 12 miesięcy wsparcia |

## Otwarte ustalenia przed implementacją pełnego zakresu

| Decyzja | Osoba/rola odpowiedzialna w projekcie | Termin | Wpływ |
|---|---|---|---|
| Dokładny zakres urządzeń: API Edge 94/Safari 17, Z13 Edge 79/Safari 13, Z11 iOS 14 | Integrator ZPE + kierownik materiału | G0 | Dobór wersji bibliotek i rendererów, testy; prototyp używa macierzy API, odbiór wymaga udokumentowania rozbieżności |
| Działanie Workera, WebGL i zasobów w docelowym hoście | Programista + integrator | G0 | Wydajność i sposób pakowania |
| Raport zbiorczy i przepływ podglądu ucznia w LMS | Integrator + reprezentant nauczycieli | G0 | Pełny odbiór funkcji ze s. 13 |
| Liczba obiektów, zadań, pytań i dokładny zakres epok | Ekspert astronomii + autor treści | G0 | Koszt treści i zakres danych |
| Licencje katalogów, granic gwiazdozbiorów i mediów | Osoba prowadząca materiał + właściciele danych | G0/G1 | Możliwość dystrybucji paczki |
| Podstawa kontraktowa WCAG, zakres ATAG i równoważność zadań | Ekspert dostępności + ORE | G0 i audyt P5 | Kryteria odbioru i projekt interakcji |
| Interpretacja ogólnych zapisów OpenXR dla standardowego VII.6 | Integrator + osoba prowadząca materiał | G0 | Potwierdzenie zakresu 2D/3D bez rozszerzania na VR |
| Liczba i czas filmów/nagrań, dostępność lektora oraz harmonogram produkcji | Producent multimediów + redaktor | G0/G1 | Profile Z13 są rozpisane w planie; do ustalenia pozostaje wolumen produkcji i wynikający z niego rozmiar pakietu |

Otwarte ustalenia są zadaniami projektu. Nie oznaczają, że brakujące funkcje można pominąć albo uznać za odebrane.
