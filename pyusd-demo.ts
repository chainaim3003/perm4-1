/**
 * PYUSD Cross-Border Trade Finance Demo
 * Demonstrates instant international settlements vs traditional 30+ day wires
 */

import { ethers } from 'ethers';
import ForteSDKManager from './sdk.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface PyusdTradeDemo {
  name: string;
  description: string;
  localAmount: number;
  localCurrency: string;
  buyerCountry: string;
  sellerCountry: string;
  expectedPyusdAmount: number;
  traditionalSettlementDays: number;
  pyusdSettlementSeconds: number;
  costSavings: number;
}

class PyusdCrossBorderDemo {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private sdk: ForteSDKManager;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');
    this.wallet = new ethers.Wallet(
      process.env.SEPOLIA_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider
    );
    this.sdk = new ForteSDKManager();
  }

  /**
   * Main PYUSD demo execution
   */
  async runPyusdDemo(): Promise<void> {
    console.log('💰 PYUSD CROSS-BORDER TRADE FINANCE DEMO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Instant International Settlements vs Traditional 30+ Day Wires');
    console.log('🌍 Cross-Border Trade Finance with FORTE Rule Compliance');
    console.log('💵 PayPal USD (PYUSD) Integration on Sepolia Testnet');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Setup FORTE policy for PYUSD trades
    console.log('📋 Setting up FORTE compliance rules for PYUSD trades...');
    const policyId = await this.sdk.setupPolicy('policies/institutional-rwa-complete.json');
    console.log(`✅ Policy configured: ${policyId}\n`);

    // Demonstrate PYUSD contract info
    await this.showPyusdInfo();

    // Run trade scenarios
    await this.demonstrateTradeScenarios(policyId);

    // Show multi-chain capabilities
    await this.showMultiChainCapabilities();

    console.log('\n🏆 PYUSD DEMO COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Demonstrated instant cross-border settlements');
    console.log('💰 PYUSD integration with institutional compliance');
    console.log('🌐 Multi-chain ready: Ethereum ↔ Solana via LayerZero');
    console.log('⚡ 99.9% faster than traditional wire transfers');
    console.log('💸 90%+ cost savings vs traditional banking');
    console.log('═══════════════════════════════════════════════════════════════');
  }

  /**
   * Show PYUSD contract information
   */
  private async showPyusdInfo(): Promise<void> {
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
  }

  /**
   * Demonstrate trade scenarios with PYUSD
   */
  private async demonstrateTradeScenarios(policyId: string): Promise<void> {
    const scenarios: PyusdTradeDemo[] = [
      {
        name: 'US-EU Supply Chain Invoice',
        description: 'Apple Inc → German supplier payment via PYUSD',
        localAmount: 2500000, // €2.5M
        localCurrency: 'EUR',
        buyerCountry: 'US',
        sellerCountry: 'DE',
        expectedPyusdAmount: 2750000, // $2.75M PYUSD
        traditionalSettlementDays: 5,
        pyusdSettlementSeconds: 30,
        costSavings: 40
      },
      {
        name: 'US-India IT Services Export',
        description: 'US company → Indian IT services payment via PYUSD',
        localAmount: 2000000, // ₹20 crores
        localCurrency: 'INR',
        buyerCountry: 'US',
        sellerCountry: 'IN',
        expectedPyusdAmount: 2400000, // $2.4M PYUSD
        traditionalSettlementDays: 12,
        pyusdSettlementSeconds: 90,
        costSavings: 150
      },
      {
        name: 'India-US Pharmaceutical Export',
        description: 'Indian pharma → US distributor payment via PYUSD',
        localAmount: 3000000, // $3M
        localCurrency: 'USD',
        buyerCountry: 'IN',
        sellerCountry: 'US', 
        expectedPyusdAmount: 3000000, // $3M PYUSD
        traditionalSettlementDays: 15,
        pyusdSettlementSeconds: 120,
        costSavings: 200
      },
      {
        name: 'US-UK Equipment Finance',
        description: 'Microsoft → UK machinery lease payment',
        localAmount: 8000000, // £8M
        localCurrency: 'GBP', 
        buyerCountry: 'US',
        sellerCountry: 'GB',
        expectedPyusdAmount: 10000000, // $10M PYUSD
        traditionalSettlementDays: 7,
        pyusdSettlementSeconds: 45,
        costSavings: 75
      },
      {
        name: 'US-Japan Trade Finance',
        description: 'Goldman Sachs → Japanese export payment',
        localAmount: 1500000000, // ¥1.5B
        localCurrency: 'JPY',
        buyerCountry: 'US', 
        sellerCountry: 'JP',
        expectedPyusdAmount: 10050000, // $10.05M PYUSD
        traditionalSettlementDays: 10,
        pyusdSettlementSeconds: 60,
        costSavings: 120
      }
    ];

    console.log('🌍 CROSS-BORDER TRADE SCENARIOS');
    console.log('─────────────────────────────────────────\n');

    for (const scenario of scenarios) {
      await this.demonstrateTradeScenario(policyId, scenario);
    }
  }

  /**
   * Demonstrate individual trade scenario
   */
  private async demonstrateTradeScenario(policyId: string, scenario: PyusdTradeDemo): Promise<void> {
    console.log(`🎬 SCENARIO: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log('─'.repeat(80));

    // Show trade details
    console.log(`💰 Local Amount: ${scenario.localAmount.toLocaleString()} ${scenario.localCurrency}`);
    console.log(`💵 PYUSD Amount: $${scenario.expectedPyusdAmount.toLocaleString()}`);
    console.log(`🌍 Route: ${scenario.buyerCountry} → ${scenario.sellerCountry}`);

    // Mock trade data for FORTE compliance check
    const tradeData = {
      corporateName: scenario.name.includes('Apple') ? 'APPLE INC' : 
                    scenario.name.includes('Microsoft') ? 'MICROSOFT CORPORATION' : 
                    'GOLDMAN SACHS GROUP INC',
      legalEntityIdentifier: scenario.name.includes('Apple') ? 'HWUPKR0MPOU8FGXBT394' :
                           scenario.name.includes('Microsoft') ? 'XEBEDEBBPPM9N3JQFGFV' :
                           '784F5XWPLTWKTBV3E584',
      assetType: 'TRADE_FINANCE',
      principalAmount: scenario.expectedPyusdAmount,
      localAmount: scenario.localAmount,
      localCurrency: scenario.localCurrency,
      buyerCountry: scenario.buyerCountry,
      sellerCountry: scenario.sellerCountry,
      transferAmount: scenario.expectedPyusdAmount,
      recipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      documentHash: '0x1234567890abcdef1234567890abcdef12345678',
      tradeDocuments: ['letter_of_credit.pdf', 'bill_of_lading.pdf', 'commercial_invoice.pdf']
    };

    console.log('\n🔍 FORTE COMPLIANCE CHECK...');
    const complianceResult = await this.sdk.checkRules(policyId, tradeData);

    console.log(`🎯 Compliance: ${complianceResult.compliant ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`✅ Rules Passed: ${complianceResult.passedRules.length}/12`);

    if (complianceResult.compliant) {
      console.log('\n⚡ INSTANT PYUSD SETTLEMENT SIMULATION:');
      console.log(`🕐 Traditional Wire: ${scenario.traditionalSettlementDays} days`);
      console.log(`⚡ PYUSD Settlement: ${scenario.pyusdSettlementSeconds} seconds`);
      console.log(`🚀 Speed Improvement: ${Math.round((scenario.traditionalSettlementDays * 24 * 3600) / scenario.pyusdSettlementSeconds)}x faster`);
      console.log(`💸 Cost Savings: $${scenario.costSavings} (vs traditional wire fees)`);
      console.log(`🌐 Cross-Chain: Ready for Ethereum ↔ Solana via LayerZero`);
    } else {
      console.log('\n❌ COMPLIANCE VIOLATIONS:');
      complianceResult.failedRules.forEach(rule => console.log(`  • ${rule}`));
    }

    console.log('\n' + '═'.repeat(80) + '\n');
  }

  /**
   * Show multi-chain capabilities
   */
  private async showMultiChainCapabilities(): Promise<void> {
    console.log('🌐 PYUSD MULTI-CHAIN CAPABILITIES');
    console.log('─────────────────────────────────────────');
    console.log('🔗 Primary: Ethereum (Mainnet + Sepolia)');
    console.log('🔗 Secondary: Solana (Mainnet + Devnet)');
    console.log('🌉 Bridge: LayerZero (burn & mint mechanism)');
    console.log('⚡ Cross-chain time: 1-2 minutes');
    console.log('💰 Bridge cost: ~$1-3 in gas fees');
    console.log('🔒 Security: No third-party bridge risks');
    console.log('📊 Liquidity: Unified across both chains');
    console.log('\n🎯 Our Integration Benefits:');
    console.log('• ✅ Instant settlements (30 seconds vs 5+ days)');
    console.log('• ✅ 90%+ cost reduction ($0.50 vs $25-50)');
    console.log('• ✅ 24/7 availability (vs banking hours)');
    console.log('• ✅ Full compliance (12 FORTE rules + ZK PRET)');
    console.log('• ✅ Multi-chain ready (Ethereum + Solana)');
    console.log('• ✅ Institutional grade (not consumer NFTs)');
    console.log('─────────────────────────────────────────');
  }

  /**
   * Show PYUSD faucet instructions
   */
  async showFaucetInstructions(): Promise<void> {
    console.log('\n💧 GET TESTNET PYUSD FOR TESTING');
    console.log('═══════════════════════════════════════');
    console.log('🌐 Visit: Google Cloud Web3 Portal Faucet');
    console.log('🔗 URL: https://cloud.google.com/web3/faucet');
    console.log('📍 Network: Ethereum Sepolia');
    console.log('💰 Amount: Up to 100 PYUSD per day');
    console.log('📝 Requirements: Google account');
    console.log('⚡ Speed: Instant delivery');
    console.log('\n📋 Steps:');
    console.log('1. Visit Google Cloud Web3 faucet');
    console.log('2. Select "Ethereum Sepolia"');
    console.log('3. Enter your wallet address');
    console.log('4. Click "Receive PYUSD"');
    console.log('5. Add token to wallet: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9');
    console.log('═══════════════════════════════════════');
  }
}

// CLI execution
if (process.argv[1] === new URL(import.meta.url).pathname.replace(/\\/g, '/')) {
  const args = process.argv.slice(2);
  const demo = new PyusdCrossBorderDemo();

  if (args[0] === 'faucet') {
    demo.showFaucetInstructions().catch(console.error);
  } else {
    demo.runPyusdDemo().catch(console.error);
  }
}

export default PyusdCrossBorderDemo;
