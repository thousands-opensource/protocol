const CustomizedLabel = ({ x, y, stroke, value }: any) => {
    return (
        <text
            x={x}
            y={y}
            dy={-4}
            fill={stroke}
            fontSize={10}
            textAnchor="middle"
        >
            {value.toFixed(2)}
        </text>
    );
};
export default CustomizedLabel;
