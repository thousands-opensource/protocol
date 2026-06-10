import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Flex,
    Text,
    Box,
    VStack,
    List,
    ListItem,
} from "@chakra-ui/react";
import { Trophy, Coins, TrendingUp, BarChart2, Zap } from "lucide-react";
import { useState } from "react";

interface RallyInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RallyInfoModal({ open, onOpenChange }: RallyInfoModalProps) {
    return (
        <Modal
            isOpen={open}
            onClose={() => onOpenChange(false)}
            size="full"
            isCentered
        >
            <ModalOverlay />
            <ModalContent
                bg="#1f1f1f"
                color="white"
                maxH="100vh"
                h="100vh"
                display="flex"
                flexDirection="column"
                overflow="hidden"
                w="100%"
                maxW="100%"
                m={0}
                borderRadius={0}
            >
                <ModalHeader flexShrink={0}>
                    <Flex align="center" gap={2}>
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <Text fontSize="xl" fontWeight="bold">
                            Rallies v2 Guide
                        </Text>
                    </Flex>
                    <Text fontSize="sm" color="gray.300" mt={1}>
                        Learn how to participate in Rallies, score points, and
                        catch the Referees&apos; attention
                    </Text>
                </ModalHeader>

                <ModalBody
                    overflowY="auto"
                    css={{
                        "&::-webkit-scrollbar": {
                            width: "4px",
                        },
                        "&::-webkit-scrollbar-track": {
                            width: "6px",
                            background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            background: "#4A5568",
                            borderRadius: "24px",
                        },
                    }}
                >
                    <Tabs variant="enclosed" colorScheme="gray">
                        <TabList>
                            <Tab>Basics</Tab>
                            <Tab>Points</Tab>
                            <Tab>Strategy</Tab>
                            <Tab>Rally Levels</Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel>
                                <VStack spacing={4} align="stretch">
                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Flex gap={2} mb={2}>
                                            <Coins className="h-5 w-5 text-amber-500" />
                                            <Text
                                                fontSize="lg"
                                                fontWeight="medium"
                                            >
                                                What are Rallies?
                                            </Text>
                                        </Flex>
                                        <Text color="gray.300" mb={2}>
                                            Rallies v2 lets Wildcard fans
                                            interact with live Exhibition Series
                                            matches by choosing which team they
                                            believe will win—Red or Blue—and
                                            Rallying behind their pick using
                                            Credits.
                                        </Text>
                                        <Text color="gray.300">
                                            Each match starts a new Rally! At
                                            any point during the match, you can
                                            Rally behind Red or Blue with your
                                            Credits. Rallying sooner often means
                                            better Multipliers and higher
                                            potential point rewards.
                                        </Text>
                                    </Box>

                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="medium"
                                            mb={2}
                                        >
                                            How to Rally
                                        </Text>
                                        <List
                                            as="ol"
                                            styleType="decimal"
                                            spacing={2}
                                            color="gray.300"
                                            pl={4}
                                        >
                                            <ListItem>
                                                Enter the number of Credits you
                                                want to Rally
                                            </ListItem>
                                            <ListItem>
                                                Choose either the Red or Blue
                                                button to support that team
                                            </ListItem>
                                            <ListItem>
                                                Confirm your rally when prompted
                                            </ListItem>
                                            <ListItem>
                                                Watch the match and see if your
                                                team wins!
                                            </ListItem>
                                        </List>
                                    </Box>

                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="medium"
                                            mb={2}
                                        >
                                            Multipliers
                                        </Text>
                                        <Text color="gray.300" mb={2}>
                                            Each team&apos;s button displays a
                                            Multiplier value:
                                        </Text>
                                        <List spacing={1} color="gray.300">
                                            <ListItem>
                                                <Text
                                                    as="span"
                                                    fontWeight="medium"
                                                    color="white"
                                                >
                                                    Multiplier:
                                                </Text>{" "}
                                                Shows how your Credits will be
                                                boosted when calculating Bonus
                                                Points if your team wins
                                            </ListItem>
                                        </List>
                                        <Text color="gray.300" mt={2}>
                                            Rallying earlier or for the team
                                            with fewer Credits gives you greater
                                            upside potential (higher Multiplier)
                                            - a chance to score more Bonus
                                            Points if that team wins!
                                        </Text>
                                    </Box>

                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="medium"
                                            mb={2}
                                        >
                                            Referees & Rewards
                                        </Text>
                                        <Text color="gray.300" mb={2}>
                                            The Referees distribute rewards
                                            based on your participation.
                                            Rallying is currently one of the
                                            strongest signals they watch for.
                                        </Text>
                                        <Text color="gray.300">
                                            The more you engage through Rallies,
                                            the more likely you are to catch the
                                            Referees&apos; attention and receive
                                            rewards.
                                        </Text>
                                    </Box>
                                </VStack>
                            </TabPanel>

                            <TabPanel>
                                <VStack spacing={4} align="stretch">
                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Flex gap={2} mb={2}>
                                            <Trophy className="h-5 w-5 text-yellow-500" />
                                            <Text
                                                fontSize="lg"
                                                fontWeight="medium"
                                            >
                                                How Points Work
                                            </Text>
                                        </Flex>
                                        <Text color="gray.300" mb={2}>
                                            Points are scored at the end of each
                                            match. There are two types of
                                            points:
                                        </Text>
                                        <List spacing={2} color="gray.300">
                                            <ListItem>
                                                <Text
                                                    as="span"
                                                    fontWeight="medium"
                                                    color="white"
                                                >
                                                    Baseline Points:
                                                </Text>{" "}
                                                Everyone who rallies scores
                                                Baseline Points, no matter which
                                                team you Rally for. The more
                                                Credits you Rally, the more
                                                Baseline Points you score.
                                            </ListItem>
                                            <ListItem>
                                                <Text
                                                    as="span"
                                                    fontWeight="medium"
                                                    color="white"
                                                >
                                                    Bonus Points:
                                                </Text>{" "}
                                                Only fans who rallied for the
                                                winning team score Bonus Points,
                                                based on their Credits and the
                                                Multiplier they locked in when
                                                rallying.
                                            </ListItem>
                                        </List>
                                    </Box>

                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="medium"
                                            mb={2}
                                        >
                                            Points Formula
                                        </Text>
                                        <Text color="gray.300" mb={2}>
                                            For losing rallies:{" "}
                                            <Text
                                                as="span"
                                                fontWeight="medium"
                                                color="white"
                                            >
                                                Points = Credits
                                            </Text>
                                        </Text>
                                        <Text color="gray.300" mb={2}>
                                            For winning rallies:{" "}
                                            <Text
                                                as="span"
                                                fontWeight="medium"
                                                color="white"
                                            >
                                                Points = Credits + Bonus Points
                                            </Text>
                                        </Text>
                                        <Text color="gray.300">
                                            Bonus Points are distributed
                                            proportionally to Winning Rallies,
                                            based on the amount of Credits and
                                            the Multiplier of each Winning
                                            Rally. The earlier you Rally, the
                                            better Multiplier you can secure,
                                            leading to more Points.
                                        </Text>
                                    </Box>
                                </VStack>
                            </TabPanel>

                            <TabPanel>
                                <VStack spacing={4} align="stretch">
                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Flex gap={2} mb={2}>
                                            <TrendingUp className="h-5 w-5 text-green-500" />
                                            <Text
                                                fontSize="lg"
                                                fontWeight="medium"
                                            >
                                                Rally Strategies
                                            </Text>
                                        </Flex>
                                        <List spacing={2} color="gray.300">
                                            <ListItem>
                                                <Text
                                                    as="span"
                                                    fontWeight="medium"
                                                    color="white"
                                                >
                                                    Favorite Strategy:
                                                </Text>{" "}
                                                Rally on the team with more
                                                Credits (lower Multiplier). This
                                                has a higher chance of winning
                                                but fewer Bonus Points.
                                            </ListItem>
                                            <ListItem>
                                                <Text
                                                    as="span"
                                                    fontWeight="medium"
                                                    color="white"
                                                >
                                                    Underdog Strategy:
                                                </Text>{" "}
                                                Rally on the team with fewer
                                                Credits (higher Multiplier).
                                                This has a lower chance of
                                                winning but more Bonus Points.
                                            </ListItem>
                                            <ListItem>
                                                <Text
                                                    as="span"
                                                    fontWeight="medium"
                                                    color="white"
                                                >
                                                    Timing Strategy:
                                                </Text>{" "}
                                                Rally early to get better
                                                Multipliers before others join
                                                in.
                                            </ListItem>
                                        </List>
                                    </Box>

                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="medium"
                                            mb={2}
                                        >
                                            Tips & Tricks
                                        </Text>
                                        <List spacing={2} color="gray.300">
                                            <ListItem>
                                                Pay attention to the game — can
                                                you read the field and predict
                                                what will happen next?
                                            </ListItem>
                                            <ListItem>
                                                Watch the match closely to see
                                                which team is currently in the
                                                lead
                                            </ListItem>
                                            <ListItem>
                                                Look at the percentage chart to
                                                see trends in which team is
                                                gaining support
                                            </ListItem>
                                            <ListItem>
                                                This isn&apos;t about guessing
                                                before kickoff — it&apos;s about
                                                watching closely and making
                                                smart, timely decisions as the
                                                match unfolds
                                            </ListItem>
                                            <ListItem>
                                                Remember: All rallies are
                                                valuable. You&apos;re showing
                                                your support and scoring points
                                                regardless of which team you
                                                rally for
                                            </ListItem>
                                        </List>
                                    </Box>

                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="medium"
                                            mb={2}
                                        >
                                            Beyond Rallies
                                        </Text>
                                        <Text color="gray.300" mb={2}>
                                            Did you know? Adding Wildcard to
                                            your Steam wishlist helps unlock
                                            additional rewards for the entire
                                            community.
                                        </Text>
                                        <Text color="gray.300">
                                            Every wishlist milestone reached
                                            unlocks larger reward pools, which
                                            are distributed during Wildcard
                                            events. The more wishlists, the more
                                            rewards for everyone!
                                        </Text>
                                    </Box>
                                </VStack>
                            </TabPanel>

                            <TabPanel>
                                <VStack spacing={4} align="stretch">
                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Flex gap={2} mb={2}>
                                            <BarChart2 className="h-5 w-5 text-purple-500" />
                                            <Text
                                                fontSize="lg"
                                                fontWeight="medium"
                                            >
                                                Rally Levels Explained
                                            </Text>
                                        </Flex>
                                        <Text color="gray.300" mb={2}>
                                            Every time someone rallies, it fills
                                            a global Rally Level meter that is
                                            shared across all fans in the arena.
                                            The more people rally, the higher
                                            the Rally Level goes up for
                                            everyone.
                                        </Text>
                                        <Text color="gray.300">
                                            The progress bar at the top of the
                                            chart shows the current Rally Level
                                            and progress toward the next level.
                                            We win together — everyone benefits
                                            from a higher Rally Level!
                                        </Text>
                                    </Box>

                                    <Box bg="gray.700" p={4} borderRadius="lg">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="medium"
                                            mb={2}
                                        >
                                            Level Benefits
                                        </Text>
                                        <Text color="gray.300" mb={2}>
                                            Rally Level determines the amount of
                                            Bonus Points available for winning
                                            Rallies. As the Level increases, the
                                            size of the Bonus Pool increases for
                                            everyone:
                                        </Text>
                                        <List spacing={1} color="gray.300">
                                            <ListItem>
                                                Level 1: Basic bonus pool
                                            </ListItem>
                                            <ListItem>
                                                Level 5: 5× the basic bonus pool
                                            </ListItem>
                                            <ListItem>
                                                Level 10 (MAX): 10× the basic
                                                bonus pool
                                            </ListItem>
                                        </List>
                                        <Text color="gray.300" mt={2}>
                                            Reaching MAX level means the maximum
                                            possible Bonus Points are available
                                            to win! This is a community effort —
                                            the more people participate, the
                                            larger the bonus pool is for
                                            everyone.
                                        </Text>
                                    </Box>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>

                <ModalFooter
                    flexShrink={0}
                    borderTop="1px solid"
                    borderColor="gray.700"
                    py={3}
                    px={6}
                    mt={4}
                >
                    <Button
                        onClick={() => onOpenChange(false)}
                        size="md"
                        minW="100px"
                    >
                        Got it
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
