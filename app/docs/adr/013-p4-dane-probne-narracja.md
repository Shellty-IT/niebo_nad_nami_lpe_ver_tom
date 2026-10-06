# ADR 013 — dane próbne do zamknięcia implementacji P4

Data: 05.10.2026. Stan: wdrożone lokalnie.

## Decyzja

Na prośbę właściciela materiału brakujące wartości robocze P4 zastępują
przykładowe treści. Każda scena E1–E8 ma odrębny tekst podstawowy,
rozszerzony i ekspercki. Wybór poziomu aktualizuje tekst i odpowiadające mu
nagranie. Nagranie jest dobrowolne, bez automatycznego odtwarzania; widoczny
tekst jest jego pełną transkrypcją. Sceny mają status `sample`, żeby użytkownik
wiedział, że to działająca wersja demonstracyjna przed odbiorem treści.

Próbne nagrania MP3 wygenerowano lokalnie syntezą mowy Windows (głos
Microsoft Paulina Desktop), po czym zakodowano jako mono 48 kHz, 128 kb/s.
Rejestr 24 plików, rozmiarów i sum SHA-256 to
`02-scenariusz/narracje-probne-p4.json`; build odrzuca brakujące lub zmienione
pliki. Teksty są w `02-scenariusz/teksty-poziomow-p4.json`. Skrypt odtworzenia
to `app/tools/generate-sample-narration.ps1`; nie nadpisuje istniejących
plików. Paczka lokalna i próbny silnik ZPE zawierają te same nagrania.

Jako próbny zakres zadań przyjęto siedem obecnych ćwiczeń praktycznych:
Z01, Z02, Z03, Z04, Z06, Orion i planety nad horyzontem. Nie generujemy
fikcyjnych wyników astronomicznych: obliczenia i kryteria zadań nadal
wykorzystują rzeczywisty model i zapisują rzeczywiste działania ucznia.
Filmy E8 pozostają odsyłaczami YouTube, zgodnie z decyzją właściciela.

## Granice decyzji

Treści i bank pytań wymagają zatwierdzenia merytorycznego i dydaktycznego.
Przed publikacją nagrań trzeba potwierdzić prawo do redystrybucji wyniku
systemowego głosu albo zastąpić je nagraniami z zatwierdzonymi prawami.
Logo ORE należy wstawić dopiero z dostarczonych materiałów. Brak dostępu do
rzeczywistego ZPE/LMS nie pozwala potwierdzić odbioru integracyjnego ani
raportu klasy. Użytkownik odłożył szeroki audyt urządzeń i dostępności.

Implementację demonstracyjnej bety P4 można zweryfikować lokalnie;
formalnej bramki G4 oraz etapów P5/P6 nie oznaczamy jako odebranych.
