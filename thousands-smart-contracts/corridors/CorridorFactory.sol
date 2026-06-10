// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {DefaultCorridor} from "./DefaultCorridor.sol";

contract CorridorFactory {
    event CorridorCreated(
        address indexed corridor, address indexed campaign, address indexed operator, uint256 operatorFeeBps
    );

    function deployDefaultCorridor(address campaign, address operator, uint256 operatorFeeBps)
        external
        returns (address)
    {
        address corridor = address(new DefaultCorridor(campaign, operator, operatorFeeBps));
        emit CorridorCreated(corridor, campaign, operator, operatorFeeBps);
        return corridor;
    }
}
