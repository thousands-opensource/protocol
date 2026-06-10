// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICorridor {
    /**
     * @notice Runs the corridor for a given campaign and amount.
     * @param campaignId The ID of the campaign.
     * @param amount The amount of tokens the corridor has to work with
     * @param data Any additional data the corridor needs to run
     * @return recipients The recipients of the distribution
     * @return amounts The amount to distribute to each recipient
     * The sum of the amounts returned must be equal to the amount parameter
     */
    function runCorridor(uint256 campaignId, uint256 amount, bytes calldata data)
        external
        returns (address[] memory recipients, uint256[] memory amounts);
}
