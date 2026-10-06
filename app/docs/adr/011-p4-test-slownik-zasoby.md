# ADR 011 — P4: bank pytań, słownik, zasoby i raporty klasy

Data: 04.10.2026. Zakres: lokalna implementacja funkcji P4; G4 nadal otwarta.

## Treści i ocena

Bank 40 pytań i słownik 23 pojęć są danymi JSON w `02-scenariusz/`,
walidowanymi podczas przygotowania treści. Każde pytanie ma stabilny
identyfikator, scenę, cel, poziom, trzy odpowiedzi, klucz, wyjaśnienie i
podpowiedź. Test E7 wybiera po dwa pytania z E1–E6, zależnie od poziomu.
Kolejność odpowiedzi jest zmieniana deterministycznie, aby pozycja poprawnej
odpowiedzi nie była wskazówką. Próby nie mają limitu czasu ani kary. Uczeń
otrzymuje uzasadnienie i listę pytań, do których powinien wrócić. Teksty i
klucz są autorskim materiałem roboczym opartym na scenach E1–E6 i źródłach
ujętych w rejestrze; wymagają redakcji i odbioru MER/LID przed uznaniem
banku za zatwierdzony.

Stan odpowiedzi ma schemat v7, `contentVersion: 0.2.0`, identyfikator sesji i historię
prób. Migracja v6/treści 0.1.0 zachowuje poprzednie pomiary i tworzy pusty wynik testu.
Import sprawdza identyfikator pytania, wybraną odpowiedź, zgodność klucza i
datę. Limit 500 prób jest jawny w E7; po jego osiągnięciu zapis nowych prób
jest blokowany zamiast cichego usunięcia wcześniejszych danych. Otwarte
wnioski z doświadczeń pozostają do oceny człowieka.

## E8 i raportowanie

E8 opisuje trzy lokalne symulacje i trzy pozycje bibliograficzne. Przy każdej
pozycji widnieją źródło, status offline i informacja o prawach. Strony
zewnętrzne otwierają się wyłącznie po działaniu użytkownika. Kategoria filmów
jest jawnie oznaczona jako oczekująca na zatwierdzone zasoby; nie oznaczamy
odsyłacza internetowego jako filmu dostępnego offline.

Raport JSON v2 łączy identyfikator sesji, wersję treści, wyniki i pełny stan.
Strona `teacher.html` przyjmuje jawnie wybrane raporty, waliduje ich spójność,
deduplikuje po identyfikatorze sesji i wersji treści oraz pokazuje raporty
tylko do odczytu. Zbiorczy CSV neutralizuje teksty mogące stać się formułami
w arkuszu. Import nie zapisuje klasy na serwerze ani w lokalnej bazie.

## Granice

Edytor konfiguracji lekcji i własnych zadań nauczyciela nie jest wykonany.
Brakuje praktycznych zadań Z01 oraz utrwalenia prób znalezienia Oriona i
widocznych planet; obecne ćwiczenia Z02–Z06 i test nie zastępują ich. E8
nie ma filmów, a pełne multimedia E1–E8, profesjonalna narracja, napisy i
audiodeskrypcja wymagają produkcji oraz odbioru. Lokalna strona nauczyciela
nie zastępuje podglądu ucznia w rzeczywistym LMS. ZPE nadal uruchamia próbny
silnik/edytor dla obserwatorium, a nie całą lekcję E1–E8. Nie deklarujemy G4.
