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
// Calculate material balance
// Positive = White has more material
// Negative = Black has more material
// --------------------------------

const getMaterialBalance = (fen) => {
  const chess = new Chess(fen);
  const board = chess.board();

  let balance = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type];

      balance += piece.color === "w" ? value : -value;
    }
  }

  return balance;
};

// --------------------------------
// Material balance from player's view
// --------------------------------

const getPlayerMaterialBalance = (fen, player) => {
  const balance = getMaterialBalance(fen);

  return player === "white" ? balance : -balance;
};

// --------------------------------
// Detect material sacrifice
// Check all legal opponent replies
// --------------------------------

const detectMaterialSacrifice = (fenBefore, fenAfter, player) => {
  try {
    const beforeBalance = getPlayerMaterialBalance(fenBefore, player);
    const opponentPosition = new Chess(fenAfter);

    const legalReplies = opponentPosition.moves({
      verbose: true,
    });

    for (const reply of legalReplies) {
      const replyPosition = new Chess(fenAfter);

      replyPosition.move({
        from: reply.from,
        to: reply.to,
        promotion: reply.promotion,
      });

      const afterReplyBalance = getPlayerMaterialBalance(replyPosition.fen(), player);

      if (beforeBalance - afterReplyBalance >= 1) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.log("Material sacrifice detection error:", error);
    return false;
  }
};

// --------------------------------
// Convert Stockfish result into
// a common evaluation format
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
  if (!evaluation) {
    return null;
  }

  return {
    type: evaluation.type,
    value: -evaluation.value,
  };
};

// --------------------------------
// Evaluation zone
// --------------------------------

const getEvaluationZone = (evaluation) => {
  if (evaluation === null) {
    return null;
  }

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

  if (evaluationBefore !== null && evaluationAfter !== null && evaluationBefore >= 1.5 && evaluationAfter <= -1.5) {
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
  // Brilliant move heuristic
  // --------------------------------

  // After reversing the evaluation perspective,
  // a positive mate score means the player who
  // made the move has a forced mate.
  const hasWinningMateAfter = mateAfter !== null && mateAfter > 0;

  const leadsToStrongPosition =
    evaluationAfter !== null &&
    evaluationAfter >= 5 &&
    (evaluationBefore === null || evaluationAfter >= evaluationBefore);

  const isAccurateSacrifice = !mateChanged && centipawnLoss !== null && centipawnLoss <= 20;

  // IMPORTANT:
  // A brilliant sacrifice does not always have to
  // match Stockfish's reported best move.
  //
  // If the move sacrifices material and leads to
  // a forced mate, it can qualify as brilliant.
  if (
    materialSacrifice &&
    (hasWinningMateAfter || (isBestMove && isAccurateSacrifice) || (isBestMove && leadsToStrongPosition))
  ) {
    return "brilliant";
  }

  // --------------------------------
  // Exact Stockfish best move
  // --------------------------------

  if (isBestMove) {
    return "best";
  }

  // --------------------------------
  // Detect major blunder
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
  // Mate position
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
    if (centipawnLoss <= 100) {
      return "good";
    }

    if (centipawnLoss <= 250) {
      return "inaccuracy";
    }

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

        // Analyze BEFORE position
        const beforeResult = await analyzePosition(gameMove.fenBefore, depth);

        // Analyze AFTER position
        const afterResult = await analyzePosition(gameMove.fenAfter, depth);

        // Get evaluations
        const beforeEvaluation = getEvaluation(beforeResult);
        const afterEvaluationRaw = getEvaluation(afterResult);

        // Convert AFTER evaluation to the
        // moving player's perspective
        const afterEvaluation = reverseEvaluation(afterEvaluationRaw);

        // Normal evaluations
        const evaluationBefore = beforeEvaluation?.type === "cp" ? beforeEvaluation.value : null;

        const evaluationAfter = afterEvaluation?.type === "cp" ? afterEvaluation.value : null;

        // Mate evaluations
        const mateBefore = beforeEvaluation?.type === "mate" ? beforeEvaluation.value : null;

        const mateAfter = afterEvaluation?.type === "mate" ? afterEvaluation.value : null;

        // Evaluation types
        const evaluationTypeBefore = beforeEvaluation?.type || null;

        const evaluationTypeAfter = afterEvaluation?.type || null;

        // Evaluation zones
        const evaluationZoneBefore = getEvaluationZone(evaluationBefore);

        const evaluationZoneAfter = getEvaluationZone(evaluationAfter);

        // Mate involvement
        const mateChanged = evaluationTypeBefore === "mate" || evaluationTypeAfter === "mate";

        // Calculate centipawn loss
        let centipawnLoss = null;

        if (!mateChanged && evaluationBefore !== null && evaluationAfter !== null) {
          centipawnLoss = Math.max(0, Math.round((evaluationBefore - evaluationAfter) * 100));
        }

        // Detect material sacrifice
        const materialSacrifice = detectMaterialSacrifice(gameMove.fenBefore, gameMove.fenAfter, gameMove.player);

        // Classify move
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

        // Complete analysis result
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

        // Update progress
        setProgress({
          current: i + 1,
          total: gameMoves.length,
        });

        // Update results while analysis runs
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
