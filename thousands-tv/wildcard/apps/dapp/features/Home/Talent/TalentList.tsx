import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IdentityDoc } from "@repo/schemas";
import TalentAvatar from "@/features/Event/EventsSeries/TalentAvatar";

interface TalentListProps {
  identities: IdentityDoc[];
}

export const TalentList = ({ identities }: TalentListProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
      }}
    >
      {identities.map((identity) => (
        <Box
          key={identity._id?.toString()}
          sx={{
            mr: "16px",
            mb: "16px",
          }}
        >
          <TalentAvatar
            avatarImageUrl={identity.identityPfpImageUrl}
            displayName={identity.identityName}
            role={identity.identityRole}
          />
        </Box>
      ))}
    </Box>
  );
};

export default TalentList;
