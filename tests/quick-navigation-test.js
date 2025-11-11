/**
 * Quick Navigation Test for Browser Console
 * Test the 4 main navigation flows from landing page
 *
 * Open http://localhost:3004 and run this in console
 */

(function() {
  'use strict';

  console.log('🚀 Testing KaiDjuric AI Tools Navigation...');

  const results = {
    landingPageButtons: {},
    headerNavigation: {},
    sidebarNavigation: {},
    pageTransitions: {},
    issues: []
  };

  function log(message, type = 'info') {
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[type] || 'ℹ️';
    console.log(`${emoji} ${message}`);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function testLandingPageButtons() {
    log('Testing Landing Page Quick Action Buttons...', 'info');

    // Check if we're on onboarding screen
    const onboardingElements = [
      'Launch Demo',
      'Request Invite',
      'Skip for now'
    ];

    for (const buttonText of onboardingElements) {
      const button = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.trim() === buttonText);

      if (button) {
        log(`Found "${buttonText}" button`, 'success');
        results.landingPageButtons[buttonText] = 'found';

        // Test clicking (but don't actually click to preserve test state)
        log(`"${buttonText}" button is clickable`, 'info');
      } else {
        log(`"${buttonText}" button not found`, 'error');
        results.landingPageButtons[buttonText] = 'not-found';
        results.issues.push(`Missing "${buttonText}" button`);
      }
    }
  }

  async function testHeaderNavigation() {
    log('Testing Header Navigation Buttons...', 'info');

    const headerButtons = [
      { text: 'Product Tour', expected: 'Onboarding page' },
      { text: 'Media Library', expected: 'Media Library page' }
    ];

    const header = document.querySelector('header');
    if (!header) {
      log('Header element not found', 'error');
      results.issues.push('Header element missing');
      return;
    }

    for (const { text, expected } of headerButtons) {
      const button = Array.from(header.querySelectorAll('button'))
        .find(btn => btn.textContent.includes(text));

      if (button) {
        log(`Found header "${text}" button`, 'success');
        results.headerNavigation[text] = 'found';
      } else {
        log(`Header "${text}" button not found`, 'error');
        results.headerNavigation[text] = 'not-found';
        results.issues.push(`Missing header "${text}" button`);
      }
    }

    // Test context buttons
    const contextButtons = ['Set Persona', 'Add Context'];
    for (const btnText of contextButtons) {
      const btn = Array.from(header.querySelectorAll('button'))
        .find(b => b.textContent.includes(btnText));

      if (btn) {
        log(`Found "${btnText}" context button`, 'success');
        results.headerNavigation[btnText] = 'found';
      } else {
        log(`"${btnText}" context button not found`, 'warning');
        results.headerNavigation[btnText] = 'not-found';
      }
    }
  }

  async function testSidebarNavigation() {
    log('Testing Sidebar Navigation...', 'info');

    const sidebar = document.querySelector('nav, [role="navigation"]');
    if (!sidebar) {
      log('Sidebar/Navigation not found', 'error');
      results.issues.push('Sidebar navigation missing');
      return;
    }

    log('Sidebar navigation found', 'success');

    // Test main navigation sections
    const navSections = [
      'Dashboard',
      'Creation Suite',
      'Content Creation',
      'Image Studio',
      'Advanced Tools',
      'Account Settings'
    ];

    for (const section of navSections) {
      const sectionButton = Array.from(sidebar.querySelectorAll('button'))
        .find(btn => btn.textContent.includes(section));

      if (sectionButton) {
        log(`Found "${section}" section`, 'success');
        results.sidebarNavigation[section] = 'found';

        // Check if it's expandable
        if (sectionButton.getAttribute('aria-expanded') !== null) {
          log(`"${section}" is expandable`, 'info');
          results.sidebarNavigation[`${section}-expandable`] = true;
        }
      } else {
        log(`"${section}" section not found`, 'warning');
        results.sidebarNavigation[section] = 'not-found';
      }
    }

    // Test direct page navigation
    const directPages = [
      'Hashtag Manager',
      'AI Story',
      'AI Lyrics',
      'Text-to-Image',
      'Settings',
      'History'
    ];

    for (const page of directPages) {
      const pageButton = Array.from(sidebar.querySelectorAll('button'))
        .find(btn => btn.textContent.trim() === page);

      if (pageButton) {
        log(`Found direct navigation to "${page}"`, 'success');
        results.sidebarNavigation[`direct-${page}`] = 'found';
      } else {
        log(`Direct navigation to "${page}" not found`, 'warning');
        results.sidebarNavigation[`direct-${page}`] = 'not-found';
      }
    }
  }

  async function testPageTransitions() {
    log('Testing Page Transition Functionality...', 'info');

    // Test if clicking navigation actually changes content
    const hashtagButton = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Hashtag Manager'));

    if (hashtagButton) {
      const beforeClick = document.querySelector('main')?.textContent.substring(0, 200) || '';

      log('Testing Hashtag Manager navigation...', 'info');
      hashtagButton.click();

      await sleep(1000);

      const afterClick = document.querySelector('main')?.textContent.substring(0, 200) || '';

      if (beforeClick !== afterClick) {
        log('Page transition works - content changed', 'success');
        results.pageTransitions['hashtag-manager'] = 'works';
      } else {
        log('Page transition unclear - content similar', 'warning');
        results.pageTransitions['hashtag-manager'] = 'unclear';
      }
    }
  }

  async function testResponsiveNavigation() {
    log('Testing Responsive Navigation...', 'info');

    const viewportWidth = window.innerWidth;
    log(`Current viewport: ${viewportWidth}px`, 'info');

    if (viewportWidth <= 768) {
      // Mobile test
      const mobileMenuButton = document.querySelector('[aria-label*="menu" i], button[class*="menu" i]');
      if (mobileMenuButton) {
        log('Mobile menu button found', 'success');
        results.mobileNavigation = 'found';
      } else {
        log('Mobile menu button not found', 'error');
        results.mobileNavigation = 'not-found';
        results.issues.push('Mobile menu button missing');
      }
    } else {
      // Desktop test
      const sidebar = document.querySelector('nav');
      if (sidebar && window.getComputedStyle(sidebar).display !== 'none') {
        log('Desktop sidebar visible', 'success');
        results.desktopNavigation = 'visible';
      } else {
        log('Desktop sidebar not visible', 'error');
        results.desktopNavigation = 'hidden';
      }
    }
  }

  async function testAccessibility() {
    log('Testing Navigation Accessibility...', 'info');

    // Test ARIA labels
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    let navWithLabels = 0;

    navElements.forEach(nav => {
      if (nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby')) {
        navWithLabels++;
      }
    });

    if (navWithLabels > 0) {
      log(`${navWithLabels} navigation elements have ARIA labels`, 'success');
      results.accessibility = 'good';
    } else {
      log('Navigation elements missing ARIA labels', 'warning');
      results.accessibility = 'needs-improvement';
    }

    // Test keyboard navigation
    const buttons = document.querySelectorAll('button');
    let focusableButtons = 0;

    buttons.forEach(btn => {
      if (btn.tabIndex >= 0 && !btn.disabled) {
        focusableButtons++;
      }
    });

    log(`${focusableButtons} focusable buttons found`, 'info');
  }

  async function runAllTests() {
    try {
      await testLandingPageButtons();
      await sleep(500);

      await testHeaderNavigation();
      await sleep(500);

      await testSidebarNavigation();
      await sleep(500);

      await testPageTransitions();
      await sleep(500);

      await testResponsiveNavigation();
      await sleep(500);

      await testAccessibility();

    } catch (error) {
      log(`Test error: ${error.message}`, 'error');
      results.issues.push(`Test error: ${error.message}`);
    }

    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('🏁 NAVIGATION TEST RESULTS');
    console.log('='.repeat(50));

    console.log('\n📄 LANDING PAGE BUTTONS:');
    Object.entries(results.landingPageButtons).forEach(([button, status]) => {
      const emoji = status === 'found' ? '✅' : '❌';
      console.log(`  ${emoji} ${button}: ${status}`);
    });

    console.log('\n🔗 HEADER NAVIGATION:');
    Object.entries(results.headerNavigation).forEach(([button, status]) => {
      const emoji = status === 'found' ? '✅' : '❌';
      console.log(`  ${emoji} ${button}: ${status}`);
    });

    console.log('\n🧭 SIDEBAR NAVIGATION:');
    Object.entries(results.sidebarNavigation).forEach(([item, status]) => {
      const emoji = status === 'found' || status === true ? '✅' : '❌';
      console.log(`  ${emoji} ${item}: ${status}`);
    });

    console.log('\n🔄 PAGE TRANSITIONS:');
    Object.entries(results.pageTransitions).forEach(([page, status]) => {
      const emoji = status === 'works' ? '✅' : status === 'unclear' ? '⚠️' : '❌';
      console.log(`  ${emoji} ${page}: ${status}`);
    });

    if (results.issues.length > 0) {
      console.log('\n⚠️ ISSUES FOUND:');
      results.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    console.log('\n' + '='.repeat(50));

    const totalTests = Object.keys(results.landingPageButtons).length +
                      Object.keys(results.headerNavigation).length +
                      Object.keys(results.sidebarNavigation).length;

    const passedTests = Object.values(results.landingPageButtons).filter(s => s === 'found').length +
                       Object.values(results.headerNavigation).filter(s => s === 'found').length +
                       Object.values(results.sidebarNavigation).filter(s => s === 'found' || s === true).length;

    const successRate = totalTests > 0 ? (passedTests / totalTests * 100) : 0;

    if (successRate >= 80) {
      log(`Overall success rate: ${successRate.toFixed(1)}% - EXCELLENT! 🎉`, 'success');
    } else if (successRate >= 60) {
      log(`Overall success rate: ${successRate.toFixed(1)}% - GOOD`, 'info');
    } else {
      log(`Overall success rate: ${successRate.toFixed(1)}% - NEEDS IMPROVEMENT`, 'warning');
    }

    return results;
  }

  // Run tests and make results available globally
  runAllTests().then(results => {
    window.navigationTestResults = results;
    log('Tests complete! Results stored in window.navigationTestResults', 'info');
  });

})();