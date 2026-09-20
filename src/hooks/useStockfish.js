import { useEffect, useRef, useState } from "react";

const useStockfish = () => {
  const workerRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    console.log("Creating Stockfish worker...");

    const worker = new Worker("/stockfish/stockfish-19-lite-single.js");

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;

      console.log("Stockfish:", message);

      // Stockfish finished UCI initialization
      if (message === "uciok") {
        worker.postMessage("isready");
      }

      // Stockfish is ready
      if (message === "readyok") {
        setIsReady(true);
      }

      // Stockfish is sending evaluation
      if (message.startsWith("info")) {
        const parts = message.split(" ");

        const scoreIndex = parts.indexOf("score");

        if (scoreIndex !== -1) {
          const scoreType = parts[scoreIndex + 1];
          const scoreValue = parts[scoreIndex + 2];

          if (scoreType === "cp") {
            const centipawns = Number(scoreValue);

            const evaluationValue = centipawns / 100;

            setEvaluation(evaluationValue);
          }
        }
      }

      // Stockfish found the best move
      if (message.startsWith("bestmove")) {
        const move = message.split(" ")[1];

        setBestMove(move);
      }
    };

    worker.onerror = (error) => {
      console.error("Stockfish Worker Error:", error);
    };

    worker.postMessage("uci");

    return () => {
      worker.terminate();
    };
  }, []);

  const analyzePosition = (fen) => {
    if (!workerRef.current || !isReady) {
      console.log("Stockfish is not ready yet.");
      return;
    }

    console.log("Analyzing FEN:", fen);

    // Clear previous results
    setBestMove(null);
    setEvaluation(null);

    // Give Stockfish the position
    workerRef.current.postMessage(`position fen ${fen}`);

    // Start analysis
    workerRef.current.postMessage("go depth 15");
  };

  return {
    isReady,
    bestMove,
    evaluation,
    analyzePosition,
  };
};

export default useStockfish;
