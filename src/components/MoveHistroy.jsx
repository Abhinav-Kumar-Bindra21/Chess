import { useEffect, useRef } from "react";

const MoveHistroy = ({ moveHistory, onMoveClick, currentMove }) => {
  const moveEndRef = useRef(null);

  // Automatically scroll to latest move
  useEffect(() => {
    moveEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [moveHistory]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Move History</h2>

      <div className="max-h-[400px] overflow-y-auto">
        <div className="flex flex-col gap-2">
          {moveHistory.map((move, index) => {
            // Only create a row for White's move
            if (index % 2 !== 0) {
              return null;
            }

            const whiteMove = move;
            const blackMove = moveHistory[index + 1];

            return (
              <div key={index} className="flex items-center gap-4">
                {/* Move number */}
                <span className="w-6">{Math.floor(index / 2) + 1}.</span>

                {/* White move */}
                <button
                  onClick={() => onMoveClick(index)}
                  className={
                    currentMove === index ? "bg-blue-500 text-white px-3 py-1 rounded" : "bg-gray-200 px-3 py-1 rounded"
                  }
                >
                  {whiteMove}
                </button>

                {/* Black move */}
                {blackMove && (
                  <button
                    onClick={() => onMoveClick(index + 1)}
                    className={
                      currentMove === index + 1
                        ? "bg-blue-500 text-white px-3 py-1 rounded"
                        : "bg-gray-200 px-3 py-1 rounded"
                    }
                  >
                    {blackMove}
                  </button>
                )}
              </div>
            );
          })}

          {/* Scroll target */}
          <div ref={moveEndRef}></div>
        </div>
      </div>
    </div>
  );
};

export default MoveHistroy;
