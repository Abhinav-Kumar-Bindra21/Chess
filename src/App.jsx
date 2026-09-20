import { Chessboard } from "react-chessboard";
import MoveHistroy from "./components/MoveHistroy";
import GameControls from "./components/GameControls";
import PGNController from "./components/PGNController";
import PositionInfo from "./components/PositionInfo";

import useChessGame from "./hooks/useChessGame";
import useStockfish from "./hooks/useStockfish";

const App = () => {
  const {
    game,
    setGame,
    currentMove,
    setCurrentMove,
    displayGame,
    currentFEN,
    handleMove,
    handleMoveClick,
    goToStart,
    undoMove,
    redoMove,
  } = useChessGame();

  const { isReady, bestMove, evaluation, mate, depth, pv, analyzePosition } = useStockfish();

  const handleAnalyze = () => {
    analyzePosition(currentFEN);
  };
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

      {/* Current FEN */}
      <PositionInfo currentFEN={currentFEN} />

      {/* Engine */}

      <div className="mt-4 flex flex-col items-center gap-2">
        <p>Stockfish: {isReady ? "Ready ✅" : "Loading..."}</p>

        <button
          onClick={handleAnalyze}
          disabled={!isReady}
          className="bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Analyze Position
        </button>

        {depth > 0 && (
          <p>
            Depth: <strong>{depth}</strong>
          </p>
        )}

        {evaluation !== null && (
          <p>
            Evaluation:{" "}
            <strong>
              {evaluation > 0 ? "+" : ""}
              {evaluation.toFixed(2)}
            </strong>
          </p>
        )}

        {mate !== null && (
          <p>
            Evaluation: <strong>{mate > 0 ? `Mate in ${mate}` : `Mated in ${Math.abs(mate)}`}</strong>
          </p>
        )}

        {bestMove && (
          <p>
            Best Move: <strong>{bestMove}</strong>
          </p>
        )}

        {/* Principal Variation */}

        {pv.length > 0 && (
          <p>
            Line : <strong>{pv.join(" ")}</strong>
          </p>
        )}
      </div>

      <GameControls onStart={goToStart} onUndo={undoMove} onRedo={redoMove} />

      <PGNController game={game} setGame={setGame} setCurrentMove={setCurrentMove} />
    </div>
  );
};

export default App;
