const GameControls = ({ onStart, onPrevious, onNext }) => {
  return (
    <div className="flex items-center justify-center mt-2 gap-3">
      <button onClick={onStart} className="px-4 bg-blue-500 text-white rounded">
        Start
      </button>
      <button onClick={onPrevious} className="px-4 bg-blue-500 text-white rounded">
        ← Previous
      </button>
      <button onClick={onNext} className="px-4 bg-blue-500 text-white rounded">
        Next →
      </button>
    </div>
  );
};

export default GameControls;
