const MoveExplanation = ({ selectedAnalysisMove }) => {
  // Step 1: Handle the case where no move is selected.
  if (!selectedAnalysisMove) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900">Why was this move good or bad?</h3>

        <p className="mt-2 text-sm text-slate-600">Select a move from the analysis table to see its explanation.</p>
      </div>
    );
  }

  // Step 2: Get the information from the selected move.
  const {
    actualMove,
    bestMove,
    classification,
    centipawnLoss,
    evaluationBefore,
    evaluationAfter,
    mateChanged,
    materialSacrifice,
  } = selectedAnalysisMove;

  // Step 3: Make sure the centipawn loss is a valid number.
  const hasValidLoss =
    centipawnLoss !== null &&
    centipawnLoss !== undefined &&
    centipawnLoss !== "" &&
    Number.isFinite(Number(centipawnLoss)) &&
    Number(centipawnLoss) >= 0;

  const loss = hasValidLoss ? Number(centipawnLoss) : null;

  // Step 4: Create an explanation based on the available data.
  const getExplanation = () => {
    if (mateChanged) {
      return {
        title: "Mate-related position",
        message:
          "The engine detected a checkmate-related evaluation before or after this move. Centipawn loss alone cannot explain the mating sequence, so review the engine's suggested move and continuation.",
      };
    }

    if (loss === null) {
      return {
        title: "Evaluation unavailable",
        message:
          "The engine did not provide enough evaluation data to calculate centipawn loss. Compare the played move with the suggested move and review the position.",
      };
    }

    if (loss <= 10) {
      return {
        title: "Very little evaluation lost",
        message:
          "Your move kept the position close to the engine's preferred evaluation. Compare it with the suggested move to see whether there was a small improvement.",
      };
    }

    if (loss <= 30) {
      return {
        title: "Small evaluation loss",
        message:
          "Your move was reasonably close to the engine's preferred play, but the suggested move may preserve a little more of the position's value.",
      };
    }

    if (loss <= 100) {
      return {
        title: "Noticeable evaluation loss",
        message:
          "The engine preferred another move. Compare the two moves and inspect the continuation to understand what positional or tactical opportunity may have been missed.",
      };
    }

    if (loss <= 300) {
      return {
        title: "Significant evaluation loss",
        message:
          "Your move substantially worsened the engine's evaluation. Study the recommended alternative and the resulting position to identify the missed opportunity.",
      };
    }

    return {
      title: "Major evaluation loss",
      message:
        "Your move caused a large evaluation loss according to the analysis. Carefully review the recommended alternative and the engine's continuation. This score alone does not identify the exact tactical mistake.",
    };
  };

  const explanation = getExplanation();

  // Step 5: Display the explanation.
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-bold text-slate-900">Why was this move good or bad?</h3>

      <p className="mt-1 text-sm text-slate-600">An explanation based on your engine analysis.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-sm text-slate-500">You played</p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {actualMove || selectedAnalysisMove.move || "Unavailable"}
          </p>
        </div>

        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-sm text-slate-500">Best move found</p>

          <p className="mt-1 text-xl font-bold text-green-700">
            {bestMove || selectedAnalysisMove.bestMoveUCI || "Unavailable"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
        <div>
          <p className="text-sm text-slate-500">Move classification</p>

          <p className="mt-1 font-semibold capitalize text-slate-900">{classification || "Not classified"}</p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Centipawn loss</p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {loss === null ? "Unavailable" : `${Math.round(loss)} cp`}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <h4 className="font-semibold text-blue-950">{explanation.title}</h4>

        <p className="mt-2 text-sm leading-6 text-blue-900">{explanation.message}</p>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-slate-900">Evaluation before and after</h4>

        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-slate-500">Before the move</p>

            <p className="mt-1 font-semibold">
              {evaluationBefore === null || evaluationBefore === undefined
                ? "Unavailable"
                : `${evaluationBefore > 0 ? "+" : ""}${evaluationBefore.toFixed(2)}`}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">After the move</p>

            <p className="mt-1 font-semibold">
              {evaluationAfter === null || evaluationAfter === undefined
                ? "Unavailable"
                : `${evaluationAfter > 0 ? "+" : ""}${evaluationAfter.toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>

      {materialSacrifice && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          The material-sacrifice detector flagged this move. This is a heuristic signal, not proof that the sacrifice is
          sound.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Centipawn loss measures an evaluation change; it does not, by itself, explain the exact tactical reason. The
        thresholds used here are explanatory ranges, not official chess standards.
      </p>
    </section>
  );
};

export default MoveExplanation;
