const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

try {
    const packageJsonPath = './package.json';
    const changelogPath = './CHANGELOG.md';

    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version || "1.0.0";
    const parts = currentVersion.split('.');

    // Increment the patch version (e.g., 1.0.0 -> 1.0.1)
    if (parts.length < 3) parts.push(0);
    parts[2] = parseInt(parts[2], 10) + 1;
    const newVersion = parts.join('.');

    // 1. Process CHANGELOG.md
    let releaseNotes = '';
    if (fs.existsSync(changelogPath)) {
        let changelog = fs.readFileSync(changelogPath, 'utf8');
        const unreleasedMatch = changelog.match(/## \[Unreleased\]([\s\S]*?)(?=\n## |$)/);

        if (unreleasedMatch && unreleasedMatch[1].trim()) {
            releaseNotes = unreleasedMatch[1].trim();
            const date = new Date().toISOString().split('T')[0];
            const versionHeader = `## [v${newVersion}] - ${date}`;

            // Replace [Unreleased] with versioned header and empty [Unreleased]
            changelog = changelog.replace(
                /## \[Unreleased\]/,
                `## [Unreleased]\n\n${versionHeader}`
            );
            fs.writeFileSync(changelogPath, changelog);
            console.log(`✅ Updated CHANGELOG.md with version v${newVersion}`);
        } else {
            console.warn('⚠️ No unreleased changes found in CHANGELOG.md. Proceeding without notes.');
        }
    } else {
        console.warn('⚠️ CHANGELOG.md not found. Proceeding without notes.');
    }

    // 2. Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`🚀 Bumped package.json version: ${currentVersion} -> ${newVersion}`);

    const commands = [
        `git add package.json ${fs.existsSync(changelogPath) ? 'CHANGELOG.md' : ''}`,
        `git commit -m "chore: bump version to v${newVersion}${releaseNotes ? '\n\n' + releaseNotes : ''}"`,
        `git push origin main`,
        `git tag v${newVersion}`,
        `git push origin v${newVersion}`
    ];

    for (const cmd of commands) {
        if (!cmd.trim()) continue;
        console.log(`> ${cmd}`);
        try {
            execSync(cmd, { stdio: 'inherit' });
        } catch (e) {
            console.error(`Failed to execute command: ${cmd}`);
            throw e;
        }
    }

    console.log(`\n✅ Successfully released v${newVersion}!`);
    console.log(`\n📋 RELEASE NOTES FOR GITHUB:\n\n${releaseNotes || 'Bug fixes and performance improvements.'}\n`);

} catch (error) {
    console.error(`\n❌ Release failed: ${error.message}\n`);
    process.exit(1);
}
