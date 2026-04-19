# Scope v0.1

## Dentro
- Una pista chiusa, ovale con due curve e due rettilinei
- Una macchina controllabile dal giocatore
- Fisica arcade: accelerazione, frenata, sterzo, attrito
- Collisione con bordi pista (respingimento morbido, no crash)
- Cronometro tempo sul giro + miglior tempo della sessione
- Schermata di start minimalissima ("Premi SPAZIO per partire")

## Fuori (esplicitamente NO in v0.1)
- Più piste
- Avversari AI
- Multiplayer
- Danni, pit stop, gomme
- Audio (arriva in v0.2)
- Menu opzioni, impostazioni grafiche
- Salvataggio persistente dei record
- Animazioni celebrative

## Slice verticali (ordine di sviluppo)
1. Walking skeleton: scena + pista quadrata + cubo che si muove con frecce
2. Camera che segue la macchina (third person alle spalle)
3. Fisica macchina: accelerazione, frenata, sterzo proporzionale alla velocità
4. Pista vera con curve (mesh procedurale)
5. Collisione con bordi
6. Rilevamento giro completato + cronometro
7. Display HUD (tempo attuale, miglior tempo)
8. Schermata start + reset
9. Polish estetico (colori, skybox semplice, linea traguardo)