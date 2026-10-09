import { useEffect, useMemo, useState } from "react";

import { Chessboard } from "react-chessboard";

import MoveHistroy from "./components/MoveHistroy";
import GameControls from "./components/GameControls";
import PGNController from "./components/PGNController";
import PositionInfo from "./components/PositionInfo";
import EvaluationBar from "./components/EvaluationBar";
import GameResult from "./components/GameResult";

import useChessGame from "./hooks/useChessGame";
import useStockfish from "./hooks/useStockfish";
import useGameAnalysis from "./hooks/useGameAnalysis";

import { extractGameMoves } from "./utils/pgnUtils";

const App = () => {
  // --------------------------------
  // Chess game state
  // --------------------------------

  const {
    game,
    setGame,
    currentMove,
    setCurrentMove,
    displayGame,
    currentFEN,
    mateWinner,
    gameStatus,
    handleMove,
    handleMoveClick,
    goToStart,
    undoMove,
    redoMove,
  } = useChessGame();

  // --------------------------------
  // Stockfish state
  // --------------------------------

  const { isReady, bestMove, bestMoveUCI, evaluation, mate, depth, pv, analyzePosition, clearAnalysis } =
    useStockfish();

  // --------------------------------
  // Full game analysis state
  // --------------------------------

  const { analysisResults, isAnalyzing, progress, analyzeGame, clearGameAnalysis } = useGameAnalysis(analyzePosition);

  // --------------------------------
  // Board orientation
  // --------------------------------

  const [boardOrientation, setBoardOrientation] = useState("white");

  const handleFlipBoard = () => {
    setBoardOrientation((current) => (current === "white" ? "black" : "white"));
  };

  // --------------------------------
  // Clear position analysis when
  // the current board position changes
  // --------------------------------

  useEffect(() => {
    clearAnalysis();
  }, [currentFEN]);

  // --------------------------------
  // Highlight Stockfish's best move
  // --------------------------------

  const bestMoveSquareStyles = useMemo(() => {
    if (!bestMoveUCI) return {};

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

  const handleAnalyze = async () => {
    if (!isReady) return;

    const result = await analyzePosition(currentFEN);

    console.log("POSITION ANALYSIS RESULT:", result);
  };

  // --------------------------------
  // Analyze complete PGN game
  // --------------------------------

  const handleAnalyzeGame = async () => {
    if (!isReady || isAnalyzing) return;

    try {
      const pgn = game.pgn();

      if (!pgn.trim()) {
        alert("Please play some moves or load a PGN game first.");
        return;
      }

      const gameMoves = extractGameMoves(pgn);

      if (gameMoves.length === 0) {
        alert("No moves found in this game.");
        return;
      }

      clearGameAnalysis();

      const results = await analyzeGame(gameMoves, 15);

      console.log("FULL GAME ANALYSIS:", results);
    } catch (error) {
      console.error("Failed to analyze game:", error);
    }
  };

  // --------------------------------
  // Analysis progress
  // --------------------------------

  const progressPercentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const analysisComplete = !isAnalyzing && progress.total > 0 && progress.current === progress.total;

  // --------------------------------
  // Classification colors
  // --------------------------------

  const getClassificationStyle = (classification) => {
    const styles = {
      brilliant: "bg-cyan-100 text-cyan-800",
      best: "bg-green-100 text-green-800",
      excellent: "bg-emerald-100 text-emerald-800",
      good: "bg-blue-100 text-blue-800",
      inaccuracy: "bg-yellow-100 text-yellow-800",
      mistake: "bg-orange-100 text-orange-800",
      blunder: "bg-red-100 text-red-800",
    };

    return styles[classification] || "bg-gray-100 text-gray-700";
  };

  // --------------------------------
  // Render application
  // --------------------------------

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 pb-10">
      <h1 className="text-3xl font-bold text-center py-4">Chess Analyzer</h1>

      {/* Chessboard and move history */}

      <div className="flex flex-wrap justify-center gap-8">
        <div className="flex items-center gap-3">
          <EvaluationBar
            evaluation={evaluation}
            mate={mate}
            mateWinner={mateWinner}
            boardOrientation={boardOrientation}
          />

          <div className="w-[400px] max-w-full">
            <Chessboard
              options={{
                position: displayGame.fen(),
                boardOrientation,
                onPieceDrop: handleMove,
                squareStyles: bestMoveSquareStyles,
              }}
            />
          </div>
        </div>

        <MoveHistroy moveHistory={game.history()} onMoveClick={handleMoveClick} currentMove={currentMove} />
      </div>

      {/* Board controls and game result */}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={handleFlipBoard}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
        >
          Flip Board
        </button>

        <GameResult gameStatus={gameStatus} />
      </div>

      {/* Current position information */}

      <PositionInfo currentFEN={currentFEN} />

      {/* Single-position Stockfish analysis */}

      <div className="mt-6 w-full max-w-[500px] bg-white rounded-xl shadow-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Engine Analysis</h2>

          <span className={isReady ? "text-green-600 text-sm font-semibold" : "text-gray-500 text-sm"}>
            {isReady ? "Ready ●" : "Loading..."}
          </span>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!isReady}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 transition"
        >
          Analyze Position
        </button>

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
              <strong>{mate > 0 ? `Mate in ${mate}` : mate < 0 ? `Mated in ${Math.abs(mate)}` : "Checkmate"}</strong>
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

        {pv.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <p className="text-xs text-gray-500 mb-1">Principal Variation</p>

            <p className="font-medium leading-relaxed break-words">{pv.join(" ")}</p>
          </div>
        )}
      </div>

      {/* Full game analysis */}

      <div className="mt-6 w-full max-w-4xl rounded-xl bg-white p-5 shadow-md">
        <h2 className="mb-4 text-xl font-bold">Full Game Analysis</h2>

        <button
          onClick={handleAnalyzeGame}
          disabled={!isReady || isAnalyzing}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isAnalyzing ? "Analyzing Game..." : "Analyze Complete Game"}
        </button>

        {/* Progress bar */}

        <div className="mt-5 rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Analysis Progress</h3>

            <span className="text-sm font-semibold text-indigo-600">{progressPercentage}%</span>
          </div>

          <div
            className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-label="Game analysis progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-gray-600">
            {isAnalyzing
              ? `Analyzing move ${progress.current} of ${progress.total}...`
              : analysisComplete
                ? `Analysis complete! ${progress.total} moves analyzed.`
                : progress.total === 0
                  ? "Load a game and click Analyze Complete Game to begin."
                  : "Analysis stopped before all moves were completed."}
          </p>

          {isAnalyzing && <p className="mt-1 text-xs text-gray-500">Stockfish is evaluating each move. Please wait.</p>}
        </div>

        {/* Analysis results */}

        {analysisResults.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-lg">Move-by-Move Results</h3>

              <span className="text-sm text-gray-500">{analysisResults.length} moves analyzed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border p-2">Move</th>
                    <th className="border p-2">Player</th>
                    <th className="border p-2">Played</th>
                    <th className="border p-2">Best</th>
                    <th className="border p-2">CPL</th>
                    <th className="border p-2">Classification</th>
                  </tr>
                </thead>

                <tbody>
                  {analysisResults.map((result, index) => (
                    <tr key={`${result.moveNumber}-${result.player}-${index}`} className="hover:bg-gray-50">
                      <td className="border p-2 whitespace-nowrap">
                        {result.moveNumber}
                        {result.player === "white" ? "." : "..."}
                      </td>

                      <td className="border p-2 capitalize">{result.player}</td>

                      <td className="border p-2 font-semibold">{result.actualMove || result.move}</td>

                      <td className="border p-2">{result.bestMove || "—"}</td>

                      <td className="border p-2">{result.centipawnLoss !== null ? result.centipawnLoss : "—"}</td>

                      <td className="border p-2">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getClassificationStyle(
                            result.classification,
                          )}`}
                        >
                          {result.classification}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Game controls */}

      <div className="mt-6">
        <GameControls onStart={goToStart} onUndo={undoMove} onRedo={redoMove} />
      </div>

      {/* PGN import/export */}

      <div className="mt-6">
        <PGNController game={game} setGame={setGame} setCurrentMove={setCurrentMove} />
      </div>
    </div>
  );
};

export default App;
