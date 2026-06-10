import { CheckboxIconProps, Icon } from "@chakra-ui/react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

export default function HeartIcon(props: CheckboxIconProps) {
    const { isChecked } = props;

    return isChecked ? (
        <Icon as={AiFillHeart} fontSize={["sm", "md"]} />
    ) : (
        <Icon as={AiOutlineHeart} color="black" fontSize={["sm", "md"]} />
    );
}
