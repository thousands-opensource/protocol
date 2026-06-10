import { Button, ButtonProps } from "@chakra-ui/react";
import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import { getBlockExplorerTxUrl } from "@/utils/blockchainUtil";
import { buttonSize, gilroyBold } from "@/utils/themeUtil";
import PolygonIcon from "@/public/images/polygon-logo.svg";

// Interface for view wildevent button
interface ViewWildeventButtonProps extends ButtonProps {
    txnHash?: string;
}

/**
 * Renders view wildevent button link
 * @param txnHash - hash url to point to
 * @returns JSX
 */
const ViewWildeventButton: React.FC<ViewWildeventButtonProps> = ({
    txnHash,
    ...rest
}) => {
    const txnUrl = getBlockExplorerTxUrl(txnHash);
    return (
        <Button
            as="a"
            target="_blank"
            className={gilroyBold.className}
            size={buttonSize}
            border={"1px"}
            variant="ghost"
            _hover={{ opacity: 0.8 }}
            borderRadius={"md"}
            fontSize={"sm"}
            rel="noopener noreferrer"
            href={txnUrl}
            rightIcon={
                <ChakraNextImageSimple
                    src={PolygonIcon.src}
                    alt="polygon logo"
                    width={4}
                    height={4}
                />
            }
            {...rest}
        >
            View Wildevent
        </Button>
    );
};

export default ViewWildeventButton;
