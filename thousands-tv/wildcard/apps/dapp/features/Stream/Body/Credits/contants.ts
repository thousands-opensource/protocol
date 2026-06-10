export interface CreditOption {
    credits: number;
    price: number;
    color: string;
    tileColor?: string;
    isAvailable?: boolean;
    name?: string;
    image?: string;
    id: string;
    sku: string;
}

export interface CreditsPurchaseOffer extends CreditOption {
    borderColor: string;
    endDate: string;
    starCount?: number;
    coinOnTop?: boolean;
    size?: "small" | "medium" | "large";
}

/**
 * Credit packages available for purchase
 * @note - price is in USD
 */
export const creditOptions: CreditOption[] = [
    {
        credits: 2500,
        price: 0.0001,
        color: "bg-gradient-to-br from-purple-500 to-violet-700",
        tileColor: "bg-[#1A1B1F]",
        isAvailable: true,
        name: "2,500 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "92659947",
        sku: "thousands.credits.2500",
    },
    {
        credits: 5500,
        price: 0.0001,
        color: "bg-gradient-to-br from-emerald-500 to-green-700",
        tileColor: "bg-[#1A1B1F]",
        isAvailable: true,
        name: "5,500 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "86233947",
        sku: "thousands.credits.5500",
    },
    {
        credits: 30000,
        price: 0.0001,
        color: "bg-gradient-to-br from-sky-500 to-blue-700",
        tileColor: "bg-[#1A1B1F]",
        isAvailable: true,
        name: "30,000 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "86651111",
        sku: "thousands.credits.30000",
    },
    {
        credits: 160000,
        price: 0.0001,
        color: "bg-gradient-to-br from-rose-500 to-red-700",
        tileColor: "bg-[#1A1B1F]",
        isAvailable: true,
        name: "160,000 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "74659968",
        sku: "thousands.credits.160000",
    },
];

/**
 * Credit packages available for purchase
 * @dev - move to backend as a product code configuration
 */

export const limitedOffers: CreditsPurchaseOffer[] = [
    {
        credits: 1200,
        price: 9.99,
        color: "bg-[linear-gradient(to_right,#007e95_0%,#167e95_50%,#2cbcdd_100%)]",
        borderColor: "border-[#007e95]",
        endDate: "",
        starCount: 1,
        coinOnTop: false,
        size: "medium",
        name: "1200 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "07d7fe8fce04",
        sku: "thousands.credits.1200",
    },
    {
        credits: 6500,
        price: 49.99,
        color: "bg-[linear-gradient(to_right,#0045a6_1%,#1945d3_50%,#3366ff_100%)]",
        borderColor: "border-[#0045a6]",
        endDate: "",
        starCount: 1,
        coinOnTop: false,
        size: "medium",
        name: "6500 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "2e5ad4bc58b1",
        sku: "thousands.credits.6500",
    },
    {
        credits: 32000,
        price: 199.99,
        color: "bg-[linear-gradient(to_right,#7b007a_1%,#95169e_50%,#ae2bc1_100%)]",
        borderColor: "border-[#7b007a]",
        endDate: "",
        starCount: 1,
        coinOnTop: false,
        size: "medium",
        name: "32000 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "50a6f69fe0ec",
        sku: "thousands.credits.32000",
    },
    {
        credits: 85000,
        price: 499.99,
        color: "bg-[linear-gradient(to_right,#9f1a07_0%,#cf3a23_50%,#ff593e_100%)]",
        borderColor: "border-[#9f1a07]",
        endDate: "",
        starCount: 1,
        coinOnTop: false,
        size: "medium",
        name: "85000 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "92099e8706b8",
        sku: "thousands.credits.85000",
    },
    {
        credits: 380000,
        price: 1999.99,
        color: "bg-[linear-gradient(to_right,#ae5e00_0%,#d75e00_50%,#ff9900_100%)]",
        borderColor: "border-[#ae5e00]",
        endDate: "",
        starCount: 1,
        coinOnTop: false,
        size: "medium",
        name: "380000 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "6dc11035dd0d",
        sku: "thousands.credits.380000",
    },
    {
        credits: 2000000,
        price: 9999.99,
        color: "bg-[linear-gradient(to_right,#db8300_0%,#edad00_50%,#ffd600_100%)]",
        borderColor: "border-[#db8300]",
        endDate: "",
        starCount: 1,
        coinOnTop: false,
        size: "medium",
        name: "2000000 Credits Package",
        image: "/images/Credits/coin.webp",
        id: "84j20cd1924f",
        sku: "thousands.credits.2000000",
    },
];
