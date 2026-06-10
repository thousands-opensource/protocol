import { NEW_FEATURE_TEXT } from "@/constants/constants";
import { gilroyBlackItalic } from "@/utils/themeUtil";
import { Box } from "@chakra-ui/react";

const NewFeatureTextSVG = () => {
    return (
        <Box
            as="svg"
            id="Layer_2"
            data-name="Layer 2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 390.51 63.73"
        >
            <defs>
                <style>
                    {`
                    .wildcard-logo-new-graident {
                        fill: url(#New_Gradient_Swatch_6);
                    }

                    .wildcard-logo-new-graident, .new-feature-text {
                        stroke-width: 0px;
                    }

                    .new-feature-text {
                        fill: #fff;
                        font-size: 63px;
                        font-weight: 700;
                        letter-spacing: .02em;
                        text-transform: uppercase;
                    }
                    `}
                </style>
                <linearGradient
                    id="New_Gradient_Swatch_6"
                    data-name="New Gradient Swatch 6"
                    x1="4.1"
                    y1="2.01"
                    x2="33.99"
                    y2="31.58"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="#d69d36" />
                    <stop offset=".52" stopColor="#b07728" />
                    <stop offset=".99" stopColor="#894b19" />
                </linearGradient>
            </defs>
            <g id="Layer_8" data-name="Layer 8">
                <g>
                    <g>
                        <text
                            className={`${gilroyBlackItalic.className} new-feature-text`}
                            transform="translate(33.73 42)"
                        >
                            <tspan x="0" y="3">
                                {NEW_FEATURE_TEXT}
                            </tspan>
                        </text>
                    </g>
                    <path
                        className="wildcard-logo-new-graident"
                        d="m7.83.32L0,30.04l24.27-6.51c2.95-.79,5.25-3.1,6.03-6.05L34.82.32H7.83Zm18.02,15.01c-.35,1.3-1.36,2.31-2.65,2.66l-15.52,4.18,3.58-13.41h2.79s-5.46-3.13-5.46-3.13h7.79l-3.41,12.8c1.16-.31,2.02-1.2,2.44-2.69,0,0,.31-1.1.44-1.55s2.29-8.56,2.29-8.56h4.28l-2.96,11.06c1.16-.31,2.02-1.2,2.44-2.69,0,0,.31-1.1.44-1.55.21-.74,1.82-6.82,1.82-6.82h4.29l-2.58,9.71Z"
                    />
                </g>
            </g>
        </Box>
    );
};
export default NewFeatureTextSVG;
