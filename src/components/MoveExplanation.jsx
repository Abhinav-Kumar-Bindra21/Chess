const formatEvaluation = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Unavailable";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Unavailable";
  }

  return `${number > 0 ? "+" : ""}${number.toFixed(2)}`;
};

const formatMove = (move) => {
  if (!move) return "Unavailable";

  if (typeof move === "string") {
    return move;
  }

  return move.san || move.lan || move.uci || move.uciMove || "Unavailable";
};

const formatCentipawnLoss = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Unavailable";
  }

  const loss = Number(value);

  if (!Number.isFinite(loss) || loss < 0) {
    return "Unavailable";
  }

  return `${Math.round(loss)} cp (${(loss / 100).toFixed(2)} pawns)`;
};

const getExplanation = (result) => {
  const classification = String(result.classification || "unclassified").toLowerCase();

  const loss = Number(result.centipawnLoss);
  const hasLoss =
    result.centipawnLoss !== null &&
    result.centipawnLoss !== undefined &&
    result.centipawnLoss !== "" &&
    Number.isFinite(loss) &&
    loss >= 0;

  const bestMove = formatMove(result.bestMove);
  const playedMove = formatMove(result.actualMove || result.san || result.move);

  const hasAlternative = bestMove !== "Unavailable" && playedMove !== "Unavailable" && bestMove !== playedMove;

  if (classification === "brilliant") {
    return {
      title: "A brilliant move!",
      detail:
        "Your analyzer classified this move as brilliant. Compare the played move with the engine continuation to understand the idea behind it.",
      lesson:
        "Look for the tactical or positional idea that justifies this move. Confirm it using the engine's suggested line.",
    };
  }

  if (classification === "blunder") {
    return {
      title: "A major mistake",
      detail: hasAlternative
        ? `The engine classified ${playedMove} as a blunder and recommends ${bestMove} instead. Review the engine continuation to find the concrete consequence.`
        : "The engine classified this move as a blunder. Review the position and engine continuation to understand the consequence.",
      lesson:
        "Before committing to a move, check your opponent's checks, captures, and threats. Also check whether your own pieces are left undefended.",
    };
  }

  if (classification === "mistake") {
    return {
      title: "A significant mistake",
      detail: hasAlternative
        ? `The engine prefers ${bestMove} over ${playedMove}. Compare the resulting positions to identify what makes the recommended move stronger.`
        : "The engine found a significant problem with this move. Inspect the recommended continuation to understand why.",
      lesson:
        "Compare candidate moves and check king safety, material, piece activity, and your opponent's immediate threats.",
    };
  }

  if (classification === "inaccuracy") {
    return {
      title: "A less accurate move",
      detail: hasAlternative
        ? `${playedMove} was less accurate than ${bestMove} according to the engine. This does not automatically mean you lost material.`
        : "The engine identified an opportunity to improve this position. Inspect its recommended continuation.",
      lesson:
        "Look for a move that improves your pieces, strengthens your king's safety, or prevents an opponent's plan.",
    };
  }

  if (classification === "excellent") {
    return {
      title: "An excellent move",
      detail:
        "Your analyzer classified this move as excellent. Review the best move and engine continuation to understand why it works well.",
      lesson: "Try to identify the strategic or tactical purpose behind the move, rather than memorizing it.",
    };
  }

  if (classification === "good") {
    return {
      title: "A good move",
      detail:
        "Your analyzer classified this move as good. Compare it with the engine's preferred continuation to see whether there is room for improvement.",
      lesson: "Keep checking your opponent's threats and look for ways to improve your pieces.",
    };
  }

  if (classification === "inaccuracy-free") {
    return {
      title: "Position maintained",
      detail:
        "The recorded analysis did not identify a significant loss from this move. Review the engine line for possible improvements.",
      lesson: "Continue evaluating checks, captures, threats, and your pieces' activity.",
    };
  }

  if (hasLoss && loss > 100) {
    return {
      title: "The move lost evaluation",
      detail: `The recorded centipawn loss is ${Math.round(loss)} cp. Compare the played move with the engine's best move and inspect the continuation to find the reason.`,
      lesson:
        "Find the first point in the engine line where the position changes significantly. Check for missed tactics and immediate threats.",
    };
  }

  return {
    title: "Review this move",
    detail:
      "The available analysis does not establish a specific tactical reason. Compare the played move, engine recommendation, and resulting position.",
    lesson: "Look for checks, captures, threats, king safety, material balance, and improvements in piece activity.",
  };
};

const MoveExplanation = ({ result }) => {
  if (!result) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Move Explanation</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Analyze a game and select a move from the Move Details table to review it here.
        </p>
      </section>
    );
  }

  const explanation = getExplanation(result);

  const playedMove = formatMove(result.actualMove || result.san || result.move);

  const bestMove = formatMove(result.bestMove);

  const classification = String(result.classification || "unclassified");

  const hasBefore =
    result.evaluationBefore !== null && result.evaluationBefore !== undefined && result.evaluationBefore !== "";

  const hasAfter =
    result.evaluationAfter !== null && result.evaluationAfter !== undefined && result.evaluationAfter !== "";

  const before = hasBefore ? Number(result.evaluationBefore) : NaN;
  const after = hasAfter ? Number(result.evaluationAfter) : NaN;

  const validEvaluations = Number.isFinite(before) && Number.isFinite(after);

  // Only calculate the change when both evaluations use
  // an explicitly identified, consistent perspective.
  const perspective = String(result.evaluationPerspective || "").toLowerCase();

  const canCalculateChange = validEvaluations && ["white", "black"].includes(perspective);

  const evaluationChange = canCalculateChange ? after - before : null;

  const pv = Array.isArray(result.pv)
    ? result.pv
        .map((move) => (typeof move === "string" ? move : move?.san || move?.uci || ""))
        .filter(Boolean)
        .join(" ")
    : typeof result.pv === "string"
      ? result.pv
      : "";

  const centipawnLoss = formatCentipawnLoss(result.centipawnLoss);

  const hasBestMove = bestMove !== "Unavailable" && bestMove !== playedMove;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Move Review</p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">{explanation.title}</h2>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium capitalize text-slate-700">
          {classification}
        </span>
      </div>

      {/* Played move and best move */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Move played</p>

          <p className="mt-1 text-xl font-bold text-slate-900">{playedMove}</p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Engine's best move</p>

          <p className="mt-1 text-xl font-bold text-blue-900">{bestMove}</p>

          {hasBestMove && <p className="mt-1 text-xs text-blue-700">Alternative to the move played</p>}
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-5">
        <h3 className="font-semibold text-slate-900">What happened?</h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">{explanation.detail}</p>
      </div>

      {/* Centipawn loss */}
      <div className="mt-5 rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Centipawn Loss</h3>

        <p className="mt-1 text-xl font-bold text-slate-900">{centipawnLoss}</p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Centipawn loss estimates how much worse the played move is compared with the engine's best move. The displayed
          value depends on the calculation performed by your analysis hook.
        </p>
      </div>

      {/* Training takeaway */}
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-semibold text-amber-900">Training takeaway</h3>

        <p className="mt-2 text-sm leading-6 text-amber-900">{explanation.lesson}</p>
      </div>

      {/* Evaluation comparison */}
      <div className="mt-5">
        <h3 className="font-semibold text-slate-900">Evaluation Comparison</h3>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-500">Before move</p>

            <p className="mt-1 font-semibold text-slate-900">
              {hasBefore ? formatEvaluation(result.evaluationBefore) : "Unavailable"}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-500">After move</p>

            <p className="mt-1 font-semibold text-slate-900">
              {hasAfter ? formatEvaluation(result.evaluationAfter) : "Unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-3">
          <p className="text-sm text-slate-500">Evaluation change (after − before)</p>

          <p className="mt-1 font-semibold text-slate-900">
            {canCalculateChange
              ? formatEvaluation(evaluationChange)
              : "Unavailable — confirm a consistent evaluation perspective"}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            A positive change means the evaluation increased from the selected perspective; a negative change means it
            decreased. This is meaningful only when both scores use the same perspective and score convention.
          </p>
        </div>
      </div>

      {/* Principal variation */}
      {pv && (
        <div className="mt-5">
          <h3 className="font-semibold text-slate-900">Engine Continuation</h3>

          <p className="mt-2 break-words rounded-lg bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-700">{pv}</p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            This is the engine's principal variation. It represents a suggested continuation, not necessarily a forced
            sequence.
          </p>
        </div>
      )}
    </section>
  );
};

export default MoveExplanation;
