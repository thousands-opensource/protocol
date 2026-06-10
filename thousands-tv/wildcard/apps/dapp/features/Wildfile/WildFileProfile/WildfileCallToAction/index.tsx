import { gilroyBlackItalic } from "@/utils/themeUtil";
import { Box } from "@chakra-ui/react";

interface WildfileCallToActionSVGProps {
    [x: keyof any]: any;
}

const WildfileCallToActionSVG = ({ ...rest }: WildfileCallToActionSVGProps) => {
    return (
        <Box
            as={"svg"}
            id="CallToAction"
            data-name="CallToAction"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 455.87 72.56"
            {...rest}
            width={"455px"}
            height={"auto"}
        >
            <defs>
                <style>
                    {`
                    .cls-1 {
                        fill: url(#linear-gradient);
                    }

                    .cls-1, .callToActionHeader {
                        stroke-width: 0px;
                        font-size: 45px;
                        text-transform: uppercase

                    }
                `}
                </style>
                <linearGradient
                    id="linear-gradient"
                    x1="273.07"
                    y1="-2.27"
                    x2="282.04"
                    y2="68.79"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="#fff" />
                    <stop offset="1" stopColor="#e9ebec" />
                </linearGradient>
            </defs>

            <g id="Layer_4" data-name="Layer 4">
                <g>
                    <polygon
                        className="cls-1"
                        points="555.87 72.56 0 72.56 19.44 0 555.87 0 555.87 72.56"
                    />
                    <g>
                        <text
                            className={`${gilroyBlackItalic.className} callToActionHeader`}
                            transform="translate(40 50)"
                        >
                            <tspan x="0" y="3">
                                Badges are live
                            </tspan>
                        </text>
                    </g>
                </g>
            </g>
        </Box>
    );
};

export default WildfileCallToActionSVG;
