import { Chessboard } from "react-chessboard";
import MoveHistroy from "./components/MoveHistroy";
import GameControls from "./components/GameControls";
import PGNController from "./components/PGNController";
import useChessGame from "./hooks/useChessGame";

const App = () => {
  const {
    game,
    setGame,
    currentMove,
    setCurrentMove,
    displayGame,
    handleMove,
    handleMoveClick,
    goToStart,
    undoMove,
    redoMove,
  } = useChessGame();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
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

      <GameControls onStart={goToStart} onUndo={undoMove} onRedo={redoMove} />

      <PGNController game={game} setGame={setGame} setCurrentMove={setCurrentMove} />
    </div>
  );
};

export default App;
