import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TabNotification,
    useNotificationStore,
} from "@/store/useNotificationStore";
import Image from "next/image";

/***
 * Render tab notification asset based on the tab type
 */
const getNotificationAsset = (tabTitle: string) => {
    switch (tabTitle) {
        case "Voting":
            return {
                src: "/images/ChatAppControl/voting-title.png",
                alt: "Voting",
                width: 80,
                height: 38,
            };
        case "Predictions":
            return {
                src: "/images/Credits/rally.png",
                alt: "Rally",
                width: 80,
                height: 38,
            };
        default:
            return {
                src: "/images/ChatAppControl/voting-title.png", // fallback
                alt: "Voting",
                width: 80,
                height: 38,
            };
    }
};

interface ToastNotificationProps {
    notification: TabNotification;
    onClose: () => void;
    onClick: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
    notification,
    onClose,
    onClick,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const NOTIFICATION_TIMEOUT_MS = 60000;
    const asset = getNotificationAsset(notification.tabTitle);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
        }, NOTIFICATION_TIMEOUT_MS);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 20 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="rounded-lg p-0 cursor-pointer flex items-center max-w-xs pointer-events-auto overflow-hidden"
                    onClick={() => {
                        onClick();
                        setIsVisible(false);
                        setTimeout(onClose, 500);
                    }}
                    style={{
                        background:
                            "linear-gradient(to right, rgba(60, 60, 60, 0.95) 0%, rgba(50, 50, 50, 0.9) 40%, rgba(40, 40, 40, 0.8) 70%, rgba(30, 30, 30, 0.4) 85%, rgba(20, 20, 20, 0) 100%)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                        border: "1px solid rgba(70, 70, 70, 0.5)",
                    }}
                >
                    <div className="flex-1 py-3 px-4">
                        <div className="flex items-center justify-center">
                            <Image
                                src={asset.src}
                                alt={asset.alt}
                                width={asset.width}
                                height={asset.height}
                                style={{
                                    objectFit: "contain",
                                    maxWidth: "100%",
                                    filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2))",
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * Toast Container component to display notifications
 */
export const ToastContainer: React.FC<{
    onNotificationClick: (tabTitle: string) => void;
    activeTabTitle?: string;
}> = ({ onNotificationClick, activeTabTitle }) => {
    // Get the notification from store directly
    const { activeNotification, clearActiveNotification } =
        useNotificationStore();

    // Only show if notification exists and is for a different tab
    const showNotification =
        activeNotification && activeNotification.tabTitle !== activeTabTitle;

    return (
        <div className="absolute top-[-80px] right-4 z-50 pointer-events-none">
            {showNotification && (
                <ToastNotification
                    key={activeNotification.id}
                    notification={activeNotification}
                    onClose={() => clearActiveNotification()}
                    onClick={() => {
                        onNotificationClick(activeNotification.tabTitle);
                        clearActiveNotification();
                    }}
                />
            )}
        </div>
    );
};
