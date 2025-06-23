// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InstitutionalAsset.sol";
import "./ZKPretAdapter.sol";
import "./InstitutionalAssetParams.sol";

/**
 * @title InstitutionalAssetFactory
 * @dev Enhanced factory for creating institutional-grade RWA tokens with FORTE compliance
 * @notice Transforms art fractionalization into sophisticated financial instrument tokenization
 */
contract InstitutionalAssetFactory {
    using InstitutionalAssetParams for *;

    // State variables
    ZKPretAdapter public zkPretAdapter;
    mapping(address => bool) public institutionalAssets;
    mapping(string => address) public leiToAsset; // LEI to asset contract mapping
    
    address[] public allAssets;
    uint256 public totalAssetsCreated;
    
    // Events
    event InstitutionalAssetCreated(
        address indexed assetContract,
        string indexed lei,
        InstitutionalAssetParams.AssetType assetType,
        uint256 principalAmount,
        uint256 totalFractions
    );
    
    event AssetStatusUpdated(
        address indexed assetContract,
        InstitutionalAssetParams.AssetStatus oldStatus,
        InstitutionalAssetParams.AssetStatus newStatus
    );

    constructor(address _zkPretAdapter) {
        zkPretAdapter = ZKPretAdapter(_zkPretAdapter);
    }

    /**
     * @dev Create institutional-grade RWA asset with comprehensive compliance
     * @param params Complete institutional asset parameters
     * @return assetContract Address of the created institutional asset contract
     */
    function createInstitutionalAsset(
        InstitutionalAssetParams.InstitutionalAsset memory params
    ) external returns (address assetContract) {
        
        // FORTE RULE 1: Enhanced KYC + GLEIF Verification
        require(
            zkPretAdapter.isGLEIFVerified(params.legalEntityIdentifier),
            "FORTE RULE 1 VIOLATION: GLEIF LEI verification required"
        );

        // FORTE RULE 4: GLEIF Corporate Registration Check
        require(
            bytes(params.legalEntityIdentifier).length == 20,
            "FORTE RULE 4 VIOLATION: Invalid LEI format"
        );

        // FORTE RULE 5: BPMN Business Process Compliance
        require(
            zkPretAdapter.isBPMNCompliant(params.assetDescription),
            "FORTE RULE 5 VIOLATION: Business process compliance not verified"
        );

        // FORTE RULE 6: ACTUS Risk Assessment Threshold
        (uint256 riskScore, uint256 liquidityScore) = zkPretAdapter.getACTUSRiskScore(
            abi.encodePacked(params.corporateName, params.principalAmount)
        );
        require(
            riskScore > 0 && riskScore <= 500, // Risk score must be reasonable (0.5 or better)
            "FORTE RULE 6 VIOLATION: ACTUS risk assessment failed or too high risk"
        );

        // FORTE RULE 7: DCSA Trade Document Integrity
        require(
            zkPretAdapter.isDCSAVerified(params.documentHash),
            "FORTE RULE 7 VIOLATION: DCSA trade document verification failed"
        );

        // FORTE RULE 8: Optimal Fraction Calculation
        InstitutionalAssetParams.FractionParams memory fractionParams = 
            zkPretAdapter.calculateOptimalFractions(params.principalAmount, params.assetType);
        
        params.totalFractions = fractionParams.optimalCount;
        params.minimumFractionSize = fractionParams.minimumSize;

        // FORTE RULE 9: Metadata Completeness Score
        InstitutionalAssetParams.MetadataScore memory score = 
            zkPretAdapter.calculateMetadataScore(params);
        require(
            score.totalScore >= 70,
            "FORTE RULE 9 VIOLATION: Insufficient metadata completeness score"
        );

        // FORTE RULE 10: Minimum Fraction Threshold
        require(
            params.minimumFractionSize >= 500e18, // Minimum $500 per fraction
            "FORTE RULE 10 VIOLATION: Fraction size below minimum threshold"
        );

        // FORTE RULE 11: Fraction Liquidity Optimization
        require(
            params.totalFractions >= 10 && params.totalFractions <= 10000,
            "FORTE RULE 11 VIOLATION: Fraction count outside optimal liquidity range"
        );

        // FORTE RULE 12: Enhanced Metadata Completeness Enforcement
        (bool meetsThreshold, uint8 currentScore, uint8 requiredScore) = 
            zkPretAdapter.checkMetadataThreshold(params);
        require(
            meetsThreshold,
            string(abi.encodePacked(
                "FORTE RULE 12 VIOLATION: Metadata score ",
                Strings.toString(currentScore),
                " below required ",
                Strings.toString(requiredScore)
            ))
        );

        // Create the institutional asset contract
        params.status = InstitutionalAssetParams.AssetStatus.APPROVED;
        params.createdAt = block.timestamp;
        params.lastUpdated = block.timestamp;
        params.manager = msg.sender;

        // Deploy new InstitutionalAsset contract
        InstitutionalAsset newAsset = new InstitutionalAsset(
            params,
            address(zkPretAdapter)
        );
        
        assetContract = address(newAsset);
        
        // Register the asset
        institutionalAssets[assetContract] = true;
        leiToAsset[params.legalEntityIdentifier] = assetContract;
        allAssets.push(assetContract);
        totalAssetsCreated++;

        emit InstitutionalAssetCreated(
            assetContract,
            params.legalEntityIdentifier,
            params.assetType,
            params.principalAmount,
            params.totalFractions
        );

        return assetContract;
    }

    /**
     * @dev Quick institutional asset creation with common defaults (for demo)
     * @param corporateName Name of the corporation
     * @param lei GLEIF Legal Entity Identifier
     * @param assetType Type of institutional asset
     * @param principalAmount Principal amount in wei
     * @param maturityDays Days until maturity
     * @param interestRate Interest rate in basis points
     */
    function createQuickInstitutionalAsset(
        string memory corporateName,
        string memory lei,
        InstitutionalAssetParams.AssetType assetType,
        uint256 principalAmount,
        uint256 maturityDays,
        uint256 interestRate
    ) external returns (address) {
        
        InstitutionalAssetParams.InstitutionalAsset memory params;
        
        // Basic corporate information
        params.corporateName = corporateName;
        params.legalEntityIdentifier = lei;
        params.corporateWallet = msg.sender;
        
        // Asset classification
        params.assetType = assetType;
        params.assetDescription = string(abi.encodePacked(
            Strings.toString(maturityDays),
            "-day ",
            corporateName,
            " institutional asset"
        ));
        params.industryCode = "NAICS-001"; // Default industry code
        
        // Financial terms
        params.principalAmount = principalAmount;
        params.interestRate = interestRate;
        params.maturityDays = maturityDays;
        params.paymentFrequency = 30; // Monthly payments
        
        // Risk assessment defaults
        params.creditRating = InstitutionalAssetParams.CreditRating.BBB; // Investment grade
        params.riskScore = 300; // Moderate risk
        params.liquidityScore = 700; // Good liquidity
        
        // Documentation defaults
        params.tradeDocuments = new string[](1);
        params.tradeDocuments[0] = "invoice_001.pdf";
        params.documentHash = keccak256(abi.encodePacked(corporateName, principalAmount, block.timestamp));
        params.dcsaVerified = false; // Will be verified through ZK PRET
        
        return this.createInstitutionalAsset(params);
    }

    // Administrative and query functions
    function getAssetByLEI(string memory lei) external view returns (address) {
        return leiToAsset[lei];
    }

    function getAllAssets() external view returns (address[] memory) {
        return allAssets;
    }

    function getAssetCount() external view returns (uint256) {
        return totalAssetsCreated;
    }

    function isInstitutionalAsset(address asset) external view returns (bool) {
        return institutionalAssets[asset];
    }

    function updateZKPretAdapter(address newAdapter) external {
        // In production, add proper access control
        zkPretAdapter = ZKPretAdapter(newAdapter);
    }
}

// Import the Strings library for conversions
library Strings {
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
