import { useEffect, useMemo } from "react";

import { Chessboard } from "react-chessboard";

import MoveHistroy from "./components/MoveHistroy";
import GameControls from "./components/GameControls";
import PGNController from "./components/PGNController";
import PositionInfo from "./components/PositionInfo";
import EvaluationBar from "./components/EvaluationBar";

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
    mateWinner,
    handleMove,
    handleMoveClick,
    goToStart,
    undoMove,
    redoMove,
  } = useChessGame();

  const { isReady, bestMove, bestMoveUCI, evaluation, mate, depth, pv, analyzePosition, clearAnalysis } =
    useStockfish();

  // --------------------------------
  // Clear old analysis when position
  // changes
  // --------------------------------

  useEffect(() => {
    clearAnalysis();
  }, [currentFEN]);

  // --------------------------------
  // Best Move Square Highlight
  // --------------------------------

  const bestMoveSquareStyles = useMemo(() => {
    if (!bestMoveUCI) {
      return {};
    }

    const from = bestMoveUCI.slice(0, 2);

    const to = bestMoveUCI.slice(2, 4);

    return {
      [from]: {
        background: "rgba(255, 193, 7, 0.55)",
      },

      [to]: {
        background: "rgba(76, 175, 80, 0.55)",
      },
    };
  }, [bestMoveUCI]);

  // --------------------------------
  // Analyze current position
  // --------------------------------

  const handleAnalyze = () => {
    analyzePosition(currentFEN);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Title */}

      <h1 className="text-3xl font-bold text-center py-4">Chess Analyzer</h1>

      {/* Board Area */}

      <div className="flex justify-center gap-8">
        {/* Chessboard + Evaluation Bar */}

        <div className="flex items-center gap-3">
          <EvaluationBar evaluation={evaluation} mate={mate} mateWinner={mateWinner} />

          <div className="w-[400px]">
            <Chessboard
              options={{
                position: displayGame.fen(),

                onPieceDrop: handleMove,

                squareStyles: bestMoveSquareStyles,
              }}
            />
          </div>
        </div>

        {/* Move History */}

        <MoveHistroy moveHistory={game.history()} onMoveClick={handleMoveClick} currentMove={currentMove} />
      </div>

      {/* Position Information */}

      <PositionInfo currentFEN={currentFEN} />

      {/* Engine Analysis */}

      <div className="mt-6 w-[400px] bg-white rounded-xl shadow-md p-5">
        {/* Header */}

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Engine Analysis</h2>

          <span className={isReady ? "text-green-600 text-sm font-semibold" : "text-gray-500 text-sm"}>
            {isReady ? "Ready ●" : "Loading..."}
          </span>
        </div>

        {/* Analyze Button */}

        <button
          onClick={handleAnalyze}
          disabled={!isReady}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 transition"
        >
          Analyze Position
        </button>

        {/* Engine Information */}

        <div className="mt-5 space-y-2 text-sm">
          {depth > 0 && (
            <p className="flex justify-between">
              <span className="text-gray-500">Depth</span>

              <strong>{depth}</strong>
            </p>
          )}

          {evaluation !== null && (
            <p className="flex justify-between">
              <span className="text-gray-500">Evaluation</span>

              <strong>
                {evaluation > 0 ? "+" : ""}
                {evaluation.toFixed(2)}
              </strong>
            </p>
          )}

          {mate !== null && (
            <p className="flex justify-between">
              <span className="text-gray-500">Result</span>

              <strong>{mate > 0 ? `Mate in ${mate}` : `Mated in ${Math.abs(mate)}`}</strong>
            </p>
          )}

          {mateWinner && (
            <p className="flex justify-between">
              <span className="text-gray-500">Winner</span>

              <strong>{mateWinner === "white" ? "White" : "Black"}</strong>
            </p>
          )}

          {bestMove && (
            <p className="flex justify-between">
              <span className="text-gray-500">Best Move</span>

              <strong>{bestMove}</strong>
            </p>
          )}
        </div>

        {/* Principal Variation */}

        {pv.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <p className="text-xs text-gray-500 mb-1">Principal Variation</p>

            <p className="font-medium leading-relaxed">{pv.join(" ")}</p>
          </div>
        )}
      </div>

      {/* Game Controls */}

      <GameControls onStart={goToStart} onUndo={undoMove} onRedo={redoMove} />

      {/* PGN */}

      <PGNController game={game} setGame={setGame} setCurrentMove={setCurrentMove} />
    </div>
  );
};

export default App;
