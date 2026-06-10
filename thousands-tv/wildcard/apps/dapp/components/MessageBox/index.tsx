import { Card, Text, CardProps, TextProps } from "@chakra-ui/react";

export interface MessageBoxProps {
    text: string;
    containerProps?: CardProps;
    textProps?: TextProps;
}

/**
 *
 * MessageBox component to display a message.
 */
export function MessageBox(props: MessageBoxProps) {
    const { text, containerProps, textProps } = props;

    return (
        <Card
            minH="400px"
            display="grid"
            placeItems="center"
            {...containerProps}
        >
            <Text fontWeight="bold" {...textProps}>
                {text}
            </Text>
        </Card>
    );
}
