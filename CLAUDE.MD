# CLAUDE.md

Questo file dà contesto a Claude Code per lavorare su questo progetto.
Leggilo SEMPRE prima di modificare codice o prendere decisioni strutturali.

## Cos'è questo progetto

Mini-gioco 3D a tema Formula 1, sviluppato da un padre insieme ai figli.
Obiettivo: un gioco semplice, divertente, giocabile in 2-3 minuti per sessione,
deployabile come PWA e (più avanti) come app mobile via Capacitor.

Non è un simulatore. Non deve essere realistico. Deve essere *divertente subito*.

Vedi `docs/concept.md` per il game design e `docs/mvp-scope.md` per cosa
appartiene alla v0.1 e cosa NO.

## Stack tecnologico

- **Runtime**: Browser (WebGL2 / WebGPU dove disponibile)
- **Linguaggio**: TypeScript (strict mode attivo)
- **Build tool**: Vite
- **Engine 3D**: Babylon.js v7+ (`@babylonjs/core`)
- **Physics**: Havok via `@babylonjs/havok` (solo se/quando necessario — vedi nota sotto)
- **Package manager**: npm
- **Target deploy primario**: PWA statica
- **Target deploy secondario (fase futura)**: Capacitor per Android/iOS, Tauri o PWA per Windows

### Versioni API importanti

Usa SEMPRE l'API Babylon.js v7+. Non generare codice con API deprecate
(es. `BABYLON.Engine` con costruttori vecchi, `SceneLoader.Load` con signature
pre-v5, materiali non-PBR quando il caso richiede PBR).
Riferimento: https://doc.babylonjs.com e https://playground.babylonjs.com

### Gestione asset

**Regola**: in questa fase del progetto, tutte le mesh e texture sono generate
proceduralmente. NON scaricare modelli glTF esterni, NON suggerire asset pack
da Sketchfab/Poly Haven. Cubo + cilindro + piano + colori piatti sono più che
sufficienti per la v0.1. Quando servirà qualcosa di più, lo decideremo esplicitamente.

## Convenzioni del progetto

### Struttura cartelle

src/
main.ts              # entry point, bootstrap engine + scena
game/
Game.ts            # classe principale, game loop
scenes/            # scene Babylon (MenuScene, RaceScene, ecc.)
entities/          # entità di gioco (Car, Track, ecc.)
systems/           # sistemi trasversali (InputSystem, AudioSystem, ecc.)
config/            # costanti, tuning (velocità, accelerazione, ecc.)
ui/                  # overlay HTML/CSS (menu, HUD)
assets/              # SOLO asset generati o pochissimi file statici
docs/
concept.md
mvp-scope.md
tech-decisions.md
playtesting.md       # feedback dopo ogni sessione con i bambini
public/                # asset statici serviti tal quali

### Naming

- File classi: `PascalCase.ts` (es. `Car.ts`, `RaceScene.ts`)
- File utility/config: `camelCase.ts` (es. `inputMap.ts`)
- Classi: `PascalCase`
- Funzioni, variabili: `camelCase`
- Costanti di tuning: `SCREAMING_SNAKE_CASE`

### Separazione logica / rendering

La logica di gioco (fisica, input, regole) NON deve essere accoppiata direttamente
ai nodi Babylon. Le entità (`Car`, ecc.) tengono il loro stato come campi TypeScript
e sincronizzano un `TransformNode` Babylon nel metodo `update(dt)`. Questo rende
il codice testabile e permette di cambiare rendering in futuro senza riscrivere
la logica.

### Game loop

Uso `scene.onBeforeRenderObservable` per il tick di gioco. Delta time in secondi
(non millisecondi). Tutte le velocità/accelerazioni sono espresse in unità/secondo,
non per frame.

### Physics

Havok entra in gioco SOLO quando strettamente necessario. Per la v0.1 la fisica
della macchina è custom e semplificata (accelerazione, attrito, sterzo), non
rigid-body. È una scelta deliberata: più prevedibile, più veloce, più leggera.

## Come lavorare su questo progetto

### Comandi base

- `npm run dev` — dev server con hot reload su `localhost:5173`
- `npm run build` — build di produzione in `dist/`
- `npm run preview` — serve il build locale per verifica
- `npm run typecheck` — controllo tipi senza build

### Come iterare

Sviluppiamo per **slice verticali**, non per layer orizzontali.
Ogni iterazione deve produrre qualcosa di *giocabile* e committabile.
Vedi `docs/mvp-scope.md` per la sequenza delle slice.

Prima di proporre implementazioni grosse:
1. Verifica che rientri nello scope della slice corrente
2. Proponi la modifica più piccola che risolve il problema
3. Se richiede decisioni architetturali, fermati e chiedi

### Stile delle risposte

- Italiano per commenti, messaggi e conversazione
- Codice e identificatori in inglese
- Conciso. Niente preamboli tipo "ottima domanda!". L'utente ha 27 anni di
  esperienza, non serve semplificare concetti tecnici.
- Se un'API che stai usando è incerta, dillo esplicitamente invece di inventare

## Decisioni architetturali registrate

Vedi `docs/tech-decisions.md` per l'elenco completo delle ADR.
Le più importanti finora:

- **ADR-001**: Babylon.js invece di Three.js (scene graph/physics/asset già integrati)
- **ADR-002**: PWA come target primario, Capacitor come fase 2
- **ADR-003**: Physics custom semplificata in v0.1, Havok solo se serve dopo
- **ADR-004**: Asset procedurali in v0.1, no dipendenze esterne

## Cosa NON fare

- Non aggiungere dipendenze senza chiedere
- Non introdurre framework UI (React, Vue) per gli overlay — HTML/CSS vanilla basta
- Non scrivere codice "enterprise" (factory astratte, DI container). Questo è
  un gioco piccolo fatto in famiglia, non Magda.
- Non ottimizzare prematuramente. 60fps su una pista con 2 macchine non è un
  problema di performance.
- Non generare test unitari a tappeto. Testiamo solo la logica pura (fisica
  macchina, calcolo tempi), non il rendering.