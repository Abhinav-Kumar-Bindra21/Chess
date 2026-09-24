const EvaluationBar = ({ evaluation, mate }) => {
  let whitePercentage = 50;

  // --------------------------------
  // Mate position
  // --------------------------------

  if (mate !== null) {
    if (mate > 0) {
      whitePercentage = 100;
    } else {
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
  // Display text
  // --------------------------------

  let evaluationText = "0.00";

  if (mate !== null) {
    evaluationText = mate > 0 ? `M${mate}` : `M${mate}`;
  } else if (evaluation !== null) {
    evaluationText = evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-bold text-gray-700">{evaluationText}</div>

      <div className="relative w-8 h-[400px] rounded-md overflow-hidden border border-gray-300 shadow-md bg-gray-900">
        {/* White */}

        <div
          className="absolute top-0 left-0 w-full bg-white transition-all duration-500"
          style={{
            height: `${whitePercentage}%`,
          }}
        />

        {/* Black */}

        <div
          className="absolute bottom-0 left-0 w-full bg-gray-900 transition-all duration-500"
          style={{
            height: `${100 - whitePercentage}%`,
          }}
        />

        {/* Center */}

        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-400 opacity-50" />
      </div>

      <div className="flex flex-col items-center text-xs font-semibold text-gray-600">
        <span>W</span>
        <span>B</span>
      </div>
    </div>
  );
};

export default EvaluationBar;
