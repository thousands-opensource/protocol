"use client";

import { Button, HStack } from "@chakra-ui/react";
import { FC } from "react";
import { useRouter } from "next/navigation";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { signOut } from "next-auth/react";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

interface IAuthButtonProps {}

/**
 * React component that displays the authentication button.
 */
const AuthButton: FC<IAuthButtonProps> = ({}: IAuthButtonProps) => {
    const { isLoggedIn, userDB } = useWildfileUserContext();
    const router = useRouter();

    const onOpenSigning = () => {
        router.push("/login");
    };

    /**
     * Render the authentication button.
     */
    const renderAuthButton = () => {
        if (userDB) {
            return (
                <HStack alignItems={"center"} justifyContent={"center"}>
                    <Button
                        variant="outline"
                        color="white"
                        borderRadius="full"
                        onClick={() => {
                            signOut();
                        }}
                        fontSize="lg"
                    >
                        Sign Out
                    </Button>
                </HStack>
            );
        }
        if (!isLoggedIn) {
            return;
        }
        return (
            <>
                <Button
                    size="sm"
                    borderRadius="md"
                    variant={"outline"}
                    onClick={() => {
                        router.push(WILDFILE_ROUTES.SERVER.WILDFILE.BASE.url);
                    }}
                >
                    View Thousands Account
                </Button>

                <Button
                    size="sm"
                    borderRadius="md"
                    variant={"outline"}
                    onClick={() => {
                        signOut();
                    }}
                >
                    Logout
                </Button>
            </>
        );
    };

    return renderAuthButton();
};
export default AuthButton;
