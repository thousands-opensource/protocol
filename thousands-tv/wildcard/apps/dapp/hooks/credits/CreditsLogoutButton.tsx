import React from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { useInfoNotifications } from "../useInfoNotifications";
import { IoLogOutOutline } from "react-icons/io5";

// Define the shape of the message object
export interface Message {
    title: string;
    description: string;
    status: "info" | "error";
    duration: number;
    isClosable: boolean;
}

interface LogoutButtonProps {}

const CreditsLogoutButton: React.FC<LogoutButtonProps> = ({}) => {
    const router = useRouter();
    const { onMessage } = useInfoNotifications();

    /**
     * Handle the logout action.
     * Performs the NextAuth sign out operation after a logout API call.
     */
    const handleLogout = async () => {
        try {
            const response = await axios.post("/api/auth/logout");
            if (response.status === 200) {
                await signOut({ redirect: false });
                router.push(WILDFILE_ROUTES.HOME.url);
                onMessage({
                    title: "Logged Out",
                    description: "You have successfully logged out.",
                    status: "info",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                throw new Error("Logout failed");
            }
        } catch (error) {
            console.error("Failed to log out:", error);
            onMessage({
                title: "Logout Error",
                description: "Failed to log out. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <button
            className="p-1 cursor-pointer focus:outline-none"
            onClick={handleLogout}
        >
            <IoLogOutOutline className="w-6 h-6 text-white transition-all duration-200 ease-in-out hover:text-gray-300 hover:scale-110" />
        </button>
    );
};

export default CreditsLogoutButton;
