import { MutableRefObject } from "react";
import { Flex } from "@chakra-ui/react";
import CollectibleList from "./CollectibleList";
import { ICollectible } from "@repo/interfaces";

interface CollectibleStoreProps {
    collectibles: ICollectible[];
    openBuyModal: () => void;
    selectedCollectibleRef: MutableRefObject<string>;
}

const CollectibleStore = ({
    collectibles,
    openBuyModal,
    selectedCollectibleRef,
}: CollectibleStoreProps) => {
    return (
        <Flex
            sx={{
                flexDirection: "row",
                alignItems: "flex-start",
                overflow: "auto",
                flexWrap: "wrap",
                columnGap: 8,
                rowGap: 10,
                width: "100%",
                height: "100%",
            }}
        >
            <CollectibleList
                collectibles={collectibles}
                openBuyModal={openBuyModal}
                selectedCollectibleRef={selectedCollectibleRef}
            />
        </Flex>
    );
};
export default CollectibleStore;
