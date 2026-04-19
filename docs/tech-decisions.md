# Decisioni tecniche (ADR leggere)

## ADR-001: Babylon.js invece di Three.js
**Data**: [da compilare]
**Contesto**: Serve un engine 3D per web, cross-platform via PWA/Capacitor.
**Decisione**: Babylon.js.
**Motivazione**: Scene graph, input, physics, asset loading già integrati.
Three.js richiederebbe di assemblare tutto a mano. TypeScript-first.
**Trade-off accettato**: Bundle leggermente più grande di Three.js puro.

## ADR-002: PWA come target primario
**Decisione**: Deploy come PWA statica, Capacitor solo in fase 2.
**Motivazione**: Zero friction per far provare il gioco ai bambini.
Niente store, niente provisioning. Lo stesso bundle diventerà app mobile
quando/se serve.

## ADR-003: Physics custom, non Havok, in v0.1
**Decisione**: Fisica della macchina implementata a mano (velocità, accelerazione, sterzo).
**Motivazione**: Più prevedibile per un arcade, più leggero, evita una dipendenza
pesante (WASM) finché non serve davvero. Havok entra se aggiungeremo collisioni
complesse o multiplayer.

## ADR-004: Asset procedurali in v0.1
**Decisione**: Nessun asset esterno. Tutto generato da codice.
**Motivazione**: Zero dipendenze su pipeline di asset, zero problemi di licenza,
iterazione veloce. I bambini hanno 7-12 anni: un cubo colorato è una F1.