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
**Stato**: Superseded by ADR-005.

## ADR-005: Texture PBR CC0 da Poly Haven
**Contesto**: Con Minecraft-look e texture procedurali siamo arrivati a un tetto
di qualità; il feedback era "troppo piatte". Full procedural con noise
multi-ottava dà margine ma resta limitato.
**Decisione**: Permesso scaricare texture PBR da fonti CC0 (no attribution
richiesta), committate in `public/textures/`. Niente asset con licenze
restrittive, niente modelli 3D ancora.
**Motivazione**: ADR-004 era esplicitamente "per la v0.1, rivalutabile".
Poly Haven offre texture CC0 senza attribution, bundle size 3-5MB totali
accettabile per una PWA. Mesh restano procedurali (cubi/cilindri).
**Trade-off accettato**: bundle PWA cresce di ~4MB al primo caricamento;
dipendenza offline-friendly una volta scaricato. No nuova build pipeline.