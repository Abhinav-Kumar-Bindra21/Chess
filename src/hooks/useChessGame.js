import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";

const useChessGame = () => {
  // The complete game history.
  const [game, setGame] = useState(new Chess());

  // -1 means the starting position.
  // 0 means after the first move, 1 after the second, etc.
  const [currentMove, setCurrentMove] = useState(-1);

  // Reconstruct a position from the beginning of the game
  // up to the requested move index.
  const getPositionAtMove = (moveIndex) => {
    const tempGame = new Chess();

    if (moveIndex === -1) {
      return tempGame;
    }

    const moves = game.history({ verbose: true });

    for (let i = 0; i <= moveIndex && i < moves.length; i++) {
      tempGame.move(moves[i]);
    }

    return tempGame;
  };

  // Play a move on the currently selected position.
  const handleMove = ({ sourceSquare, targetSquare }) => {
    const gameCopy = getPositionAtMove(currentMove);

    try {
      gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      // Store the new line of play.
      // Any old continuation after the selected position
      // is discarded because gameCopy contains only that line.
      setGame(gameCopy);

      // Select the position after the newly played move.
      setCurrentMove(gameCopy.history().length - 1);

      console.log("NEW FEN:", gameCopy.fen());
      console.log("HISTORY:", gameCopy.history());

      return true;
    } catch (error) {
      console.log("INVALID MOVE:", error);
      return false;
    }
  };

  // Select a position from the move history.
  const handleMoveClick = (moveIndex) => {
    setCurrentMove(moveIndex);
  };

  // Return to the starting position.
  const goToStart = () => {
    setCurrentMove(-1);
  };

  // Move one step backward.
  const undoMove = () => {
    setCurrentMove((prev) => Math.max(-1, prev - 1));
  };

  // Move one step forward without going beyond the final move.
  const redoMove = () => {
    const totalMoves = game.history().length;

    setCurrentMove((prev) => Math.min(totalMoves - 1, prev + 1));
  };

  // Recalculate the displayed position when the game
  // or the selected move changes.
  const displayGame = useMemo(() => {
    return getPositionAtMove(currentMove);
  }, [game, currentMove]);

  const currentFEN = displayGame.fen();

  // Determine the winner when the displayed position is checkmate.
  const mateWinner = useMemo(() => {
    if (!displayGame.isCheckmate()) {
      return null;
    }

    // The side whose turn it is has been checkmated.
    return displayGame.turn() === "w" ? "black" : "white";
  }, [displayGame]);

  // Determine whether the displayed position ends the game.
  const gameStatus = useMemo(() => {
    if (displayGame.isCheckmate()) {
      return {
        isGameOver: true,
        status: "checkmate",
        winner: displayGame.turn() === "w" ? "black" : "white",
      };
    }

    if (displayGame.isStalemate()) {
      return {
        isGameOver: true,
        status: "stalemate",
        winner: null,
      };
    }

    if (displayGame.isThreefoldRepetition()) {
      return {
        isGameOver: true,
        status: "threefold repetition",
        winner: null,
      };
    }

    if (displayGame.isInsufficientMaterial()) {
      return {
        isGameOver: true,
        status: "insufficient material",
        winner: null,
      };
    }

    if (displayGame.isDraw()) {
      return {
        isGameOver: true,
        status: "draw",
        winner: null,
      };
    }

    return {
      isGameOver: false,
      status: "playing",
      winner: null,
    };
  }, [displayGame]);

  // Update the browser tab title when the selected move changes.
  useEffect(() => {
    if (currentMove === -1) {
      document.title = "Chess Analyzer - Starting Position";
    } else {
      document.title = `Chess Analyzer - Move ${currentMove + 1}`;
    }
  }, [currentMove]);

  return {
    game,
    setGame,

    currentMove,
    setCurrentMove,

    currentFEN,
    displayGame,

    mateWinner,
    gameStatus,

    handleMove,
    handleMoveClick,

    goToStart,
    undoMove,
    redoMove,
  };
};

export default useChessGame;
