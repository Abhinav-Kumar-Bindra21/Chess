import { Chess } from "chess.js";

const PGNController = ({ game, setGame, setCurrentMove }) => {
  // Export PGN function
  const exportPGN = () => {
    const pgn = game.pgn();

    const blob = new Blob([pgn], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "chess-game.pgn";

    link.click();

    URL.revokeObjectURL(url);
  };

  // Import PGN function

  const handleImportPGN = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const pgn = event.target.result;

      const newGame = new Chess();

      try {
        newGame.loadPgn(pgn);

        setGame(newGame);

        setCurrentMove(newGame.history().length - 1);

        console.log("IMPORTED PGN:", pgn);
      } catch (error) {
        console.log("INVALID PGN:", error);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <button onClick={exportPGN} className="bg-blue-500 text-white px-4 py-2 rounded">
        Export PGN
      </button>

      <input
        type="file"
        accept=".pgn"
        onChange={handleImportPGN}
        className="bg-blue-500 text-white px-2 py-2 rounded"
        placeholder="Enter the PGN here"
      />
    </div>
  );
};

export default PGNController;
