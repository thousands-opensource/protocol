import {
    BASE64,
    BASE64_DATA_IMAGE_FORMAT,
    IPFS,
    IPFS_BASE_URL,
    UTF8_DATA_IMAGE_FORMAT,
} from "@/constants/constants";
import { PfpCollection } from "@repo/interfaces";
import { Network, OwnedNft } from "alchemy-sdk";

export const supportedPfpCollections: PfpCollection[] = [
    {
        collectionName: "Bored Ape Yacht Club",
        contractAddress: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Crypto Punks",
        contractAddress: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Azuki",
        contractAddress: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Invisible Friends",
        contractAddress: "0x59468516a8259058baD1cA5F8f4BFF190d30E066",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "CyberKongz",
        contractAddress: "0x57a204AA1042f6E66DD7730813f4024114d74f37",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Meebits",
        contractAddress: "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Moonbirds",
        contractAddress: "0x23581767a106ae21c074b2276D25e5C3e136a68b",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Azuki Elementals",
        contractAddress: "0xB6a37b5d14D502c3Ab0Ae6f3a0E058BC9517786e",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Clone X",
        contractAddress: "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "VeeFriends",
        contractAddress: "0xa3AEe8BcE55BEeA1951EF834b99f3Ac60d1ABeeB",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "The PotatoZ",
        contractAddress: "0x39ee2c7b3cb80254225884ca001F57118C8f21B6",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Bored Ape Kennel Club",
        contractAddress: "0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "DigiDaigaku Genesis",
        contractAddress: "0xd1258DB6Ac08eB0e625B75b371C023dA478E94A9",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Otherside Koda",
        contractAddress: "0xE012Baf811CF9c05c408e879C399960D1f305903",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "The Captainz",
        contractAddress: "0x769272677faB02575E84945F03Eca517ACc544Cc",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Mutant Ape Yacht Club",
        contractAddress: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Nouns",
        contractAddress: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Pudgy Penguins",
        contractAddress: "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "DeGods",
        contractAddress: "0x8821BeE2ba0dF28761AffF119D66390D594CD280",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Azuki Elemental Beans",
        contractAddress: "0x3Af2A97414d1101E2107a70E7F33955da1346305",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "0N1 Force",
        contractAddress: "0x3bf2922f4520a8BA0c2eFC3D2a1539678DaD5e9D",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Killabears",
        contractAddress: "0xc99c679c50033bbc5321eb88752e89a93e9e83c5",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Fluf World",
        contractAddress: "0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Kanpai Pandas",
        contractAddress: "0xaCF63E56fd08970b43401492a02F6F38B6635C91",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Mers",
        contractAddress: "0x79FCDEF22feeD20eDDacbB2587640e45491b757f",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "My Pet Hooligan",
        contractAddress: "0x09233d553058c2F42ba751C87816a8E9FaE7Ef10",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Cool Cats",
        contractAddress: "0x1A92f7381B9F03921564a437210bB9396471050C",
        network: Network.ETH_MAINNET,
    },

    {
        collectionName: "Sappy Seals",
        contractAddress: "0x364C828eE171616a39897688A831c2499aD972ec",
        network: Network.ETH_MAINNET,
    },

    {
        collectionName: "Azuki Beanz",
        contractAddress: "0x306b1ea3ecdf94aB739F1910bbda052Ed4A9f949",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "A Kid Called Beast",
        contractAddress: "0x77372a4cc66063575b05b44481F059BE356964A4",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Valhalla",
        contractAddress: "0x231d3559aa848Bf10366fB9868590F01d34bF240",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Renga",
        contractAddress: "0x394e3d3044fc89fcdd966d3cb35ac0b32b0cda91",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Lil Pudgys",
        contractAddress: "0x524cAB2ec69124574082676e6F654a18df49A048",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Parallel Avatars",
        contractAddress: "0x0fc3dd8c37880a297166bed57759974a157f0e74",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "World of Women Galaxy",
        contractAddress: "0xf61f24c2d93bf2de187546b14425bf631f28d6dc",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Shrapnel Operators Collection",
        contractAddress: "0xfc8a98c22a9e32948ab028414d67c62c49b16864",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Azra Games - The Hopeful",
        contractAddress: "0xc4973de5ee925b8219f1e74559fb217a8e355ecf",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Doodles",
        contractAddress: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "World of Women",
        contractAddress: "0xe785e82358879f061bc3dcac6f0444462d4b5330",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Ethlizards Genesis",
        contractAddress: "0xf96ef26f3ab9dbd167578cc2bee5395cf669261e",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Ethlizards",
        contractAddress: "0x7f312a75b62846033bc5471c5bcb94b1abfaf06d",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Overworld Incarna",
        contractAddress: "0xfdf5acd92840e796955736b1bb9cc832740744ba",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Skyborne Immortals",
        contractAddress: "0x963590fabdc1333d03bc3af42a6b2ab33e21e2ee",
        network: Network.ETH_MAINNET,
    },
    {
        collectionName: "Wolves DAO",
        contractAddress: "0x0433882c60ada1077a9f652ca2d1d36422c62c6c",
        network: Network.MATIC_MAINNET,
    },
];

/**
 * Returns the supported pfp collection given a contract address
 * @param contractAddress
 */
export function getPfpCollection(
    contractAddress: string
): PfpCollection | undefined {
    return supportedPfpCollections.find(
        (collection) =>
            collection.contractAddress.toLowerCase() ===
            contractAddress.toLowerCase()
    );
}

/**
 * Returns whether the given contract address is for a supported pfp collection
 * @param contractAddress
 */
export function isSupportedPfpCollection(contractAddress: string): boolean {
    const collection = getPfpCollection(contractAddress);
    return !!collection;
}

/**
 * Returns the chainId given a nft contract's address
 * @param contractAddress
 */
export function getPfpCollectionChainId(contractAddress: string) {
    let chainId = 0;
    const collection = getPfpCollection(contractAddress);
    if (!collection) {
        console.error(
            `Unknown nft collection with contract address: ${contractAddress}`
        );
        return chainId;
    }

    if (collection) {
        switch (collection.network) {
            case Network.ETH_MAINNET:
                chainId = 1;
                break;
            case Network.MATIC_MAINNET:
                chainId = 137;
                break;
            default:
                console.error(
                    `Unknown network for contract ${contractAddress}: ${collection.network}`
                );
        }
    }

    return chainId;
}

/**
 * Parse image url depending on the protocol
 * @param image - the URL to the image of the NFT
 * @returns image url
 */
export const parseImageUrl = (image: string) => {
    let imageUrl = "";
    const url = image.split("://");
    const protcol = url[0];

    switch (protcol) {
        case IPFS:
            const pathname = url[1];
            const containsIpfs = pathname.indexOf(IPFS) > -1;
            if (containsIpfs) {
                imageUrl = `${IPFS_BASE_URL}/${url[1]}`;
            } else {
                imageUrl = `${IPFS_BASE_URL}/${IPFS}/${url[1]}`;
            }
            return imageUrl;
        default:
            imageUrl = image;
            return imageUrl;
    }
};

/**
 * Gets base 64 image data format
 * @param image - the URL to the image of the NFT
 * @returns base64 data image format
 */
export const getBase64Image = (image: string) => {
    const imageData = image.split(UTF8_DATA_IMAGE_FORMAT);
    const svgString = imageData[1];
    const base64EncodedSvg = Buffer.from(svgString).toString(BASE64);
    return `${BASE64_DATA_IMAGE_FORMAT}${base64EncodedSvg}`;
};

/**
 * Determine whether image contains utf8 data image format
 * @param image - the URL to the image of the NFT
 * @returns true or false if it is utf8 data image format
 */
export const isUTF8DataImageFormat = (image: string) => {
    return image.indexOf(UTF8_DATA_IMAGE_FORMAT) > -1;
};

/**
 * Get image url
 * @param pfp - Pfp metadata
 * @returns image url
 */
export const getImageUrl = (pfp: OwnedNft) => {
    if (pfp.image && pfp.image.originalUrl) {
        const image = pfp.image.originalUrl;
        const isDataImageFormat = isUTF8DataImageFormat(image);
        if (isDataImageFormat) {
            return getBase64Image(image);
        }

        return parseImageUrl(image);
    }

    return "";
};
