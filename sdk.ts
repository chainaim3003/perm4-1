/**
 * FORTE SDK Integration for Institutional RWA Platform
 * Manages 14-rule policy deployment and enforcement
 * Note: Using mock FORTE implementation for demo purposes
 */

import { ethers } from 'ethers';
import { promises as fs } from 'fs';
import { zkPretManager } from './zkpret-integration/ZKPretAdapter.ts';
import * as dotenv from 'dotenv';

dotenv.config();

export class ForteSDKManager {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private policyRegistry: Map<string, any> = new Map();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.FORTE_RPC_URL || 'http://localhost:8545');
    this.wallet = new ethers.Wallet(
      process.env.FORTE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider
    );
  }

  /**
   * Setup institutional RWA policy with all 12 rules
   */
  async setupPolicy(policyPath: string): Promise<string> {
    try {
      const policyContent = await fs.readFile(policyPath, 'utf-8');
      const policy = JSON.parse(policyContent);
      
      console.log(`🏛️ Setting up FORTE policy: ${policy.policyName}`);
      console.log(`📋 Rules count: ${policy.rules.length}`);

      // Register policy in FORTE engine
      const policyId = this.generatePolicyId(policy);
      this.policyRegistry.set(policyId, policy);

      // Initialize ZK PRET integrations
      await this.initializeZKPretIntegrations(policy.zkPretIntegrations);

      console.log(`✅ Policy ${policyId} registered successfully`);
      console.log(`🔗 ZK PRET integrations: ${Object.keys(policy.zkPretIntegrations).join(', ')}`);

      return policyId;
    } catch (error) {
      console.error('❌ Failed to setup policy:', error);
      throw error;
    }
  }

  /**
   * Apply policy to contract address
   */
  async applyPolicy(policyId: string, contractAddress: string): Promise<boolean> {
    try {
      const policy = this.policyRegistry.get(policyId);
      if (!policy) {
        throw new Error(`Policy ${policyId} not found`);
      }

      console.log(`🎯 Applying policy ${policyId} to contract ${contractAddress}`);
      
      // In production FORTE integration, this would call the actual FORTE API
      // For demo, we simulate the policy application
      const simulatedResult = await this.simulatePolicyApplication(policy, contractAddress);

      if (simulatedResult.success) {
        console.log(`✅ Policy applied successfully`);
        console.log(`📊 Active rules: ${simulatedResult.activeRules.length}/12`);
        return true;
      } else {
        console.error(`❌ Policy application failed: ${simulatedResult.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to apply policy:', error);
      return false;
    }
  }

  /**
   * Check rules compliance for a transaction
   */
  async checkRules(policyId: string, transactionData: any): Promise<{
    compliant: boolean;
    passedRules: string[];
    failedRules: string[];
    warnings: string[];
  }> {
    const policy = this.policyRegistry.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const result = {
      compliant: true,
      passedRules: [] as string[],
      failedRules: [] as string[],
      warnings: [] as string[]
    };

    console.log(`🔍 Checking ${policy.rules.length} FORTE rules...`);

    for (const rule of policy.rules) {
      try {
        const ruleResult = await this.evaluateRule(rule, transactionData);
        
        if (ruleResult.passed) {
          result.passedRules.push(rule.ruleId);
          console.log(`✅ ${rule.ruleId}: ${rule.name} - PASSED`);
        } else {
          if (rule.action === 'DENY') {
            result.failedRules.push(rule.ruleId);
            result.compliant = false;
            console.log(`❌ ${rule.ruleId}: ${rule.name} - FAILED (${ruleResult.reason})`);
          } else if (rule.action === 'WARN') {
            result.warnings.push(rule.ruleId);
            console.log(`⚠️ ${rule.ruleId}: ${rule.name} - WARNING (${ruleResult.reason})`);
          } else if (rule.action === 'ADJUST') {
            result.warnings.push(rule.ruleId);
            console.log(`🔧 ${rule.ruleId}: ${rule.name} - ADJUSTED (${ruleResult.reason})`);
          }
        }
      } catch (error) {
        result.failedRules.push(rule.ruleId);
        result.compliant = false;
        console.log(`💥 ${rule.ruleId}: ${rule.name} - ERROR (${error})`);
      }
    }

    console.log(`\n📊 Rules Summary:`);
    console.log(`✅ Passed: ${result.passedRules.length}`);
    console.log(`❌ Failed: ${result.failedRules.length}`);
    console.log(`⚠️ Warnings: ${result.warnings.length}`);
    console.log(`🎯 Overall Compliance: ${result.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);

    return result;
  }

  /**
   * Evaluate individual rule
   */
  private async evaluateRule(rule: any, transactionData: any): Promise<{
    passed: boolean;
    reason?: string;
  }> {
    switch (rule.ruleId) {
      case 'RULE_01': // Enhanced KYC + GLEIF
        return this.evaluateRule01(transactionData);
      case 'RULE_02': // Enhanced OFAC
        return this.evaluateRule02(transactionData);
      case 'RULE_03': // Cross-border sanctions
        return this.evaluateRule03(transactionData);
      case 'RULE_04': // GLEIF verification
        return this.evaluateRule04(transactionData);
      case 'RULE_05': // BPMN compliance
        return this.evaluateRule05(transactionData);
      case 'RULE_06': // ACTUS risk assessment
        return this.evaluateRule06(transactionData);
      case 'RULE_07': // DCSA documents
        return this.evaluateRule07(transactionData);
      case 'RULE_08': // Optimal fractions
        return this.evaluateRule08(transactionData);
      case 'RULE_09': // Metadata score
        return this.evaluateRule09(transactionData);
      case 'RULE_10': // Minimum fraction
        return this.evaluateRule10(transactionData);
      case 'RULE_11': // Liquidity optimization
        return this.evaluateRule11(transactionData);
      case 'RULE_12': // Enhanced metadata enforcement
        return this.evaluateRule12(transactionData);
      case 'RULE_13': // PYUSD peg verification  
        return this.evaluateRule13(transactionData);
      case 'RULE_14': // Cross-border PYUSD compliance
        return this.evaluateRule14(transactionData);
      default:
        return { passed: false, reason: 'Unknown rule' };
    }
  }

  // Rule evaluation implementations
  private async evaluateRule01(data: any): Promise<{ passed: boolean; reason?: string }> {
    if (!data.legalEntityIdentifier) {
      return { passed: false, reason: 'Missing LEI' };
    }
    const gleifResult = await zkPretManager.verifyGLEIF(data.legalEntityIdentifier, data.corporateName);
    return { 
      passed: gleifResult.verified, 
      reason: gleifResult.verified ? undefined : 'GLEIF verification failed' 
    };
  }

  private async evaluateRule02(data: any): Promise<{ passed: boolean; reason?: string }> {
    // Mock OFAC check - in production, integrate with real OFAC API
    const sanctionedAddresses = ['0x1111111111111111111111111111111111111111'];
    const isOnSanctionsList = sanctionedAddresses.includes(data.recipient?.toLowerCase());
    return { 
      passed: !isOnSanctionsList, 
      reason: isOnSanctionsList ? 'Recipient on OFAC sanctions list' : undefined 
    };
  }

  private async evaluateRule03(data: any): Promise<{ passed: boolean; reason?: string }> {
    // Mock cross-border sanctions check
    return { passed: true };
  }

  private async evaluateRule04(data: any): Promise<{ passed: boolean; reason?: string }> {
    if (!data.legalEntityIdentifier || data.legalEntityIdentifier.length !== 20) {
      return { passed: false, reason: 'Invalid LEI format' };
    }
    return { passed: true };
  }

  private async evaluateRule05(data: any): Promise<{ passed: boolean; reason?: string }> {
    const bpmnResult = await zkPretManager.verifyBPMNCompliance(data.assetDescription, data.assetDescription);
    return { 
      passed: bpmnResult.verified, 
      reason: bpmnResult.verified ? undefined : 'BPMN compliance verification failed' 
    };
  }

  private async evaluateRule06(data: any): Promise<{ passed: boolean; reason?: string }> {
    const actusResult = await zkPretManager.assessACTUSRisk(data);
    return { 
      passed: (actusResult.score || 999) <= 500, 
      reason: (actusResult.score || 999) > 500 ? `Risk score too high: ${actusResult.score}` : undefined 
    };
  }

  private async evaluateRule07(data: any): Promise<{ passed: boolean; reason?: string }> {
    const dcsaResult = await zkPretManager.verifyDCSADocuments(data.documentHash, data.tradeDocuments || []);
    return { 
      passed: dcsaResult.verified, 
      reason: dcsaResult.verified ? undefined : 'DCSA document verification failed' 
    };
  }

  private async evaluateRule08(data: any): Promise<{ passed: boolean; reason?: string }> {
    const fractionParams = zkPretManager.calculateOptimalFractions(data.principalAmount, data.assetType);
    const isOptimal = fractionParams.optimalCount >= 10 && fractionParams.optimalCount <= 10000;
    return { 
      passed: isOptimal, 
      reason: isOptimal ? undefined : `Suboptimal fraction count: ${fractionParams.optimalCount}` 
    };
  }

  private async evaluateRule09(data: any): Promise<{ passed: boolean; reason?: string }> {
    const metadataScore = await zkPretManager.calculateMetadataScore(data);
    return { 
      passed: metadataScore.totalScore >= 70, 
      reason: metadataScore.totalScore < 70 ? `Metadata score too low: ${metadataScore.totalScore}/100` : undefined 
    };
  }

  private async evaluateRule10(data: any): Promise<{ passed: boolean; reason?: string }> {
    const minimumSize = 500; // $500 minimum
    const transferAmount = data.transferAmount || data.minimumFractionSize || 0;
    return { 
      passed: transferAmount >= minimumSize, 
      reason: transferAmount < minimumSize ? `Transfer below minimum: $${transferAmount}` : undefined 
    };
  }

  private async evaluateRule11(data: any): Promise<{ passed: boolean; reason?: string }> {
    const totalFractions = data.totalFractions || 0;
    const inOptimalRange = totalFractions >= 100 && totalFractions <= 5000;
    return { 
      passed: true, // Warning only rule
      reason: inOptimalRange ? undefined : `Fraction count ${totalFractions} outside optimal liquidity range` 
    };
  }

  private async evaluateRule12(data: any): Promise<{ passed: boolean; reason?: string }> {
    const thresholdCheck = await zkPretManager.checkMetadataThreshold(data);
    return { 
      passed: thresholdCheck.meetsThreshold, 
      reason: thresholdCheck.meetsThreshold ? undefined : `Metadata score ${thresholdCheck.currentScore} below required ${thresholdCheck.requiredScore}` 
    };
  }

  private async evaluateRule13(data: any): Promise<{ passed: boolean; reason?: string }> {
    // PYUSD Stablecoin Peg Verification
    const pyusdAmount = data.pyusdAmount || data.principalAmount || 0;
    
    // Mock PYUSD peg check - in production, integrate with Paxos API or price oracles
    const pyusdPegPrice = 1.001; // Simulated current PYUSD price in USD
    const pegStable = pyusdPegPrice >= 0.995 && pyusdPegPrice <= 1.005;
    
    // Check Paxos reserves (mock) - in production, verify through Paxos reserve reports
    const sufficientReserves = pyusdAmount <= 50000000; // Mock $50M liquidity limit
    
    // Check PYUSD liquidity for institutional trades
    const meetsMininumLiquidity = pyusdAmount >= 1000000; // $1M minimum for institutional
    
    if (!pegStable) {
      return { passed: false, reason: `PYUSD peg unstable: ${pyusdPegPrice} (outside 0.995-1.005 range)` };
    }
    
    if (!sufficientReserves) {
      return { passed: false, reason: `PYUSD amount ${pyusdAmount} exceeds available liquidity` };
    }
    
    if (!meetsMininumLiquidity) {
      return { passed: false, reason: `PYUSD amount ${pyusdAmount} below institutional minimum $1M` };
    }
    
    return { passed: true };
  }

  private async evaluateRule14(data: any): Promise<{ passed: boolean; reason?: string }> {
    // Cross-Border PYUSD Settlement Compliance
    const buyerCountry = data.buyerCountry || 'US';
    const sellerCountry = data.sellerCountry || 'US';
    const pyusdAmount = data.pyusdAmount || data.principalAmount || 0;
    
    // FATF compliant countries for PYUSD cross-border
    const supportedCountries = ['US', 'GB', 'DE', 'JP', 'IN', 'SG', 'CA', 'AU', 'FR', 'IT', 'ES', 'NL'];
    const restrictedCountries = ['IR', 'KP', 'CU', 'SY', 'AF']; // Sanctions list
    
    // Check if both countries support PYUSD cross-border
    if (!supportedCountries.includes(buyerCountry) || !supportedCountries.includes(sellerCountry)) {
      return { 
        passed: false, 
        reason: `PYUSD cross-border not supported for ${buyerCountry} ↔ ${sellerCountry}` 
      };
    }
    
    // Check restricted countries
    if (restrictedCountries.includes(buyerCountry) || restrictedCountries.includes(sellerCountry)) {
      return { 
        passed: false, 
        reason: `PYUSD cross-border restricted for ${buyerCountry} ↔ ${sellerCountry}` 
      };
    }
    
    // Check cross-border amount limits (varies by country pair)
    const maxCrossBorderAmount = this.getCrossBorderLimit(buyerCountry, sellerCountry);
    if (pyusdAmount > maxCrossBorderAmount) {
      return { 
        passed: false, 
        reason: `PYUSD amount ${pyusdAmount} exceeds cross-border limit ${maxCrossBorderAmount} for ${buyerCountry} ↔ ${sellerCountry}` 
      };
    }
    
    // India-specific compliance checks
    if (buyerCountry === 'IN' || sellerCountry === 'IN') {
      // RBI (Reserve Bank of India) compliance for digital currency transactions
      const indiaCompliant = this.checkIndiaRBICompliance(pyusdAmount);
      if (!indiaCompliant.compliant) {
        return { passed: false, reason: indiaCompliant.reason };
      }
    }
    
    return { passed: true };
  }
  
  private getCrossBorderLimit(buyerCountry: string, sellerCountry: string): number {
    // Mock cross-border limits - in production, integrate with regulatory APIs
    const countryPairLimits: { [key: string]: number } = {
      'US-GB': 100000000,  // $100M
      'US-DE': 100000000,  // $100M  
      'US-JP': 75000000,   // $75M
      'US-IN': 50000000,   // $50M (RBI limits)
      'US-SG': 100000000,  // $100M
      'GB-DE': 100000000,  // $100M
      'DE-JP': 75000000,   // $75M
      'default': 25000000  // $25M default
    };
    
    const key1 = `${buyerCountry}-${sellerCountry}`;
    const key2 = `${sellerCountry}-${buyerCountry}`;
    
    return countryPairLimits[key1] || countryPairLimits[key2] || countryPairLimits['default'];
  }
  
  private checkIndiaRBICompliance(pyusdAmount: number): { compliant: boolean; reason?: string } {
    // Reserve Bank of India specific compliance for digital currency cross-border transactions
    
    // RBI has specific limits and requirements for digital currency transactions
    const rbiMaxLimit = 50000000; // $50M annual limit per entity
    const rbiMinReporting = 1000000; // $1M reporting threshold
    
    if (pyusdAmount > rbiMaxLimit) {
      return { 
        compliant: false, 
        reason: `PYUSD amount ${pyusdAmount} exceeds RBI annual limit ${rbiMaxLimit}` 
      };
    }
    
    if (pyusdAmount >= rbiMinReporting) {
      // In production, verify additional RBI reporting requirements are met
      // For demo, we assume compliance
      console.log(`RBI reporting required for PYUSD amount: ${pyusdAmount}`);
    }
    
    return { compliant: true };
  }

  // Helper methods
  private generatePolicyId(policy: any): string {
    return `POLICY_${Date.now()}_${policy.policyName.replace(/\s+/g, '_').toUpperCase()}`;
  }

  private async initializeZKPretIntegrations(integrations: any): Promise<void> {
    console.log('🔗 Initializing ZK PRET integrations...');
    for (const [key, config] of Object.entries(integrations)) {
      console.log(`  📎 ${key}: ${(config as any).verifierPath}`);
    }
  }

  private async simulatePolicyApplication(policy: any, contractAddress: string): Promise<{
    success: boolean;
    activeRules: string[];
    error?: string;
  }> {
    // Simulate FORTE policy application
    return {
      success: true,
      activeRules: policy.rules.map((r: any) => r.ruleId)
    };
  }
}

// CLI execution
if (process.argv[1] === new URL(import.meta.url).pathname.replace(/\\/g, '/')) {
  const args = process.argv.slice(2);
  const sdk = new ForteSDKManager();

  if (args[0] === 'setupPolicy') {
    sdk.setupPolicy(args[1]).then(policyId => {
      console.log(`Policy ID: ${policyId}`);
    }).catch(console.error);
  } else if (args[0] === 'applyPolicy') {
    sdk.applyPolicy(args[1], args[2]).then(success => {
      console.log(`Policy application: ${success ? 'SUCCESS' : 'FAILED'}`);
    }).catch(console.error);
  } else if (args[0] === 'checkRules') {
    // Demo transaction data for rule checking
    const demoData = {
      corporateName: "APPLE INC",
      legalEntityIdentifier: "HWUPKR0MPOU8FGXBT394",
      assetType: "SUPPLY_CHAIN_INVOICE",
      principalAmount: 5000000,
      pyusdAmount: 5000000, // Added for PYUSD rules
      maturityDays: 90,
      interestRate: 850,
      creditRating: "BBB",
      assetDescription: "90-day supplier invoice from verified vendor",
      documentHash: "0x1234567890abcdef",
      tradeDocuments: ["invoice_001.pdf", "bill_of_lading.pdf"],
      totalFractions: 5000,
      minimumFractionSize: 1000,
      transferAmount: 1000,
      recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      buyerCountry: "US", // Added for cross-border PYUSD rules
      sellerCountry: "IN"  // Added India example
    };

    sdk.setupPolicy('policies/institutional-rwa-complete.json').then(policyId => {
      return sdk.checkRules(policyId, demoData);
    }).then(result => {
      console.log('\n🎯 Final Result:', result.compliant ? 'COMPLIANT' : 'NON-COMPLIANT');
    }).catch(console.error);
  } else {
    console.log('Usage: tsx sdk.ts [setupPolicy|applyPolicy|checkRules] [args...]');
  }
}

export default ForteSDKManager;
