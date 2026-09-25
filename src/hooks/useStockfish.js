import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";

const useStockfish = () => {
  const workerRef = useRef(null);

  // FEN of the position currently being analyzed
  const currentFenRef = useRef(null);

  const [isReady, setIsReady] = useState(false);

  // Human-readable best move
  const [bestMove, setBestMove] = useState(null);

  // Computer-readable best move
  const [bestMoveUCI, setBestMoveUCI] = useState(null);

  // Evaluation from White's perspective
  // Positive = White advantage
  // Negative = Black advantage
  const [evaluation, setEvaluation] = useState(null);

  // Mate score
  const [mate, setMate] = useState(null);

  // Used when the position is already checkmate
  // "white" = White won
  // "black" = Black won
  // null = normal position
  const [mateWinner, setMateWinner] = useState(null);

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

    // Clear UI data
    setBestMove(null);
    setBestMoveUCI(null);
    setEvaluation(null);
    setMate(null);
    setMateWinner(null);
    setDepth(0);
    setPv([]);
  };

  // --------------------------------
  // Convert UCI move to SAN
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
  // Create Stockfish
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

          // Current FEN
          const fen = currentFenRef.current;

          if (!fen) {
            return;
          }

          // Whose turn?
          //
          // "w" = White
          // "b" = Black
          const sideToMove = fen.split(" ")[1];

          // --------------------------------
          // Centipawn score
          // --------------------------------

          if (scoreType === "cp") {
            const centipawns = Number(scoreValue);

            const evaluationValue = centipawns / 100;

            // --------------------------------
            // Convert Stockfish score
            // to White's perspective
            // --------------------------------
            //
            // Stockfish score:
            //
            // White to move:
            //   +5.82 = White advantage
            //
            // Black to move:
            //   +5.82 = Black advantage
            //
            // Therefore when Black is to move
            // we reverse the sign.

            const whiteEvaluation = sideToMove === "w" ? evaluationValue : -evaluationValue;

            setEvaluation(whiteEvaluation);

            // Not a mate position
            setMate(null);
            setMateWinner(null);
          }

          // --------------------------------
          // Checkmate score
          // --------------------------------

          if (scoreType === "mate") {
            const mateMoves = Number(scoreValue);

            const chess = new Chess(fen);

            // --------------------------------
            // Already checkmated
            // --------------------------------
            //
            // Stockfish can return:
            //
            // mate 0
            //
            // This means the side to move
            // is already checkmated.

            if (mateMoves === 0 && chess.isCheckmate()) {
              if (sideToMove === "b") {
                // Black is checkmated
                // White has won
                setMateWinner("white");
              } else {
                // White is checkmated
                // Black has won
                setMateWinner("black");
              }

              setMate(0);
              setEvaluation(null);

              return;
            }

            // --------------------------------
            // Normal mate score
            // --------------------------------
            //
            // Example:
            //
            // White to move:
            //   mate 3
            //   => White mates in 3
            //
            // Black to move:
            //   mate 3
            //   => Black mates in 3
            //
            // Convert to White perspective.

            const whiteMate = sideToMove === "w" ? mateMoves : -mateMoves;

            setMate(whiteMate);

            setMateWinner(null);
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
        const uciMove = message.split(" ")[1];

        // Store UCI version
        setBestMoveUCI(uciMove);

        // Convert UCI → SAN
        if (currentFenRef.current) {
          const sanMove = convertMoveToSAN(currentFenRef.current, uciMove);

          setBestMove(sanMove);
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
    };
  }, []);

  // --------------------------------
  // Analyze Position
  // --------------------------------

  const analyzePosition = (fen) => {
    if (!workerRef.current || !isReady) {
      console.log("Stockfish is not ready yet.");

      return;
    }

    console.log("Analyzing FEN:", fen);

    // Remember FEN
    currentFenRef.current = fen;

    // Reset previous analysis
    setBestMove(null);
    setBestMoveUCI(null);
    setEvaluation(null);
    setMate(null);
    setMateWinner(null);
    setDepth(0);
    setPv([]);

    // Give position to Stockfish
    workerRef.current.postMessage(`position fen ${fen}`);

    // Start searching
    workerRef.current.postMessage("go depth 15");
  };

  // --------------------------------
  // Return everything
  // --------------------------------

  return {
    isReady,

    bestMove,
    bestMoveUCI,

    evaluation,

    mate,
    mateWinner,

    depth,
    pv,

    analyzePosition,
    clearAnalysis,
  };
};

export default useStockfish;
