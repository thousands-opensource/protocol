// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICorridor} from "../interfaces/ICorridor.sol";

contract DefaultCorridor is ICorridor {
    error NotCampaign();
    error InvalidData();
    error InvalidAmount();

    address public immutable campaign;
    address public immutable operator;
    uint256 public immutable operatorFeeBps;

    constructor(address _campaign, address _operator, uint256 _operatorFeeBps) {
        campaign = _campaign;
        operator = _operator;
        operatorFeeBps = _operatorFeeBps;
    }

    function runCorridor(uint256, uint256 amount, bytes calldata data)
        external
        view
        override
        onlyCampaign
        returns (address[] memory, uint256[] memory)
    {
        // Decode the data into recipients and amounts arrays
        (address[] memory recipientsData, uint256[] memory amountsData) = abi.decode(data, (address[], uint256[]));
        if (recipientsData.length != amountsData.length) {
            revert InvalidData();
        }

        // one additional recipient, which is the operator
        address[] memory recipients = new address[](recipientsData.length + 1);
        // one additional amount, which is the operator fee
        uint256[] memory amounts = new uint256[](amountsData.length + 1);

        uint256 operatorFeeTotal = 0;
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipientsData.length; ++i) {
            uint256 recipientAmount = amountsData[i];
            totalAmount += recipientAmount;
            // take the operator fee from the amount
            uint256 operatorFee = (recipientAmount * operatorFeeBps) / 10_000;
            recipientAmount -= operatorFee;
            operatorFeeTotal += operatorFee;
            recipients[i] = recipientsData[i];
            amounts[i] = recipientAmount;
        }

        if (totalAmount != amount) {
            revert InvalidAmount();
        }

        recipients[recipientsData.length] = operator;
        amounts[amountsData.length] = operatorFeeTotal;
        return (recipients, amounts);
    }

    modifier onlyCampaign() {
        if (msg.sender != campaign) {
            revert NotCampaign();
        }
        _;
    }
}
