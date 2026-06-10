// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICampaign} from "./interfaces/ICampaign.sol";
import {ICorridor} from "./interfaces/ICorridor.sol";
import {INetworkCorridor} from "./interfaces/INetworkCorridor.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Campaign is ICampaign, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error NotCampaignOwner();
    error NotCampaignOperator();
    error InsufficientBounty();
    error InsufficientUnlockedBounty();
    error NoCorridors();
    error NoBounty();
    error InvalidOperator();
    error InvalidInput();
    error InvalidCorridorAmount();
    error BountyEscrowFailed();
    error CampaignAlreadyActive();
    error CampaignNotActive();
    error CampaignAlreadyEnded();
    error InvalidFeeBps();
    error NoClaimableAmount();

    event CampaignCreated(
        uint256 indexed campaignId, address indexed operator, address indexed token, uint256 bountyAmount, string name
    );
    event CampaignActivated(uint256 indexed campaignId, address[] corridors);
    event BountyUnlocked(
        uint256 indexed campaignId, uint256 amountUnlocked, uint256 indexed conversionId, string proofUrl
    );
    event ConversionProofUrlUpdated(uint256 indexed campaignId, string proofUrl);
    event DistributionProofUrlUpdated(uint256 indexed campaignId, string proofUrl);
    event DistributionRun(
        uint256 indexed campaignId,
        uint256 amountDistributed,
        uint256 amountRemaining,
        uint256 indexed distributionId,
        string proofUrl
    );
    event CorridorProcessed(
        uint256 indexed campaignId, address indexed corridor, address[] recipients, uint256[] amounts
    );
    event CampaignEnded(uint256 indexed campaignId, uint256 amountRefunded);
    event NetworkCorridorUpdated(address indexed networkCorridor);

    uint256 public idCounter;
    INetworkCorridor public networkCorridor;
    mapping(uint256 => CampaignData) public idToCampaignData;
    mapping(uint256 => mapping(uint256 => string)) public campaignIdToConversionIdToProofUrl;
    mapping(uint256 => mapping(uint256 => string)) public campaignIdToDistributionIdToProofUrl;
    mapping(address => mapping(uint256 => uint256)) public userToCampaignIdToClaimableAmount;

    constructor(address _owner, address _networkCorridor) Ownable(_owner) {
        networkCorridor = INetworkCorridor(_networkCorridor);
    }

    function createCampaign(address operator, address token, uint256 bountyAmount, string memory name)
        external
        override
        returns (uint256)
    {
        // must provide a non-zero bounty
        if (bountyAmount == 0) {
            revert NoBounty();
        }

        // operator cannot be the same as the owner
        if (operator == msg.sender) {
            revert InvalidOperator();
        }

        // Transfer bounty amount from sender to the contract
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).transferFrom(msg.sender, address(this), bountyAmount);
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        if (balanceAfter - balanceBefore != bountyAmount) {
            revert BountyEscrowFailed();
        }

        uint256 id = ++idCounter;
        idToCampaignData[id] = CampaignData({
            id: id,
            isActive: false,
            isEnded: false,
            owner: msg.sender,
            operator: operator,
            token: token,
            bountyAmount: bountyAmount,
            amountUnlocked: 0,
            amountDistributed: 0,
            name: name,
            conversionProofUrl: "",
            distributionProofUrl: "",
            corridors: new address[](0)
        });
        emit CampaignCreated(id, operator, token, bountyAmount, name);
        return id;
    }

    function activateCampaign(uint256 campaignId, address[] calldata corridors)
        external
        override
        onlyCampaignOperator(campaignId)
    {
        CampaignData storage campaign = idToCampaignData[campaignId];
        if (campaign.isActive) {
            revert CampaignAlreadyActive();
        }

        if (campaign.isEnded) {
            revert CampaignAlreadyEnded();
        }

        // must provide at least one corridor
        if (corridors.length == 0) {
            revert NoCorridors();
        }

        campaign.corridors = corridors;
        campaign.isActive = true;
        emit CampaignActivated(campaignId, corridors);
    }

    // Campaign owner unlocks part of the bounty for the operator to distribute
    function unlockBounty(uint256 campaignId, uint256 amountUnlocked, string memory proofUrl)
        external
        override
        onlyCampaignOwner(campaignId)
        returns (uint256)
    {
        CampaignData storage campaign = idToCampaignData[campaignId];
        if (!campaign.isActive) {
            revert CampaignNotActive();
        }

        campaign.amountUnlocked += amountUnlocked;
        if (campaign.amountUnlocked > campaign.bountyAmount) {
            revert InsufficientBounty();
        }

        uint256 conversionId = ++idCounter;
        campaignIdToConversionIdToProofUrl[campaignId][conversionId] = proofUrl;
        emit BountyUnlocked(campaignId, amountUnlocked, conversionId, proofUrl);
        return conversionId;
    }

    function setConversionProofUrl(uint256 campaignId, string memory proofUrl)
        external
        override
        onlyCampaignOwner(campaignId)
    {
        idToCampaignData[campaignId].conversionProofUrl = proofUrl;
        emit ConversionProofUrlUpdated(campaignId, proofUrl);
    }

    function setDistributionProofUrl(uint256 campaignId, string memory proofUrl)
        external
        override
        onlyCampaignOperator(campaignId)
    {
        CampaignData storage campaign = idToCampaignData[campaignId];
        if (!campaign.isActive) {
            revert CampaignNotActive();
        }

        idToCampaignData[campaignId].distributionProofUrl = proofUrl;
        emit DistributionProofUrlUpdated(campaignId, proofUrl);
    }

    // The operator can end the campaign. Any undistributed bounty will be refunded to the owner
    function endCampaign(uint256 campaignId) external override onlyCampaignOperator(campaignId) nonReentrant {
        CampaignData storage campaign = idToCampaignData[campaignId];
        if (!campaign.isActive) {
            revert CampaignNotActive();
        }

        if (campaign.isEnded) {
            revert CampaignAlreadyEnded();
        }

        // Return any undistrubted bounty to the owner
        campaign.isActive = false;
        campaign.isEnded = true;
        uint256 amountToRefund = campaign.bountyAmount - campaign.amountDistributed;
        IERC20(campaign.token).safeTransfer(campaign.owner, amountToRefund);
        emit CampaignEnded(campaignId, amountToRefund);
    }

    // Campaign operator pays out creators for influencing conversions
    function runDistribution(
        uint256 campaignId,
        uint256[] calldata amounts,
        bytes[] calldata corridorData,
        string memory proofUrl
    ) external override onlyCampaignOperator(campaignId) nonReentrant returns (uint256) {
        CampaignData storage campaign = idToCampaignData[campaignId];
        if (!campaign.isActive) {
            revert CampaignNotActive();
        }

        if (corridorData.length != campaign.corridors.length || amounts.length != campaign.corridors.length) {
            revert InvalidInput();
        }

        uint256 amountToDistribute = 0;
        for (uint256 i = 0; i < amounts.length; ++i) {
            amountToDistribute += amounts[i];
        }

        // Make sure enough bounty has been unlocked
        uint256 unlockedRemaining = campaign.amountUnlocked - campaign.amountDistributed;
        if (amountToDistribute > unlockedRemaining) {
            revert InsufficientUnlockedBounty();
        }

        // Make sure there is enough bounty left to distribute
        if (campaign.amountDistributed + amountToDistribute > campaign.bountyAmount) {
            revert InsufficientBounty();
        }

        // Update the amount distributed
        campaign.amountDistributed += amountToDistribute;

        // Add the proof url to the distribution
        uint256 distributionId = ++idCounter;
        campaignIdToDistributionIdToProofUrl[campaignId][distributionId] = proofUrl;

        uint256[] memory corridorAmounts = _processNetworkCorridor(campaign, amounts);

        _processCorridors(campaign, corridorAmounts, corridorData);

        emit DistributionRun(campaignId, amountToDistribute, unlockedRemaining, distributionId, proofUrl);
        return distributionId;
    }

    function _processNetworkCorridor(CampaignData storage campaign, uint256[] memory corridorAmounts)
        internal
        returns (uint256[] memory)
    {
        if (address(networkCorridor) == address(0)) {
            return corridorAmounts;
        }

        (address feeRecipient, uint256 feeBps) = networkCorridor.runNetworkCorridor(campaign.id);
        // verify the feeBps is valid (0 < feeBps < 10_000)
        if (feeBps >= 10_000) {
            revert InvalidFeeBps();
        }

        uint256 feeAmount = 0;
        uint256[] memory updatedCorridorAmounts = new uint256[](corridorAmounts.length);
        for (uint256 i = 0; i < corridorAmounts.length; ++i) {
            uint256 corridorAmount = corridorAmounts[i];
            uint256 corridorFeeAmount = (corridorAmount * feeBps) / 10_000;
            corridorAmount -= corridorFeeAmount;
            feeAmount += corridorFeeAmount;
            updatedCorridorAmounts[i] = corridorAmount;
        }

        // transfer the fee to the fee recipient
        IERC20(campaign.token).safeTransfer(feeRecipient, feeAmount);

        // return the updated corridor amounts (less the fee)
        return updatedCorridorAmounts;
    }

    function _processCorridors(CampaignData storage campaign, uint256[] memory amounts, bytes[] calldata corridorData)
        internal
    {
        uint256 numCorridors = campaign.corridors.length;
        for (uint256 i = 0; i < numCorridors; ++i) {
            _processCorridor(campaign, campaign.corridors[i], amounts[i], corridorData[i]);
        }
    }

    function _processCorridor(
        CampaignData storage campaign,
        address corridor,
        uint256 amount,
        bytes calldata corridorData
    ) internal {
        (address[] memory recipients, uint256[] memory recipientAmounts) =
            ICorridor(corridor).runCorridor(campaign.id, amount, corridorData);
        if (recipients.length != recipientAmounts.length) {
            revert InvalidInput();
        }

        // make sure the total amount is the same as the amount allotted to the corridor
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; ++i) {
            totalAmount += recipientAmounts[i];
        }

        if (totalAmount != amount) {
            revert InvalidCorridorAmount();
        }

        for (uint256 i = 0; i < recipients.length; ++i) {
            userToCampaignIdToClaimableAmount[recipients[i]][campaign.id] += recipientAmounts[i];
        }

        emit CorridorProcessed(campaign.id, corridor, recipients, recipientAmounts);
    }

    function claim(uint256 campaignId) external override nonReentrant {
        CampaignData storage campaign = idToCampaignData[campaignId];
        uint256 claimableAmount = userToCampaignIdToClaimableAmount[msg.sender][campaignId];
        if (claimableAmount == 0) {
            revert NoClaimableAmount();
        }

        userToCampaignIdToClaimableAmount[msg.sender][campaignId] = 0;
        IERC20(campaign.token).safeTransfer(msg.sender, claimableAmount);
    }

    function setNetworkCorridor(address _networkCorridor) external onlyOwner {
        networkCorridor = INetworkCorridor(_networkCorridor);
        emit NetworkCorridorUpdated(_networkCorridor);
    }

    function getCampaignData(uint256 campaignId) external view override returns (CampaignData memory) {
        return idToCampaignData[campaignId];
    }

    function getClaimableAmount(uint256 campaignId, address user) external view override returns (uint256) {
        return userToCampaignIdToClaimableAmount[user][campaignId];
    }

    modifier onlyCampaignOwner(uint256 campaignId) {
        CampaignData storage campaign = idToCampaignData[campaignId];
        if (campaign.owner != msg.sender) {
            revert NotCampaignOwner();
        }
        _;
    }

    modifier onlyCampaignOperator(uint256 campaignId) {
        CampaignData storage campaign = idToCampaignData[campaignId];
        if (campaign.operator != msg.sender) {
            revert NotCampaignOperator();
        }
        _;
    }
}
