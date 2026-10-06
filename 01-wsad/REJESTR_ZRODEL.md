# Rejestr źródeł i produkcji — P2–P3

Stan: 04.10.2026. Pozycje pozyskane mają wskazane pliki i sumy kontrolne; wpis oczekujący nie jest dowodem pozyskania danych ani prawa do dystrybucji. Brak zatwierdzonych wielkości produkcji.

| Zasób | Źródło i cel | Prawa / pozyskanie | Przetwarzanie i odbiór |
|---|---|---|---|
| Scenariusz VII.6 | Ścieżka i SHA-256 w PLAN_PROJEKTU.md §1; podstawa celów | Dostarczony do analizy; nie kopiujemy PDF do paczki runtime | Macierz wymagań; źródłowy scenariusz nie jest treścią gotowej aplikacji |
| Dokumentacja API, Z11, Z13 | Kopie robocze w `tmp/pdfs/`; odniesienia w planie | Wyłącznie materiały robocze poza Git i paczką | Profile mediów: PLAN_PROJEKTU.md §12; kontrakt API: s. 7–13, 23–24 |
| Konfiguracja prototypu | `02-scenariusz/prototyp-g0.json` | Utworzona w projekcie; brak zewnętrznych mediów | Schemat P0, walidacja builda, kopia generowana automatycznie |
| Hipparcos-1 | [ESA, 1997, SP-1200](https://www.cosmos.esa.int/web/hipparcos/catalogues); [ESASky Legacy TAP](https://esaskylegacy.esac.esa.int/esasky-legacy-sl-tap/tap) | Credit: ESA; [CC BY-NC 3.0 IGO](https://creativecommons.org/licenses/by-nc/3.0/igo/); ograniczenie niekomercyjne | Podzbiór `Vmag <= 6.5 OR HIP = 87937`, 8875 wierszy; 8871 z RA/Dec. Id HIP, V mag, RA/Dec stopnie ICRS J1991.25, ruch własny `pmRA=μ_α cos δ`, `pmDE` mas/rok, paralaksa mas, BT/VT mag. 24 koszyki RA. Walidowany import `app/tools/prepare-catalogs.mjs`. |
| Efemerydy referencyjne | [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/); plan §7/14 | 360 pozycji Słońca/Księżyca/Marsa (03.10.2026) i 90 pozycji Merkurego, Wenus, Jowisza, Saturna, Urana, Neptuna (04.10.2026); dane obliczeniowe NASA/JPL, nie media | Surowe odpowiedzi, dokładne URL, konwencje i SHA-256 w `app/tests/astronomy/fixtures/`; poza paczką runtime. Ograniczenia UT/UTC/EOP w ADR 003. |
| Gwiazdozbiory | [IAU](https://iauarchive.eso.org/public/themes/constellations/) — granice pięciu obszarów J2000; [Stellarium Western](https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/western/index.json) — pięć figur HIP i 88 nazw | IAU: atrybucja; Stellarium team: [CC BY-SA bez podanego numeru wersji](https://github.com/Stellarium/stellarium-skycultures/blob/014fbb5e59233d133c22f9811af96b67d05a95c9/western/description.md), bez ilustracji | Linie figur, granice i opisy są oddzielone. Granice z IAU nie są kształtami figur; Stellarium `edges_epoch=B1875` nie zostały użyte. |
| Parametry fizyczne i treść E4 | [NASA/NSSDC Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), [Słońce](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html), [Kepler](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/), [Mars 2024/25](https://science.nasa.gov/solar-system/skywatching/night-sky-network/jan2025-night-sky-notes/) | Fakty liczbowe i własny tekst na ich podstawie | Średnica kątowa z średnicy fizycznej i odległości topocentrycznej. W E4 precesja ma osobny schemat ~26 tys. lat, Kepler osobny model heliocentryczny. |
| Treść kulturowa i pory roku | [IAU: definicja i nazwy asteryzmów](https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx?hkey=bb9dc841-0618-41b5-ac70-149741062141), [IAU astroEDU: Wielka Niedźwiedzica](https://astroedu.iau.org/activities/moving-constellations/), [NASA: Orion](https://science.nasa.gov/solar-system/skywatching/night-sky-network/a-flame-in-the-sky-the-orion-nebula/), [NASA: pory roku](https://science.nasa.gov/earth/facts/) | Fakty i własne krótkie opisy w języku polskim; nie kopiowano ilustracji | Historie kultur oddzielone od definicji astronomicznej. Porównanie czterech dat 2025 opiera się na obliczeniach Astronomy Engine. |
| Fotografie i modele | E1–E8; plan §12 | Dwa obrazy NASA/JPL pozyskane w P3; pozostałe media do produkcji P4 | Szczegóły obrazów P3 poniżej. Każdy kolejny zasób wymaga autora, atrybucji, opisu alternatywnego, hasha, formatu i rozmiaru. |
| Lektor i napisy | Profesjonalne nagrania człowieka | PROD/LID: wolumen i harmonogram do ustalenia | MP3/MP4 i WebVTT, transkrypcje, audiodeskrypcja według Z13 |

## Pliki pobrane 03.10.2026 i kontrola

| Plik w `01-wsad/katalogi/` | SHA-256 |
|---|---|
| `hipparcos-bright.csv` | `86247c969dcecf5242d374f78afc8e6a5398b3ce9f5eef0ac1398ea6b4217826` |
| `stellarium-western-index.json` | `a861accd345249a185a5ecfc2a516f34291c0aa52f4bb8d8337ffc53e9cef6b9` |
| `iau-uma.txt` | `681a1db59fa563a15de88269bb000d6732b959652138b043128385a0d555aa10` |
| `iau-cas.txt` | `ea05d876791fdd92a237d2e79c7688e2227080c381e767afaac6294e5b9b9693` |
| `iau-ori.txt` | `8454cd1d863b71902e7fd28a985096c15b970c50e37a905256e3841a1521a35a` |
| `iau-cru.txt` | `125b4855f89aa53ea12e31b72f025951452cd5a262d44daf52e42f2359bf3782` |
| `iau-cen.txt` | `90c7c416f86d8d0fa7c98c4276d41418e70b0f6ba92b22a425903530571fcb41` |

Zapytanie TAP: `SELECT HIP,Vmag,RAdeg,DEdeg,pmRA,pmDE,Plx,BTmag,VTmag FROM hipparcos1.hip_main WHERE Vmag <= 6.5 OR HIP IN (87937)` z `REQUEST=doQuery&LANG=ADQL&FORMAT=csv`. Granice: `https://iauarchive.eso.org/static/public/constellations/txt/{uma,cas,ori,cru,cen}.txt`. Stellarium: commit `014fbb5e59233d133c22f9811af96b67d05a95c9`. Import wykonywany lokalnie, runtime bez sieci. Wygenerowany katalog trafia do `.generated`, poza Git; źródłowe pliki oraz skrypt są w Git. Ograniczenia praw ESA i niepełne określenie wariantu CC BY-SA Stellarium wymagają potwierdzenia przed dystrybucją w innym modelu licencyjnym.

Przed produkcją mediów potrzebne są zatwierdzone teksty oraz liczba i długość nagrań. P2 nie obejmuje nowych fotografii ani filmów.

## Zasoby P3 pozyskane 04.10.2026

| Zasób lokalny | Źródło, metoda i prawa | SHA-256 / użycie |
|---|---|---|
| `app/tests/astronomy/fixtures/p3-ceres.json` | [NASA/JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), `COMMAND='1;'`, wektor geocentryczny LT+S w ICRF, AU/doba, próbka co 1 dzień od 2024-01-01 do 2030-01-01; pełny URL w pliku | SHA surowego wyniku `9d5e454c34e94113c0943159182c2527d9f1773eab2236d3bb2a3fc17b94ea0c`; 2193 wiersze. Skrypt importu weryfikuje hash. |
| `app/tests/astronomy/fixtures/p3-67p.json` | [NASA/JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), kometa 67P, rozwiązanie `90000703;`, pozostałe parametry jak wyżej | SHA surowego wyniku `62a4c38a8c176bbb945646ee11d96297bd9ce97fc467e376486460303529af94`; 2193 wiersze. Poza zakresem nie ekstrapolujemy. |
| `app/tests/astronomy/fixtures/p3-holdouts.json` | Sześć osobnych zapytań JPL dla połówek dni w latach 2025, 2027 i 2029; dokładny URL i hash odpowiedzi przy każdej próbce | Niezależny zbiór testowy interpolacji Ceres i 67P, nie trafia do runtime. |
| `app/tests/astronomy/fixtures/p3-moon-holdouts.json` | Osiem osobnych zapytań JPL dla Io, Europy, Ganimedesa i Kallisto w dwóch chwilach; URL i hash przy każdej próbce | Niezależny zbiór testowy modelu księżyców, nie trafia do runtime. |
| M31/M42 i księżyce Jowisza | [NASA M31](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/), [NASA M42](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/), [pozycja M31](https://science.nasa.gov/asset/hubble/andromeda-galaxy-m31/), [pozycja M42](https://science.nasa.gov/asset/hubble/scale-and-compass-image-for-orion-nebula/), [księżyce Jowisza](https://science.nasa.gov/jupiter/jupiter-moons/); wektory księżyców: Astronomy Engine `JupiterMoons` | Kierunki ICRF J2000 reprezentują środki zdjęć; rozmiar M31 około 3° wg NASA (sześć średnic Księżyca), dla M42 podano tylko pole centralnego obrazu 30′ i nieostre granice. Model księżyców z przybliżoną poprawką czasu światła. |
| `app/public/media/p3/m31-galex.jpg` | [NASA/JPL Photojournal PIA04921](https://science.nasa.gov/photojournal/andromeda-galaxy/), GALEX, mozaika ultrafioletowa; atrybucja: NASA/JPL/California Institute of Technology; lokalny obraz roboczy 273 993 B, JPEG | `114a91c3d75dff27dfba03c1e5b34db2bb4a95aec5ea12f9800d43bc17cecf50`. Alt: „Galaktyka Andromedy w przetworzonych barwach ultrafioletu; jasne centrum i rozległe ramiona.” Bliski UV = czerwień, daleki UV = błękit. |
| `app/public/media/p3/m42-spitzer.jpg` | [NASA/JPL Photojournal PIA13005](https://science.nasa.gov/photojournal/orions-dreamy-stars/), Spitzer/IRAC; atrybucja: NASA/JPL-Caltech; lokalny obraz roboczy 670 966 B, JPEG | `c03db260836585d98d2421b17d91c1e0465d0a20db646be322144fac47458e3c`. Alt: „Mgławica Oriona w przypisanych barwach podczerwieni; gwiazdy i ciemniejsze struktury pyłu.” 3,6 µm = błękit, 4,5 µm = pomarańcz. |
| Bezpieczna obserwacja i przykłady zaćmień | [NASA Solar Viewing Safety](https://science.nasa.gov/eclipses/safety/), [NASA GSFC 08.04.2024](https://eclipse.gsfc.nasa.gov/SEbeselm/SEbeselm2001/SE2024Apr08Tbeselm.html), [NASA GSFC 14.03.2025](https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html) | Tekst polski opracowany na podstawie zasad NASA; punkty testowe maksimum NASA GSFC. Formalny odbiór ekspercki tekstu nadal wymagany według BL-17. |
| Meteory, Syriusz, Betelgeza | [NASA Perseidy](https://science.nasa.gov/solar-system/meteors-meteorites/perseids/), [NASA Leonidy](https://science.nasa.gov/solar-system/meteors-meteorites/leonids/), [NASA Syriusz](https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/), [NASA Betelgeza](https://science.nasa.gov/universe/what-is-betelgeuse-inside-the-strange-volatile-star/) | Własne krótkie opisy faktów i jawnie statystyczny schemat rojów. |

Obrazy są użyte do celów edukacyjnych z wymaganą atrybucją zgodnie z [wytycznymi NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/) i [zasadami JPL](https://www.jpl.nasa.gov/jpl-image-use-policy/); nie użyto logotypów ani wizerunków osób, a materiał nie sugeruje poparcia NASA/JPL. Pliki są osadzone w buildzie offline po kontroli sum. Oryginały większej rozdzielczości i odbiór produkcyjny Z13 są zadaniem P4; te pliki są materiałem roboczym sceny E6.

## Treści robocze P4 — 04.10.2026

| Zasób | Podstawa i prawa | Status |
|---|---|---|
| `02-scenariusz/pytania-p4.json` | 40 autorskich pytań na podstawie scen E1–E6, planu i źródeł naukowych wskazanych wyżej; bez kopiowania cudzych tekstów | Walidacja schematu i kluczy w buildzie; odpowiedzi oraz język wymagają odbioru MER/LID |
| `02-scenariusz/slownik-p4.json` | 23 autorskie krótkie definicje dla dwóch stopni szczegółowości, oparte na treściach E1–E6 | Wymaga redakcji i odbioru dydaktycznego; brak osobnych nagrań |
| `02-scenariusz/zasoby-p4.json` | Trzy własne symulacje offline i trzy świadome odsyłacze do źródeł IAU/NASA już odnotowanych w rejestrze | Opisy są lokalne; pełne strony źródłowe wymagają internetu. Nie dołączono filmu ani nie przypisano praw do jego dystrybucji |

Nowe pliki JSON są treścią projektu, a nie pozyskanymi mediami. Powyższy stan
z 04.10.2026 nie zawierał jeszcze E8.1. Po doprecyzowaniu użytkownika filmy
w tej sekcji są linkami; osobne produkowane nagrania nadal wymagają zakresu,
scenariuszy, dostępnych odpowiedników i odbioru zgodnie z planem §12.

## Odsyłacze filmowe E8.1 — 05.10.2026

Użytkownik doprecyzował, że E8.1 ma zawierać linki do filmów, bez kopiowania
plików na hosting projektu. Dodano odsyłacze do publicznych materiałów:

| Tytuł i wydawca | Adres | Zakres |
|---|---|---|
| ESA, „Paxi i nasz Księżyc: Fazy i zaćmienia” | https://www.youtube.com/watch?v=K_KqWr4oHmA | E5, fazy i zaćmienia |
| Politechnika Wrocławska, „Fizyka I odc. 50 — Planety i satelity: prawa Keplera” | https://www.youtube.com/watch?v=BTj-sqhwyIY | E4, orbity i prawa Keplera |
| ESA, „Kim jest Paxi?” | https://www.youtube.com/watch?v=3t9LQeY2ShA | E1, wprowadzenie do eksploracji kosmosu |

Wyszukiwanie potwierdziło polskojęzyczne tytuły i wydawców. Odsyłacze wymagają
internetu; nie przeniesiono filmów ani ich ścieżek audio do aplikacji. Ich
dostępność i ewentualne napisy zależą od zewnętrznego serwisu i nie stanowią
odbioru produkcyjnych mediów projektu. Doprecyzowanie E8.1 zastępuje wcześniejszy
akapit traktujący lokalne pliki filmowe jako warunek tej sekcji.

## Próbna narracja P4 — 05.10.2026

Teksty ośmiu scen na trzech poziomach zapisano w
`02-scenariusz/teksty-poziomow-p4.json`. Są to autorskie robocze akapity
opracowane dla demonstracyjnej bety; nie są zatwierdzonym skryptem lektorskim
każdej podsceny. Z tych tekstów wygenerowano lokalnie 24 nagrania MP3 za
pomocą systemowej syntezy mowy Windows „Microsoft Paulina Desktop”. Pełny
spis plików, rozmiarów i sum SHA-256: `02-scenariusz/narracje-probne-p4.json`.
W aplikacji akapit jest transkrypcją nagrania. Build kontroluje sumy plików.

Prawo do redystrybucji syntetycznych nagrań wymaga potwierdzenia przed
publikacją. Przy braku takiego prawa nagrania należy zastąpić zasobami z
zatwierdzoną licencją i zaktualizować rejestr sum. Odbiór wymowy, treści i
dostępności również pozostaje otwarty.
