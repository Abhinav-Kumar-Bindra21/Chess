const GameControls = ({ onStart, onUndo, onRedo }) => {
  return (
    <div className="flex items-center justify-center mt-2 gap-3">
      <button onClick={onStart} className="px-4 bg-blue-500 text-white rounded">
        Start
      </button>
      <button onClick={onUndo} className="px-4 bg-blue-500 text-white rounded">
        ↶ Undo
      </button>
      <button onClick={onRedo} className="px-4 bg-blue-500 text-white rounded">
        ↷ Redo
      </button>
    </div>
  );
};

export default GameControls;
