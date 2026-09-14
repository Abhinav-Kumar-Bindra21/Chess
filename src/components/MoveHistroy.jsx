import React from "react";

const MoveHistroy = ({ moveHistory }) => {
  const history = moveHistory;

  const movePairs = [];

  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: i / 2 + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  console.log(movePairs);
  return (
    // Respresenting or showing moves in singe line

    // <div className="mt-6">
    //   <h2 className="text-xl font-bold">Move History</h2>

    //   <div>
    //     {moveHistory.map((move, index) => (
    //       <span key={index} className="mr-3">
    //         {move}
    //       </span>
    //     ))}
    //   </div>
    // </div>

    // in format chess move order
    <div>
      {movePairs.map((move) => (
        <div key={move.number}>
          {move.number}. {move.white} {move.black}
        </div>
      ))}
    </div>
  );
};

export default MoveHistroy;
