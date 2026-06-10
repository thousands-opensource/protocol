import { Link, Image, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IIdentity } from "@repo/interfaces";
import axiosAuthClientInstance, {
    CustomAxiosRequestConfig,
} from "@/lib/axiosAuthClientInstance";

const IdentityTable = () => {
    const [identities, setIdentities] = useState<IIdentity[]>([]);
    const [loading, setLoading] = useState(true);

    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    useEffect(() => {
        const fetchIdentities = async () => {
            try {
                setLoading(true);

                const response = await axiosAuthClientInstance.post(
                    "/api/identities/fetchIdentities",
                    {},
                    { showLoading: true } as CustomAxiosRequestConfig
                );
                
                if (response.status === 200) {
                    setIdentities(response.data?.claimedTicket);
                } else {
                    console.error("Error fetching identities");
                }

                setIdentities(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching identities:", error);
            }
            setLoading(false);
        };

        fetchIdentities();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Table variant="simple" bg={bgColor} borderColor={borderColor}>
            <Thead>
                <Tr>
                    <Th>Identity Name</Th>
                    <Th>Type</Th>
                    <Th>Role</Th>
                    <Th>Talent?</Th>
                    <Th>PFP Image</Th>
                    <Th>Start Date</Th>
                    <Th>End Date</Th>
                </Tr>
            </Thead>
            <Tbody>
                {identities.map((identity) => (
                    <Tr key={identity._id?.toString() || identity.identityName}>
                        <Td><Link href={`${identity._id?.toString() ?? ""}`}>{identity.identityName}</Link></Td>
                        <Td>{identity.identityType}</Td>
                        <Td>{identity.identityRole}</Td>
                        <Td>{identity.showAsTalent ? "Yes" : "No"}</Td>
                        <Td>
                            {identity.identityPfpImageUrl ? (
                                <Image 
                                    src={identity.identityPfpImageUrl} 
                                    alt={identity.identityName} 
                                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                                />
                            ) : 'No Image'}
                        </Td>
                        <Td>{new Date(identity.startDate).toLocaleDateString()}</Td>
                        <Td>{identity.endDate ? new Date(identity.endDate).toLocaleDateString() : 'N/A'}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

export default IdentityTable;

