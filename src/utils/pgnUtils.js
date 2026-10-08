import { Chess } from "chess.js";

export const extractGameMoves = (pgn) => {
  const game = new Chess();

  game.loadPgn(pgn);

  const moves = game.history({
    verbose: true,
  });

  const tempGame = new Chess();

  const gameMoves = [];

  moves.forEach((move, index) => {
    // --------------------------------
    // Position BEFORE the move
    // --------------------------------

    const fenBefore = tempGame.fen();

    // --------------------------------
    // Play the actual move
    // --------------------------------

    const playedMove = tempGame.move(move);

    // --------------------------------
    // Position AFTER the move
    // --------------------------------

    const fenAfter = tempGame.fen();

    // --------------------------------
    // Player
    // --------------------------------

    const player = move.color === "w" ? "white" : "black";

    // --------------------------------
    // Move number
    // --------------------------------

    const moveNumber = Math.floor(index / 2) + 1;

    // --------------------------------
    // Convert actual move to UCI
    //
    // Example:
    // e2 -> e4
    // becomes:
    // e2e4
    // --------------------------------

    const moveUCI = `${playedMove.from}${playedMove.to}${playedMove.promotion || ""}`;

    // --------------------------------
    // Save complete move information
    // --------------------------------

    gameMoves.push({
      moveNumber,

      player,

      move: playedMove.san,

      moveUCI,

      fenBefore,

      fenAfter,
    });
  });

  return gameMoves;
};
