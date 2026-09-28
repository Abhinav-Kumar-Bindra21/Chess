import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";

const useChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMove, setCurrentMove] = useState(-1);

  const handleMove = ({ sourceSquare, targetSquare }) => {
    const gameCopy = getPositionAtMove(currentMove);

    try {
      gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setGame(gameCopy);

      setCurrentMove(gameCopy.history().length - 1);

      console.log("NEW FEN:", gameCopy.fen());
      console.log("HISTORY:", gameCopy.history());

      return true;
    } catch (error) {
      console.log("INVALID MOVE:", error);
      return false;
    }
  };

  const getPositionAtMove = (moveIndex) => {
    const tempGame = new Chess();

    if (moveIndex === -1) {
      return tempGame;
    }

    const moves = game.history({ verbose: true });

    for (let i = 0; i <= moveIndex; i++) {
      tempGame.move(moves[i]);
    }

    return tempGame;
  };

  const handleMoveClick = (moveIndex) => {
    setCurrentMove(moveIndex);
  };

  const goToStart = () => {
    setCurrentMove(-1);
  };

  const undoMove = () => {
    setCurrentMove((prev) => Math.max(-1, prev - 1));
  };

  const redoMove = () => {
    const totalMoves = game.history().length;

    setCurrentMove((prev) => Math.min(totalMoves - 1, prev + 1));
  };

  const displayGame = useMemo(() => {
    return getPositionAtMove(currentMove);
  }, [game, currentMove]);

  const currentFEN = displayGame.fen();

  const mateWinner = useMemo(() => {
    // NO Checkmate
    if (!displayGame.isCheckmate()) {
      return null;
    }

    // If it is White's Turn
    // White has been checkmated

    if (displayGame.turn() === "w") {
      return "black";
    }

    // If its Black Turn
    // Black has been checkmated
    return "white";
  }, [displayGame]);

  // -------------------------------- // Detect complete game status // --------------------------------

  const gameStatus = useMemo(() => {
    if (displayGame.isCheckmate()) {
      return {
        isGameOver: true,
        status: "checkmate",
        winner: displayGame.turn === "w" ? "black" : "white",
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

  // -------------------------------- // Update browser title // --------------------------------

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
