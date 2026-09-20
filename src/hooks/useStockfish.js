import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";

const useStockfish = () => {
  const workerRef = useRef(null);

  // FEN of the position currently being analyzed
  const currentFenRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [mate, setMate] = useState(null);
  const [depth, setDepth] = useState(0);
  const [pv, setPv] = useState([]);

  // --------------------------------
  // Convert UCI moves to SAN moves
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
      }

      if (message === "readyok") {
        setIsReady(true);
      }

      // --------------------------------
      // Engine information
      // --------------------------------

      if (message.startsWith("info")) {
        const parts = message.split(" ");

        // --------------------------------
        // Depth
        // --------------------------------

        const depthIndex = parts.indexOf("depth");

        if (depthIndex !== -1) {
          const currentDepth = Number(parts[depthIndex + 1]);

          setDepth(currentDepth);
        }

        // --------------------------------
        // Score
        // --------------------------------

        const scoreIndex = parts.indexOf("score");

        if (scoreIndex !== -1) {
          const scoreType = parts[scoreIndex + 1];

          const scoreValue = parts[scoreIndex + 2];

          // Centipawn score
          if (scoreType === "cp") {
            const centipawns = Number(scoreValue);

            const evaluationValue = centipawns / 100;

            setEvaluation(evaluationValue);
            setMate(null);
          }

          // Checkmate score
          if (scoreType === "mate") {
            const mateMoves = Number(scoreValue);

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

          setPv(sanMoves);
        }
      }

      // --------------------------------
      // Best Move
      // --------------------------------

      if (message.startsWith("bestmove")) {
        const move = message.split(" ")[1];

        setBestMove(move);
      }
    };

    worker.onerror = (error) => {
      console.error("Stockfish Worker Error:", error);
    };

    // Start UCI mode
    worker.postMessage("uci");

    return () => {
      worker.terminate();
    };
  }, []);

  // --------------------------------
  // Analyze a position
  // --------------------------------

  const analyzePosition = (fen) => {
    if (!workerRef.current || !isReady) {
      console.log("Stockfish is not ready yet.");

      return;
    }

    console.log("Analyzing FEN:", fen);

    // Remember the FEN being analyzed
    currentFenRef.current = fen;

    // Reset previous analysis
    setBestMove(null);
    setEvaluation(null);
    setMate(null);
    setDepth(0);
    setPv([]);

    // Give Stockfish the position
    workerRef.current.postMessage(`position fen ${fen}`);

    // Start searching
    workerRef.current.postMessage("go depth 15");
  };

  return {
    isReady,
    bestMove,
    evaluation,
    mate,
    depth,
    pv,
    analyzePosition,
  };
};

export default useStockfish;
