import { MutableRefObject } from "react";
import { Grid, GridItem } from "@chakra-ui/react";
import { ICollectible } from "@repo/interfaces";
import Collectible from "../Collectible";

interface CollectibleListProps {
    collectibles: ICollectible[];
    openBuyModal: () => void;
    selectedCollectibleRef: MutableRefObject<string>;
}

const CollectibleList = ({
    collectibles,
    openBuyModal,
    selectedCollectibleRef,
}: CollectibleListProps) => {
    const renderCollectibleItem = (collectible: ICollectible) => {
        return (
            <GridItem
                key={collectible._id?.toString()}
                onClick={() => {
                    openBuyModal();
                    selectedCollectibleRef.current = collectible.name;
                }}
            >
                <Collectible collectible={collectible} />
            </GridItem>
        );
    };

    return (
        <Grid
            sx={{
                rowGap: [3, 3, 3, 5, 5],
                gridTemplateColumns: [
                    "repeat(auto-fit, 87px)",
                    "repeat(auto-fit, 105px)",
                    "repeat(auto-fit, 105px)",
                    "repeat(auto-fit, 125px)",
                    "repeat(auto-fit, 125px)",
                    "repeat(auto-fit, 125px)",
                ],
                width: "100%",
                justifyItems: "flex-start",
            }}
        >
            {collectibles.map((collectible: ICollectible) => {
                return renderCollectibleItem(collectible);
            })}
        </Grid>
    );
};
export default CollectibleList;
