import { Chess } from "chess.js";
import { useState } from "react";

// --------------------------------
// Material values
// --------------------------------

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

// --------------------------------
// Material balance
// --------------------------------

const getMaterialBalance = (fen) => {
  const chess = new Chess(fen);
  let balance = 0;

  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type];
      balance += piece.color === "w" ? value : -value;
    }
  }

  return balance;
};

const getPlayerMaterialBalance = (fen, player) => {
  const balance = getMaterialBalance(fen);
  return player === "white" ? balance : -balance;
};

// --------------------------------
// Detect material sacrifice
// --------------------------------

const detectMaterialSacrifice = (fenBefore, fenAfter, player) => {
  try {
    const beforeBalance = getPlayerMaterialBalance(fenBefore, player);

    const position = new Chess(fenAfter);
    const opponentReplies = position.moves({
      verbose: true,
    });

    for (const reply of opponentReplies) {
      const afterReply = new Chess(fenAfter);

      afterReply.move({
        from: reply.from,
        to: reply.to,
        promotion: reply.promotion,
      });

      const balanceAfterReply = getPlayerMaterialBalance(afterReply.fen(), player);

      // Opponent must win material.
      if (balanceAfterReply >= beforeBalance) {
        continue;
      }

      // Check whether the sacrificed material
      // can be recovered immediately.
      const playerReplies = afterReply.moves({
        verbose: true,
      });

      let bestBalance = balanceAfterReply;

      for (const playerReply of playerReplies) {
        const nextPosition = new Chess(afterReply.fen());

        nextPosition.move({
          from: playerReply.from,
          to: playerReply.to,
          promotion: playerReply.promotion,
        });

        const balance = getPlayerMaterialBalance(nextPosition.fen(), player);

        bestBalance = Math.max(bestBalance, balance);
      }

      if (beforeBalance - bestBalance >= 1) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Material sacrifice detection error:", error);
    return false;
  }
};

// --------------------------------
// Normalize Stockfish evaluation
// --------------------------------

const getEvaluation = (engineResult) => {
  if (engineResult?.mate !== null && engineResult?.mate !== undefined) {
    return {
      type: "mate",
      value: engineResult.mate,
    };
  }

  if (engineResult?.evaluation !== null && engineResult?.evaluation !== undefined) {
    return {
      type: "cp",
      value: engineResult.evaluation,
    };
  }

  return null;
};

// --------------------------------
// Reverse evaluation perspective
// --------------------------------

const reverseEvaluation = (evaluation) => {
  if (!evaluation) return null;

  return {
    type: evaluation.type,
    value: -evaluation.value,
  };
};

// --------------------------------
// Evaluation zone
// --------------------------------

const getEvaluationZone = (evaluation) => {
  if (evaluation === null) return null;

  if (evaluation >= 5) return "winning";
  if (evaluation >= 1.5) return "clearly_better";
  if (evaluation >= 0.5) return "slightly_better";
  if (evaluation > -0.5) return "equal";
  if (evaluation > -1.5) return "slightly_worse";
  if (evaluation > -5) return "clearly_worse";

  return "losing";
};

// --------------------------------
// Detect major blunder
// --------------------------------

const isMajorBlunder = ({ evaluationBefore, evaluationAfter, centipawnLoss, mateBefore, mateAfter }) => {
  if (centipawnLoss !== null && centipawnLoss >= 300) {
    return true;
  }

  if (evaluationBefore !== null && evaluationAfter !== null && evaluationBefore >= 0.5 && evaluationAfter <= -1) {
    return true;
  }

  if (mateBefore !== null && mateAfter !== null && mateBefore > 0 && mateAfter < 0) {
    return true;
  }

  if (evaluationBefore !== null && evaluationBefore > 0 && mateAfter !== null && mateAfter < 0) {
    return true;
  }

  return false;
};

// --------------------------------
// Classify move
// --------------------------------

const classifyMove = ({
  actualMoveUCI,
  bestMoveUCI,
  centipawnLoss,
  mateChanged,
  evaluationBefore,
  evaluationAfter,
  mateBefore,
  mateAfter,
  materialSacrifice,
}) => {
  const isBestMove = Boolean(actualMoveUCI) && Boolean(bestMoveUCI) && actualMoveUCI === bestMoveUCI;

  // --------------------------------
  // Brilliant move
  // --------------------------------
  // Require a detected material sacrifice and a
  // forced mating continuation for the moving player.
  // A normal best move such as Nc6 will not qualify
  // just because it matches Stockfish's best move.

  const leadsToForcedMate = mateAfter !== null && mateAfter > 0;

  if (materialSacrifice && leadsToForcedMate) {
    return "brilliant";
  }

  // --------------------------------
  // Best move
  // --------------------------------

  if (isBestMove) {
    return "best";
  }

  // --------------------------------
  // Blunder
  // --------------------------------

  const majorBlunder = isMajorBlunder({
    evaluationBefore,
    evaluationAfter,
    centipawnLoss,
    mateBefore,
    mateAfter,
  });

  if (majorBlunder) {
    return "blunder";
  }

  // --------------------------------
  // Mate-related evaluation
  // --------------------------------

  if (mateChanged) {
    return "good";
  }

  // --------------------------------
  // Evaluation unavailable
  // --------------------------------

  if (centipawnLoss === null) {
    return "good";
  }

  // --------------------------------
  // Already winning and still winning
  // --------------------------------

  const wasWinning = evaluationBefore !== null && evaluationBefore >= 5;

  const isStillWinning = evaluationAfter !== null && evaluationAfter >= 5;

  if (wasWinning && isStillWinning) {
    if (centipawnLoss <= 100) return "good";
    if (centipawnLoss <= 250) return "inaccuracy";

    return "mistake";
  }

  // --------------------------------
  // Excellent
  // --------------------------------

  if (centipawnLoss <= 30) {
    return "excellent";
  }

  // --------------------------------
  // Good
  // --------------------------------

  if (centipawnLoss <= 70) {
    return "good";
  }

  // --------------------------------
  // Inaccuracy
  // --------------------------------

  if (centipawnLoss <= 150) {
    return "inaccuracy";
  }

  // --------------------------------
  // Mistake
  // --------------------------------

  if (centipawnLoss <= 300) {
    return "mistake";
  }

  // --------------------------------
  // Blunder
  // --------------------------------

  return "blunder";
};

// --------------------------------
// Main game analysis hook
// --------------------------------

const useGameAnalysis = (analyzePosition) => {
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
  });

  // --------------------------------
  // Analyze complete game
  // --------------------------------

  const analyzeGame = async (gameMoves, depth = 15) => {
    if (!gameMoves || gameMoves.length === 0) {
      console.log("No game moves to analyze.");
      return [];
    }

    if (isAnalyzing) {
      console.log("Game analysis already running.");
      return [];
    }

    setIsAnalyzing(true);

    setProgress({
      current: 0,
      total: gameMoves.length,
    });

    setAnalysisResults([]);

    const results = [];

    try {
      for (let i = 0; i < gameMoves.length; i++) {
        const gameMove = gameMoves[i];

        console.log(`Analyzing move ${i + 1} / ${gameMoves.length}`);

        // Analyze position before the move.
        const beforeResult = await analyzePosition(gameMove.fenBefore, depth);

        // Analyze position after the move.
        const afterResult = await analyzePosition(gameMove.fenAfter, depth);

        // Get evaluations.
        const beforeEvaluation = getEvaluation(beforeResult);
        const afterEvaluationRaw = getEvaluation(afterResult);

        // Convert after evaluation to the moving player's
        // perspective. This assumes engine scores are
        // reported from the side-to-move perspective.
        const afterEvaluation = reverseEvaluation(afterEvaluationRaw);

        const evaluationBefore = beforeEvaluation?.type === "cp" ? beforeEvaluation.value : null;

        const evaluationAfter = afterEvaluation?.type === "cp" ? afterEvaluation.value : null;

        const mateBefore = beforeEvaluation?.type === "mate" ? beforeEvaluation.value : null;

        const mateAfter = afterEvaluation?.type === "mate" ? afterEvaluation.value : null;

        const evaluationTypeBefore = beforeEvaluation?.type || null;

        const evaluationTypeAfter = afterEvaluation?.type || null;

        const evaluationZoneBefore = getEvaluationZone(evaluationBefore);

        const evaluationZoneAfter = getEvaluationZone(evaluationAfter);

        const mateChanged = evaluationTypeBefore === "mate" || evaluationTypeAfter === "mate";

        // Calculate centipawn loss.
        let centipawnLoss = null;

        if (!mateChanged && evaluationBefore !== null && evaluationAfter !== null) {
          centipawnLoss = Math.max(0, Math.round((evaluationBefore - evaluationAfter) * 100));
        }

        // Detect material sacrifice.
        const materialSacrifice = detectMaterialSacrifice(gameMove.fenBefore, gameMove.fenAfter, gameMove.player);

        // Classify move.
        const classification = classifyMove({
          actualMoveUCI: gameMove.moveUCI,
          bestMoveUCI: beforeResult?.bestMoveUCI || null,
          centipawnLoss,
          mateChanged,
          evaluationBefore,
          evaluationAfter,
          mateBefore,
          mateAfter,
          materialSacrifice,
        });

        // Complete analysis result.
        const analyzedMove = {
          ...gameMove,

          actualMove: gameMove.move,
          actualMoveUCI: gameMove.moveUCI,

          bestMove: beforeResult?.bestMove || null,
          bestMoveUCI: beforeResult?.bestMoveUCI || null,

          evaluationBefore,
          evaluationAfter,

          evaluationZoneBefore,
          evaluationZoneAfter,

          mateBefore,
          mateAfter,

          evaluationTypeBefore,
          evaluationTypeAfter,

          mateChanged,
          centipawnLoss,
          materialSacrifice,
          classification,

          engineDepth: beforeResult?.depth || 0,
          pv: beforeResult?.pv || [],
        };

        results.push(analyzedMove);

        setProgress({
          current: i + 1,
          total: gameMoves.length,
        });

        setAnalysisResults([...results]);

        console.log("MOVE ANALYSIS:", analyzedMove);
      }

      console.log("GAME ANALYSIS COMPLETE:", results);

      return results;
    } catch (error) {
      console.error("Game analysis error:", error);
      return results;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --------------------------------
  // Clear results
  // --------------------------------

  const clearGameAnalysis = () => {
    setAnalysisResults([]);

    setProgress({
      current: 0,
      total: 0,
    });
  };

  return {
    analysisResults,
    isAnalyzing,
    progress,
    analyzeGame,
    clearGameAnalysis,
  };
};

export default useGameAnalysis;
