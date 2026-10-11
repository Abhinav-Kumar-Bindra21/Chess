const GameControls = ({ goToStart, undoMove, redoMove }) => {
  return (
    <div className="mt-2 flex items-center justify-center gap-3">
      <button type="button" onClick={goToStart} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
        Start
      </button>

      <button type="button" onClick={undoMove} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
        ↶ Undo
      </button>

      <button type="button" onClick={redoMove} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
        ↷ Redo
      </button>
    </div>
  );
};

export default GameControls;
