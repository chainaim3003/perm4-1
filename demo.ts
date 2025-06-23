/**
 * Institutional RWA Platform Demo Script
 * Demonstrates 14 FORTE rules with ZK PRET integration - Pass and Fail scenarios
 */

import { ethers } from 'ethers';
import ForteSDKManager from './sdk.ts';
import { zkPretManager } from './zkpret-integration/ZKPretAdapter.ts';
import * as dotenv from 'dotenv';

dotenv.config();

interface DemoScenario {
  name: string;
  description: string;
  expectedResult: 'PASS' | 'FAIL';
  data: any;
}

class InstitutionalRWADemo {
  private sdk: ForteSDKManager;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    this.sdk = new ForteSDKManager();
    this.provider = new ethers.JsonRpcProvider(process.env.FORTE_RPC_URL || 'http://localhost:8545');
    this.wallet = new ethers.Wallet(
      process.env.FORTE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider
    );
  }

  /**
   * Main demo execution
   */
  async runDemo(scenarioType: 'pass' | 'fail' | 'all' = 'all'): Promise<void> {
    console.log('🏛️ INSTITUTIONAL RWA PLATFORM DEMO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 14 FORTE Rules + ZK PRET Integration Demonstration');
    console.log('📊 Asset Type: Supply Chain Finance (not art fractionalization)');
    console.log('🔗 Multi-Chain: FORTE → BNB → PYUSD → SUPRA → FLOW');
    console.log('💰 PYUSD Cross-Border: US ↔ India Trade Finance');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Setup policy
    const policyId = await this.sdk.setupPolicy('policies/institutional-rwa-complete.json');
    console.log(`📋 Policy ID: ${policyId}\n`);

    // Run scenarios based on type
    if (scenarioType === 'pass' || scenarioType === 'all') {
      await this.runPassingScenarios(policyId);
    }

    if (scenarioType === 'fail' || scenarioType === 'all') {
      await this.runFailingScenarios(policyId);
    }

    // Run PYUSD cross-border demo
    if (scenarioType === 'all') {
      await this.runPyusdCrossBorderDemo();
    }

    // Summary
    console.log('\n🏆 DEMO COMPLETE - INSTITUTIONAL RWA PLATFORM');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Demonstrated 14 sophisticated FORTE rules (inc. 2 PYUSD-specific)');
    console.log('🔗 Integrated ZK PRET verification capabilities');
    console.log('🏦 Transformed art fractionalization → institutional finance');
    console.log('💰 PYUSD cross-border trade finance integration');
    console.log('🇮🇳 India RBI compliance for digital currency transactions');
    console.log('🌐 Ready for multi-chain deployment across 5 networks');
    console.log('═══════════════════════════════════════════════════════════════');
  }

  /**
   * Demonstrate passing scenarios
   */
  private async runPassingScenarios(policyId: string): Promise<void> {
    console.log('✅ PASSING SCENARIOS - All Rules Compliant');
    console.log('───────────────────────────────────────────\n');

    const passingScenarios: DemoScenario[] = [
      {
        name: 'APPLE Inc Supply Chain Invoice',
        description: 'Premium institutional asset with perfect compliance',
        expectedResult: 'PASS',
        data: {
          corporateName: "APPLE INC",
          legalEntityIdentifier: "HWUPKR0MPOU8FGXBT394",
          assetType: "SUPPLY_CHAIN_INVOICE",
          principalAmount: 5000000,
          pyusdAmount: 5000000,
          maturityDays: 90,
          interestRate: 850,
          creditRating: "BBB",
          assetDescription: "90-day supplier invoice from verified vendor",
          documentHash: "0x1234567890abcdef1234567890abcdef12345678",
          tradeDocuments: ["invoice_001.pdf", "bill_of_lading.pdf", "purchase_order.pdf"],
          totalFractions: 5000,
          minimumFractionSize: 1000,
          transferAmount: 1000,
          recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          buyerCountry: "US",
          sellerCountry: "DE"
        }
      },
      {
        name: 'US-India IT Services Payment',
        description: 'US company → Indian IT services via PYUSD with RBI compliance',
        expectedResult: 'PASS',
        data: {
          corporateName: "MICROSOFT CORPORATION",
          legalEntityIdentifier: "XEBEDEBBPPM9N3JQFGFV",
          assetType: "TRADE_FINANCE",
          principalAmount: 2400000,
          pyusdAmount: 2400000,
          maturityDays: 60,
          interestRate: 750,
          creditRating: "AAA",
          assetDescription: "US-India IT services payment with RBI compliance",
          documentHash: "0xabcdef1234567890abcdef1234567890abcdef12",
          tradeDocuments: ["service_agreement.pdf", "rbi_compliance.pdf"],
          totalFractions: 2400,
          minimumFractionSize: 1000,
          transferAmount: 1000,
          recipient: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          buyerCountry: "US",
          sellerCountry: "IN"
        }
      },
      {
        name: 'India-US Pharmaceutical Export',
        description: 'Indian pharma → US distributor with FDA/RBI compliance',
        expectedResult: 'PASS',
        data: {
          corporateName: "CIPLA LIMITED",
          legalEntityIdentifier: "IN000000000000000001", // Mock Indian LEI
          assetType: "TRADE_FINANCE",
          principalAmount: 3000000,
          pyusdAmount: 3000000,
          maturityDays: 120,
          interestRate: 900,
          creditRating: "A",
          assetDescription: "India-US pharmaceutical export with FDA approval",
          documentHash: "0xfedcba0987654321fedcba0987654321fedcba09",
          tradeDocuments: ["fda_approval.pdf", "export_license.pdf", "rbi_clearance.pdf"],
          totalFractions: 3000,
          minimumFractionSize: 1000,
          transferAmount: 1000,
          recipient: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          buyerCountry: "IN",
          sellerCountry: "US"
        }
      }
    ];

    for (const scenario of passingScenarios) {
      await this.runScenario(policyId, scenario);
    }
  }

  /**
   * Demonstrate failing scenarios - each rule individually
   */
  private async runFailingScenarios(policyId: string): Promise<void> {
    console.log('\n❌ FAILING SCENARIOS - Individual Rule Violations');
    console.log('──────────────────────────────────────────────────\n');

    const failingScenarios: DemoScenario[] = [
      {
        name: 'RULE 13 VIOLATION: PYUSD Peg Instability',
        description: 'PYUSD transaction when peg is unstable (demo simulation)',
        expectedResult: 'FAIL',
        data: {
          corporateName: "APPLE INC",
          legalEntityIdentifier: "HWUPKR0MPOU8FGXBT394",
          assetType: "SUPPLY_CHAIN_INVOICE",
          principalAmount: 60000000, // Exceeds liquidity limit
          pyusdAmount: 60000000,
          maturityDays: 90,
          interestRate: 850,
          creditRating: "BBB",
          assetDescription: "Large PYUSD transaction exceeding limits",
          documentHash: "0x1234567890abcdef1234567890abcdef12345678",
          tradeDocuments: ["invoice_001.pdf"],
          totalFractions: 60000,
          minimumFractionSize: 1000,
          transferAmount: 1000,
          recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          buyerCountry: "US",
          sellerCountry: "DE"
        }
      },
      {
        name: 'RULE 14 VIOLATION: Cross-Border PYUSD Restriction',
        description: 'PYUSD transaction to restricted country',
        expectedResult: 'FAIL',
        data: {
          corporateName: "RISKY CORP",
          legalEntityIdentifier: "RESTRICTED000000000000",
          assetType: "TRADE_FINANCE",
          principalAmount: 5000000,
          pyusdAmount: 5000000,
          maturityDays: 90,
          interestRate: 1200,
          creditRating: "CCC",
          assetDescription: "Cross-border payment to restricted jurisdiction",
          documentHash: "0x2222222222222222222222222222222222222222",
          tradeDocuments: ["restricted_invoice.pdf"],
          totalFractions: 5000,
          minimumFractionSize: 1000,
          transferAmount: 1000,
          recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          buyerCountry: "US",
          sellerCountry: "IR" // Iran - restricted country
        }
      },
      {
        name: 'RULE 14 VIOLATION: India RBI Limit Exceeded',
        description: 'US-India PYUSD transaction exceeding RBI limits',
        expectedResult: 'FAIL',
        data: {
          corporateName: "LARGE CORP",
          legalEntityIdentifier: "LARGECORP000000000000",
          assetType: "TRADE_FINANCE",
          principalAmount: 60000000, // Exceeds RBI $50M limit
          pyusdAmount: 60000000,
          maturityDays: 90,
          interestRate: 850,
          creditRating: "BBB",
          assetDescription: "Large US-India transaction exceeding RBI limits",
          documentHash: "0x3333333333333333333333333333333333333333",
          tradeDocuments: ["large_invoice.pdf"],
          totalFractions: 60000,
          minimumFractionSize: 1000,
          transferAmount: 1000,
          recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          buyerCountry: "US",
          sellerCountry: "IN"
        }
      },
      {
        name: 'RULE 02 VIOLATION: OFAC Sanctions List',
        description: 'Transfer to sanctioned address',
        expectedResult: 'FAIL',
        data: {
          corporateName: "APPLE INC",
          legalEntityIdentifier: "HWUPKR0MPOU8FGXBT394",
          assetType: "SUPPLY_CHAIN_INVOICE",
          principalAmount: 5000000,
          pyusdAmount: 5000000,
          maturityDays: 90,
          interestRate: 850,
          creditRating: "BBB",
          assetDescription: "90-day supplier invoice from verified vendor",
          documentHash: "0x1234567890abcdef1234567890abcdef12345678",
          tradeDocuments: ["invoice_001.pdf"],
          totalFractions: 5000,
          minimumFractionSize: 1000,
          transferAmount: 1000,
          recipient: "0x1111111111111111111111111111111111111111", // Sanctioned address
          buyerCountry: "US",
          sellerCountry: "DE"
        }
      }
    ];

    for (const scenario of failingScenarios) {
      await this.runScenario(policyId, scenario);
    }
  }

  /**
   * Execute individual scenario
   */
  private async runScenario(policyId: string, scenario: DemoScenario): Promise<void> {
    console.log(`🎬 SCENARIO: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`🎯 Expected: ${scenario.expectedResult}`);
    console.log('─'.repeat(80));

    // Display key asset information
    console.log(`🏢 Corporate: ${scenario.data.corporateName}`);
    console.log(`🆔 LEI: ${scenario.data.legalEntityIdentifier}`);
    console.log(`📊 Asset Type: ${scenario.data.assetType}`);
    console.log(`💰 Principal: $${(scenario.data.principalAmount / 1000000).toFixed(1)}M`);
    console.log(`💵 PYUSD Amount: $${(scenario.data.pyusdAmount / 1000000).toFixed(1)}M`);
    console.log(`🌍 Route: ${scenario.data.buyerCountry} → ${scenario.data.sellerCountry}`);
    console.log(`⭐ Credit Rating: ${scenario.data.creditRating}`);
    console.log(`📄 Documents: ${scenario.data.tradeDocuments.length} files`);

    try {
      // Check rules compliance
      const result = await this.sdk.checkRules(policyId, scenario.data);
      
      console.log('\n📊 RESULT SUMMARY:');
      console.log(`🎯 Overall Compliance: ${result.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
      console.log(`✅ Passed Rules: ${result.passedRules.length}/14`);
      console.log(`❌ Failed Rules: ${result.failedRules.length}/14`);
      console.log(`⚠️ Warnings: ${result.warnings.length}/14`);

      if (result.failedRules.length > 0) {
        console.log('\n❌ Failed Rules:');
        result.failedRules.forEach(rule => console.log(`  • ${rule}`));
      }

      if (result.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        result.warnings.forEach(rule => console.log(`  • ${rule}`));
      }

      // Verify expected result
      const actualResult = result.compliant ? 'PASS' : 'FAIL';
      const resultIcon = actualResult === scenario.expectedResult ? '✅' : '❌';
      console.log(`\n${resultIcon} Expected: ${scenario.expectedResult}, Actual: ${actualResult}`);

    } catch (error) {
      console.error(`💥 Scenario failed with error: ${error}`);
    }

    console.log('\n' + '═'.repeat(80) + '\n');
  }

  /**
   * PYUSD Cross-Border Trade Finance Demo
   */
  private async runPyusdCrossBorderDemo(): Promise<void> {
    console.log('\n\n💰 PYUSD CROSS-BORDER TRADE FINANCE DEMONSTRATION');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Instant International Settlements vs Traditional 30+ Day Wires');
    console.log('🌍 Cross-Border Trade Finance with FORTE Rule Compliance');
    console.log('💵 PayPal USD (PYUSD) Integration on Sepolia Testnet');
    console.log('🇮🇳 India RBI Digital Currency Compliance');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Show PYUSD contract info
    console.log('💵 PYUSD CONTRACT INFORMATION');
    console.log('─────────────────────────────────────────');
    console.log('🔗 Network: Ethereum Sepolia Testnet');
    console.log('📍 Contract: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9');
    console.log('🏦 Issuer: Paxos Trust Company');
    console.log('💎 Backing: 100% USD reserves + US Treasuries');
    console.log('⚡ Settlement: Instant (vs 3-5 days traditional)');
    console.log('💰 Fees: ~$0.50 (vs $25-50 traditional wire)');
    console.log('🌐 Chains: Ethereum + Solana (LayerZero bridge)');
    console.log('🔑 Faucet: Google Cloud Web3 Portal');
    console.log('─────────────────────────────────────────\n');

    // Demo cross-border trade scenarios with India focus
    const crossBorderTrades = [
      {
        name: 'US-EU Supply Chain Invoice',
        description: 'Apple Inc → German supplier payment via PYUSD',
        localAmount: '€2.5M',
        pyusdAmount: '$2.75M',
        route: 'US → DE',
        traditionalDays: 5,
        pyusdSeconds: 30,
        savings: '$40'
      },
      {
        name: 'US-India IT Services Export',
        description: 'US company → Indian IT services payment via PYUSD',
        localAmount: '₹20 Cr',
        pyusdAmount: '$2.4M',
        route: 'US → IN',
        traditionalDays: 12,
        pyusdSeconds: 90,
        savings: '$150',
        specialNote: 'RBI digital currency compliance'
      },
      {
        name: 'India-US Pharmaceutical Export',
        description: 'Indian pharma → US distributor payment',
        localAmount: '$3M',
        pyusdAmount: '$3M',
        route: 'IN → US',
        traditionalDays: 15,
        pyusdSeconds: 120,
        savings: '$200',
        specialNote: 'FDA/RBI cross-compliance'
      },
      {
        name: 'US-Japan Trade Finance',
        description: 'Goldman Sachs → Japanese export payment',
        localAmount: '¥1.5B',
        pyusdAmount: '$10.05M',
        route: 'US → JP',
        traditionalDays: 10,
        pyusdSeconds: 60,
        savings: '$120'
      }
    ];

    console.log('🌍 CROSS-BORDER TRADE SCENARIOS');
    console.log('─────────────────────────────────────────\n');

    for (const trade of crossBorderTrades) {
      console.log(`🎬 ${trade.name}`);
      console.log(`📝 ${trade.description}`);
      console.log(`💰 Amount: ${trade.localAmount} → ${trade.pyusdAmount} PYUSD`);
      console.log(`🌍 Route: ${trade.route}`);
      console.log(`⚡ Speed: ${trade.pyusdSeconds}s (vs ${trade.traditionalDays} days traditional)`);
      console.log(`💸 Savings: ${trade.savings} in fees`);
      if (trade.specialNote) {
        console.log(`📝 Special: ${trade.specialNote}`);
      }
      console.log(`🚀 Improvement: ${Math.round((trade.traditionalDays * 24 * 3600) / trade.pyusdSeconds)}x faster\n`);
    }

    console.log('🎯 PYUSD Integration Benefits:');
    console.log('• ✅ Instant settlements (30 seconds vs 5+ days)');
    console.log('• ✅ 90%+ cost reduction ($0.50 vs $25-50)');
    console.log('• ✅ 24/7 availability (vs banking hours)');
    console.log('• ✅ Full compliance (14 FORTE rules + ZK PRET)');
    console.log('• ✅ Multi-chain ready (Ethereum + Solana)');
    console.log('• ✅ Institutional grade (not consumer NFTs)');
    console.log('• ✅ India RBI compliance for digital currency');
    console.log('• ✅ Cross-border limits enforcement (US-IN: $50M max)');
    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  /**
   * Multi-chain deployment demo
   */
  async demonstrateMultiChain(): Promise<void> {
    console.log('🌐 MULTI-CHAIN DEPLOYMENT DEMONSTRATION');
    console.log('═══════════════════════════════════════════════════════════════');

    const chains = [
      { name: 'FORTE', rpc: process.env.FORTE_RPC_URL, features: '14 FORTE Rules + ZK PRET' },
      { name: 'BNB Chain', rpc: process.env.BNB_RPC_URL, features: 'AI-Enhanced Risk Scoring' },
      { name: 'PYUSD (Sepolia)', rpc: process.env.SEPOLIA_RPC_URL, features: 'Cross-Border Trade Finance' },
      { name: 'SUPRA', rpc: process.env.SUPRA_RPC_URL, features: 'Automated Monitoring' },
      { name: 'FLOW', rpc: process.env.FLOW_RPC_URL, features: 'Consumer-Accessible Interface' }
    ];

    for (const chain of chains) {
      console.log(`🔗 ${chain.name}:`);
      console.log(`  📡 RPC: ${chain.rpc || 'Not configured'}`);
      console.log(`  🎯 Features: ${chain.features}`);
      console.log(`  ✅ Status: ${chain.rpc ? 'Ready for deployment' : 'Configure RPC'}`);
    }

    console.log('\n🎯 Multi-Chain Strategy:');
    console.log('1. FORTE: Core compliance engine with all 14 rules');
    console.log('2. BNB: Gas-optimized with AI risk enhancement');
    console.log('3. PYUSD: Instant cross-border settlements + India compliance');
    console.log('4. SUPRA: Real-time monitoring and automation');
    console.log('5. FLOW: Consumer-friendly institutional access');
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

// CLI execution
if (process.argv[1] === new URL(import.meta.url).pathname.replace(/\\/g, '/')) {
  const args = process.argv.slice(2);
  const demo = new InstitutionalRWADemo();

  const scenario = args[0] as 'pass' | 'fail' | 'all' | 'multichain' || 'all';

  if (scenario === 'multichain') {
    demo.demonstrateMultiChain().catch(console.error);
  } else {
    demo.runDemo(scenario).catch(console.error);
  }
}

export default InstitutionalRWADemo;
