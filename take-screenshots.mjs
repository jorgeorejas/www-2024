import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// Configuration
const pages = {
  'home': '/',
  'blog-list': '/blog',
  'blog-detail': '/blog/talent-and-values',
  'projects-list': '/projects',
  'projects-detail': '/projects/aramo-v2',
  'work-list': '/work',
  'work-detail': '/work/vivla',
  'cv': '/cv'
};

const baseUrls = {
  before: 'https://www.jorgeorejas.com',
  after: 'https://www-git-redesign-2026-jorejas-projects.vercel.app'
};

const viewports = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 }
};

const WAIT_TIME = 3000; // Wait for animations and fonts to load

// Create directory structure
async function setupDirectories() {
  const dirs = [
    'screenshots/before/mobile',
    'screenshots/before/desktop',
    'screenshots/after/mobile',
    'screenshots/after/desktop'
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
  console.log('✓ Created directory structure');
}

// Capture screenshot
async function captureScreenshot(page, url, outputPath, viewport) {
  try {
    await page.setViewportSize(viewport);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(WAIT_TIME);
    await page.screenshot({ path: outputPath, fullPage: true });
    return true;
  } catch (error) {
    console.error(`✗ Failed to capture ${outputPath}: ${error.message}`);
    return false;
  }
}

// Generate markdown table
function generateMarkdown() {
  const desktopRows = Object.keys(pages).map(pageName => {
    const label = pageName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `| **${label}** | ![](screenshots/before/desktop/${pageName}.png) | ![](screenshots/after/desktop/${pageName}.png) |`;
  }).join('\n');

  const mobileRows = Object.keys(pages).map(pageName => {
    const label = pageName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `| **${label}** | ![](screenshots/before/mobile/${pageName}.png) | ![](screenshots/after/mobile/${pageName}.png) |`;
  }).join('\n');

  return `# Visual Changes

## Desktop View

| Page Type | Before | After |
|-----------|--------|-------|
${desktopRows}

## Mobile View

| Page Type | Before | After |
|-----------|--------|-------|
${mobileRows}
`;
}

// Main execution
async function main() {
  console.log('🚀 Starting screenshot capture...\n');

  await setupDirectories();

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;
  const totalScreenshots = Object.keys(pages).length * 2 * 2; // pages × versions × viewports

  // Capture all screenshots
  for (const [pageName, path] of Object.entries(pages)) {
    for (const [version, baseUrl] of Object.entries(baseUrls)) {
      for (const [device, viewport] of Object.entries(viewports)) {
        const url = baseUrl + path;
        const outputPath = join('screenshots', version, device, `${pageName}.png`);

        console.log(`📸 Capturing ${version}/${device}/${pageName}...`);
        const success = await captureScreenshot(page, url, outputPath, viewport);

        if (success) {
          successCount++;
          console.log(`   ✓ Saved to ${outputPath}`);
        } else {
          failCount++;
        }
      }
    }
  }

  await browser.close();

  // Generate markdown
  const markdown = generateMarkdown();
  await writeFile('SCREENSHOTS.md', markdown);
  console.log('\n✓ Generated SCREENSHOTS.md');

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Total: ${totalScreenshots} screenshots`);
  console.log(`   ✓ Success: ${successCount}`);
  console.log(`   ✗ Failed: ${failCount}`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n⚠️  Some screenshots failed. Check the errors above.');
    process.exit(1);
  }

  console.log('\n✅ All screenshots captured successfully!');
  console.log('\nNext steps:');
  console.log('1. Review screenshots in the screenshots/ directory');
  console.log('2. Copy content from SCREENSHOTS.md to your PR description');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
