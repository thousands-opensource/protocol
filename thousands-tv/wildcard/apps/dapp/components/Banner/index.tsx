import { Center, Text } from "@chakra-ui/react";

export interface BannerProps {
    message: string;
}

/**
 * React component that displays a banner with a message.
 */
export function Banner({ message }: BannerProps) {
    return (
        <>
            <Center bg="blackAlpha.700" p={[4, 4, 2, 2, 2]}>
                <Text
                    size={{
                        base: "sm",
                        md: "sm",
                    }}
                    ml="4"
                    color="white"
                >
                    {message}
                </Text>
            </Center>
        </>
    );
}
