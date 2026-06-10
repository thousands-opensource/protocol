import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { TabNotification } from "@/store/useNotificationStore";

interface TabNotificationProps {
    notification: TabNotification;
    onClose: () => void;
    onClick: () => void;
}

export const TabNotificationItem: React.FC<TabNotificationProps> = ({
    notification,
    onClose,
    onClick,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    // Auto-dismiss notification after X seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, 10000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-zinc-800 border border-zinc-700 rounded-md p-3 mb-2 shadow-lg flex justify-between items-start"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                >
                    <div className="flex-1 mr-3 cursor-pointer">
                        <div className="text-sm font-medium text-gray-200">
                            {notification.message}
                        </div>
                        <div className="text-xs text-gray-400">
                            {new Date(
                                notification.timestamp
                            ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    </div>
                    <button
                        className="text-gray-400 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const NotificationContainer: React.FC<{
    notifications: TabNotification[];
    onNotificationClick: (tabIndex: number) => void;
    onNotificationClose: (id: string) => void;
}> = ({ notifications, onNotificationClick, onNotificationClose }) => {
    return (
        <div className="absolute bottom-[calc(100%+12px)] right-0 w-full max-w-xs flex flex-col-reverse space-y-reverse space-y-2">
            {notifications.map((notification) => (
                <TabNotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => onNotificationClose(notification.id)}
                    onClick={() => onNotificationClick(Number(notification.id))}
                />
            ))}
        </div>
    );
};
