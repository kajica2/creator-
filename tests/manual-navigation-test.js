/**
 * Manual Navigation Testing Script
 * Run this in browser console to test all navigation paths
 *
 * Usage:
 * 1. Open the app in browser
 * 2. Open browser console (F12)
 * 3. Paste this script and run it
 * 4. Watch the automated navigation testing
 */

(function() {
  'use strict';

  console.log('🔍 Starting KaiDjuric AI Tools Navigation Test Suite...');

  // All pages from types.ts
  const ALL_PAGES = [
    'Landing', 'Onboarding', 'Roadmap', 'Hashtag Manager', 'AI Story', 'AI Lyrics',
    'Text-to-Image', 'Image Edit', 'Batch Images', 'Batch Prompts', 'AI Website',
    'AI Strategy', 'AI Skill', 'AI Mutator', 'AI Concept', 'Gallery', 'History',
    'Settings', 'Subscription', 'Thinking Mode', 'Audio Transcriber', 'Audio Agents',
    'Live Mixer', 'Synaptic Symphony', 'Gamification', 'Persona Templates',
    'Website Manager', 'Sentry Navigation Cloud', 'Media Library', 'Documentation'
  ];

  // Test results storage
  const testResults = {
    passed: [],
    failed: [],
    warnings: [],
    pageRenderTests: {},
    navigationTests: {},
    performance: {}
  };

  let testStartTime = Date.now();

  // Utility functions
  function log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      test: '🧪'
    }[type] || 'ℹ️';

    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await sleep(100);
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  }

  function findButtonByText(text) {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn =>
      btn.textContent.toLowerCase().includes(text.toLowerCase()) ||
      btn.getAttribute('aria-label')?.toLowerCase().includes(text.toLowerCase())
    );
  }

  function getCurrentPage() {
    // Try to detect current page from visible content
    const main = document.querySelector('main');
    if (!main) return 'unknown';

    // Check for specific page indicators
    const testIds = Array.from(main.querySelectorAll('[data-testid]')).map(el => el.dataset.testid);
    const headings = Array.from(main.querySelectorAll('h1, h2')).map(h => h.textContent);

    return {
      testIds,
      headings,
      mainContent: main.textContent.substring(0, 200)
    };
  }

  // Test 1: Check initial page load
  async function testInitialLoad() {
    log('Testing initial page load...', 'test');

    try {
      // Check if main layout components are present
      await waitForElement('header', 2000);
      await waitForElement('main', 2000);
      await waitForElement('nav', 2000);

      // Check title
      const title = document.querySelector('h1');
      if (title && title.textContent.includes('KaiDjuric')) {
        log('✅ Main layout loaded correctly', 'success');
        testResults.passed.push('Initial layout load');
      } else {
        log('❌ Main title not found or incorrect', 'error');
        testResults.failed.push('Main title missing');
      }

      // Check if sidebar is present
      const sidebar = document.querySelector('nav[aria-label*="Navigation"], div[role="navigation"]');
      if (sidebar) {
        log('✅ Navigation sidebar found', 'success');
        testResults.passed.push('Sidebar presence');
      } else {
        log('❌ Navigation sidebar not found', 'error');
        testResults.failed.push('Sidebar missing');
      }

    } catch (error) {
      log(`❌ Initial load test failed: ${error.message}`, 'error');
      testResults.failed.push(`Initial load: ${error.message}`);
    }
  }

  // Test 2: Header navigation buttons
  async function testHeaderNavigation() {
    log('Testing header navigation buttons...', 'test');

    const headerButtons = [
      'Product Tour',
      'Media Library',
      'Set Persona',
      'Add Context'
    ];

    for (const buttonText of headerButtons) {
      try {
        const button = findButtonByText(buttonText);
        if (button) {
          log(`✅ Found header button: ${buttonText}`, 'success');

          const beforeClick = getCurrentPage();
          button.click();
          await sleep(1000);
          const afterClick = getCurrentPage();

          if (JSON.stringify(beforeClick) !== JSON.stringify(afterClick)) {
            log(`✅ ${buttonText} navigation works`, 'success');
            testResults.navigationTests[buttonText] = 'success';
          } else {
            log(`⚠️ ${buttonText} click didn't change page`, 'warning');
            testResults.navigationTests[buttonText] = 'no-change';
          }

        } else {
          log(`❌ Header button not found: ${buttonText}`, 'error');
          testResults.navigationTests[buttonText] = 'not-found';
        }
      } catch (error) {
        log(`❌ Error testing ${buttonText}: ${error.message}`, 'error');
        testResults.navigationTests[buttonText] = `error: ${error.message}`;
      }
    }
  }

  // Test 3: Sidebar navigation
  async function testSidebarNavigation() {
    log('Testing sidebar navigation...', 'test');

    try {
      // First try to open sidebar on mobile
      const mobileMenuButton = document.querySelector('button[aria-label*="menu" i], button[aria-label*="navigation" i]');
      if (mobileMenuButton) {
        mobileMenuButton.click();
        await sleep(500);
        log('✅ Mobile menu opened', 'success');
      }

      // Find all navigation buttons
      const navButtons = Array.from(document.querySelectorAll('nav button, [role="navigation"] button'));
      log(`Found ${navButtons.length} navigation buttons`, 'info');

      const testablePages = ['Hashtag Manager', 'AI Story', 'Settings', 'Subscription', 'History'];

      for (const pageName of testablePages) {
        try {
          const button = navButtons.find(btn =>
            btn.textContent.toLowerCase().includes(pageName.toLowerCase())
          );

          if (button) {
            log(`Testing navigation to ${pageName}...`, 'test');

            const beforeNav = getCurrentPage();
            button.click();
            await sleep(1500);
            const afterNav = getCurrentPage();

            // Check if page changed
            if (JSON.stringify(beforeNav) !== JSON.stringify(afterNav)) {
              log(`✅ Successfully navigated to ${pageName}`, 'success');
              testResults.pageRenderTests[pageName] = 'success';

              // Check for errors in console (simple check)
              if (!document.querySelector('.error, [data-error="true"]')) {
                log(`✅ No visible errors on ${pageName}`, 'success');
              } else {
                log(`⚠️ Possible errors detected on ${pageName}`, 'warning');
                testResults.warnings.push(`Possible errors on ${pageName}`);
              }

            } else {
              log(`❌ Navigation to ${pageName} failed - no page change`, 'error');
              testResults.pageRenderTests[pageName] = 'navigation-failed';
            }

          } else {
            log(`❌ Navigation button for ${pageName} not found`, 'error');
            testResults.pageRenderTests[pageName] = 'button-not-found';
          }

        } catch (error) {
          log(`❌ Error navigating to ${pageName}: ${error.message}`, 'error');
          testResults.pageRenderTests[pageName] = `error: ${error.message}`;
        }
      }

    } catch (error) {
      log(`❌ Sidebar navigation test failed: ${error.message}`, 'error');
      testResults.failed.push(`Sidebar navigation: ${error.message}`);
    }
  }

  // Test 4: Expandable menu sections
  async function testExpandableMenus() {
    log('Testing expandable menu sections...', 'test');

    const expandableMenus = [
      'Dashboard',
      'Creation Suite',
      'Content Creation',
      'Image Studio',
      'Advanced Tools',
      'Account Settings'
    ];

    for (const menuName of expandableMenus) {
      try {
        const menuButton = findButtonByText(menuName);
        if (menuButton && menuButton.getAttribute('aria-expanded')) {
          log(`Testing expandable menu: ${menuName}`, 'test');

          const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
          menuButton.click();
          await sleep(500);

          const newState = menuButton.getAttribute('aria-expanded') === 'true';
          if (isExpanded !== newState) {
            log(`✅ ${menuName} menu toggle works`, 'success');
            testResults.passed.push(`${menuName} menu toggle`);
          } else {
            log(`❌ ${menuName} menu toggle failed`, 'error');
            testResults.failed.push(`${menuName} menu toggle`);
          }

        } else {
          log(`ℹ️ Expandable menu ${menuName} not found or not expandable`, 'info');
        }
      } catch (error) {
        log(`❌ Error testing ${menuName} menu: ${error.message}`, 'error');
        testResults.failed.push(`${menuName} menu: ${error.message}`);
      }
    }
  }

  // Test 5: Keyboard navigation
  async function testKeyboardNavigation() {
    log('Testing keyboard navigation...', 'test');

    try {
      // Focus on first interactive element
      const firstButton = document.querySelector('button, a[href], input, select, textarea');
      if (firstButton) {
        firstButton.focus();

        // Test tab navigation
        const focusedBefore = document.activeElement;

        // Simulate tab key
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          keyCode: 9,
          which: 9,
          bubbles: true
        });

        document.activeElement.dispatchEvent(tabEvent);
        await sleep(100);

        const focusedAfter = document.activeElement;

        if (focusedBefore !== focusedAfter) {
          log('✅ Tab navigation works', 'success');
          testResults.passed.push('Tab navigation');
        } else {
          log('⚠️ Tab navigation might not be working', 'warning');
          testResults.warnings.push('Tab navigation unclear');
        }

        // Test Enter key on buttons
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          });

          document.activeElement.dispatchEvent(enterEvent);
          await sleep(100);

          log('✅ Enter key handling tested', 'success');
        }

      } else {
        log('❌ No focusable elements found', 'error');
        testResults.failed.push('No focusable elements');
      }

    } catch (error) {
      log(`❌ Keyboard navigation test failed: ${error.message}`, 'error');
      testResults.failed.push(`Keyboard navigation: ${error.message}`);
    }
  }

  // Test 6: Responsive behavior
  async function testResponsiveBehavior() {
    log('Testing responsive behavior...', 'test');

    try {
      // Get current viewport
      const originalWidth = window.innerWidth;
      log(`Current viewport width: ${originalWidth}px`, 'info');

      // Check if mobile menu button is visible on small screens
      if (originalWidth <= 768) {
        const mobileMenuButton = document.querySelector('[aria-label*="menu" i]');
        if (mobileMenuButton && window.getComputedStyle(mobileMenuButton).display !== 'none') {
          log('✅ Mobile menu button visible on small screen', 'success');
          testResults.passed.push('Mobile menu button visibility');
        } else {
          log('❌ Mobile menu button not found on small screen', 'error');
          testResults.failed.push('Mobile menu button missing');
        }
      }

      // Check if sidebar behavior changes based on screen size
      const sidebar = document.querySelector('nav, [role="navigation"]');
      if (sidebar) {
        const sidebarStyles = window.getComputedStyle(sidebar);
        log(`Sidebar display: ${sidebarStyles.display}`, 'info');

        if (originalWidth <= 768) {
          // On mobile, sidebar should be hidden or absolutely positioned
          if (sidebarStyles.position === 'absolute' || sidebarStyles.position === 'fixed') {
            log('✅ Sidebar uses mobile layout', 'success');
            testResults.passed.push('Mobile sidebar layout');
          }
        } else {
          // On desktop, sidebar should be visible
          if (sidebarStyles.display !== 'none') {
            log('✅ Sidebar visible on desktop', 'success');
            testResults.passed.push('Desktop sidebar layout');
          }
        }
      }

    } catch (error) {
      log(`❌ Responsive test failed: ${error.message}`, 'error');
      testResults.failed.push(`Responsive: ${error.message}`);
    }
  }

  // Test 7: Accessibility
  async function testAccessibility() {
    log('Testing accessibility features...', 'test');

    try {
      // Check for ARIA labels
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      let navHasLabels = 0;

      navElements.forEach(nav => {
        if (nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby')) {
          navHasLabels++;
        }
      });

      if (navHasLabels > 0) {
        log('✅ Navigation elements have ARIA labels', 'success');
        testResults.passed.push('Navigation ARIA labels');
      } else {
        log('❌ Navigation elements missing ARIA labels', 'error');
        testResults.failed.push('Missing navigation ARIA labels');
      }

      // Check button accessibility
      const buttons = document.querySelectorAll('button');
      let buttonsWithLabels = 0;

      buttons.forEach(button => {
        const hasLabel = button.textContent.trim() ||
                        button.getAttribute('aria-label') ||
                        button.getAttribute('aria-labelledby') ||
                        button.querySelector('span:not([aria-hidden="true"])');
        if (hasLabel) buttonsWithLabels++;
      });

      const labelPercentage = (buttonsWithLabels / buttons.length) * 100;
      if (labelPercentage >= 90) {
        log(`✅ ${labelPercentage.toFixed(1)}% of buttons have accessible labels`, 'success');
        testResults.passed.push('Button accessibility');
      } else {
        log(`⚠️ Only ${labelPercentage.toFixed(1)}% of buttons have accessible labels`, 'warning');
        testResults.warnings.push('Button accessibility could be improved');
      }

      // Check for focus indicators
      const firstButton = document.querySelector('button');
      if (firstButton) {
        firstButton.focus();
        await sleep(100);

        const focusStyles = window.getComputedStyle(firstButton, ':focus');
        if (focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none') {
          log('✅ Focus indicators present', 'success');
          testResults.passed.push('Focus indicators');
        } else {
          log('⚠️ Focus indicators might be missing', 'warning');
          testResults.warnings.push('Check focus indicators');
        }
      }

    } catch (error) {
      log(`❌ Accessibility test failed: ${error.message}`, 'error');
      testResults.failed.push(`Accessibility: ${error.message}`);
    }
  }

  // Test 8: Performance check
  async function testPerformance() {
    log('Testing navigation performance...', 'test');

    try {
      // Test navigation timing
      const button = findButtonByText('Hashtag Manager') || document.querySelector('nav button');

      if (button) {
        const startTime = performance.now();
        button.click();

        // Wait for navigation to complete
        await sleep(1000);

        const endTime = performance.now();
        const navigationTime = endTime - startTime;

        testResults.performance.navigationTime = `${navigationTime.toFixed(2)}ms`;

        if (navigationTime < 1000) {
          log(`✅ Navigation completed in ${navigationTime.toFixed(2)}ms`, 'success');
          testResults.passed.push('Navigation performance');
        } else {
          log(`⚠️ Navigation took ${navigationTime.toFixed(2)}ms (might be slow)`, 'warning');
          testResults.warnings.push('Navigation performance could be improved');
        }
      }

      // Check for memory leaks (basic)
      if (window.performance && window.performance.memory) {
        testResults.performance.memoryUsage = {
          used: `${(window.performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(window.performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
        };
        log(`Memory usage: ${testResults.performance.memoryUsage.used}`, 'info');
      }

    } catch (error) {
      log(`❌ Performance test failed: ${error.message}`, 'error');
      testResults.failed.push(`Performance: ${error.message}`);
    }
  }

  // Main test runner
  async function runAllTests() {
    log('🚀 Starting comprehensive navigation test suite...', 'info');
    log(`Testing ${ALL_PAGES.length} total pages defined in the app`, 'info');

    try {
      await testInitialLoad();
      await sleep(1000);

      await testHeaderNavigation();
      await sleep(1000);

      await testSidebarNavigation();
      await sleep(1000);

      await testExpandableMenus();
      await sleep(1000);

      await testKeyboardNavigation();
      await sleep(1000);

      await testResponsiveBehavior();
      await sleep(1000);

      await testAccessibility();
      await sleep(1000);

      await testPerformance();

    } catch (error) {
      log(`❌ Test suite error: ${error.message}`, 'error');
    } finally {
      printResults();
    }
  }

  // Print test results
  function printResults() {
    const totalTime = Date.now() - testStartTime;

    console.log('\n' + '='.repeat(60));
    console.log('🏁 NAVIGATION TEST RESULTS');
    console.log('='.repeat(60));

    console.log(`⏱️  Total test time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);

    if (testResults.passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      testResults.passed.forEach(test => console.log(`  • ${test}`));
    }

    if (testResults.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.failed.forEach(test => console.log(`  • ${test}`));
    }

    if (testResults.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      testResults.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    if (Object.keys(testResults.navigationTests).length > 0) {
      console.log('\n🧭 NAVIGATION TESTS:');
      Object.entries(testResults.navigationTests).forEach(([test, result]) => {
        const emoji = result === 'success' ? '✅' : result === 'error' ? '❌' : '⚠️';
        console.log(`  ${emoji} ${test}: ${result}`);
      });
    }

    if (Object.keys(testResults.pageRenderTests).length > 0) {
      console.log('\n📄 PAGE RENDER TESTS:');
      Object.entries(testResults.pageRenderTests).forEach(([page, result]) => {
        const emoji = result === 'success' ? '✅' : '❌';
        console.log(`  ${emoji} ${page}: ${result}`);
      });
    }

    if (Object.keys(testResults.performance).length > 0) {
      console.log('\n⚡ PERFORMANCE:');
      Object.entries(testResults.performance).forEach(([metric, value]) => {
        console.log(`  • ${metric}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    const successRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100;
    if (successRate >= 80) {
      console.log(`🎉 Overall success rate: ${successRate.toFixed(1)}% - GOOD!`);
    } else if (successRate >= 60) {
      console.log(`😐 Overall success rate: ${successRate.toFixed(1)}% - NEEDS IMPROVEMENT`);
    } else {
      console.log(`😞 Overall success rate: ${successRate.toFixed(1)}% - NEEDS MAJOR WORK`);
    }

    console.log('='.repeat(60));

    // Return results for programmatic use
    return testResults;
  }

  // Start the tests
  runAllTests();

  // Make results available globally
  window.navigationTestResults = testResults;

})();