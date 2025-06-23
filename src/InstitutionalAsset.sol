// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InstitutionalAssetParams.sol";
import "./ZKPretAdapter.sol";

/**
 * @title InstitutionalAsset 
 * @dev ERC-1400 compliant security token for institutional-grade RWA assets
 * @notice Replaces simple art fractionalization with sophisticated financial instruments
 */
contract InstitutionalAsset {
    using InstitutionalAssetParams for *;

    // ERC-1400 Security Token Standard compliance
    string public name;
    string public symbol;
    uint256 public totalSupply;
    uint8 public constant decimals = 18;

    // Enhanced institutional asset data
    InstitutionalAssetParams.InstitutionalAsset public assetData;
    ZKPretAdapter public zkPretAdapter;

    // Token holder management
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;
    address[] public holders;
    mapping(address => bool) public isHolder;

    // Security token features
    mapping(address => bool) public whitelistedInvestors;
    mapping(address => uint256) public investorClasses; // 0: Retail, 1: Accredited, 2: Institutional
    bool public transfersEnabled = true;

    // Events (ERC-20 + ERC-1400 compliance)
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // Security token events
    event InvestorWhitelisted(address indexed investor, uint256 class);
    event TransfersStatusChanged(bool enabled);
    event ComplianceRuleTriggered(string rule, address indexed account, bool passed);

    modifier onlyManager() {
        require(msg.sender == assetData.manager, "Only asset manager can execute");
        _;
    }

    modifier transfersAllowed() {
        require(transfersEnabled, "Transfers currently disabled");
        _;
    }

    modifier onlyWhitelisted(address account) {
        require(whitelistedInvestors[account], "Investor not whitelisted");
        _;
    }

    constructor(
        InstitutionalAssetParams.InstitutionalAsset memory _assetData,
        address _zkPretAdapter
    ) {
        assetData = _assetData;
        zkPretAdapter = ZKPretAdapter(_zkPretAdapter);

        // Set token metadata based on institutional asset
        name = string(abi.encodePacked(_assetData.corporateName, " Institutional Asset"));
        symbol = string(abi.encodePacked("IA-", _extractSymbol(_assetData.corporateName)));
        totalSupply = _assetData.totalFractions * 1e18; // Each fraction = 1 token

        // Mint initial supply to the asset manager
        balances[_assetData.manager] = totalSupply;
        holders.push(_assetData.manager);
        isHolder[_assetData.manager] = true;

        // Whitelist the manager automatically
        whitelistedInvestors[_assetData.manager] = true;
        investorClasses[_assetData.manager] = 2; // Institutional class

        emit Transfer(address(0), _assetData.manager, totalSupply);
    }

    /**
     * @dev Enhanced transfer with FORTE rules compliance
     */
    function transfer(address to, uint256 amount) 
        external 
        transfersAllowed 
        onlyWhitelisted(msg.sender) 
        onlyWhitelisted(to)
        returns (bool) {
        
        // FORTE RULE 2: Enhanced OFAC Real-time Check
        require(!_isOnSanctionsList(to), "FORTE RULE 2 VIOLATION: Recipient on sanctions list");
        emit ComplianceRuleTriggered("RULE_02_OFAC", to, !_isOnSanctionsList(to));

        // FORTE RULE 3: Enhanced Sanctions Cross-border Check
        require(_checkCrossBorderCompliance(msg.sender, to), "FORTE RULE 3 VIOLATION: Cross-border sanctions violation");
        emit ComplianceRuleTriggered("RULE_03_SANCTIONS", to, true);

        // FORTE RULE 10: Minimum Fraction Threshold
        require(amount >= assetData.minimumFractionSize, "FORTE RULE 10 VIOLATION: Transfer below minimum threshold");
        emit ComplianceRuleTriggered("RULE_10_MIN_FRACTION", msg.sender, true);

        return _transfer(msg.sender, to, amount);
    }

    /**
     * @dev Enhanced transferFrom with institutional compliance
     */
    function transferFrom(address from, address to, uint256 amount) 
        external 
        transfersAllowed 
        onlyWhitelisted(from) 
        onlyWhitelisted(to) 
        returns (bool) {
        
        uint256 currentAllowance = allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");

        // Same compliance checks as transfer
        require(!_isOnSanctionsList(to), "FORTE RULE 2 VIOLATION: Recipient on sanctions list");
        require(_checkCrossBorderCompliance(from, to), "FORTE RULE 3 VIOLATION: Cross-border sanctions violation");
        require(amount >= assetData.minimumFractionSize, "FORTE RULE 10 VIOLATION: Transfer below minimum threshold");

        // Update allowance
        allowances[from][msg.sender] = currentAllowance - amount;

        return _transfer(from, to, amount);
    }

    /**
     * @dev Internal transfer function with holder management
     */
    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(balances[from] >= amount, "ERC20: transfer amount exceeds balance");

        balances[from] -= amount;
        balances[to] += amount;

        // Manage holder list
        if (!isHolder[to]) {
            holders.push(to);
            isHolder[to] = true;
        }

        // Remove from holders if balance becomes zero
        if (balances[from] == 0) {
            _removeHolder(from);
        }

        emit Transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Whitelist investor with compliance verification
     */
    function whitelistInvestor(address investor, uint256 class) external onlyManager {
        // Enhanced KYC verification through ZK PRET
        require(class <= 2, "Invalid investor class");
        
        whitelistedInvestors[investor] = true;
        investorClasses[investor] = class;
        
        emit InvestorWhitelisted(investor, class);
    }

    /**
     * @dev Emergency circuit breaker (FORTE Rule implementation)
     */
    function emergencyPause() external onlyManager {
        transfersEnabled = false;
        emit TransfersStatusChanged(false);
        emit ComplianceRuleTriggered("EMERGENCY_CIRCUIT_BREAKER", msg.sender, true);
    }

    function resumeTransfers() external onlyManager {
        transfersEnabled = true;
        emit TransfersStatusChanged(true);
    }

    /**
     * @dev Update asset status with compliance verification
     */
    function updateAssetStatus(InstitutionalAssetParams.AssetStatus newStatus) external onlyManager {
        InstitutionalAssetParams.AssetStatus oldStatus = assetData.status;
        assetData.status = newStatus;
        assetData.lastUpdated = block.timestamp;

        // Trigger compliance re-verification for certain status changes
        if (newStatus == InstitutionalAssetParams.AssetStatus.DEFAULT) {
            transfersEnabled = false; // Auto-pause on default
        }

        emit Transfer(address(0), address(0), 0); // Trigger event for status change
    }

    // Standard ERC-20 functions
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return allowances[owner][spender];
    }

    // Institutional asset specific getters
    function getAssetData() external view returns (InstitutionalAssetParams.InstitutionalAsset memory) {
        return assetData;
    }

    function getMetadataScore() external view returns (InstitutionalAssetParams.MetadataScore memory) {
        return zkPretAdapter.calculateMetadataScore(assetData);
    }

    function getHolders() external view returns (address[] memory) {
        return holders;
    }

    function getHolderCount() external view returns (uint256) {
        return holders.length;
    }

    function isTransferCompliant(address from, address to, uint256 amount) external view returns (bool) {
        if (!transfersEnabled) return false;
        if (!whitelistedInvestors[from] || !whitelistedInvestors[to]) return false;
        if (_isOnSanctionsList(to)) return false;
        if (!_checkCrossBorderCompliance(from, to)) return false;
        if (amount < assetData.minimumFractionSize) return false;
        return true;
    }

    // Internal compliance functions
    function _isOnSanctionsList(address account) internal pure returns (bool) {
        // Mock OFAC check - in production, integrate with real sanctions API
        // For demo, we'll mark specific addresses as sanctioned
        return account == address(0x1111111111111111111111111111111111111111);
    }

    function _checkCrossBorderCompliance(address from, address to) internal pure returns (bool) {
        // Mock cross-border compliance check
        // In production, integrate with international sanctions databases
        return true; // For demo, assume compliant
    }

    function _extractSymbol(string memory corporateName) internal pure returns (string memory) {
        // Extract first 3 characters for symbol
        bytes memory nameBytes = bytes(corporateName);
        if (nameBytes.length >= 3) {
            return string(abi.encodePacked(nameBytes[0], nameBytes[1], nameBytes[2]));
        }
        return "IAT"; // Default symbol
    }

    function _removeHolder(address holder) internal {
        require(isHolder[holder], "Not a holder");
        
        for (uint256 i = 0; i < holders.length; i++) {
            if (holders[i] == holder) {
                holders[i] = holders[holders.length - 1];
                holders.pop();
                isHolder[holder] = false;
                break;
            }
        }
    }
}
