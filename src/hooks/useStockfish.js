import { useEffect, useRef, useState } from "react";

const useStockfish = () => {
  const workerRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);

  useEffect(() => {
    console.log("Creating Stockfish worker...");

    const worker = new Worker("/stockfish/stockfish-19-lite-single.js");

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;

      console.log("Stockfish message:", message);

      // Stockfish has finished UCI initialization
      if (message === "uciok") {
        console.log("Stockfish UCI ready");

        worker.postMessage("isready");
      }

      // Stockfish is completely ready
      if (message === "readyok") {
        console.log("Stockfish is READY!");

        setIsReady(true);
      }

      // Stockfish has found the best move
      if (message.startsWith("bestmove")) {
        const move = message.split(" ")[1];

        console.log("BEST MOVE:", move);

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

  const analyzePosition = (fen) => {
    if (!workerRef.current || !isReady) {
      console.log("Stockfish is not ready yet.");
      return;
    }

    console.log("Analyzing FEN:", fen);

    // Clear previous best move
    setBestMove(null);

    // Tell Stockfish which position to analyze
    workerRef.current.postMessage(`position fen ${fen}`);

    // Start calculation
    workerRef.current.postMessage("go depth 15");
  };

  return {
    isReady,
    bestMove,
    analyzePosition,
  };
};

export default useStockfish;
