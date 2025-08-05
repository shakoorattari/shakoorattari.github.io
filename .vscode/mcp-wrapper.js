#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Determine the workspace folder
const workspaceFolder = process.env.WORKSPACE_FOLDER || path.resolve(__dirname, '..');

// Path to the environment file (now in project root)
const envFilePath = path.join(workspaceFolder, '.env');

// Load environment variables from .env if it exists
if (fs.existsSync(envFilePath)) {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            process.env[key.trim()] = value;
        }
    });
}

// Get command arguments (skip node and script name)
const args = process.argv.slice(2);

// Process arguments and substitute environment variables
const processedArgs = args.map(arg => {
    return arg.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return process.env[varName] || match;
    });
});

// Handle Windows-specific command adjustments
let command = processedArgs[0];
let commandArgs = processedArgs.slice(1);

// On Windows, adjust common commands that need .cmd extension
if (process.platform === 'win32') {
    if (command === 'npx' || command === 'npm') {
        command = command + '.cmd';
    }
}

// Spawn the command
const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    cwd: workspaceFolder,
    env: process.env,
    shell: process.platform === 'win32' // Use shell on Windows for better compatibility
});

// Forward exit code
child.on('exit', (code) => {
    process.exit(code);
});

child.on('error', (err) => {
    console.error('Failed to start subprocess:', err);
    process.exit(1);
});
