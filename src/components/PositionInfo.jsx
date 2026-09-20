const PositionInfo = ({ currentFEN }) => {
  return (
    <div className="mt-4 w-[400px]">
      <h2 className="font-bold text-lg">Current Position</h2>

      <p className="text-sm break-all bg-gray-200 p-2 rounded">{currentFEN}</p>
    </div>
  );
};

export default PositionInfo;
