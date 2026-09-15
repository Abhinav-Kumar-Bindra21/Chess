const GameControls = ({ onUndo, onRedo, onReset }) => {
  return (
    <div className="flex gap-3">
      <button onClick={onUndo} className="px-4 bg-blue-500 text-white rounded">
        Undo
      </button>
      <button onClick={onRedo} className="px-4 bg-blue-500 text-white rounded">
        Redo
      </button>
      <button onClick={onReset} className="px-4 bg-blue-500 text-white rounded">
        Reset
      </button>
    </div>
  );
};

export default GameControls;
