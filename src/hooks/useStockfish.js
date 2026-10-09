import { Chess } from "chess.js";
import { useCallback, useEffect, useRef, useState } from "react";

const useStockfish = () => {
  const workerRef = useRef(null);

  // Current analysis information
  const currentFenRef = useRef(null);
  const analysisIdRef = useRef(0);
  const analysisResolverRef = useRef(null);

  // Latest engine values
  const evaluationRef = useRef(null);
  const mateRef = useRef(null);
  const depthRef = useRef(0);
  const pvRef = useRef([]);

  // React state
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [bestMoveUCI, setBestMoveUCI] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [mate, setMate] = useState(null);
  const [depth, setDepth] = useState(0);
  const [pv, setPv] = useState([]);

  // Clear engine analysis.
  // useCallback keeps this function stable between renders.
  const clearAnalysis = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage("stop");
    }

    analysisIdRef.current += 1;
    currentFenRef.current = null;
    analysisResolverRef.current = null;

    evaluationRef.current = null;
    mateRef.current = null;
    depthRef.current = 0;
    pvRef.current = [];

    setBestMove(null);
    setBestMoveUCI(null);
    setEvaluation(null);
    setMate(null);
    setDepth(0);
    setPv([]);
  }, []);

  // Convert UCI to SAN
  const convertMoveToSAN = (fen, uciMove) => {
    const chess = new Chess(fen);

    try {
      const move = chess.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: uciMove[4] || "q",
      });

      return move ? move.san : uciMove;
    } catch (error) {
      console.log("Best move conversion error:", error);
      return uciMove;
    }
  };

  // Convert principal variation from UCI to SAN
  const convertPVToSAN = (fen, uciMoves) => {
    const chess = new Chess(fen);
    const sanMoves = [];

    for (const uciMove of uciMoves) {
      try {
        const move = chess.move({
          from: uciMove.slice(0, 2),
          to: uciMove.slice(2, 4),
          promotion: uciMove[4] || "q",
        });

        if (move) {
          sanMoves.push(move.san);
        }
      } catch (error) {
        console.log("PV conversion error:", error);
        break;
      }
    }

    return sanMoves;
  };

  // Create Stockfish worker
  useEffect(() => {
    console.log("Creating Stockfish worker...");

    const worker = new Worker("/stockfish/stockfish-19-lite-single.js");

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;

      if (message === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (message === "readyok") {
        setIsReady(true);
        return;
      }

      // Ignore engine messages when no analysis is active.
      if (!currentFenRef.current) {
        return;
      }

      if (message.startsWith("info")) {
        const parts = message.split(" ");

        // Depth
        const depthIndex = parts.indexOf("depth");

        if (depthIndex !== -1) {
          const currentDepth = Number(parts[depthIndex + 1]);

          depthRef.current = currentDepth;
          setDepth(currentDepth);
        }

        // Evaluation score
        const scoreIndex = parts.indexOf("score");

        if (scoreIndex !== -1) {
          const scoreType = parts[scoreIndex + 1];
          const scoreValue = Number(parts[scoreIndex + 2]);

          if (scoreType === "cp") {
            const evaluationValue = scoreValue / 100;

            evaluationRef.current = evaluationValue;
            mateRef.current = null;

            setEvaluation(evaluationValue);
            setMate(null);
          }

          if (scoreType === "mate") {
            mateRef.current = scoreValue;
            evaluationRef.current = null;

            setMate(scoreValue);
            setEvaluation(null);
          }
        }

        // Principal variation
        const pvIndex = parts.indexOf("pv");

        if (pvIndex !== -1 && currentFenRef.current) {
          const uciMoves = parts.slice(pvIndex + 1);

          const sanMoves = convertPVToSAN(currentFenRef.current, uciMoves);

          pvRef.current = sanMoves;
          setPv(sanMoves);
        }
      }

      // Best move
      if (message.startsWith("bestmove")) {
        const uciMove = message.split(" ")[1];

        if (!uciMove || uciMove === "(none") {
          return;
        }

        const fen = currentFenRef.current;

        if (!fen) {
          return;
        }

        const sanMove = convertMoveToSAN(fen, uciMove);

        setBestMoveUCI(uciMove);
        setBestMove(sanMove);

        const result = {
          bestMove: sanMove,
          bestMoveUCI: uciMove,
          evaluation: evaluationRef.current,
          mate: mateRef.current,
          depth: depthRef.current,
          pv: pvRef.current,
        };

        console.log("FINAL ENGINE RESULT:", result);

        if (analysisResolverRef.current) {
          const resolve = analysisResolverRef.current;
          analysisResolverRef.current = null;
          resolve(result);
        }
      }
    };

    worker.onerror = (error) => {
      console.error("Stockfish Worker Error:", error);
    };

    worker.postMessage("uci");

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Analyze a position
  const analyzePosition = (fen, searchDepth = 15) => {
    if (!workerRef.current || !isReady) {
      console.log("Stockfish is not ready yet.");
      return Promise.resolve(null);
    }

    console.log("Analyzing FEN:", fen);
    console.log("Analysis depth:", searchDepth);

    analysisIdRef.current += 1;
    const analysisId = analysisIdRef.current;

    // Stop the previous search.
    workerRef.current.postMessage("stop");

    // Reset previous results.
    evaluationRef.current = null;
    mateRef.current = null;
    depthRef.current = 0;
    pvRef.current = [];

    setBestMove(null);
    setBestMoveUCI(null);
    setEvaluation(null);
    setMate(null);
    setDepth(0);
    setPv([]);

    currentFenRef.current = fen;

    return new Promise((resolve) => {
      analysisResolverRef.current = resolve;

      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${searchDepth}`);

      console.log("Started analysis:", analysisId);
    });
  };

  return {
    isReady,
    bestMove,
    bestMoveUCI,
    evaluation,
    mate,
    depth,
    pv,
    analyzePosition,
    clearAnalysis,
  };
};

export default useStockfish;
