import React, { useState, useCallback, useEffect } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface AccessibilityTestResult {
  passed: number;
  failed: number;
  warnings: number;
  details: AccessibilityCheck[];
}

export interface AccessibilityCheck {
  id: string;
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  element?: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  helpUrl?: string;
}

interface AccessibilityTesterProps {
  standards: ('WCAG2.1' | 'ARIA' | 'Section508')[];
  onTestComplete: (results: AccessibilityTestResult) => void;
}

export const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  standards,
  onTestComplete
}) => {
  const { announce } = useAccessibility();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AccessibilityTestResult | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [screenReaderText, setScreenReaderText] = useState<string[]>([]);

  // Test color contrast ratios
  const testColorContrast = useCallback((): AccessibilityCheck[] => {
    const checks: AccessibilityCheck[] = [];

    try {
      const elements = document.querySelectorAll('*');
      const testedElements = Array.from(elements).slice(0, 50); // Limit for performance

      testedElements.forEach((element, index) => {
        try {
          const computed = window.getComputedStyle(element);
          const color = computed.color;
          const background = computed.backgroundColor;

          if (color && background && color !== 'rgba(0, 0, 0, 0)' && background !== 'rgba(0, 0, 0, 0)') {
            const contrast = calculateContrastRatio(color, background);
            const fontSize = parseFloat(computed.fontSize);
            const fontWeight = computed.fontWeight;

            const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
            const requiredRatio = isLargeText ? 3.0 : 4.5;

            checks.push({
              id: `contrast-${index}`,
              rule: 'WCAG 2.1 - Color Contrast',
              status: contrast >= requiredRatio ? 'pass' : 'fail',
              element: element.tagName.toLowerCase(),
              description: `Contrast ratio: ${contrast.toFixed(2)}:1 (required: ${requiredRatio}:1)`,
              impact: contrast < requiredRatio ? (contrast < 2.0 ? 'critical' : 'serious') : 'minor'
            });
          }
        } catch (error) {
          // Skip elements that cause errors
        }
      });
    } catch (error) {
      checks.push({
        id: 'contrast-error',
        rule: 'Color Contrast Test',
        status: 'fail',
        description: 'Failed to analyze color contrast',
        impact: 'moderate'
      });
    }

    return checks;
  }, []);

  // Test ARIA labels and roles
  const testARIACompliance = useCallback((): AccessibilityCheck[] => {
    const checks: AccessibilityCheck[] = [];

    // Check for missing ARIA labels on interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]');

    interactiveElements.forEach((element, index) => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const ariaDescribedBy = element.getAttribute('aria-describedby');
      const textContent = element.textContent?.trim();
      const title = element.getAttribute('title');

      const hasLabel = ariaLabel || ariaLabelledBy || textContent || title;

      checks.push({
        id: `aria-label-${index}`,
        rule: 'ARIA - Accessible Name',
        status: hasLabel ? 'pass' : 'fail',
        element: element.tagName.toLowerCase() + (element.className ? `.${element.className.split(' ')[0]}` : ''),
        description: hasLabel
          ? 'Element has accessible name'
          : 'Interactive element missing accessible name',
        impact: hasLabel ? 'minor' : 'serious'
      });
    });

    // Check for proper ARIA roles
    const elementsWithRoles = document.querySelectorAll('[role]');
    elementsWithRoles.forEach((element, index) => {
      const role = element.getAttribute('role');
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
        'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
        'dialog', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group',
        'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'main', 'navigation',
        'region', 'row', 'rowgroup', 'rowheader', 'search', 'switch', 'tab', 'table',
        'tablist', 'tabpanel', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
        'treeitem', 'presentation', 'none'
      ];

      checks.push({
        id: `aria-role-${index}`,
        rule: 'ARIA - Valid Roles',
        status: role && validRoles.includes(role) ? 'pass' : 'fail',
        element: element.tagName.toLowerCase(),
        description: role && validRoles.includes(role)
          ? `Valid ARIA role: ${role}`
          : `Invalid or missing ARIA role: ${role}`,
        impact: role && validRoles.includes(role) ? 'minor' : 'moderate'
      });
    });

    return checks;
  }, []);

  // Test keyboard navigation
  const testKeyboardNavigation = useCallback((): AccessibilityCheck[] => {
    const checks: AccessibilityCheck[] = [];

    // Check for focusable elements
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Check if elements have visible focus indicators
    focusableElements.forEach((element, index) => {
      const computed = window.getComputedStyle(element);
      const outlineStyle = computed.outline;
      const outlineWidth = computed.outlineWidth;

      const hasFocusIndicator = outlineStyle !== 'none' && outlineWidth !== '0px';

      checks.push({
        id: `focus-indicator-${index}`,
        rule: 'WCAG 2.1 - Focus Visible',
        status: hasFocusIndicator ? 'pass' : 'warning',
        element: element.tagName.toLowerCase(),
        description: hasFocusIndicator
          ? 'Element has visible focus indicator'
          : 'Element may lack visible focus indicator',
        impact: hasFocusIndicator ? 'minor' : 'moderate'
      });
    });

    // Check tab order
    const tabbableElements = Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    const tabIndexIssues = tabbableElements.filter((element) => {
      const tabIndex = element.tabIndex;
      return tabIndex > 0; // Positive tab indices can cause issues
    });

    if (tabIndexIssues.length > 0) {
      checks.push({
        id: 'tab-order',
        rule: 'WCAG 2.1 - Focus Order',
        status: 'warning',
        description: `${tabIndexIssues.length} elements have positive tabindex values, which may disrupt natural tab order`,
        impact: 'moderate'
      });
    } else {
      checks.push({
        id: 'tab-order',
        rule: 'WCAG 2.1 - Focus Order',
        status: 'pass',
        description: 'No positive tabindex values found - natural tab order preserved',
        impact: 'minor'
      });
    }

    return checks;
  }, []);

  // Test image accessibility
  const testImageAccessibility = useCallback((): AccessibilityCheck[] => {
    const checks: AccessibilityCheck[] = [];

    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');

      // Check for alt text
      if (alt === null) {
        checks.push({
          id: `img-alt-${index}`,
          rule: 'WCAG 2.1 - Non-text Content',
          status: 'fail',
          element: 'img',
          description: 'Image missing alt attribute',
          impact: 'serious'
        });
      } else if (alt === '') {
        if (role === 'presentation' || img.closest('[aria-hidden="true"]')) {
          checks.push({
            id: `img-alt-${index}`,
            rule: 'WCAG 2.1 - Non-text Content',
            status: 'pass',
            element: 'img',
            description: 'Decorative image properly marked',
            impact: 'minor'
          });
        } else {
          checks.push({
            id: `img-alt-${index}`,
            rule: 'WCAG 2.1 - Non-text Content',
            status: 'warning',
            element: 'img',
            description: 'Image has empty alt text - ensure it\'s decorative',
            impact: 'moderate'
          });
        }
      } else {
        checks.push({
          id: `img-alt-${index}`,
          rule: 'WCAG 2.1 - Non-text Content',
          status: 'pass',
          element: 'img',
          description: 'Image has alt text',
          impact: 'minor'
        });
      }
    });

    return checks;
  }, []);

  // Test heading structure
  const testHeadingStructure = useCallback((): AccessibilityCheck[] => {
    const checks: AccessibilityCheck[] = [];

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    if (headings.length === 0) {
      checks.push({
        id: 'heading-structure',
        rule: 'WCAG 2.1 - Info and Relationships',
        status: 'warning',
        description: 'No headings found on page',
        impact: 'moderate'
      });
      return checks;
    }

    // Check for H1
    const h1s = headings.filter(h => h.tagName === 'H1');
    if (h1s.length === 0) {
      checks.push({
        id: 'h1-missing',
        rule: 'WCAG 2.1 - Info and Relationships',
        status: 'fail',
        description: 'Page missing H1 heading',
        impact: 'serious'
      });
    } else if (h1s.length > 1) {
      checks.push({
        id: 'h1-multiple',
        rule: 'WCAG 2.1 - Info and Relationships',
        status: 'warning',
        description: 'Multiple H1 headings found',
        impact: 'moderate'
      });
    } else {
      checks.push({
        id: 'h1-present',
        rule: 'WCAG 2.1 - Info and Relationships',
        status: 'pass',
        description: 'Single H1 heading found',
        impact: 'minor'
      });
    }

    // Check heading hierarchy
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));

      if (index === 0 && level !== 1) {
        checks.push({
          id: `heading-order-${index}`,
          rule: 'WCAG 2.1 - Info and Relationships',
          status: 'warning',
          element: heading.tagName.toLowerCase(),
          description: 'First heading is not H1',
          impact: 'moderate'
        });
      } else if (level > lastLevel + 1) {
        checks.push({
          id: `heading-skip-${index}`,
          rule: 'WCAG 2.1 - Info and Relationships',
          status: 'warning',
          element: heading.tagName.toLowerCase(),
          description: `Heading level skipped (from H${lastLevel} to H${level})`,
          impact: 'moderate'
        });
      }

      lastLevel = level;
    });

    return checks;
  }, []);

  // Test form accessibility
  const testFormAccessibility = useCallback((): AccessibilityCheck[] => {
    const checks: AccessibilityCheck[] = [];

    const formControls = document.querySelectorAll('input, select, textarea');

    formControls.forEach((control, index) => {
      const label = document.querySelector(`label[for="${control.id}"]`);
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledBy = control.getAttribute('aria-labelledby');

      const hasLabel = label || ariaLabel || ariaLabelledBy;

      checks.push({
        id: `form-label-${index}`,
        rule: 'WCAG 2.1 - Labels or Instructions',
        status: hasLabel ? 'pass' : 'fail',
        element: control.tagName.toLowerCase(),
        description: hasLabel
          ? 'Form control has associated label'
          : 'Form control missing label',
        impact: hasLabel ? 'minor' : 'serious'
      });

      // Check for required fields
      if (control.hasAttribute('required') || control.getAttribute('aria-required') === 'true') {
        const hasRequiredIndicator =
          control.getAttribute('aria-label')?.includes('required') ||
          document.querySelector(`label[for="${control.id}"]`)?.textContent?.includes('*') ||
          control.getAttribute('aria-describedby');

        checks.push({
          id: `form-required-${index}`,
          rule: 'WCAG 2.1 - Labels or Instructions',
          status: hasRequiredIndicator ? 'pass' : 'warning',
          element: control.tagName.toLowerCase(),
          description: hasRequiredIndicator
            ? 'Required field properly indicated'
            : 'Required field may not be clearly indicated',
          impact: hasRequiredIndicator ? 'minor' : 'moderate'
        });
      }
    });

    return checks;
  }, []);

  // Test screen reader compatibility
  const testScreenReaderCompatibility = useCallback((): AccessibilityCheck[] => {
    const checks: AccessibilityCheck[] = [];

    // Check for live regions
    const liveRegions = document.querySelectorAll('[aria-live], [aria-atomic]');
    checks.push({
      id: 'live-regions',
      rule: 'ARIA - Live Regions',
      status: liveRegions.length > 0 ? 'pass' : 'warning',
      description: `${liveRegions.length} live regions found`,
      impact: liveRegions.length > 0 ? 'minor' : 'moderate'
    });

    // Check for hidden content
    const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
    const visuallyHidden = document.querySelectorAll('.sr-only, .screen-reader-only, .visually-hidden');

    checks.push({
      id: 'screen-reader-content',
      rule: 'ARIA - Hidden Content',
      status: 'pass',
      description: `${hiddenElements.length} elements hidden from screen readers, ${visuallyHidden.length} elements visually hidden but available to screen readers`,
      impact: 'minor'
    });

    // Simulate screen reader text extraction
    const extractedText = extractScreenReaderText();
    setScreenReaderText(extractedText);

    checks.push({
      id: 'screen-reader-text',
      rule: 'Screen Reader - Text Content',
      status: extractedText.length > 0 ? 'pass' : 'fail',
      description: `${extractedText.length} text nodes accessible to screen readers`,
      impact: extractedText.length > 0 ? 'minor' : 'critical'
    });

    return checks;
  }, []);

  // Extract text that would be read by screen readers
  const extractScreenReaderText = (): string[] => {
    const textNodes: string[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text && text.length > 0) {
              const parentElement = node.parentElement;
              if (parentElement && !isElementHidden(parentElement)) {
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const ariaLabel = element.getAttribute('aria-label');
            const altText = element.getAttribute('alt');
            if (ariaLabel || altText) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) textNodes.push(text);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const ariaLabel = element.getAttribute('aria-label');
        const altText = element.getAttribute('alt');
        if (ariaLabel) textNodes.push(ariaLabel);
        if (altText) textNodes.push(altText);
      }
    }

    return textNodes;
  };

  const isElementHidden = (element: Element): boolean => {
    const style = window.getComputedStyle(element);
    return (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      element.getAttribute('aria-hidden') === 'true' ||
      element.hasAttribute('hidden')
    );
  };

  // Helper function to calculate contrast ratio
  const calculateContrastRatio = (color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return 0;

      const [r, g, b] = rgb.map(c => {
        const val = parseInt(c) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  };

  // Run all accessibility tests
  const runAccessibilityTests = useCallback(async () => {
    setIsRunning(true);
    setResults(null);
    announce('Starting accessibility tests');

    try {
      const allChecks: AccessibilityCheck[] = [];

      // Run each test with progress updates
      setCurrentTest('Testing color contrast...');
      await new Promise(resolve => setTimeout(resolve, 100));
      allChecks.push(...testColorContrast());

      setCurrentTest('Testing ARIA compliance...');
      await new Promise(resolve => setTimeout(resolve, 100));
      allChecks.push(...testARIACompliance());

      setCurrentTest('Testing keyboard navigation...');
      await new Promise(resolve => setTimeout(resolve, 100));
      allChecks.push(...testKeyboardNavigation());

      setCurrentTest('Testing image accessibility...');
      await new Promise(resolve => setTimeout(resolve, 100));
      allChecks.push(...testImageAccessibility());

      setCurrentTest('Testing heading structure...');
      await new Promise(resolve => setTimeout(resolve, 100));
      allChecks.push(...testHeadingStructure());

      setCurrentTest('Testing form accessibility...');
      await new Promise(resolve => setTimeout(resolve, 100));
      allChecks.push(...testFormAccessibility());

      setCurrentTest('Testing screen reader compatibility...');
      await new Promise(resolve => setTimeout(resolve, 100));
      allChecks.push(...testScreenReaderCompatibility());

      setCurrentTest('Finalizing results...');

      const testResults: AccessibilityTestResult = {
        passed: allChecks.filter(check => check.status === 'pass').length,
        failed: allChecks.filter(check => check.status === 'fail').length,
        warnings: allChecks.filter(check => check.status === 'warning').length,
        details: allChecks
      };

      setResults(testResults);
      onTestComplete(testResults);

      announce(`Accessibility tests completed. ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.warnings} warnings`);
    } catch (error) {
      console.error('Accessibility test error:', error);
      announce('Accessibility tests failed with error');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  }, [
    testColorContrast,
    testARIACompliance,
    testKeyboardNavigation,
    testImageAccessibility,
    testHeadingStructure,
    testFormAccessibility,
    testScreenReaderCompatibility,
    onTestComplete,
    announce
  ]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Accessibility Tester</h3>
        <div className="flex items-center space-x-2">
          {standards.map(standard => (
            <span key={standard} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
              {standard}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={runAccessibilityTests}
        disabled={isRunning}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        aria-label="Run accessibility tests"
      >
        {isRunning ? 'Running Tests...' : 'Run Accessibility Tests'}
      </button>

      {isRunning && currentTest && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-300">{currentTest}</span>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-900/30 border border-green-500 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{results.passed}</p>
              <p className="text-sm text-green-300">Passed</p>
            </div>
            <div className="bg-red-900/30 border border-red-500 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{results.failed}</p>
              <p className="text-sm text-red-300">Failed</p>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-500 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-400">{results.warnings}</p>
              <p className="text-sm text-yellow-300">Warnings</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.details.map((check, index) => (
              <div
                key={check.id}
                className={`p-3 rounded-lg border ${
                  check.status === 'pass' ? 'bg-green-900/20 border-green-500' :
                  check.status === 'fail' ? 'bg-red-900/20 border-red-500' :
                  'bg-yellow-900/20 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{check.rule}</h4>
                    <p className="text-sm text-gray-300">{check.description}</p>
                    {check.element && (
                      <p className="text-xs text-gray-400">Element: {check.element}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      check.impact === 'critical' ? 'bg-red-600 text-white' :
                      check.impact === 'serious' ? 'bg-red-500 text-white' :
                      check.impact === 'moderate' ? 'bg-yellow-500 text-black' :
                      'bg-green-600 text-white'
                    }`}>
                      {check.impact}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${
                      check.status === 'pass' ? 'bg-green-400' :
                      check.status === 'fail' ? 'bg-red-400' :
                      'bg-yellow-400'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Screen Reader Preview */}
          {screenReaderText.length > 0 && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Screen Reader Text Preview</h4>
              <div className="max-h-32 overflow-y-auto text-sm text-gray-300 space-y-1">
                {screenReaderText.slice(0, 20).map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
                {screenReaderText.length > 20 && (
                  <p className="text-gray-400">...and {screenReaderText.length - 20} more text nodes</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};