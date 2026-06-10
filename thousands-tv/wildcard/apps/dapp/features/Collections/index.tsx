import { poppinsBold, poppinsMedium } from "@/utils/themeUtil";
import { Flex, Box, Image, Text, Link } from "@chakra-ui/react";

const Collections = () => {
    const championsMagicEdenLink = "https://magiceden.us/collections/polygon/0x305a9d605455844ad3779204fddc0b41d6dc1788";
    const summonsMagicEdenLink = "https://magiceden.us/collections/polygon/0x305a9d605455844ad3779204fddc0b41d6dc1788";

    return (
        <Flex
            id="collections-section"
            sx={{
                flexDirection: ["column"],
                height: ["760px", "760px", "200px", "200px", "200px"],
                width: ["100%", "280px", "100%", "100%", "960px"],
                mt: "0px",
            }}
        >
            <Flex
                sx={{
                    flexDirection: ["row"],
                }}
            >
                <Text
                    className={poppinsBold.className}
                    sx={{
                        fontSize: "16px",
                        mr: "20px",
                    }}
                >
                    Alpha Series Champions
                </Text>
                <Text
                    className={poppinsMedium.className}
                    sx={{
                        fontSize: "8px",
                        mt: "10px",
                        mr: "20px",
                        color: "#999",
                    }}
                >
                    Visit Magic Eden to view the collection
                </Text>
                <Box
                    sx={{
                        mt: "3px",
                    }}
                >
                    <Link target="_blank" href={championsMagicEdenLink}>
                        <Image                    
                            src="/images/magiceden.webp" alt="Magic Eden"
                        />
                    </Link>
                </Box>
            </Flex>
            <Box
                sx={{
                    pt: "8px",
                    pb: "8px",
                    borderRadius: "16px"
                }}
            >
                <Link target="_blank" href={championsMagicEdenLink}>
                    <Image
                        sx={{
                            width: "100%",
                            borderRadius: "16px",
                            borderColor: "#0000ff",
                            borderWidth: "2px",
                            borderStyle: "solid",
                        }}
                        src="/images/champions.png"
                        alt="Champions"
                    />
                </Link>
            </Box>
            <Box
                sx={{
                    pt: "12px",
                    pb: "40px",
                }}
            >
                <Text
                    className={poppinsMedium.className}
                    sx={{
                        fontSize: "12px",
                        color: "#999",
                    }}
                >
                    <Text as="span" sx={{ color: "white" }}>Alphas Series Champion</Text> description text.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.
                </Text>
            </Box>


            <Flex
                sx={{
                    flexDirection: ["row"],
                }}
            >
                <Text
                    className={poppinsBold.className}
                    sx={{
                        fontSize: "16px",
                        mr: "20px",
                    }}
                >
                    Alpha Series Summons
                </Text>
                <Text
                    className={poppinsMedium.className}
                    sx={{
                        fontSize: "8px",
                        mt: "10px",
                        mr: "20px",
                        color: "#999",
                    }}
                >
                    Visit Magic Eden to view the collection
                </Text>
                <Box
                    sx={{
                        mt: "3px",
                    }}
                >
                    <Link target="_blank" href={summonsMagicEdenLink}>
                        <Image
                            src="/images/magiceden.webp" alt="Magic Eden"
                        />
                    </Link>
                </Box>
            </Flex>
            <Box
                sx={{
                    pt: "8px",
                    pb: "8px",
                }}
            >
                <Link target="_blank" href={summonsMagicEdenLink}>
                    <Image
                        sx={{
                            width: "100%",
                            borderRadius: "16px",
                            borderColor: "#ff8822",
                            borderWidth: "2px",
                            borderStyle: "solid",
                        }}
                        src="/images/summons.png"
                        alt="Summons"
                    />
                </Link>
            </Box>
            <Box
                sx={{
                    pt: "12px",
                    pb: "40px",
                }}
            >
                <Text
                    className={poppinsMedium.className}
                    sx={{
                        fontSize: "12px",
                        color: "#999",
                    }}
                >
                    <Text as="span" sx={{ color: "white" }}>Alphas Series Summons</Text> description text.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.  We need some description text for this area.
                </Text>
            </Box>
        </Flex>
    );
}

export default Collections;