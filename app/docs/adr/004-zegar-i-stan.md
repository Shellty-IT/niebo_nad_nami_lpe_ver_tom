# ADR 004 — zegar i zapamiętanie kamery

Data: 03.10.2026. Status: wdrożony lokalny fragment BL-09, bez odbioru całego P1.

Stan v3 zawiera UTC, obserwatora, strefę prezentacji, zaznaczenie, refrakcję,
kierunek kamery, pole widzenia i tempo. Walidowane migracje v1→v2→v3 dodają
domyślną kamerę i pauzę; konfiguracja treści pozostaje w wersji 2. Zapis nie
zawiera zasobów GPU ani historii klatek. Starsze uszkodzone dane są odrzucane.

Zegar domenowy liczy czas z kotwicy i monotonicznego czasu `performance.now()`;
częstotliwość klatek nie wpływa na wynik. Interfejs zleca obliczenia najwyżej
10 razy na sekundę. Worker ma najwyżej jedno obliczenie i ostatnie oczekujące
żądanie. Formattery dat są używane ponownie. Zapis podczas ruchu następuje
co 5 sekund oraz przy zmianie tempa/pauzie. Odczyty tabeli pozostają spokojne
podczas ruchu i aktualizują się po pauzie; podpis podaje ich chwilę UTC.

Tempa: ±0,1; ±1; ±60; ±3600; ±86400 oraz pauza. Kroki „doba” to dokładnie
86400 sekund UTC, nie lokalny dzień kalendarzowy (ważne przy DST). „Teraz”
ustawia czas systemowy i tempo 1. Edycja formularza zatrzymuje ruch. Ukrycie
karty zatrzymuje eksperyment z tempem innym niż 1; tempo rzeczywiste po
powrocie nadrabia przerwę. Zamrożenie hosta zatrzymuje obliczenia i zapis;
odmrożenie nie nadrabia zamrożonego czasu. Granice modelu 1900–2100 zatrzymują
zegar z komunikatem. Przywrócenie zapisanej sesji rozpoczyna od zapisanej
chwili — nie dolicza czasu zamkniętej aplikacji.

Weryfikacja: jednostkowa niezależność zegara od częstotliwości próbkowania,
walidacja tempa, izolacja kopii kamery i zamrożenie; przeglądarkowe cofanie,
pauza, odtworzenie widoku i brak zapisu podczas blokady. 9 testów
przeglądarkowych zaliczonych; oba buildy i kontrola ES5 zaliczone.

Pozostają: nawigacja/sceny, historia miejsc, pełna sesja IndexedDB i zakres
sterowania czasem dla zatwierdzonych scen. Nie jest to zamknięcie BL-09/BL-21.
