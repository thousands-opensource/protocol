import { Button, ButtonProps, Tooltip } from "@chakra-ui/react";
import { FaTwitter } from "react-icons/fa";

interface TweetButtonProps extends ButtonProps {
    tweetUrl: string;
}

const TweetButton: React.FC<TweetButtonProps> = ({ tweetUrl, ...rest }) => {
    const handleTweet = () => {
        // Open the Twitter intent window to compose a tweet
        if (rest.disabled) return;
        window.open(tweetUrl, "_blank");
    };

    const toolTipMsg = rest.disabled
        ? "Link your Twitter account first to tweet about your selection!"
        : "";

    return (
        <Tooltip label={toolTipMsg}>
            <Button
                leftIcon={<FaTwitter />}
                colorScheme="twitter"
                color="white"
                variant="fill"
                size={"sm"}
                {...rest}
                bgColor="twitter.600"
                lineHeight={"12px"}
                py={"8px"}
                h="fit-content"
                onClick={handleTweet}
                _hover={{ opacity: 0.8 }}
            >
                Tweet
            </Button>
        </Tooltip>
    );
};

export default TweetButton;
