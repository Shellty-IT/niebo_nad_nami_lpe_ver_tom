# ADR 002 — mapa i próba wydajności

Data: 03.10.2026. Stan: przyjęty prototyp lokalny BL-05. Odbiór na słabszym urządzeniu pozostaje otwarty; użytkownik polecił wykonać go na końcu.

Three.js 0.186.1 / WebGL2 i Canvas 2D otrzymują identyczne kierunki topocentryczne z Astronomy Engine. Kamera perspektywiczna i projekcja Canvas używają tego samego azymutu, wysokości, pionowego pola widzenia oraz wektorów bazowych. Zaznaczenie nie przestawia kamery; centrowanie jest osobną czynnością. Mapa i tabela mają wspólne dane, a wybór z listy jest równoważny klikaniu znacznika. Aktualna mapa pokazuje trzy ciała, siatkę horyzontalną i kierunki świata; nie zawiera jeszcze katalogu gwiazd ani wszystkich warstw P2. Znaczniki nie udają rzeczywistych średnic tarcz.

Optymalizacje obecne od prototypu: brak stałej pętli animacji w bezczynnym widoku, wspólna geometria punktów w benchmarku, ograniczenie pixel ratio do 2, ponowne użycie buforów, rysowanie po zmianie danych/kamery/rozmiaru, obliczenia poza wątkiem UI, jedna najnowsza oczekująca rewizja, zwalnianie geometrii/materiałów/kontekstu w destroy. Brak WebGL2 albo utrata kontekstu uruchamia Canvas. Brak obu API pozostawia tekstowe odczyty. Kolejne decyzje o jakości zależą od pomiaru na docelowym urządzeniu; nie obniżamy zakresu edukacyjnego.

Test integracyjny wykrył `window.__THREE__` zapisywane przez główne wejście Three.Core. Zamiast modyfikować window lub kasować cudze dane, importujemy potrzebne klasy z oficjalnie eksportowanego `three/src/*`. Test dwóch instancji ponownie potwierdził brak nowych globali. Wersja Three pozostaje przypięta, bo ścieżki wymagają weryfikacji przy aktualizacji. Licencja MIT jest dostarczona w obu paczkach.

`benchmark.html` mierzy 8000 deterministycznie wygenerowanych **syntetycznych punktów**, jawnie oddzielonych od danych naukowych. Pięciosekundowa próba obraca kamerę, zapisuje rozmiar, renderer, FPS, percentyle odstępu klatek i czasu CPU rysowania. Zmiana widoczności karty lub renderera unieważnia pomiar. Rejestr: `docs/performance/p0-headless.json`.

Pomiar wstępny: Windows, Intel i7-11800H, Chromium 153 headless, 776×440, DPR 1. WebGL2 około 60 FPS, CPU render p95 0.3 ms; Canvas około 60 FPS, p95 3.3 ms. Nie jest to słabe urządzenie ani audyt 60 FPS na pełnym materiale. Pamięć GPU nie została zmierzona. Użytkownik potwierdził odroczenie rzeczywistego odbioru urządzeniowego do końca prac.

Vite zgłasza pakiet renderera większy niż 500 kB; cały podstawowy JS/CSS prototypu nadal jest poniżej budżetu 8 MB z planu. Nie dodano tekstur, katalogów ani mediów. Ostrzeżenia nie wyłączono. Optymalizacja dostarczenia pełnych danych i pomiar pamięci pozostają zadaniami P2/P5.
