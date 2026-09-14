import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";

const App = () => {
  const [game, setGame] = useState(new Chess());

  const handleMove = ({ sourceSquare, targetSquare }) => {
    console.log("FEN:", game.fen());
    console.log("Turn:", game.turn());
    console.log("Legal moves:", game.moves());

    const gameCopy = new Chess(game.fen());

    try {
      gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setGame(gameCopy);

      console.log("NEW FEN:", gameCopy.fen());

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
      </div>
    </div>
  );
};

export default App;
