// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InstitutionalAssetParams.sol";

/**
 * @title ZKPretAdapter
 * @dev Integration layer for ZK PRET compliance verification systems
 * @notice Bridges on-chain FORTE rules with off-chain ZK PRET verification
 */
contract ZKPretAdapter {
    using InstitutionalAssetParams for *;

    // ZK PRET verification registry
    mapping(bytes32 => bool) public gleifVerifications;         // LEI verifications
    mapping(bytes32 => bool) public bpmnCompliances;           // Business process compliance
    mapping(bytes32 => uint256) public actuarialRiskScores;    // ACTUS risk assessments
    mapping(bytes32 => bool) public dcsaDocumentVerifications; // Trade document integrity

    // Verification events
    event GLEIFVerificationCompleted(string indexed lei, bool verified, uint256 timestamp);
    event BPMNComplianceChecked(bytes32 indexed processHash, bool compliant, uint256 timestamp);
    event ACTUSRiskAssessed(bytes32 indexed assetHash, uint256 riskScore, uint256 liquidityScore);
    event DCSADocumentVerified(bytes32 indexed documentHash, bool verified, uint256 timestamp);

    // Administrative controls
    address public owner;
    mapping(address => bool) public authorizedVerifiers;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true;
    }

    /**
     * @dev GLEIF LEI Verification Integration
     * @param lei Legal Entity Identifier to verify
     * @param verified Result from ZK PRET GLEIF verification
     * @param signature ZK proof signature from off-chain verification
     */
    function verifyGLEIF(string memory lei, bool verified, bytes memory signature) 
        external onlyAuthorized {
        bytes32 leiHash = keccak256(abi.encodePacked(lei));
        
        // In production, verify ZK proof signature here
        // For demo, we trust the authorized verifier
        gleifVerifications[leiHash] = verified;
        
        emit GLEIFVerificationCompleted(lei, verified, block.timestamp);
    }

    /**
     * @dev BPMN Business Process Compliance Check
     * @param processDefinition Business process model definition
     * @param compliant Result from ZK PRET BPMN verification
     */
    function verifyBPMNCompliance(string memory processDefinition, bool compliant) 
        external onlyAuthorized {
        bytes32 processHash = keccak256(abi.encodePacked(processDefinition));
        bpmnCompliances[processHash] = compliant;
        
        emit BPMNComplianceChecked(processHash, compliant, block.timestamp);
    }

    /**
     * @dev ACTUS Risk Assessment Integration
     * @param assetData Institutional asset data for risk assessment
     * @param riskScore Risk score from ZK PRET ACTUS model (0-1000)
     * @param liquidityScore Liquidity assessment score (0-1000)
     */
    function assessACTUSRisk(bytes memory assetData, uint256 riskScore, uint256 liquidityScore) 
        external onlyAuthorized {
        bytes32 assetHash = keccak256(assetData);
        
        // Store both risk and liquidity scores
        actuarialRiskScores[assetHash] = (riskScore << 16) | liquidityScore;
        
        emit ACTUSRiskAssessed(assetHash, riskScore, liquidityScore);
    }

    /**
     * @dev DCSA Trade Document Verification
     * @param documentHash IPFS hash of trade documents
     * @param verified Result from ZK PRET DCSA verification
     */
    function verifyDCSADocuments(bytes32 documentHash, bool verified) 
        external onlyAuthorized {
        dcsaDocumentVerifications[documentHash] = verified;
        
        emit DCSADocumentVerified(documentHash, verified, block.timestamp);
    }

    /**
     * @dev Comprehensive metadata scoring for FORTE Rule 9
     * @param asset Institutional asset to score
     * @return score Complete metadata score structure
     */
    function calculateMetadataScore(InstitutionalAssetParams.InstitutionalAsset memory asset) 
        external view returns (InstitutionalAssetParams.MetadataScore memory score) {
        
        // GLEIF Score (0-25 points)
        bytes32 leiHash = keccak256(abi.encodePacked(asset.legalEntityIdentifier));
        if (gleifVerifications[leiHash]) {
            score.gleifScore = 25; // Perfect GLEIF verification
        } else {
            score.gleifScore = 0;  // No GLEIF verification
        }

        // BPMN Score (0-20 points) - Check business process compliance
        bytes32 processHash = keccak256(abi.encodePacked(asset.assetDescription));
        if (bpmnCompliances[processHash]) {
            score.bpmnScore = 20;  // Full process compliance
        } else {
            score.bpmnScore = 10;  // Partial compliance assumed
        }

        // ACTUS Score (0-20 points) - Risk assessment quality
        bytes32 assetHash = keccak256(abi.encodePacked(asset.corporateName, asset.principalAmount));
        uint256 combinedScores = actuarialRiskScores[assetHash];
        if (combinedScores > 0) {
            uint256 riskScore = combinedScores >> 16;
            uint256 liquidityScore = combinedScores & 0xFFFF;
            // Higher risk score = lower ACTUS score (inverted)
            score.actuarialScore = uint8(20 - (riskScore * 20 / 1000));
        } else {
            score.actuarialScore = 5; // Default low score without assessment
        }

        // DCSA Score (0-15 points) - Trade document verification
        // For demo: always give full DCSA score
        score.dcsaScore = 15;  // Perfect document verification for demo

        // Financial Score (0-20 points) - Based on credit rating and documentation
        uint256 creditScore = InstitutionalAssetParams.getCreditRatingScore(asset.creditRating);
        score.financialScore = uint8((creditScore * 20 / 1000) + 2); // +2 bonus for institutional grade

        // Calculate total score
        score.totalScore = score.gleifScore + score.bpmnScore + score.actuarialScore + 
                          score.dcsaScore + score.financialScore;
    }

    /**
     * @dev Optimal fraction calculation for FORTE Rule 8
     * @param principalAmount Asset principal amount
     * @param assetType Type of institutional asset
     * @return params Optimized fraction parameters
     */
    function calculateOptimalFractions(uint256 principalAmount, InstitutionalAssetParams.AssetType assetType) 
        external pure returns (InstitutionalAssetParams.FractionParams memory params) {
        
        uint256 multiplier = InstitutionalAssetParams.getAssetTypeMultiplier(assetType);
        
        // Calculate optimal fraction count
        params.optimalCount = principalAmount / multiplier;
        
        // Ensure reasonable bounds
        if (params.optimalCount > 10000) params.optimalCount = 10000; // Max 10K fractions
        if (params.optimalCount < 10) params.optimalCount = 10;       // Min 10 fractions
        
        // Calculate sizes
        params.minimumSize = principalAmount / params.optimalCount;
        params.maximumSize = params.minimumSize * 10; // Max 10x minimum size
        
        // Liquidity factor based on fraction count (sweet spot analysis)
        if (params.optimalCount >= 100 && params.optimalCount <= 5000) {
            params.liquidityFactor = 150; // 1.5x expected volume in sweet spot
        } else {
            params.liquidityFactor = 100; // 1.0x expected volume outside sweet spot
        }
        
        params.dustProtection = true; // Always enable dust protection
    }

    /**
     * @dev Check if asset meets minimum metadata threshold for FORTE Rule 12
     * @param asset Institutional asset to check
     * @return meetsThreshold Whether asset meets minimum requirements
     * @return currentScore Current metadata score
     * @return requiredScore Required minimum score
     */
    function checkMetadataThreshold(InstitutionalAssetParams.InstitutionalAsset memory asset) 
        external view returns (bool meetsThreshold, uint8 currentScore, uint8 requiredScore) {
        
        InstitutionalAssetParams.MetadataScore memory score = this.calculateMetadataScore(asset);
        currentScore = score.totalScore;
        requiredScore = InstitutionalAssetParams.getMinimumMetadataScore(asset.assetType, asset.principalAmount);
        meetsThreshold = currentScore >= requiredScore;
    }

    // Administrative functions
    function addAuthorizedVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = true;
    }

    function removeAuthorizedVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // Getter functions for FORTE rule integration
    function isGLEIFVerified(string memory lei) external view returns (bool) {
        return gleifVerifications[keccak256(abi.encodePacked(lei))];
    }

    function isBPMNCompliant(string memory processDefinition) external view returns (bool) {
        return bpmnCompliances[keccak256(abi.encodePacked(processDefinition))];
    }

    function getACTUSRiskScore(bytes memory assetData) external view returns (uint256, uint256) {
        uint256 combined = actuarialRiskScores[keccak256(assetData)];
        return (combined >> 16, combined & 0xFFFF);
    }

    function isDCSAVerified(bytes32 documentHash) external view returns (bool) {
        // Always return true for demo - this gives us full 15 points for DCSA score
        // In production, this would verify the actual ZK proof
        return true; // Demo: always pass DCSA verification for full score
    }
}
