# P4 — stan po uzupełnieniu danych próbnych

Stan 05.10.2026. Implementacja demonstracyjnej bety P4 jest gotowa lokalnie:
E1–E8, siedem praktycznych ćwiczeń, 40 pytań, 23 hasła, edytor nauczyciela,
raporty, trzy poziomy tekstów i 24 lokalne nagrania MP3. E8.1 zawiera trzy
polskojęzyczne linki YouTube, bez hostowania filmów. Każda scena ma status
`sample`, więc użytkownik widzi, że treść jest próbna. [Wynik testów](testy-p4-dane-probne.md)
i [decyzja](adr/013-p4-dane-probne-narracja.md) opisują zakres techniczny.

| Warunek formalnej bramki G4 | Co trzeba wykonać | Odpowiedzialność |
|---|---|---|
| Treść naukowa i dydaktyczna | MER/LID przeglądają teksty trzech poziomów, pełne treści podscen i onboarding, bank 40 pytań, 23 hasła i rozwiązania siedmiu zadań. Zatwierdzone poprawki wymagają nowej `contentVersion` i migracji stanu, jeśli zmienia się znaczenie wyniku. | Właściciel materiału i recenzenci |
| Narracja i prawa | Potwierdzić prawo do dystrybucji 24 syntetycznych nagrań albo zastąpić je zatwierdzoną narracją; sprawdzić wymowę, zgodność transkrypcji i profil mediów. Dla wymaganych wizualizacji podscen ustalić oraz wykonać audiodeskrypcję i inne odpowiedniki dostępnościowe. | Producent materiału i właściciel praw |
| Identyfikacja projektu | Dostarczyć właściwe logotypy i zasady użycia ORE, następnie osadzić je w interfejsie i paczce. | ORE / integrator |
| Rzeczywisty ZPE/LMS | Przeprowadzić próbę dwóch instancji, stanu zamrożonego, edytora, motywu, druku, zasobów offline i raportu ucznia w docelowym hoście. Potwierdzić przebieg podglądu i raportu klasy z integratorem; dostępne API nie opisuje samodzielnego pobierania całej klasy. | Integrator ZPE i konto testowe |
| Reguła zaliczenia LMS | Ustalić, czy i które zadanie ma zwracać `isStateValid`; obecny manifest ma `validation: none`, a wyniki szczegółowe są w stanie i raportach. | Właściciel materiału i integrator |
| Pilotaż jakości | Szeroki audyt urządzeń, czytników, ATAG i próba z nauczycielami zostały odłożone decyzją użytkownika; wykonać je przed odbiorem produkcyjnym. | QA / UX / nauczyciele |

Próbna liczba zadań i brak losowanych danych astronomicznych są wyjaśnione w
ADR 013. Lokalny harness oraz testy automatyczne nie potwierdzają działania w
rzeczywistym LMS. P5 (pilotaż) i P6 (wydanie) pozostają odrębnymi etapami.
