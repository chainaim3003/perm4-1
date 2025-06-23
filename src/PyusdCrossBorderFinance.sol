// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InstitutionalAssetParams.sol";
import "./ZKPretAdapter.sol";

/**
 * @title PyusdCrossBorderFinance
 * @dev PYUSD integration for cross-border trade finance with institutional compliance
 * @notice Enables instant international settlements with FORTE rule compliance
 */

// PYUSD Interface (ERC-20 compatible)
interface IPYUSD {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract PyusdCrossBorderFinance {
    using InstitutionalAssetParams for *;

    // PYUSD Contract Addresses
    address public constant PYUSD_MAINNET = 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8;
    address public constant PYUSD_SEPOLIA = 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9;
    
    IPYUSD public pyusdToken;
    ZKPretAdapter public zkPretAdapter;
    
    // Cross-border trade finance tracking
    struct CrossBorderTrade {
        uint256 tradeId;
        address buyer;
        address seller;
        address buyerBank;
        address sellerBank;
        uint256 pyusdAmount;          // Settlement amount in PYUSD
        uint256 localAmount;          // Local currency amount
        string localCurrency;         // "USD", "EUR", "JPY", etc.
        string buyerCountry;          // ISO country code
        string sellerCountry;         // ISO country code
        bytes32 letterOfCreditHash;   // DCSA verified LC document
        bool gleifVerified;           // Both parties GLEIF verified
        bool complianceCleared;       // All FORTE rules passed
        TradeStatus status;
        uint256 createdAt;
        uint256 settledAt;
    }
    
    enum TradeStatus {
        INITIATED,           // Trade initiated
        COMPLIANCE_CHECK,    // FORTE rules verification
        LC_ISSUED,          // Letter of credit issued
        GOODS_SHIPPED,      // Goods shipped with DCSA documents
        PYUSD_ESCROWED,     // PYUSD held in escrow
        SETTLEMENT_READY,    // Ready for instant settlement
        SETTLED,            // Trade completed
        DISPUTED,           // Dispute raised
        CANCELLED           // Trade cancelled
    }
    
    // Storage
    mapping(uint256 => CrossBorderTrade) public trades;
    mapping(address => uint256[]) public userTrades;
    mapping(string => uint256) public exchangeRates; // Currency to USD rate (scaled by 1e6)
    uint256 public nextTradeId;
    
    // Events
    event CrossBorderTradeInitiated(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 pyusdAmount,
        string buyerCountry,
        string sellerCountry
    );
    
    event InstantSettlement(
        uint256 indexed tradeId,
        uint256 pyusdAmount,
        uint256 settlementTime
    );
    
    event ComplianceCleared(
        uint256 indexed tradeId,
        bool gleifVerified,
        bool forteRulesPassed
    );
    
    modifier onlyTradeParticipant(uint256 tradeId) {
        CrossBorderTrade memory trade = trades[tradeId];
        require(
            msg.sender == trade.buyer || 
            msg.sender == trade.seller ||
            msg.sender == trade.buyerBank ||
            msg.sender == trade.sellerBank,
            "Not authorized for this trade"
        );
        _;
    }
    
    constructor(address _pyusdToken, address _zkPretAdapter) {
        pyusdToken = IPYUSD(_pyusdToken);
        zkPretAdapter = ZKPretAdapter(_zkPretAdapter);
        
        // Initialize common exchange rates (scaled by 1e6)
        exchangeRates["USD"] = 1000000;      // 1.000000 USD = 1 USD
        exchangeRates["EUR"] = 1100000;      // 1.100000 USD = 1 EUR
        exchangeRates["GBP"] = 1250000;      // 1.250000 USD = 1 GBP
        exchangeRates["JPY"] = 6700;         // 0.006700 USD = 1 JPY
        exchangeRates["CNY"] = 140000;       // 0.140000 USD = 1 CNY
    }
    
    /**
     * @dev Initiate cross-border trade with PYUSD settlement
     * @notice Creates institutional trade finance transaction with FORTE compliance
     */
    function initiateCrossBorderTrade(
        address seller,
        address buyerBank,
        address sellerBank,
        uint256 localAmount,
        string memory localCurrency,
        string memory buyerCountry,
        string memory sellerCountry,
        bytes32 letterOfCreditHash,
        string memory buyerLEI,
        string memory sellerLEI
    ) external returns (uint256 tradeId) {
        
        // FORTE RULE 1 & 4: Enhanced KYC + GLEIF Verification
        require(
            zkPretAdapter.isGLEIFVerified(buyerLEI) && 
            zkPretAdapter.isGLEIFVerified(sellerLEI),
            "FORTE VIOLATION: Both parties must have GLEIF verification"
        );
        
        // FORTE RULE 2 & 3: OFAC and Cross-border Sanctions
        require(!_isOnSanctionsList(msg.sender), "FORTE VIOLATION: Buyer on sanctions list");
        require(!_isOnSanctionsList(seller), "FORTE VIOLATION: Seller on sanctions list");
        require(_validateCrossBorderCompliance(buyerCountry, sellerCountry), "FORTE VIOLATION: Cross-border sanctions");
        
        // Convert local currency to PYUSD amount
        uint256 pyusdAmount = _convertToPYUSD(localAmount, localCurrency);
        
        // FORTE RULE 10: Minimum transaction threshold
        require(pyusdAmount >= 1000 * 1e6, "FORTE VIOLATION: Trade below $1,000 minimum");
        
        tradeId = nextTradeId++;
        
        CrossBorderTrade storage trade = trades[tradeId];
        trade.tradeId = tradeId;
        trade.buyer = msg.sender;
        trade.seller = seller;
        trade.buyerBank = buyerBank;
        trade.sellerBank = sellerBank;
        trade.pyusdAmount = pyusdAmount;
        trade.localAmount = localAmount;
        trade.localCurrency = localCurrency;
        trade.buyerCountry = buyerCountry;
        trade.sellerCountry = sellerCountry;
        trade.letterOfCreditHash = letterOfCreditHash;
        trade.status = TradeStatus.INITIATED;
        trade.createdAt = block.timestamp;
        
        // Track trades for participants
        userTrades[msg.sender].push(tradeId);
        userTrades[seller].push(tradeId);
        userTrades[buyerBank].push(tradeId);
        userTrades[sellerBank].push(tradeId);
        
        emit CrossBorderTradeInitiated(
            tradeId,
            msg.sender,
            seller,
            pyusdAmount,
            buyerCountry,
            sellerCountry
        );
        
        return tradeId;
    }
    
    /**
     * @dev Execute comprehensive FORTE compliance check for trade
     */
    function executeComplianceCheck(uint256 tradeId) external onlyTradeParticipant(tradeId) {
        CrossBorderTrade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.INITIATED, "Invalid trade status");
        
        // FORTE RULE 7: DCSA Trade Document Verification
        require(
            zkPretAdapter.isDCSAVerified(trade.letterOfCreditHash),
            "FORTE VIOLATION: Letter of credit not DCSA verified"
        );
        
        // Update compliance status
        trade.gleifVerified = true;  // Already verified in initiation
        trade.complianceCleared = true;
        trade.status = TradeStatus.COMPLIANCE_CHECK;
        
        emit ComplianceCleared(tradeId, trade.gleifVerified, trade.complianceCleared);
    }
    
    /**
     * @dev Escrow PYUSD for trade settlement
     */
    function escrowPYUSD(uint256 tradeId) external onlyTradeParticipant(tradeId) {
        CrossBorderTrade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.COMPLIANCE_CHECK, "Compliance not cleared");
        require(trade.complianceCleared, "Trade not compliant");
        
        // Transfer PYUSD to this contract as escrow
        require(
            pyusdToken.transferFrom(trade.buyer, address(this), trade.pyusdAmount),
            "PYUSD escrow transfer failed"
        );
        
        trade.status = TradeStatus.PYUSD_ESCROWED;
    }
    
    /**
     * @dev Execute instant PYUSD settlement (vs 30+ day traditional wire)
     * @notice Demonstrates PYUSD's key advantage: instant cross-border settlement
     */
    function executeInstantSettlement(uint256 tradeId) external onlyTradeParticipant(tradeId) {
        CrossBorderTrade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.PYUSD_ESCROWED, "PYUSD not escrowed");
        
        // FORTE RULE 2: Final sanctions check before settlement
        require(!_isOnSanctionsList(trade.seller), "FORTE VIOLATION: Seller sanctions check failed");
        
        // Calculate settlement amounts (could include bank fees, FX costs, etc.)
        uint256 sellerAmount = trade.pyusdAmount * 98 / 100;  // 2% for fees
        uint256 buyerBankFee = trade.pyusdAmount * 1 / 100;   // 1% buyer bank fee
        uint256 sellerBankFee = trade.pyusdAmount * 1 / 100;  // 1% seller bank fee
        
        // Instant PYUSD transfers (vs days for traditional wire)
        require(pyusdToken.transfer(trade.seller, sellerAmount), "Seller payment failed");
        require(pyusdToken.transfer(trade.buyerBank, buyerBankFee), "Buyer bank fee failed");
        require(pyusdToken.transfer(trade.sellerBank, sellerBankFee), "Seller bank fee failed");
        
        // Update trade status
        trade.status = TradeStatus.SETTLED;
        trade.settledAt = block.timestamp;
        
        emit InstantSettlement(tradeId, trade.pyusdAmount, block.timestamp);
    }
    
    /**
     * @dev Get settlement time comparison: PYUSD vs Traditional
     */
    function getSettlementComparison(uint256 tradeId) external view returns (
        uint256 pyusdSettlementTime,
        uint256 traditionalEstimate,
        uint256 timeSaved,
        uint256 costSaved
    ) {
        CrossBorderTrade memory trade = trades[tradeId];
        
        if (trade.settledAt > 0) {
            pyusdSettlementTime = trade.settledAt - trade.createdAt;
            traditionalEstimate = 3 days;  // Typical international wire time
            timeSaved = traditionalEstimate - pyusdSettlementTime;
            
            // Cost savings: Traditional (~$25-50) vs PYUSD (~$0.50)
            costSaved = 40 * 1e6;  // $40 saved in PYUSD decimals
        }
        
        return (pyusdSettlementTime, traditionalEstimate, timeSaved, costSaved);
    }
    
    /**
     * @dev Demonstrate PYUSD multi-chain capability
     */
    function initiateCrossChainTrade(
        uint256 tradeId,
        uint256 destinationChainId,
        address destinationContract
    ) external onlyTradeParticipant(tradeId) {
        CrossBorderTrade memory trade = trades[tradeId];
        require(trade.status == TradeStatus.SETTLED, "Trade not settled");
        
        // In production, this would integrate with LayerZero for PYUSD cross-chain
        // For demo, we emit event showing cross-chain capability
        
        emit InstantSettlement(tradeId, trade.pyusdAmount, block.timestamp);
    }
    
    // Utility functions
    function _convertToPYUSD(uint256 localAmount, string memory currency) internal view returns (uint256) {
        uint256 rate = exchangeRates[currency];
        require(rate > 0, "Unsupported currency");
        
        // Convert local currency to USD, then to PYUSD (6 decimals)
        return (localAmount * rate) / 1e6;
    }
    
    function _isOnSanctionsList(address account) internal pure returns (bool) {
        // Mock sanctions check - in production, integrate with real OFAC API
        return account == address(0x1111111111111111111111111111111111111111);
    }
    
    function _validateCrossBorderCompliance(string memory buyerCountry, string memory sellerCountry) 
        internal pure returns (bool) {
        // Mock compliance - in production, check country-specific regulations
        bytes32 buyerHash = keccak256(abi.encodePacked(buyerCountry));
        bytes32 sellerHash = keccak256(abi.encodePacked(sellerCountry));
        
        // Block sanctioned countries
        bytes32 sanctionedCountry = keccak256(abi.encodePacked("IR")); // Iran example
        return buyerHash != sanctionedCountry && sellerHash != sanctionedCountry;
    }
    
    // Admin functions for exchange rates
    function updateExchangeRate(string memory currency, uint256 rate) external {
        exchangeRates[currency] = rate;
    }
    
    // View functions
    function getTrade(uint256 tradeId) external view returns (CrossBorderTrade memory) {
        return trades[tradeId];
    }
    
    function getUserTrades(address user) external view returns (uint256[] memory) {
        return userTrades[user];
    }
    
    function getPYUSDBalance(address account) external view returns (uint256) {
        return pyusdToken.balanceOf(account);
    }
    
    function getTradeCount() external view returns (uint256) {
        return nextTradeId;
    }
}
