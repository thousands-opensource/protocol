// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICampaign {
    struct CampaignData {
        uint256 id; // unique id of the campaign
        bool isActive; // whether the campaign is active
        bool isEnded; // whether the campaign has ended
        address owner; // ex. Wildcard
        address operator; // ex. Thousands
        address token; // ex. USDC
        uint256 bountyAmount; // ex. 25k * 1e6
        uint256 amountUnlocked; // ex. 10k * 1e6
        uint256 amountDistributed; // ex. 5k * 1e6
        string name; // name of the campaign
        string conversionProofUrl; // proof of conversion for the campaign
        string distributionProofUrl; // proof of distribution for the campaign
        address[] corridors; // addresses of the corridors that will be used to distribute the tokens
    }

    // Owner (ex. Wildcard) creates a campaign and provides an operator (ex. Thousands), token bounty for the campaign, operator threshold, and name
    function createCampaign(address operator, address token, uint256 bountyAmount, string memory name)
        external
        returns (uint256);
    // Operator (ex. Thousands) activates the campaign and provides the corridors that will be used to distribute the tokens
    function activateCampaign(uint256 campaignId, address[] calldata corridors) external;
    // Owner (ex. Wildcard) unlocks part of the bounty for the operator to distribute
    function unlockBounty(uint256 campaignId, uint256 amountUnlocked, string memory proofUrl)
        external
        returns (uint256);
    // Owner (ex. Wildcard) sets the conversion proof url
    function setConversionProofUrl(uint256 campaignId, string memory proofUrl) external;
    // Operator sets the distribution proof url
    function setDistributionProofUrl(uint256 campaignId, string memory proofUrl) external;
    // Operator runs a distribution to pay out creators for the conversions that they influenced
    function runDistribution(
        uint256 campaignId,
        uint256[] calldata amounts,
        bytes[] calldata corridorData,
        string memory proofUrl
    ) external returns (uint256);
    // Operator ends the campaign. Any undistributed bounty will be refunded to the owner
    function endCampaign(uint256 campaignId) external;
    // User claims their portion of the bounty
    function claim(uint256 campaignId) external;

    function getCampaignData(uint256 campaignId) external view returns (CampaignData memory);
    function getClaimableAmount(uint256 campaignId, address user) external view returns (uint256);
}
