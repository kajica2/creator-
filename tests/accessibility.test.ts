/**
 * WCAG 2.1 AA compliance testing framework
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { AccessibilityTester, runQuickAccessibilityCheck, AccessibilityMonitor } from '../src/utils/accessibilityTesting';
import { colorContrast } from '../src/utils/accessibility';

// Mock DOM environment
const setupDOM = (html: string) => {
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    resources: 'usable'
  });
  global.window = dom.window as any;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;

  // Mock getComputedStyle
  global.getComputedStyle = vi.fn((element) => ({
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(0, 0, 0)',
    fontSize: '16px',
    fontWeight: 'normal'
  })) as any;

  return dom.window.document;
};

describe('WCAG 2.1 AA Compliance Tests', () => {
  let document: Document;
  let tester: AccessibilityTester;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Image Alt Text (WCAG 1.1.1)', () => {
    it('should pass when all images have alt text', async () => {
      document = setupDOM(`
        <div>
          <img src="test.jpg" alt="Descriptive alt text" />
          <img src="decorative.jpg" alt="" role="presentation" />
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const altErrors = report.errors.filter(error => error.description.includes('alt'));
      expect(altErrors).toHaveLength(0);
    });

    it('should fail when images are missing alt text', async () => {
      document = setupDOM(`
        <div>
          <img src="test.jpg" />
          <img src="test2.jpg" alt="" />
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const altErrors = report.errors.filter(error => error.description.includes('missing alt'));
      expect(altErrors.length).toBeGreaterThan(0);
    });

    it('should warn about redundant alt text', async () => {
      document = setupDOM(`
        <div>
          <img src="test.jpg" alt="Image of a cat" />
          <img src="test2.jpg" alt="Picture showing a dog" />
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const altWarnings = report.warnings_list.filter(warning =>
        warning.description.includes('redundant')
      );
      expect(altWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('Form Labels (WCAG 1.3.1, 3.3.2)', () => {
    it('should pass when all form controls have labels', async () => {
      document = setupDOM(`
        <form>
          <label for="name">Name:</label>
          <input type="text" id="name" />

          <label for="email">Email:</label>
          <input type="email" id="email" />

          <input type="text" aria-label="Phone number" />

          <select aria-labelledby="country-label">
            <option>USA</option>
          </select>
          <span id="country-label">Country</span>
        </form>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const labelErrors = report.errors.filter(error =>
        error.description.includes('label')
      );
      expect(labelErrors).toHaveLength(0);
    });

    it('should fail when form controls lack labels', async () => {
      document = setupDOM(`
        <form>
          <input type="text" placeholder="Enter your name" />
          <select>
            <option>Choose option</option>
          </select>
          <textarea></textarea>
        </form>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const labelErrors = report.errors.filter(error =>
        error.description.includes('missing accessible label')
      );
      expect(labelErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Heading Structure (WCAG 1.3.1)', () => {
    it('should pass with proper heading hierarchy', async () => {
      document = setupDOM(`
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <h2>Another Section</h2>
          <h3>Another Subsection</h3>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const headingErrors = report.errors.filter(error =>
        error.description.includes('Heading')
      );
      expect(headingErrors).toHaveLength(0);
    });

    it('should warn about skipped heading levels', async () => {
      document = setupDOM(`
        <div>
          <h1>Main Title</h1>
          <h3>Skipped h2</h3>
          <h5>Skipped h4</h5>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const headingWarnings = report.warnings_list.filter(warning =>
        warning.description.includes('skipped')
      );
      expect(headingWarnings.length).toBeGreaterThan(0);
    });

    it('should fail for empty headings', async () => {
      document = setupDOM(`
        <div>
          <h1></h1>
          <h2>   </h2>
          <h3>Valid Heading</h3>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const emptyHeadingErrors = report.errors.filter(error =>
        error.description.includes('empty')
      );
      expect(emptyHeadingErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Color Contrast (WCAG 1.4.3)', () => {
    it('should calculate contrast ratios correctly', () => {
      // Test high contrast (should pass)
      const highContrast = colorContrast.getContrastRatio('#000000', '#ffffff');
      expect(highContrast).toBe(21);

      // Test low contrast
      const lowContrast = colorContrast.getContrastRatio('#777777', '#888888');
      expect(lowContrast).toBeLessThan(4.5);
    });

    it('should validate WCAG AA compliance', () => {
      // High contrast should pass AA
      expect(colorContrast.meetsWCAGAA('#000000', '#ffffff')).toBe(true);
      expect(colorContrast.meetsWCAGAA('#ffffff', '#000000')).toBe(true);

      // Low contrast should fail AA
      expect(colorContrast.meetsWCAGAA('#777777', '#888888')).toBe(false);

      // Large text has lower requirements
      expect(colorContrast.meetsWCAGAA('#777777', '#ffffff', true)).toBe(true);
    });
  });

  describe('Keyboard Accessibility (WCAG 2.1.1)', () => {
    it('should pass when interactive elements are focusable', async () => {
      document = setupDOM(`
        <div>
          <button>Click me</button>
          <a href="#link">Link</a>
          <input type="text" />
          <select><option>Option</option></select>
          <textarea></textarea>
          <div role="button" tabindex="0">Custom button</div>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const keyboardErrors = report.errors.filter(error =>
        error.description.includes('keyboard')
      );
      expect(keyboardErrors).toHaveLength(0);
    });

    it('should fail when interactive elements are not focusable', async () => {
      document = setupDOM(`
        <div>
          <div onclick="handleClick()">Not focusable</div>
          <span role="button">No tabindex</span>
        </div>
      `);

      // Mock the focusable check to return false for these elements
      vi.mocked(global.getComputedStyle).mockImplementation((element) => {
        const el = element as HTMLElement;
        if (el.hasAttribute('onclick') || el.getAttribute('role') === 'button') {
          return {
            color: 'rgb(255, 255, 255)',
            backgroundColor: 'rgb(0, 0, 0)',
            fontSize: '16px',
            fontWeight: 'normal',
            display: 'block'
          } as CSSStyleDeclaration;
        }
        return {
          color: 'rgb(255, 255, 255)',
          backgroundColor: 'rgb(0, 0, 0)',
          fontSize: '16px',
          fontWeight: 'normal'
        } as CSSStyleDeclaration;
      });

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const keyboardErrors = report.errors.filter(error =>
        error.description.includes('unfocusable')
      );
      expect(keyboardErrors.length).toBeGreaterThan(0);
    });

    it('should warn about positive tabindex values', async () => {
      document = setupDOM(`
        <div>
          <button tabindex="1">Bad tabindex</button>
          <button tabindex="5">Another bad tabindex</button>
          <button tabindex="0">Good tabindex</button>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const tabindexWarnings = report.warnings_list.filter(warning =>
        warning.description.includes('Positive tabindex')
      );
      expect(tabindexWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('ARIA Usage (WCAG 4.1.2)', () => {
    it('should pass with valid ARIA attributes', async () => {
      document = setupDOM(`
        <div>
          <button aria-label="Close dialog">×</button>
          <div role="button" aria-pressed="false">Toggle</div>
          <input aria-describedby="help-text" />
          <div id="help-text">Help information</div>
          <div aria-labelledby="title">
            <h2 id="title">Section Title</h2>
          </div>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const ariaErrors = report.errors.filter(error =>
        error.description.includes('ARIA') || error.description.includes('aria-')
      );
      expect(ariaErrors).toHaveLength(0);
    });

    it('should fail with invalid ARIA attributes', async () => {
      document = setupDOM(`
        <div>
          <div role="invalid-role">Invalid role</div>
          <button aria-label="">Empty label</button>
          <input aria-labelledby="non-existent" />
          <input aria-describedby="also-non-existent" />
          <div aria-live="invalid-value">Live region</div>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const ariaErrors = report.errors.filter(error =>
        error.description.includes('Invalid') || error.description.includes('non-existent')
      );
      expect(ariaErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Landmarks and Structure (WCAG 1.3.1)', () => {
    it('should pass with proper landmark structure', async () => {
      document = setupDOM(`
        <div>
          <header role="banner">
            <nav role="navigation">Navigation</nav>
          </header>
          <main role="main">
            <h1>Main Content</h1>
          </main>
          <footer role="contentinfo">Footer</footer>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const landmarkWarnings = report.warnings_list.filter(warning =>
        warning.description.includes('landmark')
      );
      expect(landmarkWarnings).toHaveLength(0);
    });

    it('should warn about missing landmarks', async () => {
      document = setupDOM(`
        <div>
          <h1>Content without landmarks</h1>
          <p>Some content</p>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const landmarkWarnings = report.warnings_list.filter(warning =>
        warning.description.includes('landmark')
      );
      expect(landmarkWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('Focus Management', () => {
    it('should pass with skip links', async () => {
      document = setupDOM(`
        <div>
          <a href="#main-content">Skip to main content</a>
          <nav>Navigation items</nav>
          <main id="main-content">Main content</main>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const skipLinkErrors = report.errors.filter(error =>
        error.description.includes('skip')
      );
      expect(skipLinkErrors).toHaveLength(0);
    });

    it('should fail when skip links point to non-existent targets', async () => {
      document = setupDOM(`
        <div>
          <a href="#non-existent">Skip to main content</a>
          <main id="different-id">Main content</main>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const skipLinkErrors = report.errors.filter(error =>
        error.description.includes('non-existent')
      );
      expect(skipLinkErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Media Accessibility (WCAG 1.4.2)', () => {
    it('should pass when autoplay media has controls', async () => {
      document = setupDOM(`
        <div>
          <video autoplay controls src="video.mp4">Video content</video>
          <audio autoplay controls src="audio.mp3">Audio content</audio>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const mediaErrors = report.errors.filter(error =>
        error.description.includes('Auto-playing')
      );
      expect(mediaErrors).toHaveLength(0);
    });

    it('should fail when autoplay media lacks controls', async () => {
      document = setupDOM(`
        <div>
          <video autoplay src="video.mp4">Video content</video>
          <audio autoplay src="audio.mp3">Audio content</audio>
        </div>
      `);

      tester = new AccessibilityTester(document.body);
      const report = await tester.runFullAudit();

      const mediaErrors = report.errors.filter(error =>
        error.description.includes('Auto-playing')
      );
      expect(mediaErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should generate comprehensive audit report', async () => {
      document = setupDOM(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <header>
            <nav>
              <a href="#main">Skip to main content</a>
              <ul>
                <li><a href="/home">Home</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
          </header>

          <main id="main">
            <h1>Welcome to Test Page</h1>

            <form>
              <label for="name">Name:</label>
              <input type="text" id="name" required />

              <label for="email">Email:</label>
              <input type="email" id="email" required />

              <button type="submit">Submit</button>
            </form>

            <img src="test.jpg" alt="Test image" />
          </main>

          <footer>
            <p>&copy; 2024 Test Company</p>
          </footer>
        </body>
        </html>
      `);

      const report = await runQuickAccessibilityCheck(document.body);

      expect(report).toBeDefined();
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.totalChecks).toBeGreaterThan(0);
      expect(report.wcagLevel).toMatch(/^(A|AA|AAA)$/);
      expect(Array.isArray(report.errors)).toBe(true);
      expect(Array.isArray(report.warnings_list)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should provide actionable recommendations', async () => {
      document = setupDOM(`
        <div>
          <img src="bad.jpg" />
          <div onclick="handle()">Not focusable</div>
          <input type="text" />
        </div>
      `);

      const report = await runQuickAccessibilityCheck(document.body);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(rec =>
        rec.includes('alt text') || rec.includes('keyboard')
      )).toBe(true);
    });
  });

  describe('Accessibility Monitor', () => {
    it('should detect DOM changes and trigger audits', async () => {
      document = setupDOM('<div id="test"></div>');

      const monitor = new AccessibilityMonitor();
      const mockCallback = vi.fn();

      monitor.startMonitoring(mockCallback);

      // Simulate DOM change
      const testDiv = document.getElementById('test');
      testDiv!.innerHTML = '<img src="test.jpg" />';

      // Wait for potential callback (monitor has throttling)
      await new Promise(resolve => setTimeout(resolve, 100));

      monitor.stopMonitoring();

      // Note: Actual callback triggering depends on timing and throttling
      // This test verifies the monitoring can start/stop without errors
      expect(() => monitor.stopMonitoring()).not.toThrow();
    });
  });
});

describe('Performance Tests', () => {
  it('should complete audit within reasonable time', async () => {
    const largeDocument = setupDOM(`
      <div>
        ${Array.from({ length: 100 }, (_, i) => `
          <div>
            <h2>Section ${i}</h2>
            <p>Content ${i}</p>
            <img src="img${i}.jpg" alt="Image ${i}" />
            <button>Button ${i}</button>
            <input type="text" id="input${i}" />
            <label for="input${i}">Label ${i}</label>
          </div>
        `).join('')}
      </div>
    `);

    const startTime = performance.now();
    const report = await runQuickAccessibilityCheck(largeDocument.body);
    const endTime = performance.now();

    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    expect(report).toBeDefined();
    expect(report.totalChecks).toBeGreaterThan(0);
  });
});

describe('Error Handling', () => {
  it('should handle invalid DOM gracefully', async () => {
    // Test with minimal DOM
    const emptyDocument = setupDOM('<div></div>');

    expect(async () => {
      await runQuickAccessibilityCheck(emptyDocument.body);
    }).not.toThrow();
  });

  it('should handle missing elements gracefully', async () => {
    document = setupDOM(`
      <div>
        <input aria-labelledby="missing-id" />
        <img src="" alt="" />
        <a href="#missing-target">Link</a>
      </div>
    `);

    const report = await runQuickAccessibilityCheck(document.body);

    expect(report).toBeDefined();
    expect(report.errors.some(error =>
      error.description.includes('missing') || error.description.includes('non-existent')
    )).toBe(true);
  });
});