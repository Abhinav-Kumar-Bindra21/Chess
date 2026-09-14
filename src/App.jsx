import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import MoveHistroy from "./components/MoveHistroy";

const App = () => {
  const [game, setGame] = useState(new Chess());

  const handleMove = ({ sourceSquare, targetSquare }) => {
    const gameCopy = new Chess();

    // Copy previous game including history
    gameCopy.loadPgn(game.pgn());

    try {
      gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setGame(gameCopy);

      console.log("NEW FEN:", gameCopy.fen());
      console.log("HISTORY:", gameCopy.history());

      return true;
    } catch (error) {
      console.log("INVALID MOVE:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center py-4">Chess Analyzer</h1>

      <div className="flex justify-center">
        <div className="w-[400px]">
          <Chessboard
            options={{
              position: game.fen(),
              onPieceDrop: handleMove,
            }}
          />
        </div>

        {/* MOVE HISTORY */}

        <MoveHistroy moveHistory={game.history()} />
      </div>
    </div>
  );
};

export default App;
