# ADR 003 — obliczenia lokalne i Worker

Data: 03.10.2026. Stan: przyjęte dla lokalnego prototypu BL-04, odbiór ekspercki pełnego materiału nadal otwarty.

Wymagania: PLAN_PROJEKTU §7/14, BL-04, NFR-06, SIM-04. Astronomy Engine 2.1.19 za adapterem `calculateSnapshot` dostarcza kierunki Słońca, Księżyca i Marsa. Wybór biblioteki wynika z planu; wersję sprawdzono testem i przypięto wraz z licencją MIT.

Konwencje: observer latitude/longitude w stopniach (N/E dodatnie), wysokość w metrach; czas ISO UTC, strefa IANA tylko do prezentacji. `Equator(..., true, true)` uwzględnia paralaksę, czas biegu światła i aberrację, zwraca układ równika/równonocy daty. RA w godzinach, Dec w stopniach, dystans w au. `Horizon` zwraca azymut N→E i wysokość w stopniach. Refrakcja domyślnie wyłączona, opcjonalnie przybliżony wariant `normal`. RA/Dec pozostają bez refrakcji. Określenie „nad horyzontem” dotyczy środka ciała i nie obiecuje widoczności ani wschodu górnej krawędzi.

Zakres próbny: 1900-01-01 do końca 2100, zgodnie z propozycją planu; poza nim nie zwracamy ekstrapolacji. Wysokość obserwatora ograniczona technicznie do −500…10 000 m, czyli obserwacji naziemnych. Inne zastosowania potrzebują osobnej decyzji. Status `prototype` informuje, że próbki referencyjne nie są gwarancją dokładności każdego punktu zakresu. Zmiana lat nie daje zgody na długookresowy model edukacyjny.

Worker korzysta z identycznego modułu jak wariant zastępczy. Klient ma jedną obliczaną i jedną najnowszą oczekującą rewizję; starsze wyniki nie zastępują nowych. Niedostępne API, odmowa CSP, błąd transmisji lub 5 s bez odpowiedzi kończą Workera i uruchamiają lokalną porcję trzech obiektów po oddaniu sterowania pętli zdarzeń. Nie dodano długich wyszukiwań zdarzeń; będą wymagać osobnego porcjowania i anulowania. `destroy` kończy Workera, timery i oczekujące obietnice.

Stan v2 dodaje obserwatora i refrakcję. Migracja v1 zachowuje UTC/strefę/wybór i dodaje początkową Warszawę (52.2297°N, 21.0122°E, 100 m) oraz wyłączoną refrakcję. Migracja działa dopiero po pełnej walidacji znanego starego schematu. Zapis v1 nie jest automatycznie nadpisywany przy samym odczycie.

Referencje: 360 topocentrycznych pozycji NASA/JPL Horizons, 12 miejsc, 10 dat obejmujących granice zakresu, pory roku, rok przestępny i DST. Test porównuje separację kierunków, nie różnicę azymutów przy zenicie. Maksimum: **1.432761′ w RA/Dec i 1.703333′ w układzie horyzontalnym**, przy kryterium 2′. Horizons przed 1962 r. używa UT1, później UTC; przyszłe sekundy przestępne i EOP są nieznane. Różnice modeli precesji/nutacji i skali czasu są częścią ograniczeń porównania. Nie zweryfikowano jeszcze zdarzeń, faz, gwiazd, innych ciał ani dokładności rozmiarów.

Źródła: [Astronomy Engine API](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md), [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), [opis współrzędnych Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html). Surowe odpowiedzi, URL i SHA-256: `tests/astronomy/fixtures/`. Skrypt `tools/prepare-horizons-fixtures.mjs` pobiera dane tylko na jawne uruchomienie przez programistę; testy i aplikacja nie łączą się z JPL.
