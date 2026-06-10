// CreditDeductionAnimation.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";

export interface CreditDeductionAnimationRef {
  triggerAnimation: (deduction: number) => void;
}

interface AnimationItem {
  id: string;
  deduction: number;
}

const floatUpSmallAnimation = `
  @keyframes floatUpSmall {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(-50px);
      opacity: 0;
    }
  }
`;

const CreditDeductionAnimation = forwardRef<CreditDeductionAnimationRef>((_, ref) => {
  const [animations, setAnimations] = useState<AnimationItem[]>([]);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = floatUpSmallAnimation;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    triggerAnimation(deduction: number) {
      const newItem: AnimationItem = {
        id: `${Date.now()}-${Math.random()}`,
        deduction,
      };
      setAnimations((prev) => [...prev, newItem]);
    },
  }));

  const handleAnimationEnd = (id: string) => {
    setAnimations((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {animations.map((item) => (
        <div
          key={item.id}
          style={{
            position: "absolute",
            bottom: "100%", 
            right: "0",
            animation: "floatUpSmall 1s ease-out forwards",
            display: "flex",
            alignItems: "center",
          }}
          onAnimationEnd={() => handleAnimationEnd(item.id)}
        >
          <span
            style={{
              fontSize: "12px",
              color: "white",
              fontWeight: "bold",
              marginRight: "4px",
            }}
          >
            {item.deduction > 0 ? `-${item.deduction}` : "Free"}
          </span>
          <Image
            src="/images/Credits/coin.webp"
            alt="Credits"
            width={12}
            height={12}
          />
        </div>
      ))}
    </div>
  );
});

CreditDeductionAnimation.displayName = "CreditDeductionAnimation";

export default CreditDeductionAnimation;
