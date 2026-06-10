import { SkyboxColor } from "@/store/useSkyboxStore";
import { SkyboxMember, SkyboxSlot } from "./types";

export const slotsData: SkyboxSlot[] = [
    {
        id: 1234,
        occupied: true,
        name: "Team-Alpha",
        color: "#8B5CF6",
        avatar: "/images/pfps/magiceden.png",
    },
    { id: 2345, name: "Team Alpha v2", occupied: false },
    { id: 3456, name: "Team Alpha v3", occupied: false },
    { id: 4567, name: "Team Alpha v4", occupied: false },
    { id: 5678, name: "Team Alpha v5", occupied: false },
];

export const DEFAULT_SKYBOX_COLOR: SkyboxColor = {
    id: 1,
    name: "gold",
    displayName: "Gold",
    color: "#F9C74F",
};

// Color options
export const colorOptions: SkyboxColor[] = [
    { id: 1, name: "gold", displayName: "Gold", color: "#F9C74F" },
    { id: 2, name: "orange", displayName: "Orange", color: "#F3722C" },
    { id: 3, name: "red", displayName: "Red", color: "#F94144" },
    { id: 4, name: "pink", displayName: "Pink", color: "#D95AA3" },
    { id: 5, name: "purple", displayName: "Purple", color: "#8B5CF6" },
    { id: 6, name: "blue", displayName: "Blue", color: "#4361EE" },
    { id: 7, name: "teal", displayName: "Teal", color: "#43AA8B" },
    { id: 8, name: "green", displayName: "Green", color: "#4CAF50" },
    { id: 9, name: "white", displayName: "White", color: "#FFFFFF" },
    { id: 10, name: "black", displayName: "Black", color: "#222222" },
];

export const colorNameToSkyboxColorMap: { [key: string]: SkyboxColor } = {
    gold: { id: 1, name: "gold", displayName: "Gold", color: "#F9C74F" },
    orange: { id: 2, name: "orange", displayName: "Orange", color: "#F3722C" },
    red: { id: 3, name: "red", displayName: "Red", color: "#F94144" },
    pink: { id: 4, name: "pink", displayName: "Pink", color: "#D95AA3" },
    purple: { id: 5, name: "purple", displayName: "Purple", color: "#8B5CF6" },
    blue: { id: 6, name: "blue", displayName: "Blue", color: "#4361EE" },
    teal: { id: 7, name: "teal", displayName: "Teal", color: "#43AA8B" },
    green: { id: 8, name: "green", displayName: "Green", color: "#4CAF50" },
    white: { id: 9, name: "white", displayName: "White", color: "#FFFFFF" },
    black: { id: 10, name: "black", displayName: "Black", color: "#222222" },
};

const skyboxMembers: SkyboxMember[] = [
    {
        id: 1,
        username: "Sampson",
        timestamp: "12:30 AM",
        message: "Sampson strted a Skybox!!!",
        avatar: "/images/pfps/azuki.jpg",
    },
    {
        id: 2,
        username: "CryptoKing",
        timestamp: "12:32 AM",
        message: "Welcome to the best Skybox on the platform!",
        avatar: "/images/pfps/blake.jpg",
    },
    {
        id: 3,
        username: "StreamQueen",
        timestamp: "12:35 AM",
        message: "Hey everyone! Excited to be here!",
        avatar: "/images/pfps/paytplaystalent.jpg",
    },
    {
        id: 4,
        username: "TechGuru",
        timestamp: "12:36 AM",
        message: "This stream is amazing, can't wait for more content",
        avatar: "/images/pfps/magiceden.png",
    },
    {
        id: 5,
        username: "Sampson",
        timestamp: "12:40 AM",
        message:
            "Thanks for joining! Make sure to boost the stream if you're enjoying it!",
        avatar: "/images/pfps/tytus.jpg",
    },
];
