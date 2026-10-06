# ADR 009 — P3: obserwacje, instrumenty i dodatkowy katalog

Data: 04.10.2026. Stan: implementacja lokalna E5–E6 i techniczna bramka G3 ukończone; odbiory zewnętrzne pozostają otwarte.

## Dane i dostawcy pozycji

P3 wybiera mały katalog: M31, M42, Ceres, 67P oraz Io, Europę, Ganimedesa i Kallisto. M31/M42 mają kierunki środka katalogowego w ICRF/J2000 z kart NASA; ich rozmiar na mapie jest opisem przybliżonym. Ceres i 67P korzystają z geocentrycznych pozornych wektorów [JPL Horizons](https://ssd-api.jpl.nasa.gov/doc/horizons.html) LT+S, próbkowanych codziennie od 2024-01-01 do 2030-01-01 w AU i AU/dobę. Interpolacja Hermite’a używa pozycji i prędkości; odejmujemy wektor obserwatora, a potem przekształcamy kierunek do horyzontu. Poza tym okresem nie wyznaczamy pozycji. Cztery księżyce Jowisza oblicza `JupiterMoons` Astronomy Engine z przybliżoną poprawką czasu biegu światła; karta informuje o możliwym zakryciu przez Jowisza. Kierunki planetoidy i komety sprawdzono w osobnych próbkach JPL pomiędzy węzłami, a księżyce względem osobnych wektorów JPL. Pliki źródłowe, SHA-256, epoki i prawa podaje [rejestr źródeł](../../../01-wsad/REJESTR_ZRODEL.md).

Obiekty można wybrać z listy i mapy; tabela, karta i mapa używają tych samych pozycji. Karty podają status jakości, ważność, rozmiar kątowy albo jawny brak wiarygodnej wartości. Wybór katalogowy zapisuje stan. Poza okresem efemerydy karta pokazuje brak danych i przycisk przejścia do okresu ważności. Rozszerzenie nie obiecuje widoczności gołym okiem.

## E5 i zadania

E5 korzysta z miejsca i chwili UTC E2. Wschód, górowanie i zachód Słońca liczy Astronomy Engine; brak zdarzenia w dacie UTC jest jawny. Z03 zapisuje cztery daty dla jednego miejsca i otwarty wniosek. Fazy Księżyca pochodzą z `Illumination`, `MoonPhase` i `SearchMoonQuarter`; rysunek tarczy obraca jasny brzeg według topocentrycznych kierunków Słońca i Księżyca w lokalnym niebie. Z04 zapisuje cztery kolejne fazy jednego cyklu i miejsca, z rozpoznaniem, kolejnością i otwartym wnioskiem. Mars ma separację topocentryczną od Słońca jako przykład koniunkcji i opozycji.

Zaćmienie Słońca 08.04.2024 i Księżyca 14.03.2025 mają tabelę kontaktów, wysokości lokalnych i rozróżnienie widoczności żadnej części, fragmentu albo maksimum. Czasy w UI zaokrąglono do minuty. Przykłady maksimum porównano z NASA GSFC; test obejmuje 12 miejsc. Słoneczny przypadek bez lokalnego zjawiska nie pokazuje kontaktów innego zaćmienia. Zasady obserwacji Słońca opracowano na podstawie [NASA](https://science.nasa.gov/eclipses/safety/), w tym filtr przed obiektywem, niewystarczalność zwykłych okularów do patrzenia przez instrument oraz projekcję otworkową. Tekst nadal wymaga formalnej redakcji i podpisu eksperta według BL-17.

Perseidy i Leonidy mają opis radiantu oraz powtarzalny schemat pięciu smug. To model statystyczny bez prognozy czasu i położenia pojedynczych meteorów. Podstawa opisowa: [NASA Perseids](https://science.nasa.gov/solar-system/meteors-meteorites/perseids/) i [NASA Leonids](https://science.nasa.gov/solar-system/meteors-meteorites/leonids/). Plan obserwacji oraz dziennik 100 pomiarów korzystają z istniejącego stanu, importu/eksportu i zamrożenia.

## E6 i zdjęcia

E6 oblicza powiększenie, przybliżone pole rzeczywiste, źrenicę wyjściową i idealny limit dyfrakcyjny. Lornetka, refraktor i reflektor mają obrotowy model 3D oraz schemat 2D przy braku WebGL2. Rysunek pola porównuje skalę Księżyca, Jowisza, M31 lub centralnego pola M42 z polem instrumentu. Z06 wymaga wyboru krótszego okularu i przewidzenia zmniejszenia pola; zapisuje wynik i wniosek. Model nie dodaje szczegółów powierzchni ani nie symuluje obrazu przez okular.

Dwie lokalne fotografie robocze NASA/JPL przedstawiają M31 w umownych barwach ultrafioletu (GALEX, PIA04921) i M42 w podczerwieni (Spitzer, PIA13005). Podpisy podają pasmo, metodę, autorstwo i źródło. Zadanie analizy odróżnia te dane od widoku oka; model ekspozycji pokazuje tylko proporcję sygnału wobec 10 s, bez modelu szumu, prowadzenia i obróbki. Zdjęcia są osadzone w paczce offline po kontroli SHA. Materiał o Stellarium i SkySafari działa bez ich instalacji.

## Stan i granice odbioru

Pola P3 są opcjonalnym rozszerzeniem zapisu v6. Starsze poprawne sesje v6 otrzymują pusty stan P3; walidacja sprawdza zakresy, jedno miejsce Z03, spójny cykl i miejsce Z04 oraz wybór obiektu. Testy modelu, tabele, opisy tekstowe, sterowanie klawiaturą, wariant Canvas i axe A/AA spełniają lokalną techniczną bramkę G3. Automatyczne testy nie zastępują prób czytników ekranowych na urządzeniach docelowych (P5), recenzji naukowej i bezpieczeństwa (BL-17/BL-25), odbioru mediów Z13 ani integracji z rzeczywistym ZPE.
