import { useEffect } from "react";

interface SkyboxToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    bgStyle?: "default" | "gradient" | "success" | "error" | "warning";
    duration?: number;
}

export const SkyboxToast: React.FC<SkyboxToastProps> = ({
    message,
    isVisible,
    onClose,
    bgStyle = "default",
    duration = 3000,
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose, duration]);

    if (!isVisible) return null;

    const bgStyles = {
        default: "bg-[#333333]",
        gradient: "bg-gradient-to-r from-blue-500 to-blue-700",
        success: "bg-gradient-to-r from-green-500 to-green-700",
        error: "bg-gradient-to-r from-red-500 to-red-700",
        warning: "bg-gradient-to-r from-yellow-500 to-yellow-700",
    };

    return (
        <div
            className={`fixed bottom-4 right-4 ${bgStyles[bgStyle]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-fadeIn z-50`}
        >
            <span className="mr-2">{message}</span>
            <button
                onClick={onClose}
                className="ml-3 text-gray-200 hover:text-white transition-colors"
            >
                ×
            </button>
        </div>
    );
};
