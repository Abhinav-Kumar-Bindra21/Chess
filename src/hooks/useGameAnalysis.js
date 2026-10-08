import { useState } from "react";

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
// Get evaluation zone
// --------------------------------

const getEvaluationZone = (evaluation) => {
  if (evaluation === null) {
    return null;
  }

  if (evaluation >= 5) {
    return "winning";
  }

  if (evaluation >= 1.5) {
    return "clearly_better";
  }

  if (evaluation >= 0.5) {
    return "slightly_better";
  }

  if (evaluation > -0.5) {
    return "equal";
  }

  if (evaluation > -1.5) {
    return "slightly_worse";
  }

  if (evaluation > -5) {
    return "clearly_worse";
  }

  return "losing";
};

// --------------------------------
// Detect major blunder
// --------------------------------

const isMajorBlunder = ({ evaluationBefore, evaluationAfter, centipawnLoss, mateBefore, mateAfter }) => {
  // --------------------------------
  // Huge centipawn loss
  // --------------------------------

  if (centipawnLoss !== null && centipawnLoss >= 300) {
    return true;
  }

  // --------------------------------
  // Winning advantage becomes
  // clearly losing
  // --------------------------------

  if (evaluationBefore !== null && evaluationAfter !== null && evaluationBefore >= 0.5 && evaluationAfter <= -1) {
    return true;
  }

  // --------------------------------
  // Clearly winning becomes losing
  // --------------------------------

  if (evaluationBefore !== null && evaluationAfter !== null && evaluationBefore >= 1.5 && evaluationAfter <= -1.5) {
    return true;
  }

  // --------------------------------
  // Forced mate for the player
  // becomes forced mate for opponent
  //
  // Example:
  // +M3 → -M2
  // --------------------------------

  if (mateBefore !== null && mateAfter !== null && mateBefore > 0 && mateAfter < 0) {
    return true;
  }

  // --------------------------------
  // Normal winning position becomes
  // a forced mate against the player
  // --------------------------------

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
}) => {
  // --------------------------------
  // Exact Stockfish best move
  // --------------------------------

  if (actualMoveUCI && bestMoveUCI && actualMoveUCI === bestMoveUCI) {
    return "best";
  }

  // --------------------------------
  // FIRST check for a real blunder
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
  // No CPL
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
  // Best
  // --------------------------------

  if (centipawnLoss <= 10) {
    return "best";
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
      // --------------------------------
      // Analyze every move
      // --------------------------------

      for (let i = 0; i < gameMoves.length; i++) {
        const gameMove = gameMoves[i];

        console.log(`Analyzing move ${i + 1} / ${gameMoves.length}`);

        // --------------------------------
        // Analyze BEFORE position
        // --------------------------------

        const beforeResult = await analyzePosition(gameMove.fenBefore, depth);

        // --------------------------------
        // Analyze AFTER position
        // --------------------------------

        const afterResult = await analyzePosition(gameMove.fenAfter, depth);

        // --------------------------------
        // Get evaluations
        // --------------------------------

        const beforeEvaluation = getEvaluation(beforeResult);

        const afterEvaluationRaw = getEvaluation(afterResult);

        // --------------------------------
        // Reverse AFTER perspective
        // --------------------------------

        const afterEvaluation = reverseEvaluation(afterEvaluationRaw);

        // --------------------------------
        // Normal evaluations
        // --------------------------------

        const evaluationBefore = beforeEvaluation?.type === "cp" ? beforeEvaluation.value : null;

        const evaluationAfter = afterEvaluation?.type === "cp" ? afterEvaluation.value : null;

        // --------------------------------
        // Mate evaluations
        // --------------------------------

        const mateBefore = beforeEvaluation?.type === "mate" ? beforeEvaluation.value : null;

        const mateAfter = afterEvaluation?.type === "mate" ? afterEvaluation.value : null;

        // --------------------------------
        // Evaluation types
        // --------------------------------

        const evaluationTypeBefore = beforeEvaluation?.type || null;

        const evaluationTypeAfter = afterEvaluation?.type || null;

        // --------------------------------
        // Evaluation zones
        // --------------------------------

        const evaluationZoneBefore = getEvaluationZone(evaluationBefore);

        const evaluationZoneAfter = getEvaluationZone(evaluationAfter);

        // --------------------------------
        // Detect mate involvement
        // --------------------------------

        const mateChanged = evaluationTypeBefore === "mate" || evaluationTypeAfter === "mate";

        // --------------------------------
        // Calculate CPL
        // --------------------------------

        let centipawnLoss = null;

        if (!mateChanged && evaluationBefore !== null && evaluationAfter !== null) {
          centipawnLoss = Math.max(0, Math.round((evaluationBefore - evaluationAfter) * 100));
        }

        // --------------------------------
        // Classify move
        // --------------------------------

        const classification = classifyMove({
          actualMoveUCI: gameMove.moveUCI,

          bestMoveUCI: beforeResult?.bestMoveUCI || null,

          centipawnLoss,

          mateChanged,

          evaluationBefore,

          evaluationAfter,

          mateBefore,

          mateAfter,
        });

        // --------------------------------
        // Complete result
        // --------------------------------

        const analyzedMove = {
          ...gameMove,

          // Actual move
          actualMove: gameMove.move,

          actualMoveUCI: gameMove.moveUCI,

          // Best move
          bestMove: beforeResult?.bestMove || null,

          bestMoveUCI: beforeResult?.bestMoveUCI || null,

          // Evaluations
          evaluationBefore,

          evaluationAfter,

          // Evaluation zones
          evaluationZoneBefore,

          evaluationZoneAfter,

          // Mate
          mateBefore,

          mateAfter,

          // Evaluation types
          evaluationTypeBefore,

          evaluationTypeAfter,

          // Mate flag
          mateChanged,

          // CPL
          centipawnLoss,

          // Classification
          classification,

          // Engine
          engineDepth: beforeResult?.depth || 0,

          pv: beforeResult?.pv || [],
        };

        // --------------------------------
        // Save result
        // --------------------------------

        results.push(analyzedMove);

        // --------------------------------
        // Update progress
        // --------------------------------

        setProgress({
          current: i + 1,
          total: gameMoves.length,
        });

        // --------------------------------
        // Update results immediately
        // --------------------------------

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
