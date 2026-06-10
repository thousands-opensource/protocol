import React from "react";
import { Box, Button, Center, Heading, Text, useToast } from "@chakra-ui/react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

const SignOutEverywhere = () => {
    const toast = useToast();
    const router = useRouter();
    const { onMessage } = useInfoNotifications();

    const { setIsLoggedIn, isLoggedIn } = useWildfileUserContext();

    const handleLogout = async () => {
        try {
            // Request to the server to clear the access token cookie
            const response = await axios.post("/api/auth/logout");

            if (response.status === 200) {
                // Redirect to login page
                await signOut();
                router.push(WILDFILE_ROUTES.LOGIN.url);

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
            console.error(error);
        }
    };

    return (
        <Box p={4} mb={4} shadow="sm">
            <Text mb={4}>
                Sign out everywhere else your account is being used, including
                all other browsers, phones, consoles, or any other devices.
            </Text>
            <Center>
                <Button
                    w="fit-content"
                    alignSelf={"center"}
                    _hover={{ bg: "gray.500" }}
                    border="1px solid white"
                    onClick={handleLogout}
                    color="white"
                >
                    Sign Out of All Other Sessions
                </Button>
            </Center>
        </Box>
    );
};

export default SignOutEverywhere;
