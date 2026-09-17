const MoveHistroy = ({ moveHistory, onMoveClick, currentMove }) => {
  return (
    <div>
      <h2>Move History</h2>

      <div>
        {moveHistory.map((move, index) => {
          // Only create a row for White's move
          if (index % 2 !== 0) {
            return null;
          }

          const whiteMove = move;
          const blackMove = moveHistory[index + 1];

          return (
            <div key={index} className="flex gap-4">
              {/* Move number */}
              <span>{Math.floor(index / 2) + 1}.</span>

              {/* White move */}
              <button
                onClick={() => onMoveClick(index)}
                className={currentMove === index ? "bg-blue-500 text-white" : "bg-gray-200"}
              >
                {whiteMove}
              </button>

              {/* Black move */}
              {blackMove && (
                <button
                  onClick={() => onMoveClick(index + 1)}
                  className={currentMove === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}
                >
                  {blackMove}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoveHistroy;
