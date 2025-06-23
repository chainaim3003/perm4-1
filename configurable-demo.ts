/**
 * Configurable Demo Runner
 * No more hardcoded company data!
 */

import ConfigurableDemoEngine from './configurable-demo-engine.ts';

async function runConfigurableDemo() {
    console.log('🎯 CONFIGURABLE FORTE DEMO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ No hardcoded company names or LEI IDs');
    console.log('📋 All data comes from demo-config.json');
    console.log('🔧 Easily add new companies and scenarios');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const engine = new ConfigurableDemoEngine();
    
    try {
        // Load configuration
        await engine.loadConfig('demo-config.json');
        
        // Show available companies
        console.log('\n📊 Configuration Overview:');
        engine.listAvailableCompanies();
        console.log('');
        
        // Run all scenarios from config
        await engine.runConfigurableDemo('all');
        
        console.log('\n🎉 Demo completed successfully!');
        console.log('💡 To add new companies, edit demo-config.json');
        
    } catch (error) {
        console.error('💥 Demo failed:', error);
        process.exit(1);
    }
}

// CLI usage examples
if (process.argv.length > 2) {
    const command = process.argv[2];
    
    if (command === 'pass') {
        console.log('🎯 Running only PASSING scenarios...');
        const engine = new ConfigurableDemoEngine();
        engine.loadConfig().then(() => engine.runConfigurableDemo('pass'));
    } else if (command === 'fail') {
        console.log('🎯 Running only FAILING scenarios...');
        const engine = new ConfigurableDemoEngine();
        engine.loadConfig().then(() => engine.runConfigurableDemo('fail'));
    } else if (command === 'companies') {
        console.log('🏢 Available companies:');
        const engine = new ConfigurableDemoEngine();
        engine.loadConfig().then(() => engine.listAvailableCompanies());
    } else {
        console.log('Usage: npx tsx configurable-demo.ts [pass|fail|companies|all]');
    }
} else {
    // Run full demo
    runConfigurableDemo();
}
