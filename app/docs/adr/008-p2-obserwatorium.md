# ADR 008 — lokalny zakres P2: katalogi, E1–E4 i raport Z02

Data: 04.10.2026. Stan: implementacja lokalna; odbiór naukowy, dydaktyczny, licencyjny i platformowy pozostaje osobnym etapem.

## Dane i obliczenia

Hipparcos-1 pobieramy jako utrwalony podzbiór przez ESASky Legacy TAP. Import sprawdza SHA-256, identyfikatory, jednostki, zakres jasności, epokę J1991.25 i 24 obszary RA. W runtime jest 8871 gwiazd; cztery rekordy bez RA/Dec pominięto. Własny ruch propagujemy liniowo w płaszczyźnie stycznej i obracamy z ICRS do lokalnego horyzontu przez Astronomy Engine. Nie modelujemy tu ruchu radialnego ani szczegółowej fotometrii, więc nie podajemy gwiazdom nieuzasadnionej dokładności wielotysięcznych lat. Dane ESA wymagają „Credit: ESA” i podlegają CC BY-NC 3.0 IGO.

Pięć granic IAU J2000 jest odrębną warstwą od pięciu umownych figur Stellarium. Użyto tylko identyfikatorów HIP linii, bez ilustracji i bez niezgodnych epokowo odcinków `edges` B1875. W aplikacji są też nazwy 88 obszarów. Teksty kulturowe są własnym polskim opracowaniem na podstawie IAU/NASA. Licencje, URL, modyfikacje i sumy są w `01-wsad/REJESTR_ZRODEL.md` i `app/licenses/README.md`.

Słońce, Księżyc i siedem planet mają wspólny kontrakt pozycji topocentrycznej, fazy oświetlenia (poza Słońcem), jasności i średnicy kątowej. Średnice fizyczne pochodzą z NASA/NSSDC, odległość z efemerydy, a faza/jasność z Astronomy Engine. Dla olbrzymów gazowych średnica jest przybliżeniem tarczy obłoków; znaczniki mapy nie są rysowane w rzeczywistej skali. Refrakcja jest opcją, a zakres 1900–2100 pozostaje oznaczony jako próbny.

## Interakcja i sceny

E1 daje tekstowy miniwykład, przełączane oznaczenia i pytanie. E2 ma siatkę horyzontalną i równikową daty, gwiazdy, pięć figur, Słońce/Księżyc/planety, przyciski, przeciąganie wskaźnikiem, zoom, śledzenie i osobne centrowanie. Karta i lista pozwalają filtrować ciała względem horyzontu oraz wybrać gwiazdę po HIP bez trafiania w piksel. Trwały stan lekcji v6 zachowuje wybrane ciało lub gwiazdę, kamerę i odczyty zadania; starszy zapis v6 bez pola gwiazdy przywraca brak zaznaczenia.

E3 pokazuje pięć przykładów, figurę, granicę, odczyty gwiazd i porównanie Warszawa–Kapsztad przy tej samej chwili UTC. E4 oddziela ruch dobowy, roczny i własny, schemat precesji ~26 tys. lat, topocentryczny ślad Marsa 2024/25 i model trzech praw Keplera. Orbitę heliocentryczną oznaczono jako eksperyment dydaktyczny, niezależny od bieżących efemeryd. Tabele zawierają odpowiedniki liczbowe grafiki.

Z02 zachowuje hipotezę, ostatni pomiar azymutu/wysokości/separacji, liczbę prób, najlepszy pomiar, chwilę ukończenia i wniosek. Stan v6 migruje poprawne stany v1–v5; starszemu v5 nie przypisujemy zmyślonego ostatniego pomiaru. Raport jest widoczny uczniowi i eksportowany w JSON. Tekst otwarty nie podlega automatycznej ocenie. Raport zbiorczy nauczyciela, CSV, druk i LMS należą do P4 oraz wymagają rzeczywistej integracji ZPE.

## Granice decyzji

Licencja Stellarium Western określa CC BY-SA bez numeru wersji; zapisujemy tę niejednoznaczność i wymagamy potwierdzenia przed innym sposobem redystrybucji. Nie deklarujemy odbioru przez ORE, eksperta merytorycznego, UX ani testu słabego urządzenia. Obecny pomiar Chromium headless dotyczy wskazanej maszyny i nie jest miarą pamięci GPU. Techniczne kryterium G2 jest spełnione lokalnie, a formalne zatwierdzenie materiału pozostaje otwarte.
