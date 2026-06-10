/**
 * Dynamically calculates the avatar image size based on the screen size
 * @returns sx object
 */
export const avatarSx = () => {
    const aspectRatio = 0.92;
    const baseBreakpoint = 300;
    const smBreakpoint = 300;
    const mdBreakpoint = 400;
    const lgBreakpoint = 600;
    const xLgBreakpoint = 600;
    const xxLgBreakpoint = 800;

    return {
        position: "relative",
        w: [
            `${baseBreakpoint}px`,
            `${smBreakpoint}px`,
            `${mdBreakpoint}px`,
            `${lgBreakpoint}px`,
            `${xLgBreakpoint}px`,
        ],
        h: [
            `${baseBreakpoint * aspectRatio}px`,
            `${smBreakpoint * aspectRatio}px`,
            `${mdBreakpoint * aspectRatio}px`,
            `${lgBreakpoint * aspectRatio}px`,
            `${xLgBreakpoint * aspectRatio}px`,
        ],
        "@media (min-width: 1700px)": {
            w: `${xxLgBreakpoint}px`,
            h: `${xxLgBreakpoint * aspectRatio}px`,
        },
        top: ["55px", "40px", "0px", "30px", "30px", "40px"],
        transform: [
            "scale(1)",
            "scale(1)",
            "scale(1)",
            "scale(1)",
            "scale(1.1)",
        ], // scale up pfp on larger screens
    };
};

export const avatarBackgroundGlowSx = {
    position: "absolute",
    filter: "blur(190px)",
    opacity: ["0.95", "0.95", "0.85"],
    bottom: "80%",
    "@media (max-width: 1000px)": { bottom: "95%" },
    "@media (min-width: 2500px)": { right: "5%" },
    "@media (min-width: 3000px)": { right: "10%" },
    "@media (min-width: 3500px)": { right: "20%" },
    "@media (min-width: 4000px)": { right: "25%" },
    "@media (min-width: 4500px)": { right: "30%" },
    "@media (min-width: 5000px)": { right: "35%" },
    transform: "scale(2)",
};
