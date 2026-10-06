# ADR 006 — lokalny fundament P1

Data: 03.10.2026. Stan: zakres etapu P1 i lokalna bramka G1 zamknięte.
Odbiory końcowe UX/QA i urządzeń odłożono na koniec na polecenie użytkownika.

## Stan i routing

Stan v4 dodaje `sceneId` (E1–E8), poziom podstawowy/rozszerzony/ekspercki,
tryb odkrywania/uczenia oraz historię maksymalnie 100 miejsc. Migracja z v3
zachowuje obserwację, kamerę i tempo; wcześniejsze v1/v2 przechodzą kolejno
przez istniejące migracje. Historii nie dopisują klatki zegara, a tylko zmiana
miejsca. Zmiana sceny jest komendą store, nie bezpośrednią zmianą renderera.

Osiem szkieletów pochodzi z `02-scenariusz/sceny-p1.json`, walidowanego przy
budowaniu. Zachowują numerację i źródła scenariusza. Jedynie E2 pokazuje
aktualną próbkę obserwatorium; inne ekrany są wyraźnie oznaczone jako szkielety.
Osobny JSON Schema v1 opisuje docelowy format treści sceny: cel, poziomy,
bloki, ustawienia obserwacji, aktywności, media i tekst prosty. Schemat wymaga
opisu alternatywnego ilustracji i transkryptu filmu. Brak zatwierdzonych treści
nie jest zastępowany fikcyjnymi danymi.

Poziom podstawowy ogranicza widoczne kontrolki zaawansowane w wersji lokalnej;
rozszerzony/ekspercki zachowują je. Poziom jest zapisany i przywracany. Pełne
zróżnicowanie treści i tryb „Ucz się” wymagają scen i zadań P2–P4. Wersja ZPE
nie ukrywa dotychczasowego formularza przez lokalne style.

## Pamięć i paczka

Lokalny zapis na G1 pozostaje sesyjny (`sessionStorage`), zgodnie z wyborem
trybu na współdzielonym komputerze. Eksport JSON pozwala przenieść go między
adresami przeglądarki. Import ma limit 1 MB, walidację wersji i pełnego stanu;
zapis do pamięci następuje przed zmianą stanu w aplikacji. Błędny import lub
odmowa zapisu zachowują poprzednią lekcję. Uszkodzony zapis nie jest nadpisywany
automatycznie. Reset wymaga potwierdzenia w interfejsie i usuwa tylko stan
lekcji w bieżącej karcie; preferencje zostają. Docelowe IndexedDB dla sesji i
wyników jest rozszerzeniem BL-21 na P4.

`npm run build:demo` dodaje do statycznego `dist/local` serwer Node,
`URUCHOM.cmd`, `start.sh` i instrukcję. Serwer wiąże wyłącznie 127.0.0.1:5173,
nie listuje katalogów i sprawdza rzeczywistą ścieżkę pliku. Wersja po zbudowaniu
nie wymaga npm ani internetu. Obserwatorium i biblioteka grafiki są ładowane
dopiero po wejściu do E2; porzucenie E2 przed końcem importu nie montuje widoku.
Na ekranie startowym nie pobiera się pliku renderera. Kontener E2 używa układu
trzech kolumn przy szerokości kontenera co najmniej 1050 px, a węższe okna
zachowują liniowy odczyt. Makiety szeroka i mobilna zapisano w `03-makieta/`.
Ręczny audyt UX pozostaje otwarty do odbioru końcowego.

## Granice odbioru

G1 sprawdza paczkę, klawiaturę, reset, zapis i powrót; te kryteria spełnia
lokalna demonstracja. Podział etapów planu przypisuje pełne media i nagrania do
P4, a testy urządzeń i audyt do P5. Użytkownik zdecydował, że UX/QA i próba na
słabszym urządzeniu odbędą się na końcu. To nie jest fikcyjna akceptacja
tych obszarów. Źródłowe wymagania mówią, że oznaczenia projektu dostarczy ORE;
bez identyfikacji konkretnego programu nie wolno użyć przypadkowych znaków.
Odpowiednie pozycje BL-08 pozostają otwarte w macierzy wymagań, nie blokując
zakończenia etapu P1 według jego warunku wyjścia. Późniejsze pełne BL-21/24/26
i ZPE/LMS pozostają w planie.
