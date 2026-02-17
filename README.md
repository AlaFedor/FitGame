# FitGame

FitGame to przeglądarkowa „gra fitness”, która zamienia codzienną aktywność w prostą, wizualną planszówkę: każdy dzień to kolejne pole na mapie misji, a wykonanie zadań daje XP, poziomy i odznaki. Projekt nie skupia się na dokładnym mierzeniu treningów, tylko na motywacji i regularności poprzez grywalizację.

## Opis problemu
Wiele osób ma trudność z utrzymaniem regularnej aktywności fizycznej. Klasyczne aplikacje fitness często są zbyt techniczne, skupione na liczbach, statystykach i zaawansowanych pomiarach, co zniechęca początkujących użytkowników. Brakuje im też elementu zabawy i wizualnej motywacji.

Celem projektu FitGame jest zaprojektowanie i zaimplementowanie interaktywnego interfejsu graficznego, który przekształca ćwiczenia fizyczne w angażującą grę planszową, w której każdy dzień treningowy to kolejne kółko na planszy, a użytkownik wykonując codzienne misje przesuwa się po niej, zdobywając punkty doświadczenia, odznaki i awansując na wyższe poziomy.

## Docelowy użytkownik
Docelową grupą użytkowników są osoby w wieku 18–35 lat, które chcą poprawić swoją kondycję fizyczną, ale mają trudność z utrzymaniem regularności ćwiczeń. To użytkownicy ceniący estetyczne, proste i angażujące aplikacje – niekoniecznie sportowcy, lecz raczej osoby początkujące, potrzebujące motywacji. Aplikacja jest dostępna z poziomu przeglądarki internetowej.

---

## Uruchomienie (bez instalacji)
Nie trzeba instalować żadnych dodatkowych bibliotek ani narzędzi.

1. Pobierz / sklonuj projekt.
2. Otwórz plik `index.html` w przeglądarce (dwuklik lub „Otwórz za pomocą…”).


---

## Funkcjonalności

### 1) „Plansza” misji (ekran **Gra**)
- Poziomy oznaczone jako:
  - **current** – dzisiejsza misja (aktywna),
  - **completed** – wykonane,
  - **locked** – zablokowane (odblokowują się z czasem).  
- Co **5 poziomów** pojawia się „Boss” (wyróżnione pole).  
- Kliknięcie w aktywny/ukończony dzień otwiera popup z dzisiejszymi misjami i przyciskiem **DONE**. 

### 2) Misje dzienne + XP
- Po wykonaniu misji użytkownik dostaje XP i widzi popup „Świetna robota! +XP”. 
- XP wpływa na pasek postępu i poziom (HUD + profil). System poziomów używa rosnących progów XP. 
- Dni „Boss Day” mają stałą, wyższą nagrodę XP.

### 3) Streak (regularność)
- Aplikacja prowadzi streak i pokazuje go w HUD.
- Jeśli przerwa między wykonaniami jest większa niż 1 dzień, streak jest resetowany. 

### 4) Statystyki (ekran **Statystyki**)
- Kafelki: dni w grze, najdłuższy streak, liczba wykonanych misji, zdobyte poziomy.
- Wykresy:
  - „Ukończone vs pominięte misje”
  - „Trenowane partie mięśniowe”
- Kalendarz aktywności: dni z wykonaną misją są podświetlane, a na hover pojawia się status (tooltip).   

### 5) Profil: avatar, nick, odznaki
- Edycja profilu odbywa się w osobnym popupie (avatar + nick).   
- Odznaki:
  - odblokowywane automatycznie na podstawie warunków (np. pierwsza misja, streak, XP w jeden dzień itd.).
  - widoki „Odblokowane” / „Zablokowane” (filtrowanie).   
  - kliknięcie odblokowanej odznaki otwiera popup ze szczegółami.   
  - możliwość **pobrania odznaki** (generowanie grafiki do pobrania).   

### 6) Personalizacja misji
- W profilu dostępna jest personalizacja:
  - poziom trudności,
  - cele treningu,
  - partie mięśniowe.   
- Misje są losowane z puli, z uwzględnieniem preferencji użytkownika (cele/partie/trudność). 

### 7) Bezpieczeństwo zmian (UX)
- Gdy użytkownik próbuje opuścić ekran/zakładkę z niezapisanymi zmianami, pojawia się ostrzeżenie „Masz niezapisane zmiany” oraz potwierdzenie.   

---

## Technologie i pliki
- `index.html` – struktura ekranów (Welcome/Gra/Statystyki/Profil), nawigacja dolna oraz popupy.   
- `style.css` – pełny styling (neonowy UI, karty, responsywność, boss-node, tooltipy kalendarza itd.).   
- `script.js` – cała logika gry: mapa misji, XP/level, streak, odznaki, personalizacja, kalendarz, popupy, localStorage.   
- Chart.js – do wykresów (ładowane z CDN).

---

## Zapisywanie danych
FitGame zapisuje postęp lokalnie w przeglądarce (LocalStorage): m.in. XP, statystyki, stan misji, streak, log aktywności (kalendarz), profil i personalizację. Dzięki temu po odświeżeniu strony postęp nie znika. 

## Autorzy
* **Anna Dębska**
* **Nikola Garbarz**
* **Zuzanna Czerwińska**
* **Alicja Fedor**
