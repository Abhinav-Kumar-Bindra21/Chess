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

  return {
    game,
    setGame,

    currentMove,
    setCurrentMove,

    currentFEN,
    displayGame,

    handleMove,
    handleMoveClick,

    goToStart,
    undoMove,
    redoMove,
  };
};

export default useChessGame;
