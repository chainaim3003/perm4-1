// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InstitutionalAssetParams
 * @dev Data structures for institutional-grade RWA assets beyond simple art fractionalization
 * @notice Defines parameters for supply chain finance, trade finance, equipment finance, etc.
 * @notice Enhanced with PYUSD cross-border capabilities for Rules 13 & 14
 */
library InstitutionalAssetParams {
    // Asset type enumeration for institutional instruments
    enum AssetType {
        SUPPLY_CHAIN_INVOICE,    // Trade receivables and supplier invoices
        EQUIPMENT_FINANCE,       // Machinery leasing and equipment loans
        TRADE_FINANCE,          // Letters of credit and international trade
        WORKING_CAPITAL,        // Inventory financing and cash flow
        COMMERCIAL_REAL_ESTATE, // Property development and commercial loans
        CORPORATE_BONDS,        // Corporate debt instruments
        STRUCTURED_PRODUCTS     // Complex financial derivatives
    }

    // Credit rating enumeration
    enum CreditRating {
        AAA, AA, A, BBB, BB, B, CCC, CC, C, D
    }

    // Asset status throughout lifecycle
    enum AssetStatus {
        PENDING_VERIFICATION,   // Initial submission
        COMPLIANCE_REVIEW,      // ZK PRET verification in progress
        APPROVED,              // Ready for tokenization
        ACTIVE,                // Currently tokenized and trading
        MATURED,               // Principal and interest paid
        DEFAULT,               // Non-performing asset
        LIQUIDATED             // Asset sold/recovered
    }

    // Core institutional asset parameters (Enhanced with PYUSD support)
    struct InstitutionalAsset {
        // Corporate Identity (GLEIF Integration)
        string corporateName;           // "APPLE INC"
        string legalEntityIdentifier;   // GLEIF LEI: HWUPKR0MPOU8FGXBT394
        address corporateWallet;        // On-chain corporate identity
        
        // Asset Classification
        AssetType assetType;           // Type of financial instrument
        string assetDescription;       // "90-day supplier invoice from verified vendor"
        string industryCode;           // NAICS/SIC industry classification
        
        // Financial Terms
        uint256 principalAmount;       // $5,000,000 (in wei equivalent)
        uint256 interestRate;          // 8.5% APR (in basis points: 850)
        uint256 maturityDays;          // 90 days
        uint256 paymentFrequency;      // Days between payments
        
        // Risk Assessment (ACTUS Integration)
        CreditRating creditRating;     // Credit rating from agencies
        uint256 riskScore;             // 0-1000 risk score from ZK PRET ACTUS
        uint256 liquidityScore;        // 0-1000 liquidity assessment
        
        // Compliance & Documentation (DCSA Integration)
        string[] tradeDocuments;       // Bills of lading, invoices, etc.
        bytes32 documentHash;          // IPFS hash of compliance documents
        bool dcsaVerified;             // DCSA trade document verification
        
        // Tokenization Parameters
        uint256 totalFractions;        // Calculated optimal fraction count
        uint256 minimumFractionSize;   // Minimum investment per fraction
        uint256 targetLiquidity;       // Expected secondary market volume
        
        // PYUSD Cross-Border Integration (Rules 13 & 14)
        uint256 pyusdAmount;          // PYUSD settlement amount (0 if not using PYUSD)
        bool isCrossBorder;           // True if cross-border transaction
        string buyerCountry;          // ISO country code of buyer (e.g., "US")
        string sellerCountry;         // ISO country code of seller (e.g., "IN")
        
        // Operational Data
        AssetStatus status;            // Current lifecycle status
        uint256 createdAt;            // Block timestamp of creation
        uint256 lastUpdated;          // Last compliance verification
        address manager;              // Institutional asset manager
    }

    // Metadata scoring components for Rule 9
    struct MetadataScore {
        uint8 gleifScore;      // 0-25 points for GLEIF verification quality
        uint8 bpmnScore;       // 0-20 points for business process compliance
        uint8 actuarialScore;  // 0-20 points for risk assessment completeness
        uint8 dcsaScore;       // 0-15 points for trade document integrity
        uint8 financialScore;  // 0-20 points for financial documentation
        uint8 totalScore;      // 0-100 total metadata completeness
    }

    // Fraction optimization parameters for Rules 8, 10, 11
    struct FractionParams {
        uint256 optimalCount;      // AI-calculated optimal fraction count
        uint256 minimumSize;       // Minimum viable fraction size
        uint256 maximumSize;       // Maximum fraction size for liquidity
        uint256 liquidityFactor;   // Expected trading volume multiplier
        bool dustProtection;       // Anti-dust trading protection enabled
    }

    // Events for institutional asset lifecycle
    event InstitutionalAssetCreated(
        address indexed asset,
        string indexed lei,
        AssetType assetType,
        uint256 principalAmount
    );

    event ComplianceStatusUpdated(
        address indexed asset,
        AssetStatus oldStatus,
        AssetStatus newStatus,
        uint8 metadataScore
    );

    event FractionOptimizationCompleted(
        address indexed asset,
        uint256 totalFractions,
        uint256 minimumSize,
        uint256 liquidityScore
    );

    // PYUSD-specific events (Rules 13 & 14)
    event PYUSDCrossBorderTransaction(
        address indexed asset,
        string buyerCountry,
        string sellerCountry,
        uint256 pyusdAmount,
        bool compliant
    );

    // Utility functions for asset type handling
    function getAssetTypeMultiplier(AssetType assetType) internal pure returns (uint256) {
        if (assetType == AssetType.SUPPLY_CHAIN_INVOICE) return 1000; // $1K per fraction
        if (assetType == AssetType.EQUIPMENT_FINANCE) return 10000;   // $10K per fraction
        if (assetType == AssetType.COMMERCIAL_REAL_ESTATE) return 25000; // $25K per fraction
        if (assetType == AssetType.TRADE_FINANCE) return 5000;        // $5K per fraction
        if (assetType == AssetType.WORKING_CAPITAL) return 2000;      // $2K per fraction
        if (assetType == AssetType.CORPORATE_BONDS) return 1000;      // $1K per fraction
        return 1000; // Default to $1K per fraction
    }

    function getCreditRatingScore(CreditRating rating) internal pure returns (uint256) {
        if (rating <= CreditRating.A) return 950;      // Investment grade high
        if (rating <= CreditRating.BBB) return 750;    // Investment grade
        if (rating <= CreditRating.BB) return 500;     // Speculative grade
        if (rating <= CreditRating.B) return 300;      // Highly speculative
        return 100; // Substantial risk or default
    }

    function getMinimumMetadataScore(AssetType assetType, uint256 principalAmount) 
        internal pure returns (uint8) {
        // Higher requirements for larger deals and complex asset types
        uint8 baseScore = 70;
        
        // Convert wei to plain number for comparison (divide by 1e18)
        uint256 principalInUSD = principalAmount / 1e18;
        
        if (principalInUSD >= 10000000) baseScore = 95;  // $10M+ requires 95%
        else if (principalInUSD >= 5000000) baseScore = 85;   // $5M+ requires 85%
        else if (principalInUSD >= 1000000) baseScore = 75;   // $1M+ requires 75%
        
        // Complex asset types need higher scores
        if (assetType == AssetType.STRUCTURED_PRODUCTS) baseScore += 5;
        if (assetType == AssetType.TRADE_FINANCE) baseScore += 3;
        
        return baseScore > 100 ? 100 : baseScore;
    }

    // PYUSD compliance utilities (Rules 13 & 14)
    function isCountryPYUSDCompliant(string memory countryCode) internal pure returns (bool) {
        // FATF compliant countries for PYUSD cross-border
        bytes32 code = keccak256(abi.encodePacked(countryCode));
        
        // Supported countries
        if (code == keccak256("US")) return true;   // United States
        if (code == keccak256("GB")) return true;   // United Kingdom  
        if (code == keccak256("DE")) return true;   // Germany
        if (code == keccak256("JP")) return true;   // Japan
        if (code == keccak256("IN")) return true;   // India
        if (code == keccak256("SG")) return true;   // Singapore
        if (code == keccak256("CA")) return true;   // Canada
        if (code == keccak256("AU")) return true;   // Australia
        if (code == keccak256("FR")) return true;   // France
        if (code == keccak256("IT")) return true;   // Italy
        if (code == keccak256("ES")) return true;   // Spain
        if (code == keccak256("NL")) return true;   // Netherlands
        
        // Restricted countries
        if (code == keccak256("IR")) return false;  // Iran
        if (code == keccak256("KP")) return false;  // North Korea
        if (code == keccak256("CU")) return false;  // Cuba
        if (code == keccak256("SY")) return false;  // Syria
        
        return false; // Default to not supported
    }

    function getCrossBorderPYUSDLimit(string memory buyerCountry, string memory sellerCountry) 
        internal pure returns (uint256) {
        bytes32 buyer = keccak256(abi.encodePacked(buyerCountry));
        bytes32 seller = keccak256(abi.encodePacked(sellerCountry));
        
        // Country-specific limits (in wei, e.g., 50000000e18 = $50M)
        if ((buyer == keccak256("US") && seller == keccak256("IN")) ||
            (buyer == keccak256("IN") && seller == keccak256("US"))) {
            return 50000000e18; // $50M for US-India corridor (RBI limits)
        }
        
        if ((buyer == keccak256("US") && seller == keccak256("GB")) ||
            (buyer == keccak256("GB") && seller == keccak256("US"))) {
            return 100000000e18; // $100M for US-UK corridor
        }
        
        if ((buyer == keccak256("US") && seller == keccak256("DE")) ||
            (buyer == keccak256("DE") && seller == keccak256("US"))) {
            return 100000000e18; // $100M for US-Germany corridor
        }
        
        return 25000000e18; // $25M default limit
    }
}
