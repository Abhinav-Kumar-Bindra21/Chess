import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import MoveHistroy from "./components/MoveHistroy";

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMove, setCurrentMove] = useState(-1);

  const handleMove = ({ sourceSquare, targetSquare }) => {
    const gameCopy = new Chess();

    gameCopy.loadPgn(game.pgn());

    try {
      gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setGame(gameCopy);

      // After making a new move, show the latest position
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

  const previousMove = () => {
    setCurrentMove((prev) => Math.max(-1, prev - 1));
  };

  const nextMove = () => {
    const totalMoves = game.history().length;

    setCurrentMove((prev) => Math.min(totalMoves - 1, prev + 1));
  };

  const displayGame = getPositionAtMove(currentMove);

  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center py-4">Chess Analyzer</h1>

      <div className="flex justify-center gap-8">
        <div className="w-[400px]">
          <Chessboard
            options={{
              position: displayGame.fen(),
              onPieceDrop: handleMove,
            }}
          />
        </div>

        <MoveHistroy moveHistory={game.history()} onMoveClick={handleMoveClick} currentMove={currentMove} />
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <button onClick={goToStart}>Start</button>

        <button onClick={previousMove}>← Previous</button>

        <button onClick={nextMove}>Next →</button>
      </div>
    </div>
  );
};

export default App;
