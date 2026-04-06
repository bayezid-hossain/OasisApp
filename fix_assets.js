const fs = require('fs');
const path = require('path');

const assetDir = path.join(__dirname, 'assets');
const logoPath = path.join(assetDir, 'logo.png');

const targets = ['icon.png', 'adaptive-icon.png', 'splash.png'];

if (!fs.existsSync(logoPath)) {
    console.error('logo.png not found');
    process.exit(1);
}

targets.forEach(target => {
    const dest = path.join(assetDir, target);
    fs.copyFileSync(logoPath, dest);
    console.log(`Copied logo.png to ${target}`);
});
