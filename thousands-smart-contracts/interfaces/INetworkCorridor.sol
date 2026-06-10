// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface INetworkCorridor {
    /**
     * @notice Runs the network corridor for a given campaign.
     * @param campaignId The ID of the campaign.
     * @return feeRecipient The recipient of the fee
     * @return feeBps The fee percentage in basis points
     */
    function runNetworkCorridor(uint256 campaignId) external returns (address feeRecipient, uint256 feeBps);
}
