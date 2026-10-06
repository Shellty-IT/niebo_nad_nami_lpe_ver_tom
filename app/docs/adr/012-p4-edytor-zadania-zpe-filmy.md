# ADR 012 — kontynuacja P4: edytor, zadania i E8.1

Stan: 05.10.2026. Decyzja i implementacja lokalna; bramka G4 pozostaje otwarta.

## Kontekst

Plan wymaga konfiguracji nauczyciela, własnych pytań i zadań, trwałych wyników
zadań oraz pełnej lekcji w adapterze ZPE. Użytkownik doprecyzował, że w E8.1
chodzi o linki do filmów edukacyjnych, bez hostowania plików. Szeroki audyt
jakości można odłożyć; testy potrzebne do sprawdzenia nowych zmian pozostają.

## Rozwiązanie

- Jeden model `lesson` w pliku konfiguracji v0.3.0 obsługuje sceny, kolejność,
  poziomy, widoczne obiekty, warstwy E3, początkową obserwację, zakres dat,
  pytania i zadania E2. Ten sam formularz działa w `teacher.html` i zakładce
  edytora ZPE. Import jest walidowany i wyświetlany jako tekst, bez HTML/JS.
- Walidator odrzuca pusty wybór scen/poziomów/obiektów, ukryty cel, daty poza
  1900–2100, cel obiektowy pod horyzontem w chwili początkowej oraz pytania i
  zadania bez treści, podpowiedzi lub wyjaśnienia. Zadania współrzędnych mają
  jawną tolerancję. Interfejs ucznia stosuje te ustawienia.
- Z01 ma stały widok Warszawa, 16.01.2025 20:00 UTC, z Marsem nad horyzontem.
  Próbę można ponowić przez mapę lub listę. Orion ma trwały wynik wskazania
  w E3. Zadanie planet używa tej samej chwili i kryterium wysokości nad
  lokalnym horyzontem (Mars, Jowisz, Uran, Neptun). Wyraźnie odróżnia je od
  widoczności gołym okiem. Własne zadania E2 zapisują próby. Stan v8 i treść 0.3.0 migrują stare
  sesje i zachowują wcześniejsze odpowiedzi.
- Silnik ZPE uruchamia E1–E8, jeśli konfiguracja zawiera `lesson`; starszy
  wariant próbki bez tego pola nadal uruchamia samo obserwatorium. Lokalny
  harness sprawdza pełną lekcję, edytor i zamrożenie stanu. Nie jest to
  potwierdzenie działania w rzeczywistym LMS. Domyślna konfiguracja instancji
  zawiera `lesson` ze wszystkimi scenami. Manifest deklaruje drukowanie, lecz
  walidację LMS pozostawia jako `none`, ponieważ plan nie podaje jednej reguły
  zaliczenia całej lekcji z zadaniami otwartymi.
- E8.1 zawiera tylko zewnętrzne linki do trzech polskojęzycznych materiałów
  ESA i Politechniki Wrocławskiej. Są opcjonalne i oznaczone jako wymagające
  internetu. Nie kopiujemy filmów, więc profile MP4 z §12 planu ich nie dotyczą.
  Osobny zakres produkowanych nagrań i narracji pozostaje do ustalenia i odbioru.

## Granice i dalsze prace

Na prośbę użytkownika przyjęliśmy nauczycielskie kryterium położenia nad
horyzontem i opisaliśmy je bez dwuznacznego słowa „widoczne”. Liczba pozostałych
zadań oraz recenzja banku i tekstów wymagają decyzji MER/LID. Podgląd i raport
w docelowym LMS wymagają środowiska i integratora ZPE. Szeroki audyt urządzeń,
czytników i ATAG odłożono na życzenie użytkownika; automatyczne testy obecnej
implementacji nie zastępują takiego odbioru.
