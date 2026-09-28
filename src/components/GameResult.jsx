const GameResult = ({ gameStatus }) => {
  // -------------------------------- // Game is still running // --------------------------------

  if (!gameStatus.isGameOver) {
    return (
      <div className="mt-4  flex  items-center gap-2 text-sm text-gray-500">
        <span className="size-2 rounded-full bg-green-500"></span>

        <span>Game in progress</span>
      </div>
    );
  }

  // -------------------------------- // Checkmate // --------------------------------

  if (gameStatus.status === "checkmate") {
    return (
      <div className="mt-4 w-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Game Over</p>

        <h2 className="text-2xl font-bold mt-1 text-gray-800">
          {gameStatus.winner === "white" ? "♔ White Wins" : "♚ Black Wins"}
        </h2>

        <p className="text-sm text-gray-500 mt-1"> Checkmate </p>
      </div>
    );
  }

  // -------------------------------- // Stalemate // --------------------------------

  if (gameStatus.status === "stalemate") {
    return (
      <div className="mt-4 w-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center">
        {" "}
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold"> Draw </p>{" "}
        <h2 className="text-xl font-bold mt-1 text-gray-800"> Stalemate </h2>{" "}
        <p className="text-sm text-gray-500 mt-1"> The player has no legal moves, but is not in check. </p>{" "}
      </div>
    );
  }

  // -------------------------------- // Threefold repetition // --------------------------------

  if (gameStatus.status === "threefold repetition") {
    return (
      <div className="mt-4 w-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center">
        {" "}
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold"> Draw </p>{" "}
        <h2 className="text-xl font-bold mt-1 text-gray-800"> Threefold Repetition </h2>{" "}
        <p className="text-sm text-gray-500 mt-1"> The same position occurred three times. </p>{" "}
      </div>
    );
  }

  // -------------------------------- // Insufficient material // --------------------------------

  if (gameStatus.status === "insufficient material") {
    return (
      <div className="mt-4 w-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center">
        {" "}
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold"> Draw </p>{" "}
        <h2 className="text-xl font-bold mt-1 text-gray-800"> Insufficient Material </h2>{" "}
        <p className="text-sm text-gray-500 mt-1"> Neither side has enough material to checkmate. </p>{" "}
      </div>
    );
  }

  // -------------------------------- // Generic draw // --------------------------------
  return (
    <div className="mt-4 w-[400px] bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center">
      {" "}
      <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold"> Draw </p>{" "}
      <h2 className="text-xl font-bold mt-1 text-gray-800"> Game Drawn </h2>{" "}
      <p className="text-sm text-gray-500 mt-1"> The game ended in a draw. </p>{" "}
    </div>
  );
};

export default GameResult;
