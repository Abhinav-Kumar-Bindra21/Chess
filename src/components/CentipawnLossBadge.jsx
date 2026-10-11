const CentipawnLossBadge = ({ loss }) => {
  const hasValidLoss =
    loss !== null && loss !== undefined && loss !== "" && Number.isFinite(Number(loss)) && Number(loss) >= 0;

  if (!hasValidLoss) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
        N/A
      </span>
    );
  }

  const value = Number(loss);

  let style = "bg-red-100 text-red-800";

  if (value <= 10) {
    style = "bg-green-100 text-green-800";
  } else if (value <= 30) {
    style = "bg-emerald-100 text-emerald-800";
  } else if (value <= 100) {
    style = "bg-yellow-100 text-yellow-800";
  } else if (value <= 300) {
    style = "bg-orange-100 text-orange-800";
  }
  return (
    <span
      title="Centipawn loss compared with the engine's evaluation"
      className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${style}`}
    >
      {Math.round(value)} cp
    </span>
  );
};

export default CentipawnLossBadge;
