const CustomizedAxisTick = ({ x, y, stroke, payload }: any) => {
    const dateStr = new Date(payload.value);
    const formattedDateStr =
        String(dateStr.getUTCMonth() + 1)/*.padStart(2, "0")*/ +
        "/" +
        String(dateStr.getUTCDate())/*.padStart(2, "0") +
        "/" +
        String(dateStr.getUTCFullYear()).slice(-2);*/
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={10}
                y={10}
                dy={16}
                textAnchor="end"
                fill="#82ca9d"
                transform="rotate(0)"
                fontSize={14}
            >
                {formattedDateStr}
            </text>
        </g>
    );
};
export default CustomizedAxisTick;
