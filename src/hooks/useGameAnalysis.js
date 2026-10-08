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
        // Analyze position BEFORE move
        // --------------------------------

        const beforeResult = await analyzePosition(gameMove.fenBefore, depth);

        // --------------------------------
        // Analyze position AFTER move
        // --------------------------------

        const afterResult = await analyzePosition(gameMove.fenAfter, depth);

        // --------------------------------
        // Get structured evaluations
        // --------------------------------

        const beforeEvaluation = getEvaluation(beforeResult);

        const afterEvaluationRaw = getEvaluation(afterResult);

        // --------------------------------
        // Reverse AFTER evaluation
        //
        // After the player's move,
        // the opponent is now to move.
        // --------------------------------

        const afterEvaluation = reverseEvaluation(afterEvaluationRaw);

        // --------------------------------
        // Normal CP evaluations
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
        // Detect mate involvement
        // --------------------------------

        const mateChanged = evaluationTypeBefore === "mate" || evaluationTypeAfter === "mate";

        // --------------------------------
        // Calculate CPL only when
        // BOTH positions are normal
        // centipawn evaluations
        // --------------------------------

        let centipawnLoss = null;

        if (!mateChanged && evaluationBefore !== null && evaluationAfter !== null) {
          centipawnLoss = Math.max(0, Math.round((evaluationBefore - evaluationAfter) * 100));
        }

        // --------------------------------
        // Combine complete result
        // --------------------------------

        const analyzedMove = {
          ...gameMove,

          // --------------------------------
          // Actual player move
          // --------------------------------

          actualMove: gameMove.move,

          actualMoveUCI: gameMove.moveUCI,

          // --------------------------------
          // Stockfish best move
          // --------------------------------

          bestMove: beforeResult?.bestMove || null,

          bestMoveUCI: beforeResult?.bestMoveUCI || null,

          // --------------------------------
          // Normal evaluations
          // --------------------------------

          evaluationBefore,

          evaluationAfter,

          // --------------------------------
          // Mate evaluations
          // --------------------------------

          mateBefore,

          mateAfter,

          // --------------------------------
          // Evaluation types
          // --------------------------------

          evaluationTypeBefore,

          evaluationTypeAfter,

          // --------------------------------
          // Did this move involve mate?
          // --------------------------------

          mateChanged,

          // --------------------------------
          // Centipawn loss
          // --------------------------------

          centipawnLoss,

          // --------------------------------
          // Engine information
          // --------------------------------

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
