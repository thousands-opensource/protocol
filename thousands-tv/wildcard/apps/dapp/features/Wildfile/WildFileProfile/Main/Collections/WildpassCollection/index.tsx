import { Box, Wrap } from "@chakra-ui/react";
import React, { useContext } from "react";
import WildcardPass from "../../Wildpass";
import { getColorAmountForWildpasses } from "@/utils/util";
import AddToCollectionButton from "../../AddToCollectionButton";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { MAGIC_EDEN_WILDPASS_LINK } from "@/constants/constants";
import * as styles from "../styles";

const WildpassCollection: React.FC = () => {
    const { wildpasses } = useContext(ProfileContext);

    // create object containing info on amount of each wildpass color
    const wildpassesColorAmounts = getColorAmountForWildpasses(wildpasses);
    return (
        <Wrap sx={styles.WrapSx} justify={"start"}>
            {Object.entries(wildpassesColorAmounts).map(
                ([color, amount], index) => {
                    return (
                        <Box key={color} mr={index == 0 ? "0" : "14px"}>
                            <WildcardPass color={color} amount={amount} />
                        </Box>
                    );
                }
            )}
            <AddToCollectionButton
                id={"ga-profile-button-wildpass-collection"}
                aria-label="add-to-collection"
                url={MAGIC_EDEN_WILDPASS_LINK}
            />
        </Wrap>
    );
};

export default WildpassCollection;
