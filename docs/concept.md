# Concept

## Pitch in una frase
Un gioco arcade di F1 in 3D a blocchi, dove fai più giri possibile nel minor tempo.

## Target giocatori
Due figli, 10 e 16 anni. Questo gap guida diverse scelte:

- **Curva di apprendimento bassa**: il 10enne deve poter iniziare a giocare
  entro 30 secondi senza tutorial. Controlli intuitivi, nessun concetto
  complesso da spiegare.
- **Soffitto di skill alto**: il 16enne si annoia in 5 minuti se il gioco è
  banale. Ci deve essere margine per migliorare (traiettoria ottimale,
  gestione frenata, memorizzazione pista) che premi la pratica.
- **Competizione asimmetrica**: il cuore del divertimento sarà
  probabilmente "chi fa il giro più veloce". La classifica persistente dei
  tempi è quindi *centrale*, non un extra.

Stessa meccanica, gratificazioni diverse: il piccolo si diverte guidando,
il grande si diverte ottimizzando.

## Il loop di gameplay
Parti → accelera → curve → taglia il traguardo → vedi il tuo tempo →
"ancora un giro, questa volta lo batto".

## Controlli
- Desktop: frecce o WASD (↑/W accelera, ↓/S frena, ←→/AD sterza),
  Space = freno a mano
- Mobile: bottoni touch (accelera/frena a destra, sterzo a sinistra)
- Gamepad: supporto base (stick sinistro sterza, grilletti acceleratore/freno)

## Estetica
Low-poly, colori piatti e saturi. Piste cartoon. Macchine a forma di F1
stilizzata (cubo lungo + ruote cilindriche). Niente ombre realistiche,
niente riflessi.

Deve risultare accattivante sia per un 10enne (colori vivi, senso di
velocità, feedback immediato) sia per un 16enne (non infantile, non
"cartoon per bambini piccoli"). Riferimento mentale: *Trackmania* semplificato,
non *Cars* della Pixar.

## Obiettivo giocatore
Tempo sul giro più basso possibile.
La classifica dei migliori tempi (persistente, almeno in localStorage) è
parte integrante dell'MVP perché è quella che alimenta la competizione
tra fratelli.