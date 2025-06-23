/**
 * Configurable Demo Engine
 * No more hardcoding - all company data comes from config files
 */

import { readFile } from 'fs/promises';
import ForteSDKManager from './sdk.ts';

interface DemoConfig {
  demoConfiguration: any;
  companies: Record<string, any>;
  assetTemplates: Record<string, any>;
  countries: Record<string, any>;
  passingScenarios: any[];
  failingScenarios: any[];
  testAddresses: any;
  defaultSettings: any;
}

interface DemoScenario {
  name: string;
  description: string;
  expectedResult: 'PASS' | 'FAIL';
  data: any;
}

export class ConfigurableDemoEngine {
  private config: DemoConfig;
  private sdk: ForteSDKManager;

  constructor() {
    this.sdk = new ForteSDKManager();
  }

  /**
   * Load demo configuration from JSON file
   */
  async loadConfig(configPath: string = 'demo-config.json'): Promise<void> {
    console.log(`📋 Loading demo configuration from ${configPath}...`);
    try {
      const configContent = await readFile(configPath, 'utf-8');
      this.config = JSON.parse(configContent);
      console.log(`✅ Configuration loaded: ${this.config.demoConfiguration.title}`);
      console.log(`📊 Companies available: ${Object.keys(this.config.companies).length}`);
      console.log(`🎬 Passing scenarios: ${this.config.passingScenarios.length}`);
      console.log(`❌ Failing scenarios: ${this.config.failingScenarios.length}`);
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Generate demo scenario from configuration
   */
  private generateScenario(scenarioConfig: any, expectedResult: 'PASS' | 'FAIL'): DemoScenario {
    const company = this.config.companies[scenarioConfig.company];
    const template = this.config.assetTemplates[scenarioConfig.assetTemplate];
    const buyerCountry = this.config.countries[scenarioConfig.buyerCountry];
    const sellerCountry = this.config.countries[scenarioConfig.sellerCountry];

    if (!company || !template) {
      throw new Error(`Invalid company (${scenarioConfig.company}) or template (${scenarioConfig.assetTemplate})`);
    }

    // Start with company data
    const data = {
      corporateName: company.corporateName,
      legalEntityIdentifier: company.legalEntityIdentifier,
      creditRating: company.creditRating,
      corporateWallet: this.config.testAddresses.clean[0], // Default to clean address
      manager: this.config.testAddresses.clean[1],
      
      // Asset template data
      assetType: template.assetType,
      assetDescription: template.description,
      principalAmount: template.defaultPrincipalAmount,
      maturityDays: template.defaultMaturityDays,
      interestRate: template.defaultInterestRate,
      tradeDocuments: template.documents,
      
      // PYUSD and cross-border data
      pyusdAmount: scenarioConfig.pyusdAmount || template.defaultPrincipalAmount,
      isCrossBorder: scenarioConfig.buyerCountry !== scenarioConfig.sellerCountry,
      buyerCountry: scenarioConfig.buyerCountry,
      sellerCountry: scenarioConfig.sellerCountry,
      
      // Default settings
      ...this.config.defaultSettings,
      
      // Document hash (generated)
      documentHash: this.generateDocumentHash(company.corporateName, template.assetType),
      
      // Recipient address (clean by default)
      recipient: this.config.testAddresses.clean[0]
    };

    // Apply customizations
    if (scenarioConfig.customizations) {
      Object.assign(data, scenarioConfig.customizations);
    }

    // Process dynamic description placeholders
    data.assetDescription = this.processDescriptionTemplate(data.assetDescription, {
      days: data.maturityDays,
      country1: scenarioConfig.buyerCountry,
      country2: scenarioConfig.sellerCountry,
      industry: company.industry
    });

    return {
      name: scenarioConfig.name,
      description: this.generateDescription(scenarioConfig, company, buyerCountry, sellerCountry),
      expectedResult,
      data
    };
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(scenarioConfig: any, company: any, buyerCountry: any, sellerCountry: any): string {
    const template = this.config.assetTemplates[scenarioConfig.assetTemplate];
    const pyusdAmount = (scenarioConfig.pyusdAmount / 1000000).toFixed(1);
    
    let description = `${company.corporateName} ${template.assetType.toLowerCase().replace('_', ' ')}`;
    description += ` - $${pyusdAmount}M ${buyerCountry.name} → ${sellerCountry.name}`;
    
    if (sellerCountry.rbiCompliance) {
      description += ' with RBI compliance';
    }
    
    if (scenarioConfig.violation) {
      description += ` (${scenarioConfig.violation} violation)`;
    }
    
    return description;
  }

  /**
   * Process description template with placeholders
   */
  private processDescriptionTemplate(template: string, values: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value.toString());
    }
    return result;
  }

  /**
   * Generate document hash
   */
  private generateDocumentHash(corporateName: string, assetType: string): string {
    const data = corporateName + assetType + Date.now();
    // Simple hash simulation
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += Math.floor(Math.random() * 16).toString(16);
    }
    return hash;
  }

  /**
   * Run demo with configuration
   */
  async runConfigurableDemo(scenarioType: 'pass' | 'fail' | 'all' = 'all'): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    console.log('🏛️ CONFIGURABLE INSTITUTIONAL RWA PLATFORM DEMO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📋 Configuration: ${this.config.demoConfiguration.title}`);
    console.log(`📊 Version: ${this.config.demoConfiguration.version}`);
    console.log('🎯 14 FORTE Rules + ZK PRET Integration');
    console.log('💰 PYUSD Cross-Border Support');
    console.log('🌐 Fully Configurable Company Data');
    console.log('═══════════════════════════════════════════════════════════════\\n');

    // Setup policy
    console.log('📋 Setting up institutional policy...');
    const policyId = await this.sdk.setupPolicy('policies/institutional-rwa-complete.json');
    console.log(`✅ Policy ID: ${policyId}\\n`);

    // Run configured scenarios
    if (scenarioType === 'pass' || scenarioType === 'all') {
      await this.runPassingScenariosFromConfig(policyId);
    }

    if (scenarioType === 'fail' || scenarioType === 'all') {
      await this.runFailingScenariosFromConfig(policyId);
    }

    console.log('\\n🏆 CONFIGURABLE DEMO COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Companies tested: ${new Set([...this.config.passingScenarios, ...this.config.failingScenarios].map(s => s.company)).size}`);
    console.log(`🌍 Countries covered: ${new Set([...this.config.passingScenarios, ...this.config.failingScenarios].flatMap(s => [s.buyerCountry, s.sellerCountry])).size}`);
    console.log('🔧 No hardcoded values - fully configurable!');
    console.log('═══════════════════════════════════════════════════════════════');
  }

  /**
   * Run passing scenarios from configuration
   */
  private async runPassingScenariosFromConfig(policyId: string): Promise<void> {
    console.log('✅ PASSING SCENARIOS - From Configuration');
    console.log('───────────────────────────────────────────\\n');

    for (const scenarioConfig of this.config.passingScenarios) {
      const scenario = this.generateScenario(scenarioConfig, 'PASS');
      await this.runScenario(policyId, scenario);
    }
  }

  /**
   * Run failing scenarios from configuration
   */
  private async runFailingScenariosFromConfig(policyId: string): Promise<void> {
    console.log('\\n❌ FAILING SCENARIOS - From Configuration');
    console.log('──────────────────────────────────────────────────\\n');

    for (const scenarioConfig of this.config.failingScenarios) {
      const scenario = this.generateScenario(scenarioConfig, 'FAIL');
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
      
      console.log('\\n📊 RESULT SUMMARY:');
      console.log(`🎯 Overall Compliance: ${result.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
      console.log(`✅ Passed Rules: ${result.passedRules.length}/14`);
      console.log(`❌ Failed Rules: ${result.failedRules.length}/14`);
      console.log(`⚠️ Warnings: ${result.warnings.length}/14`);

      if (result.failedRules.length > 0) {
        console.log('\\n❌ Failed Rules:');
        result.failedRules.forEach(rule => console.log(`  • ${rule}`));
      }

      // Verify expected result
      const actualResult = result.compliant ? 'PASS' : 'FAIL';
      const resultIcon = actualResult === scenario.expectedResult ? '✅' : '❌';
      console.log(`\\n${resultIcon} Expected: ${scenario.expectedResult}, Actual: ${actualResult}`);

    } catch (error) {
      console.error(`💥 Scenario failed with error: ${error}`);
    }

    console.log('\\n' + '═'.repeat(80) + '\\n');
  }

  /**
   * List available companies
   */
  listAvailableCompanies(): void {
    console.log('🏢 AVAILABLE COMPANIES:');
    console.log('─'.repeat(50));
    for (const [key, company] of Object.entries(this.config.companies)) {
      console.log(`${key}: ${company.corporateName} (${company.country}, ${company.creditRating})`);
    }
  }

  /**
   * Add new company to configuration
   */
  addCompany(key: string, companyData: any): void {
    this.config.companies[key] = companyData;
    console.log(`✅ Added company: ${key} - ${companyData.corporateName}`);
  }

  /**
   * Create custom scenario
   */
  createCustomScenario(
    company: string, 
    assetTemplate: string, 
    buyerCountry: string, 
    sellerCountry: string,
    customizations: any = {}
  ): DemoScenario {
    const scenarioConfig = {
      name: `Custom ${company} scenario`,
      company,
      assetTemplate,
      buyerCountry,
      sellerCountry,
      pyusdAmount: customizations.pyusdAmount || 5000000,
      customizations
    };
    
    return this.generateScenario(scenarioConfig, 'PASS');
  }
}

export default ConfigurableDemoEngine;
