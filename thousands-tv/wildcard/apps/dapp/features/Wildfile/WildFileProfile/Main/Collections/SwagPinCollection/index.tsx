import { Wrap } from "@chakra-ui/react";
import SwagPinCard from "../../SwagPinCard";
import AddToCollectionButton from "../../AddToCollectionButton";
import { MAGIC_EDEN_WILDCARD_SWAG_LINK } from "@/constants/constants";
import { OwnedNft } from "alchemy-sdk";
import * as styles from "../styles";

interface SwagPinCollectionProps {
    swagPins: OwnedNft[];
}

const SwagPinCollection: React.FC<SwagPinCollectionProps> = ({ swagPins }) => {
    return (
        <Wrap id={"swag-pin-container"} sx={styles.WrapSx} justify={"start"}>
            {swagPins.map((swagPin) => {
                return (
                    <SwagPinCard
                        key={swagPin.tokenId}
                        imageUrl={swagPin.image.originalUrl || ""}
                        balanceStr={swagPin.balance}
                    />
                );
            })}
            <AddToCollectionButton
                id={"ga-profile-button-swag-collection"}
                aria-label="add-swag-pin"
                url={MAGIC_EDEN_WILDCARD_SWAG_LINK}
            />
        </Wrap>
    );
};

export default SwagPinCollection;
