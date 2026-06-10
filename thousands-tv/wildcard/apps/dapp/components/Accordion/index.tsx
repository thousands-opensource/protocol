import { Accordion as ChakraAccordion, AccordionItem } from "@chakra-ui/react";

export interface AccordionProps {
    children: React.ReactNode;
}

const Accordion = ({ children }: AccordionProps) => {
    return (
        <ChakraAccordion defaultIndex={[0]} mt={[3, 3, 3, 0]} allowMultiple>
            <AccordionItem borderStyle={"none"}>{children}</AccordionItem>
        </ChakraAccordion>
    );
};
export default Accordion;
