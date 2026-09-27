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
  // Keep percentage between 0 and 100
  // --------------------------------

  whitePercentage = Math.max(0, Math.min(100, whitePercentage));

  // --------------------------------
  // Evaluation text
  // --------------------------------

  let evaluationText = "—";

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
      {/* --------------------------------
          Evaluation Text
      -------------------------------- */}

      <div
        className="
          min-w-[42px]
          text-center
          text-sm
          font-bold
          text-gray-700
          bg-white
          px-1.5
          py-1
          rounded
          shadow-sm
          border
          border-gray-200
        "
      >
        {evaluationText}
      </div>

      {/* --------------------------------
          Evaluation Bar
      -------------------------------- */}

      <div
        className="
          relative
          w-8
          h-[390px]
          rounded-sm
          overflow-hidden
          border
          border-gray-400
          shadow-md
          bg-gray-900
        "
      >
        {/* Black Portion */}

        <div
          className="
            absolute
            top-0
            left-0
            w-full
            bg-gray-900
            transition-all
            duration-500
            ease-out
          "
          style={{
            height: `${100 - whitePercentage}%`,
          }}
        />

        {/* White Portion */}

        <div
          className="
            absolute
            bottom-0
            left-0
            w-full
            bg-white
            transition-all
            duration-500
            ease-out
          "
          style={{
            height: `${whitePercentage}%`,
          }}
        />

        {/* Center Line */}

        <div
          className="
            absolute
            top-1/2
            left-0
            w-full
            h-[1px]
            bg-gray-400
            opacity-50
          "
        />

        {/* 50% Marker */}

        <div
          className="
            absolute
            top-1/2
            left-1/2
            -translate-x-1/2
            -translate-y-1/2
            w-1.5
            h-1.5
            rounded-full
            bg-gray-500
          "
        />
      </div>

      {/* --------------------------------
          Labels
      -------------------------------- */}

      <div
        className="
          flex
          flex-col
          items-center
          text-[11px]
          font-bold
          text-gray-500
          leading-5
        "
      >
        <span>W</span>
        <span>B</span>
      </div>
    </div>
  );
};

export default EvaluationBar;
