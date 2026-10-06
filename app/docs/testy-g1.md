# G1 — lokalna paczka demonstracyjna

Data: 03.10.2026. Bramka G1 etapu P1; nie jest odbiorem finalnego materiału.

Końcowa regresja: `npm run check`, 419/419 testów jednostkowych, 12/12 testów
przeglądarkowych, `npm run build:demo`, build ZPE oraz walidacja ES5/UTF-8
trzech plików JS. Ilustracja jest dostępna w paczce przez HTTP 200.

| Kryterium G1 | Dowód | Wynik |
|---|---|---|
| Uruchomienie lokalne | `npm run build:demo`; `node dist/local/server.mjs` pod 127.0.0.1:5173, odpowiedzi HTML/JS 200, próba wyjścia poza katalog 404 | Technicznie zaliczone |
| Osiem ekranów | Test przeglądarkowy przechodzi E1–E8 i przywraca wybrany ekran po odświeżeniu | Szkielety zaliczone; treść później |
| Klawiatura i mobilny start | Playwright fokus, 320 px, 200% tekstu, axe A/AA; menu scen ma przyciski | Automatycznie zaliczone; ręczny audyt otwarty |
| Reset | Test odrzucenia i potwierdzenia resetu; po odświeżeniu start | Zaliczone |
| Zapis i powrót | Test odświeżenia, eksportu/importu, odrzucenia błędnego JSON | Zaliczone w trybie sesyjnym |
| Offline | W samodzielnym serwerze wszystkie osiem ekranów i E2 bez żądań poza 127.0.0.1 | Zaliczone dla wersji rozwojowej |
| Wydajny start | Brak żądania pliku renderera przed E2, potem jedno żądanie; Worker i Canvas zwalniane po wyjściu | Zaliczone lokalnie; słabe urządzenie otwarte |

Ograniczenia: E1 i E3–E8 są szkieletami zgodnie z P1. E2 jest próbką techniczną.
Ilustracja NASA na starcie ma udokumentowane źródło i prawa w rejestrze mediów.
Logotypy ORE i polskie nagrania, zatwierdzenie UX/QA, integracja na ZPE oraz
próba na słabszym urządzeniu pozostają otwarte. Użytkownik odłożył odbiory
UX/QA i urządzeń na koniec; pełny BL-08 i wydanie nadal wymagają ich dowodów.
Pierwsza instalacja Node/npm do budowania wymaga internetu lub cache;
uruchomienie gotowej paczki już nie.
