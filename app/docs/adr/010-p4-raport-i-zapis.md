# ADR 010 — P4: podsumowanie i lokalny zapis

Data: 04.10.2026. Zakres: pierwszy fragment P4; bez deklaracji G4.

## Decyzja

E7 korzysta bezpośrednio z wersjonowanego stanu ucznia. Podsumowanie pokazuje
rzeczywiste dane Z02, Z03, Z04, Z06 i dziennika. Przyciski wracają do E1–E6
bez resetowania pomiarów. Raport JSON zawiera stan oraz jawne wiersze raportu;
CSV ma nagłówki, kodowanie UTF-8 i neutralizuje komórki zaczynające się od
znaków formuły. Widok E7 ma arkusz wydruku. Brak pomiaru jest oznaczony jako
brak, a otwarte wnioski nie otrzymują automatycznej oceny.

Lokalnie użytkownik wybiera zapis sesyjny albo trwały w IndexedDB. Domyślny
pozostaje tryb sesyjny na współdzielonym urządzeniu. Włączenie trybu trwałego
zapisuje bieżący stan, a jego wyłączenie wymaga potwierdzenia w interfejsie i
usuwa trwałą migawkę. Oba tryby używają tego samego walidatora importu; zapis
trwały wykonuje się po istotnej zmianie stanu. Operacje zapisu są kolejkowane,
aby starszy stan nie nadpisał nowszego. Błąd zapisu jest pokazywany w UI.
Uszkodzona migawka nie jest automatycznie nadpisywana; naprawa wymaga
poprawnego importu albo świadomego resetu.

Nie tworzono kont uczniów ani pól osobowych. Zapis w IndexedDB nie daje
izolacji użytkowników tego samego profilu przeglądarki. Eksport pozwala
przenieść dane ręcznie; nie ma synchronizacji sieciowej.

## Granice fragmentu

E7 nie zawiera jeszcze testu przekrojowego, przeglądu błędnych odpowiedzi ani
konfigurowalnego banku pytań. E8 pozostaje szkieletem. Raport klasy, deduplikacja
po identyfikatorze sesji, edytor nauczyciela i finalny adapter ZPE są nadal
zakresem P4. Teksty, filmy, nagrania, napisy i audiodeskrypcja wymagają produkcji
oraz odbioru zgodnie z planem i Z13; nie zastępujemy ich materiałem pozornym.
Lokalne testy automatyczne nie są odbiorem z rzeczywistym LMS ani audytem
czytników ekranu.
