const CustomizedAxisTick = ({ x, y, stroke, payload }: any) => {
    const dateStr = new Date(payload.value).toDateString();
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={-10}
                dy={16}
                textAnchor="end"
                fill="#666"
                transform="rotate(-45)"
                fontSize={14}
            >
                {dateStr}
            </text>
        </g>
    );
};
export default CustomizedAxisTick;
