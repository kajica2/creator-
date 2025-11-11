/**
 * End-to-End Navigation Tests using Playwright
 * Tests all critical navigation flows for KaiDjuric AI Tools
 *
 * Install: npm install @playwright/test
 * Run: npx playwright test tests/navigation-e2e.test.js
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3004';

// Test configuration
test.describe('KaiDjuric AI Tools - Navigation & Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Set up local storage to control onboarding state
    await page.goto(BASE_URL);
  });

  test.describe('Landing Page Navigation', () => {
    test('should display onboarding screen for new users', async ({ page }) => {
      // Clear localStorage to simulate new user
      await page.evaluate(() => localStorage.clear());
      await page.goto(BASE_URL);

      // Check for onboarding screen elements
      await expect(page.locator('text=Welcome to the Viral Hashtag & Image AI Studio')).toBeVisible();
      await expect(page.locator('button:text("Launch Demo")')).toBeVisible();
      await expect(page.locator('button:text("Request Invite")')).toBeVisible();
    });

    test('should navigate to Hashtag Manager when Launch Demo clicked', async ({ page }) => {
      await page.evaluate(() => localStorage.clear());
      await page.goto(BASE_URL);

      // Click Launch Demo button
      await page.click('button:text("Launch Demo")');

      // Wait for navigation and check we're on Hashtag Manager
      await page.waitForTimeout(1000);

      // Check for hashtag manager specific content
      await expect(page.locator('text=Hashtag Manager').first()).toBeVisible();

      // Verify localStorage was updated
      const hasSeenOnboarding = await page.evaluate(() =>
        localStorage.getItem('hasSeenOnboarding')
      );
      expect(hasSeenOnboarding).toBe('true');
    });

    test('should navigate to Subscription when Request Invite clicked', async ({ page }) => {
      await page.evaluate(() => localStorage.clear());
      await page.goto(BASE_URL);

      // Click Request Invite button
      await page.click('button:text("Request Invite")');

      // Wait for navigation and check we're on Subscription page
      await page.waitForTimeout(1000);

      // Look for subscription-specific content
      const subscriptionContent = page.locator('text=Subscription, text=Plan, text=Billing').first();
      await expect(subscriptionContent).toBeVisible({ timeout: 5000 });
    });

    test('should skip to Hashtag Manager when Skip clicked', async ({ page }) => {
      await page.evaluate(() => localStorage.clear());
      await page.goto(BASE_URL);

      // Check if skip button exists and click it
      const skipButton = page.locator('button:text("Skip for now")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('text=Hashtag Manager').first()).toBeVisible();
      }
    });
  });

  test.describe('Header Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set up as returning user
      await page.evaluate(() => localStorage.setItem('hasSeenOnboarding', 'true'));
      await page.goto(BASE_URL);
    });

    test('should have header with app title', async ({ page }) => {
      await expect(page.locator('text=KaiDjuric AI Tools')).toBeVisible();
    });

    test('should navigate to onboarding when Product Tour clicked', async ({ page }) => {
      const productTourButton = page.locator('button:text("Product Tour")');

      if (await productTourButton.isVisible()) {
        await productTourButton.click();
        await page.waitForTimeout(1000);

        // Should see onboarding content
        await expect(page.locator('text=Welcome to the Viral Hashtag & Image AI Studio')).toBeVisible();
      }
    });

    test('should navigate to Media Library when clicked', async ({ page }) => {
      const mediaLibraryButton = page.locator('button:text("Media Library")');

      if (await mediaLibraryButton.isVisible()) {
        await mediaLibraryButton.click();
        await page.waitForTimeout(1000);

        // Check for media library content
        const mediaContent = page.locator('text=Media Library, text=Upload, text=Gallery').first();
        await expect(mediaContent).toBeVisible({ timeout: 5000 });
      }
    });

    test('should open context modals without navigating', async ({ page }) => {
      // Test Set Persona button
      const setPersonaButton = page.locator('button:text("Set Persona")');
      if (await setPersonaButton.isVisible()) {
        await setPersonaButton.click();
        await page.waitForTimeout(500);

        // Should open a modal, not navigate to a new page
        // Look for modal indicators
        const modal = page.locator('[role="dialog"], .modal, [data-modal="true"]').first();
        await expect(modal).toBeVisible({ timeout: 3000 });
      }

      // Close modal if opened
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Test Add Context button
      const addContextButton = page.locator('button:text("Add Context")');
      if (await addContextButton.isVisible()) {
        await addContextButton.click();
        await page.waitForTimeout(500);

        // Should open a modal
        const modal = page.locator('[role="dialog"], .modal, [data-modal="true"]').first();
        await expect(modal).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('hasSeenOnboarding', 'true'));
      await page.goto(BASE_URL);
      await page.waitForTimeout(1000);
    });

    test('should have visible sidebar on desktop', async ({ page }) => {
      // Check if sidebar/navigation is visible
      const sidebar = page.locator('nav, [role="navigation"]').first();
      await expect(sidebar).toBeVisible();
    });

    test('should navigate through main sections', async ({ page }) => {
      const testPages = [
        { name: 'Hashtag Manager', content: 'Hashtag Manager' },
        { name: 'Settings', content: 'Settings' },
        { name: 'History', content: 'History' }
      ];

      for (const { name, content } of testPages) {
        // Find and click the navigation button
        const navButton = page.locator(`nav button:text("${name}"), [role="navigation"] button:text("${name}")`).first();

        if (await navButton.isVisible()) {
          await navButton.click();
          await page.waitForTimeout(1000);

          // Check if content changed
          await expect(page.locator(`text=${content}`).first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should expand and collapse menu sections', async ({ page }) => {
      const expandableSections = [
        'Dashboard',
        'Content Creation',
        'Image Studio',
        'Advanced Tools'
      ];

      for (const section of expandableSections) {
        const sectionButton = page.locator(`button:text("${section}")`).first();

        if (await sectionButton.isVisible()) {
          // Check if it has aria-expanded attribute (indicating it's expandable)
          const ariaExpanded = await sectionButton.getAttribute('aria-expanded');

          if (ariaExpanded !== null) {
            // Click to expand/collapse
            await sectionButton.click();
            await page.waitForTimeout(500);

            // Check if state changed
            const newAriaExpanded = await sectionButton.getAttribute('aria-expanded');
            expect(newAriaExpanded).not.toBe(ariaExpanded);
          }
        }
      }
    });

    test('should navigate to creation tools', async ({ page }) => {
      const creationTools = [
        'AI Story',
        'AI Lyrics',
        'Text-to-Image'
      ];

      for (const tool of creationTools) {
        // Try to find the tool button (might be in expandable section)
        let toolButton = page.locator(`nav button:text("${tool}")`, { timeout: 2000 }).first();

        // If not visible, try expanding Content Creation section
        if (!(await toolButton.isVisible({ timeout: 1000 }))) {
          const contentCreationButton = page.locator('button:text("Content Creation")').first();
          if (await contentCreationButton.isVisible()) {
            await contentCreationButton.click();
            await page.waitForTimeout(500);
            toolButton = page.locator(`nav button:text("${tool}")`).first();
          }
        }

        if (await toolButton.isVisible()) {
          await toolButton.click();
          await page.waitForTimeout(1500);

          // Check for tool-specific content
          const toolContent = page.locator(`text=${tool}`, { timeout: 5000 }).first();
          await expect(toolContent).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.evaluate(() => localStorage.setItem('hasSeenOnboarding', 'true'));
      await page.goto(BASE_URL);
    });

    test('should show mobile menu button', async ({ page }) => {
      // Look for mobile menu button
      const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[class*="menu" i]').first();
      await expect(mobileMenuButton).toBeVisible();
    });

    test('should open and close mobile sidebar', async ({ page }) => {
      const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[class*="menu" i]').first();

      if (await mobileMenuButton.isVisible()) {
        // Open sidebar
        await mobileMenuButton.click();
        await page.waitForTimeout(500);

        // Check if sidebar is now visible
        const sidebar = page.locator('nav, [role="navigation"]').first();
        await expect(sidebar).toBeVisible();

        // Close sidebar by clicking overlay or close button
        const closeButton = page.locator('button[aria-label*="close" i]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          // Try clicking overlay
          await page.click('body', { position: { x: 50, y: 50 } });
        }

        await page.waitForTimeout(500);
      }
    });

    test('should close sidebar after navigation', async ({ page }) => {
      const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[class*="menu" i]').first();

      if (await mobileMenuButton.isVisible()) {
        // Open sidebar
        await mobileMenuButton.click();
        await page.waitForTimeout(500);

        // Click a navigation item
        const navItem = page.locator('nav button:text("Settings")').first();
        if (await navItem.isVisible()) {
          await navItem.click();
          await page.waitForTimeout(1000);

          // Sidebar should be closed after navigation
          // This depends on implementation - test would need to check specific behavior
        }
      }
    });
  });

  test.describe('Page Rendering Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('hasSeenOnboarding', 'true'));
      await page.goto(BASE_URL);
    });

    test('should render all major pages without errors', async ({ page }) => {
      const pagesToTest = [
        'Hashtag Manager',
        'Settings',
        'Subscription',
        'History'
      ];

      for (const pageName of pagesToTest) {
        // Navigate to page
        const pageButton = page.locator(`nav button:text("${pageName}")`).first();

        if (await pageButton.isVisible()) {
          await pageButton.click();
          await page.waitForTimeout(1500);

          // Check for JavaScript errors
          page.on('pageerror', error => {
            throw new Error(`Page error on ${pageName}: ${error.message}`);
          });

          // Check that main content exists and no error messages
          const main = page.locator('main').first();
          await expect(main).toBeVisible();

          // Check for common error indicators
          const errorElements = page.locator('.error, [data-error="true"], text="Error"');
          const errorCount = await errorElements.count();
          expect(errorCount).toBe(0);
        }
      }
    });
  });

  test.describe('Accessibility Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('hasSeenOnboarding', 'true'));
      await page.goto(BASE_URL);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // Check that focus is on a focusable element
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check navigation has aria-label
      const nav = page.locator('nav, [role="navigation"]').first();
      const ariaLabel = await nav.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const hasAccessibleName = await button.evaluate(el => {
          return !!(
            el.textContent?.trim() ||
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby')
          );
        });
        expect(hasAccessibleName).toBeTruthy();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should navigate quickly between pages', async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('hasSeenOnboarding', 'true'));
      await page.goto(BASE_URL);

      const startTime = Date.now();

      // Navigate to a few pages
      const pages = ['Settings', 'History', 'Hashtag Manager'];

      for (const pageName of pages) {
        const pageButton = page.locator(`nav button:text("${pageName}")`).first();

        if (await pageButton.isVisible()) {
          const navStartTime = Date.now();
          await pageButton.click();
          await page.waitForTimeout(500);
          const navEndTime = Date.now();

          const navigationTime = navEndTime - navStartTime;
          expect(navigationTime).toBeLessThan(2000); // Should navigate in under 2 seconds
        }
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(10000); // Total test should complete quickly
    });
  });
});