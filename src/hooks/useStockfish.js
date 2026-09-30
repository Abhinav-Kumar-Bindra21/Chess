import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";

const useStockfish = () => {
  const workerRef = useRef(null);

  // --------------------------------
  // Current analysis information
  // --------------------------------

  const currentFenRef = useRef(null);

  const analysisIdRef = useRef(0);

  const analysisResolverRef = useRef(null);

  // --------------------------------
  // Latest engine values
  // These refs are used internally
  // because Stockfish is asynchronous.
  // --------------------------------

  const evaluationRef = useRef(null);

  const mateRef = useRef(null);

  const depthRef = useRef(0);

  const pvRef = useRef([]);

  // --------------------------------
  // React state
  // Used by the UI
  // --------------------------------

  const [isReady, setIsReady] = useState(false);

  const [bestMove, setBestMove] = useState(null);

  const [bestMoveUCI, setBestMoveUCI] = useState(null);

  const [evaluation, setEvaluation] = useState(null);

  const [mate, setMate] = useState(null);

  const [depth, setDepth] = useState(0);

  const [pv, setPv] = useState([]);

  // --------------------------------
  // Clear engine analysis
  // --------------------------------

  const clearAnalysis = () => {
    // Stop current Stockfish search
    if (workerRef.current) {
      workerRef.current.postMessage("stop");
    }

    // Invalidate current analysis
    analysisIdRef.current += 1;

    // Remove current FEN
    currentFenRef.current = null;

    // Remove pending Promise
    analysisResolverRef.current = null;

    // Reset internal refs
    evaluationRef.current = null;
    mateRef.current = null;
    depthRef.current = 0;
    pvRef.current = [];

    // Reset UI
    setBestMove(null);
    setBestMoveUCI(null);
    setEvaluation(null);
    setMate(null);
    setDepth(0);
    setPv([]);
  };

  // --------------------------------
  // Convert UCI → SAN
  // --------------------------------

  const convertMoveToSAN = (fen, uciMove) => {
    const chess = new Chess(fen);

    const from = uciMove.slice(0, 2);

    const to = uciMove.slice(2, 4);

    const promotion = uciMove[4];

    try {
      const move = chess.move({
        from,
        to,
        promotion,
      });

      return move ? move.san : uciMove;
    } catch (error) {
      console.log("Best move conversion error:", error);

      return uciMove;
    }
  };

  // --------------------------------
  // Convert PV UCI → SAN
  // --------------------------------

  const convertPVToSAN = (fen, uciMoves) => {
    const chess = new Chess(fen);

    const sanMoves = [];

    for (const uciMove of uciMoves) {
      const from = uciMove.slice(0, 2);

      const to = uciMove.slice(2, 4);

      const promotion = uciMove[4];

      try {
        const move = chess.move({
          from,
          to,
          promotion,
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

  // --------------------------------
  // Create Stockfish worker
  // --------------------------------

  useEffect(() => {
    console.log("Creating Stockfish worker...");

    const worker = new Worker("/stockfish/stockfish-19-lite-single.js");

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;

      console.log("Stockfish:", message);

      // --------------------------------
      // UCI initialization
      // --------------------------------

      if (message === "uciok") {
        worker.postMessage("isready");

        return;
      }

      if (message === "readyok") {
        setIsReady(true);

        return;
      }

      // --------------------------------
      // Ignore messages when no
      // analysis is active
      // --------------------------------

      if (!currentFenRef.current) {
        return;
      }

      // --------------------------------
      // INFO message
      // --------------------------------

      if (message.startsWith("info")) {
        const parts = message.split(" ");

        // --------------------------------
        // Depth
        // --------------------------------

        const depthIndex = parts.indexOf("depth");

        if (depthIndex !== -1) {
          const currentDepth = Number(parts[depthIndex + 1]);

          depthRef.current = currentDepth;

          setDepth(currentDepth);
        }

        // --------------------------------
        // Score
        // --------------------------------

        const scoreIndex = parts.indexOf("score");

        if (scoreIndex !== -1) {
          const scoreType = parts[scoreIndex + 1];

          const scoreValue = parts[scoreIndex + 2];

          // --------------------------------
          // Centipawn score
          // --------------------------------

          if (scoreType === "cp") {
            const centipawns = Number(scoreValue);

            const evaluationValue = centipawns / 100;

            // Store immediately
            evaluationRef.current = evaluationValue;

            mateRef.current = null;

            // Update UI
            setEvaluation(evaluationValue);

            setMate(null);
          }

          // --------------------------------
          // Mate score
          // --------------------------------

          if (scoreType === "mate") {
            const mateMoves = Number(scoreValue);

            // Store immediately
            mateRef.current = mateMoves;

            evaluationRef.current = null;

            // Update UI
            setMate(mateMoves);

            setEvaluation(null);
          }
        }

        // --------------------------------
        // Principal Variation
        // --------------------------------

        const pvIndex = parts.indexOf("pv");

        if (pvIndex !== -1 && currentFenRef.current) {
          const uciMoves = parts.slice(pvIndex + 1);

          const sanMoves = convertPVToSAN(currentFenRef.current, uciMoves);

          // Store immediately
          pvRef.current = sanMoves;

          // Update UI
          setPv(sanMoves);
        }
      }

      // --------------------------------
      // BESTMOVE
      // --------------------------------

      if (message.startsWith("bestmove")) {
        const uciMove = message.split(" ")[1];

        if (!uciMove) {
          return;
        }

        // --------------------------------
        // Convert UCI → SAN
        // --------------------------------

        let sanMove = uciMove;

        if (currentFenRef.current) {
          sanMove = convertMoveToSAN(currentFenRef.current, uciMove);
        }

        // --------------------------------
        // Update UI
        // --------------------------------

        setBestMoveUCI(uciMove);

        setBestMove(sanMove);

        // --------------------------------
        // Build final result
        // --------------------------------

        const result = {
          bestMove: sanMove,

          bestMoveUCI: uciMove,

          evaluation: evaluationRef.current,

          mate: mateRef.current,

          depth: depthRef.current,

          pv: pvRef.current,
        };

        console.log("FINAL ENGINE RESULT:", result);

        // --------------------------------
        // Resolve Promise
        // --------------------------------

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

    // Start UCI mode
    worker.postMessage("uci");

    return () => {
      worker.terminate();

      workerRef.current = null;
    };
  }, []);

  // --------------------------------
  // Analyze Position
  // --------------------------------

  const analyzePosition = (fen, searchDepth = 15) => {
    if (!workerRef.current || !isReady) {
      console.log("Stockfish is not ready yet.");

      return Promise.resolve(null);
    }

    console.log("Analyzing FEN:", fen);

    console.log("Analysis depth:", searchDepth);

    // --------------------------------
    // Create new analysis ID
    // --------------------------------

    analysisIdRef.current += 1;

    const analysisId = analysisIdRef.current;

    console.log("Analysis ID:", analysisId);

    // --------------------------------
    // Stop previous search
    // --------------------------------

    workerRef.current.postMessage("stop");

    // --------------------------------
    // Reset engine refs
    // --------------------------------

    evaluationRef.current = null;

    mateRef.current = null;

    depthRef.current = 0;

    pvRef.current = [];

    // --------------------------------
    // Reset UI
    // --------------------------------

    setBestMove(null);
    setBestMoveUCI(null);
    setEvaluation(null);
    setMate(null);
    setDepth(0);
    setPv([]);

    // --------------------------------
    // Store current FEN
    // --------------------------------

    currentFenRef.current = fen;

    // --------------------------------
    // Create Promise
    // --------------------------------

    return new Promise((resolve) => {
      analysisResolverRef.current = resolve;

      // --------------------------------
      // Send position
      // --------------------------------

      workerRef.current.postMessage(`position fen ${fen}`);

      // --------------------------------
      // Start search
      // --------------------------------

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
