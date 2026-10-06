# Informacje o kodzie i danych zewnętrznych

Paczka zawiera Astronomy Engine 2.1.19 (MIT, Don Cross), kod walidatorów wygenerowany przez Ajv 8.20.0 (MIT) oraz helpery kompilacji Babel 7.29.7 (MIT) i TypeScript/tslib 2.8.1 (0BSD), jeśli pozostały po optymalizacji. Oryginalne teksty licencji dostarczamy obok tego pliku. Licencja Astronomy Engine pochodzi z nagłówka źródła dostarczonego w przypiętej paczce npm.

Mapa używa Three.js 0.186.1 (MIT); tekst licencji w Three.txt. Pozostałe zależności developerskie oraz dokładne wersje są zapisane w package-lock.json; ich paczki npm zawierają własne licencje.

## Dane P2

- Gwiazdy: **Credit: ESA**. ESA, 1997, *The Hipparcos and Tycho Catalogues*, ESA SP-1200. Podzbiór Hipparcos-1 pobrany z [ESASky Legacy TAP](https://esaskylegacy.esac.esa.int/esasky-legacy-sl-tap/tap), ograniczony do `Vmag <= 6.5` oraz HIP 87937. Licencja danych: [CC BY-NC 3.0 IGO](https://creativecommons.org/licenses/by-nc/3.0/igo/). Zmieniono: redukcja pól, pominięcie czterech rekordów bez współrzędnych, sortowanie, podział RA. **Ograniczenie NC dotyczy ponownego użycia danych**; przed wykorzystaniem komercyjnym potrzebna jest odrębna podstawa prawna.
- Figury pięciu gwiazdozbiorów i nazwy łacińskie: Stellarium team, [Western sky culture, wersja `014fbb5`](https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/western/index.json). [Opis i warunki](https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/western/description.md) określają tekst i dane jako **CC BY-SA** bez numeru wersji. Zmieniono: wybrano pięć figur, połączono identyfikatory HIP z katalogiem ESA, przeliczono pozycje do horyzontu. Materiał pochodny figur udostępniamy na tych samych warunkach CC BY-SA określonych przez autorów. Nie użyto ilustracji (osobna Free Art License).
- Granice pięciu obszarów i definicja 88 gwiazdozbiorów: [International Astronomical Union](https://iauarchive.eso.org/public/themes/constellations/), współrzędne granic J2000; przeliczono do lokalnego horyzontu. Granice nie są liniami figur. Źródłowe pliki i sumy w `01-wsad/REJESTR_ZRODEL.md`.
- Średnice fizyczne użyte do obliczenia rozmiaru kątowego: [NASA/NSSDC Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) i [Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html). Obliczenia faz i jasności: Astronomy Engine. Rozmiary znaczników na mapie są umowne.

Nie nadano automatycznie licencji całemu autorskiemu projektowi ani źródłowym dokumentom.
