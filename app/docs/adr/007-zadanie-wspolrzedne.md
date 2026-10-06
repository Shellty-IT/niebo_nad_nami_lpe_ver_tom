# ADR 007 — pierwsze zadanie współrzędnych w P2

Data: 03.10.2026. Stan: przyjęte dla lokalnego fragmentu P2; odbiór dydaktyczny i G2 pozostają otwarte.

Źródło: PLAN_PROJEKTU §3 (Z02), §5, §15; BL-09, BL-13, BL-14, BL-19 i BL-23. W E2 zadanie Z02 ustawia środek mapy na azymut 90° i wysokość 30°. Cel jest kierunkiem matematycznym, więc nie wymaga niezatwierdzonego katalogu. Przyciski mapy pozwalają osiągnąć go klawiaturą. Wynik liczymy jako separację dwóch kierunków na sferze, nie różnicę azymutów; próg podstawowy wynosi 2° zgodnie z przykładem w planie. Ponowna próba nie ma kary ani limitu czasu.

Store przechowuje aktywność, poprzednią kamerę, liczbę prób, najlepszą separację i chwilę pierwszego ukończenia. Start zatrzymuje zegar; wyjście albo przejście do innej sceny przywraca poprzedni kierunek. Stan v5 ma ścisły schemat i migrację zweryfikowanego v4. Wynik jest widoczny w raporcie Z02 i obecny w istniejącym eksporcie stanu JSON; host ZPE dostaje powiadomienie o zmianie. Zamrożenie blokuje ocenę i zmianę zadania.

Raport jest na razie pojedynczym wynikiem zadania. Nie stanowi pełnego raportu ucznia/nauczyciela, banku zadań ani potwierdzenia LMS. E1 i pozostałe podsceny E2 nadal wymagają treści, siatek i odbioru merytorycznego. Źródła katalogów, prawa, dokładna skala danych i epoki są otwarte w D09/D10; tej decyzji nie używamy jako podstawy do ich importu.
