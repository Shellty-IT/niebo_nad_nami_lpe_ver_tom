# ADR 005 — lokalny start i preferencje

Data: 03.10.2026. Zapis historyczny fragmentu BL-08; bramka G1 została następnie zamknięta w P1.

Przed wejściem do obserwatorium dostępne są kontrast, skala tekstu 100–200%,
kontrolki co najmniej 56 px, czytelniejsza typografia, ograniczenie ruchu
i celownik. Domyślna redukcja ruchu uwzględnia preferencję systemu.
Włączenie tej opcji zatrzymuje czas; użytkownik może świadomie uruchomić go
ponownie. Zmiana dotyczy tylko własnego kontenera. Nie ładuje fontów z sieci.

Preferencje mają osobny schemat wersji 1, walidację oraz adapter Web Storage.
Domyślnie zapis dotyczący ustawień obowiązuje w bieżącej karcie. Zaznaczenie
opcji „na przyszłość” zapisuje również w localStorage. Preferencje karty
mają pierwszeństwo. Zmiana tylko dla karty nie usuwa wcześniejszej preferencji
trwałej; interfejs jawnie to wyjaśnia. Odmowa dostępu do pamięci nie blokuje
zmiany wyglądu, ale wyświetla komunikat o niezapisanych ustawieniach.

Wprowadzenie obejmuje sześć kroków planu: otwarcie, interfejs, lokalizacja,
obiekt, ruch, podsumowanie. Można je pominąć, wrócić i powtórzyć. Fokus trafia
do nagłówka nowego kroku; po zakończeniu wraca do obserwatorium. Po odświeżeniu
karty wraca zapamiętany krok. Tekst jest roboczą instrukcją istniejących funkcji,
nie odebraną treścią multimedialną. Brak nagrań i logotypów. W P1 dodano
ilustrację NASA z rejestrem praw oraz zapis wyboru poziomu; pełne treści
poziomów należą do późniejszych etapów.

Na ekranie startowym nie powstają kontekst WebGL ani Worker. Powrót do startu
zatrzymuje zegar i zwalnia oba zasoby. Biblioteka renderowania nadal jest
częścią pobieranego pakietu; Vite zgłasza chunk powyżej 500 kB. Ładowanie na
żądanie i pełna ocena czasu startu pozostają do dalszej optymalizacji.

Ten fragment jest obecnie w wejściu lokalnym. ZPE zachowuje istniejącą próbkę
obserwatorium i kontrasty platformy. Włączenie startu i preferencji w docelowy
cykl życia ZPE jest częścią późniejszej integracji BL-24, nie ukrytą deklaracją
zgodności. Automatyczne axe i klawiatura nie zastępują ręcznego audytu ORE.

Weryfikacja: 417 testów jednostkowych; test przeglądarkowy sześciu kroków,
odtworzenia kroku i preferencji w nowej karcie, 320 px z tekstem 200%, axe A/AA
oraz zwalniania grafiki/Workera. Znalezione przepełnienie etykiet przy dużym
tekście poprawiono przez zawijanie. Wynik pełnej regresji zapisany w postępie.
