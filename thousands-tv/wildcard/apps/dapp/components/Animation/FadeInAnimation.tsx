import React, { useRef, ReactNode } from "react";
import { motion, useInView } from "framer-motion";

interface FadeInAnimationProps {
    children: ReactNode;
}

const FadeInAnimation: React.FC<FadeInAnimationProps> = ({ children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    const variants = {
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        hidden: { opacity: 0, y: 100 },
    };

    return (
        <motion.div
            ref={ref}
            animate={isInView ? "visible" : "hidden"}
            initial="hidden"
            variants={variants}
        >
            {children}
        </motion.div>
    );
};

export default FadeInAnimation;
