const EvaluationBar = ({ evaluation, mate, mateWinner }) => {
  let whitePercentage = 50;

  // --------------------------------
  // Already checkmate
  // --------------------------------

  if (mateWinner === "white") {
    whitePercentage = 100;
  } else if (mateWinner === "black") {
    whitePercentage = 0;
  }

  // --------------------------------
  // Normal mate
  // --------------------------------
  else if (mate !== null) {
    if (mate > 0) {
      whitePercentage = 100;
    } else if (mate < 0) {
      whitePercentage = 0;
    }
  }

  // --------------------------------
  // Normal evaluation
  // --------------------------------
  else if (evaluation !== null) {
    whitePercentage = 50 + 50 * Math.tanh(evaluation / 4);
  }

  // --------------------------------
  // Keep between 0 and 100
  // --------------------------------

  whitePercentage = Math.max(0, Math.min(100, whitePercentage));

  // --------------------------------
  // Evaluation text
  // --------------------------------

  let evaluationText = "0.00";

  if (mateWinner === "white") {
    evaluationText = "M#";
  } else if (mateWinner === "black") {
    evaluationText = "-M#";
  } else if (mate !== null) {
    if (mate > 0) {
      evaluationText = `M${mate}`;
    } else if (mate < 0) {
      evaluationText = `-M${Math.abs(mate)}`;
    }
  } else if (evaluation !== null) {
    evaluationText = evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Evaluation text */}
      <div className="text-sm font-bold text-gray-700">{evaluationText}</div>

      {/* Evaluation bar */}
      <div className="relative w-8 h-[390px] rounded-sm overflow-hidden border border-gray-300 shadow-sm bg-gray-900">
        {/* Black portion */}
        <div
          className="absolute top-0 left-0 w-full bg-gray-900 transition-all duration-500 ease-out"
          style={{
            height: `${100 - whitePercentage}%`,
          }}
        />

        {/* White portion */}
        <div
          className="absolute bottom-0 left-0 w-full bg-white transition-all duration-500 ease-out"
          style={{
            height: `${whitePercentage}%`,
          }}
        />

        {/* Center line */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-400/50" />
      </div>

      {/* Labels */}
      <div className="flex flex-col items-center text-xs font-semibold text-gray-600">
        <span>W</span>
        <span>B</span>
      </div>
    </div>
  );
};

export default EvaluationBar;
