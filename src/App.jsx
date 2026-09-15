import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import MoveHistroy from "./components/MoveHistroy";
import GameControls from "./components/GameControls";

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [redoStack, setRedoStack] = useState([]);

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

      console.log("PGN:", gameCopy.pgn());
      console.log("FEN:", gameCopy.fen());
      console.log("HISTORY:", gameCopy.history());

      return true;
    } catch (error) {
      console.log("INVALID MOVE:", error);
      return false;
    }
  };

  // Undo move function
  const undoMove = () => {
    if (game.history().length === 0) {
      return;
    }

    const gameCopy = new Chess();

    gameCopy.loadPgn(game.pgn());

    const undoneMove = gameCopy.undo();

    if (!undoneMove) {
      return;
    }

    setGame(gameCopy);

    setRedoStack((prev) => [
      ...prev,
      {
        from: undoneMove.from,
        to: undoneMove.to,
        promotion: undoneMove.promotion,
      },
    ]);
  };

  // Redo move function
  const redoMove = () => {
    if (redoStack.length === 0) {
      return;
    }

    const newStack = [...redoStack];

    const moveToRedo = newStack.pop();

    if (!moveToRedo) {
      return;
    }

    const gameCopy = new Chess();

    gameCopy.loadPgn(game.pgn());

    gameCopy.move(moveToRedo);

    setGame(gameCopy);

    setRedoStack(newStack);
  };

  // Reset game function
  const resetGame = () => {
    setGame(new Chess());
    setRedoStack([]);
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

          {/* Game controls */}
          <GameControls onUndo={undoMove} onRedo={redoMove} onReset={resetGame} />
        </div>

        {/* MOVE HISTORY */}

        <MoveHistroy moveHistory={game.history()} />
      </div>
    </div>
  );
};

export default App;
