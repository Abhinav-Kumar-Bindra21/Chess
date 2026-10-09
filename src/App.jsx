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

const CLASSIFICATION_STYLES = {
  brilliant: "bg-cyan-100 text-cyan-800",
  best: "bg-green-100 text-green-800",
  excellent: "bg-emerald-100 text-emerald-800",
  good: "bg-blue-100 text-blue-800",
  inaccuracy: "bg-yellow-100 text-yellow-800",
  mistake: "bg-orange-100 text-orange-800",
  blunder: "bg-red-100 text-red-800",
};

const MOVE_QUALITY_ITEMS = [
  {
    key: "brilliant",
    label: "Brilliant",
    symbol: "!!",
    style: "border-cyan-400",
  },
  {
    key: "best",
    label: "Best",
    symbol: "★",
    style: "border-green-500",
  },
  {
    key: "excellent",
    label: "Excellent",
    symbol: "!",
    style: "border-emerald-400",
  },
  {
    key: "good",
    label: "Good",
    symbol: "✓",
    style: "border-blue-400",
  },
  {
    key: "inaccuracy",
    label: "Inaccuracies",
    symbol: "?!",
    style: "border-yellow-400",
  },
  {
    key: "mistake",
    label: "Mistakes",
    symbol: "?",
    style: "border-orange-400",
  },
  {
    key: "blunder",
    label: "Blunders",
    symbol: "??",
    style: "border-red-500",
  },
];

function App() {
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

  const { isReady, bestMove, bestMoveUCI, evaluation, mate, depth, pv, analyzePosition, clearAnalysis } =
    useStockfish();

  const { analysisResults, isAnalyzing, progress, analyzeGame, clearGameAnalysis } = useGameAnalysis(analyzePosition);

  const [boardOrientation, setBoardOrientation] = useState("white");
  const [selectedAnalysisMove, setSelectedAnalysisMove] = useState(null);

  // Show the selected analyzed position or the current game position.
  const boardPosition = selectedAnalysisMove ? selectedAnalysisMove.fenAfter : displayGame.fen();

  // Lesson 53: Count each move classification.
  const moveQualitySummary = useMemo(() => {
    const summary = {
      brilliant: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
    };

    for (const result of analysisResults) {
      const classification = result.classification;

      if (Object.prototype.hasOwnProperty.call(summary, classification)) {
        summary[classification] += 1;
      }
    }

    return summary;
  }, [analysisResults]);

  const analyzedMoveCount = useMemo(() => {
    return Object.values(moveQualitySummary).reduce((total, count) => total + count, 0);
  }, [moveQualitySummary]);

  // Highlight the best move on the live board.
  const bestMoveArrows = useMemo(() => {
    if (!bestMoveUCI || selectedAnalysisMove) {
      return [];
    }

    const from = bestMoveUCI.slice(0, 2);
    const to = bestMoveUCI.slice(2, 4);

    if (from.length !== 2 || to.length !== 2) {
      return [];
    }

    return [
      {
        startSquare: from,
        endSquare: to,
        color: "#16a34a",
      },
    ];
  }, [bestMoveUCI, selectedAnalysisMove]);

  const bestMoveSquareStyles = useMemo(() => {
    if (!bestMoveUCI || selectedAnalysisMove) {
      return {};
    }

    const from = bestMoveUCI.slice(0, 2);
    const to = bestMoveUCI.slice(2, 4);

    return {
      [from]: {
        backgroundColor: "rgba(250, 204, 21, 0.45)",
      },
      [to]: {
        backgroundColor: "rgba(34, 197, 94, 0.45)",
      },
    };
  }, [bestMoveUCI, selectedAnalysisMove]);

  // Clear the previous engine result when the live position changes.
  useEffect(() => {
    clearAnalysis();
  }, [currentFEN, clearAnalysis]);

  // Analyze the currently displayed position.
  const handleAnalyze = () => {
    if (!isReady) {
      return;
    }

    analyzePosition(boardPosition, 15);
  };

  // Analyze all moves from the current game's PGN.
  const handleAnalyzeGame = () => {
    const pgn = game.pgn();

    if (!pgn.trim()) {
      window.alert("Play some moves before analyzing the game.");
      return;
    }

    const gameMoves = extractGameMoves(pgn);

    if (gameMoves.length === 0) {
      window.alert("No moves were found to analyze.");
      return;
    }

    setSelectedAnalysisMove(null);
    clearGameAnalysis();
    analyzeGame(gameMoves, 15);
  };

  // Inspect an analyzed move without changing the actual game history.
  const handleAnalysisMoveClick = (result) => {
    setSelectedAnalysisMove(result);
  };

  const returnToCurrentPosition = () => {
    setSelectedAnalysisMove(null);
  };

  const handleFlipBoard = () => {
    setBoardOrientation((previous) => (previous === "white" ? "black" : "white"));
  };

  const progressPercentage = typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Chess Analyzer</h1>

          <p className="mt-2 text-sm text-slate-600">Analyze positions, find stronger moves, and review your game.</p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* Left side: Chessboard */}
          <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            {selectedAnalysisMove && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50 p-3">
                <div>
                  <p className="font-semibold text-blue-900">Reviewing analyzed move</p>

                  <p className="text-sm text-blue-700">
                    Move {selectedAnalysisMove.moveNumber}: {selectedAnalysisMove.move}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={returnToCurrentPosition}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Return to game
                </button>
              </div>
            )}

            <div className="mx-auto w-full max-w-[620px]">
              <Chessboard
                options={{
                  position: boardPosition,
                  boardOrientation,
                  onPieceDrop: selectedAnalysisMove ? undefined : handleMove,
                  squareStyles: bestMoveSquareStyles,
                  arrows: bestMoveArrows,
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleFlipBoard}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Flip Board
              </button>

              <GameResult gameStatus={gameStatus} />
            </div>

            {/* Evaluation bar */}
            <div className="mt-5">
              <EvaluationBar
                evaluation={evaluation}
                mate={mate}
                mateWinner={mateWinner}
                boardOrientation={boardOrientation}
              />
            </div>

            {/* Position information */}
            <div className="mt-5">
              <PositionInfo currentFEN={boardPosition} />
            </div>
          </section>

          {/* Right side: Analysis */}
          <div className="space-y-6">
            {/* Single-position analysis */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Engine Analysis</h2>

              <p className="mt-1 text-sm text-slate-600">
                {isReady
                  ? "Stockfish is ready to analyze the current position."
                  : "Waiting for Stockfish to become ready..."}
              </p>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!isReady}
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Analyze Position
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-500">Evaluation</p>

                  <p className="mt-1 text-lg font-bold">
                    {evaluation === null || evaluation === undefined
                      ? "—"
                      : evaluation > 0
                        ? `+${evaluation.toFixed(2)}`
                        : evaluation.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-500">Mate</p>

                  <p className="mt-1 text-lg font-bold">{mate === null || mate === undefined ? "—" : `#${mate}`}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-500">Depth</p>

                  <p className="mt-1 text-lg font-bold">{depth ?? "—"}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700">Best move</p>

                <p className="mt-1 break-words text-lg font-bold text-green-700">
                  {bestMove || bestMoveUCI || "Analyze the position first"}
                </p>
              </div>

              {pv && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-700">Principal variation</p>

                  <p className="mt-1 break-words text-sm text-slate-600">{Array.isArray(pv) ? pv.join(" ") : pv}</p>
                </div>
              )}
            </section>

            {/* Full-game analysis */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Full Game Analysis</h2>

                  <p className="mt-1 text-sm text-slate-600">Review the quality of each played move.</p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                  {analysisResults.length} analyzed
                </span>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeGame}
                disabled={!isReady || isAnalyzing}
                className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isAnalyzing ? "Analyzing Game..." : "Analyze Complete Game"}
              </button>

              {/* Analysis progress bar */}
              {isAnalyzing && (
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm text-slate-600">
                    <span>Analyzing moves</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>

                  <div
                    className="h-3 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label="Game analysis progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progressPercentage)}
                  >
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Lesson 53: Move quality summary */}
              {analysisResults.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">Move Quality Summary</h3>

                    <span className="text-sm text-slate-500">{analyzedMoveCount} classified moves</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {MOVE_QUALITY_ITEMS.map((item) => (
                      <div key={item.key} className={`rounded-lg border-l-4 bg-slate-50 p-3 ${item.style}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-600">{item.label}</p>

                          <span className="font-bold text-slate-500">{item.symbol}</span>
                        </div>

                        <p className="mt-2 text-2xl font-bold">{moveQualitySummary[item.key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual analyzed moves */}
              {analysisResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-bold">Move Details</h3>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-3 py-3">Move</th>
                          <th className="px-3 py-3">Player</th>
                          <th className="px-3 py-3">Played</th>
                          <th className="px-3 py-3">Best move</th>
                          <th className="px-3 py-3">Evaluation</th>
                          <th className="px-3 py-3">Quality</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {analysisResults.map((result, index) => {
                          const isSelected = selectedAnalysisMove === result;

                          const classification = result.classification || "good";

                          const classificationStyle =
                            CLASSIFICATION_STYLES[classification] || CLASSIFICATION_STYLES.good;

                          return (
                            <tr
                              key={`${result.moveNumber}-${result.player}-${index}`}
                              onClick={() => handleAnalysisMoveClick(result)}
                              className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                                isSelected ? "bg-blue-100" : "bg-white"
                              }`}
                            >
                              <td className="px-3 py-3 font-medium">
                                {result.moveNumber}
                                {result.player === "black" ? "..." : "."}
                              </td>

                              <td className="px-3 py-3 capitalize">{result.player}</td>

                              <td className="px-3 py-3 font-semibold">{result.actualMove || result.move || "—"}</td>

                              <td className="px-3 py-3 text-green-700">
                                {result.bestMove || result.bestMoveUCI || "—"}
                              </td>

                              <td className="px-3 py-3">
                                {result.evaluationAfter === null || result.evaluationAfter === undefined
                                  ? "—"
                                  : result.evaluationAfter > 0
                                    ? `+${result.evaluationAfter.toFixed(2)}`
                                    : result.evaluationAfter.toFixed(2)}
                              </td>

                              <td className="px-3 py-3">
                                <span
                                  className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold capitalize ${classificationStyle}`}
                                >
                                  {classification}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Select a row to inspect the board position after that move.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Move history and game controls */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Move History</h2>

            <MoveHistroy moveHistory={game.history()} currentMove={currentMove} onMoveClick={handleMoveClick} />
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Game Controls</h2>

            <GameControls
              goToStart={goToStart}
              undoMove={undoMove}
              redoMove={redoMove}
              currentMove={currentMove}
              setCurrentMove={setCurrentMove}
              game={game}
              setGame={setGame}
              gameStatus={gameStatus}
            />
          </section>
        </div>

        {/* PGN import and export */}
        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">PGN Import / Export</h2>

          <PGNController game={game} setGame={setGame} setCurrentMove={setCurrentMove} />
        </section>
      </div>
    </main>
  );
}

export default App;
