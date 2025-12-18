const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0];
let target = args[1] || 'all'; // 'item', 'savior', 'arcana', or 'all'

if (target.startsWith('--target=')) {
    target = target.split('=')[1];
}

const SCRIPT_DIR = __dirname;
const DATA_MANAGER_DIR = path.join(SCRIPT_DIR, 'data_manager');

function runScript(scriptPath) {
    console.log(`\n> Running: ${path.relative(process.cwd(), scriptPath)}`);
    try {
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error running ${scriptPath}:`, error.message);
        // Process continues even if one script fails, or you can add process.exit(1) here
    }
}

if (command === 'import') {
    console.log(`=== Starting Data Import [Target: ${target}] ===`);

    if (target === 'item' || target === 'all') {
        runScript(path.join(DATA_MANAGER_DIR, 'import_item.js'));
    }

    if (target === 'savior' || target === 'all') {
        // Renaming index.js to import_savior.js was planned but user wanted to keep index.js untouched.
        // So we call index.js for savior data.
        runScript(path.join(DATA_MANAGER_DIR, 'index.js'));
    }

    if (target === 'arcana' || target === 'all') {
        runScript(path.join(DATA_MANAGER_DIR, 'import_arcana.js'));
    }

    console.log(`\n=== Data Import Completed ===`);

} else if (command === 'export') {
    console.log("Export functionality is not yet implemented or migrated.");
    // Add logic here if needed
} else {
    console.log("Usage: node scripts/manage_data.js [import|export] [all|item|savior|arcana]");
    console.log("Example: node scripts/manage_data.js import --target=item");
}
