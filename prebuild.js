const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetPropertiesPath = path.join(__dirname, 'android', 'local.properties');
const sourcePropertiesPath = path.join('C:', 'Users', 'amiba', 'Projects', 'poultry-solution', 'android', 'local.properties');

const stagingDir = path.join(__dirname, 'android-src-staging');
const javaBaseDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', 'com', 'oasis', 'app');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function ensurePrebuild() {
    console.log('--- Oasis Prebuild ---');

    const args = process.argv.slice(2);
    const isClean = args.includes('--clean');

    // 1. Run expo prebuild (--clean wipes android/ and replays all plugins)
    if (isClean) {
        console.log('Running npx expo prebuild --clean...');
        try {
            execSync('npx expo prebuild --clean', { stdio: 'inherit' });
            console.log('✅ Expo prebuild --clean completed.');
        } catch (err) {
            console.error(`❌ Expo prebuild failed: ${err.message}`);
            process.exit(1);
        }
    }

    // 2. Sync local.properties (not committed, must be restored after --clean)
    if (!fs.existsSync(targetPropertiesPath)) {
        if (fs.existsSync(sourcePropertiesPath)) {
            console.log('Copying local.properties...');
            fs.mkdirSync(path.dirname(targetPropertiesPath), { recursive: true });
            fs.copyFileSync(sourcePropertiesPath, targetPropertiesPath);
            console.log('✅ local.properties copied.');
        } else {
            console.warn('⚠️  local.properties not found — set sdk.dir manually in android/local.properties');
        }
    } else {
        console.log('✅ local.properties exists.');
    }

    // 3. Sync android-src-staging → java/com/oasis/app/ (safety net for non-clean runs)
    //    The Expo config plugin (withOasisModule) handles this during prebuild --clean.
    //    This step covers the case where someone edits staging files without running --clean.
    if (fs.existsSync(stagingDir)) {
        console.log(`Syncing android-src-staging → ${path.relative(__dirname, javaBaseDir)}...`);
        try {
            copyRecursiveSync(stagingDir, javaBaseDir);
            console.log('✅ Kotlin sources synced.');
        } catch (err) {
            console.error(`❌ Failed to sync sources: ${err.message}`);
        }
    } else {
        console.warn('⚠️  android-src-staging not found.');
    }

    console.log('--- Prebuild Complete ---');
}

ensurePrebuild();
