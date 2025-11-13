/**
 * Accessibility testing utilities and automated audit tools
 */

import { accessibilityTesting, colorContrast, ARIA_ROLES, ARIA_PROPERTIES } from './accessibility';

// Accessibility audit report interface
export interface AccessibilityAuditReport {
  timestamp: number;
  score: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  errors: AccessibilityError[];
  warnings_list: AccessibilityWarning[];
  recommendations: string[];
  wcagLevel: 'A' | 'AA' | 'AAA';
  testedUrl: string;
}

export interface AccessibilityError {
  id: string;
  severity: 'error' | 'warning' | 'info';
  element: string;
  description: string;
  wcagCriteria: string[];
  suggestion: string;
  xpath?: string;
  selector?: string;
}

export interface AccessibilityWarning {
  id: string;
  element: string;
  description: string;
  suggestion: string;
}

// WCAG 2.1 Level AA criteria checklist
const WCAG_AA_CRITERIA = {
  // Perceivable
  'text-alternatives': 'All images have appropriate alt text',
  'captions': 'Audio content has captions',
  'audio-descriptions': 'Video content has audio descriptions',
  'color-contrast': 'Text has sufficient color contrast (4.5:1 normal, 3:1 large)',
  'resize-text': 'Text can be resized up to 200% without loss of functionality',
  'images-of-text': 'Images of text are avoided where possible',

  // Operable
  'keyboard-accessible': 'All functionality is available from keyboard',
  'no-keyboard-trap': 'Keyboard focus is not trapped',
  'timing-adjustable': 'Time limits can be extended or disabled',
  'seizures': 'No content flashes more than 3 times per second',
  'skip-links': 'Skip links are provided for main content',
  'page-titles': 'Pages have descriptive titles',
  'focus-order': 'Focus order is logical and intuitive',
  'link-purpose': 'Link purpose is clear from context',

  // Understandable
  'page-language': 'Page language is identified',
  'parts-language': 'Language changes are identified',
  'on-focus': 'Components do not change context on focus',
  'on-input': 'Components do not change context on input',
  'error-identification': 'Errors are clearly identified',
  'labels-instructions': 'Labels and instructions are provided',
  'error-suggestion': 'Error correction suggestions are provided',
  'error-prevention': 'Error prevention for important data',

  // Robust
  'valid-code': 'Markup is valid and well-formed',
  'name-role-value': 'Components have accessible names and roles'
};

// Comprehensive accessibility testing class
export class AccessibilityTester {
  private errors: AccessibilityError[] = [];
  private warnings: AccessibilityWarning[] = [];
  private element: HTMLElement;

  constructor(rootElement: HTMLElement = document.body) {
    this.element = rootElement;
    this.errors = [];
    this.warnings = [];
  }

  // Run complete accessibility audit
  public async runFullAudit(): Promise<AccessibilityAuditReport> {
    const startTime = performance.now();

    // Reset results
    this.errors = [];
    this.warnings = [];

    // Run all checks
    await Promise.all([
      this.checkImageAltText(),
      this.checkFormLabels(),
      this.checkHeadingStructure(),
      this.checkColorContrast(),
      this.checkKeyboardAccessibility(),
      this.checkAriaUsage(),
      this.checkFocusManagement(),
      this.checkLandmarks(),
      this.checkSemanticStructure(),
      this.checkLiveRegions(),
      this.checkSkipLinks(),
      this.checkTabIndex(),
      this.checkInteractiveElements(),
      this.checkErrorHandling(),
      this.checkTimingFunctionality()
    ]);

    const endTime = performance.now();
    const totalChecks = Object.keys(WCAG_AA_CRITERIA).length;
    const failedChecks = this.errors.filter(e => e.severity === 'error').length;
    const passedChecks = totalChecks - failedChecks;
    const score = Math.round((passedChecks / totalChecks) * 100);

    return {
      timestamp: Date.now(),
      score,
      totalChecks,
      passedChecks,
      failedChecks,
      warnings: this.warnings.length,
      errors: this.errors,
      warnings_list: this.warnings,
      recommendations: this.generateRecommendations(),
      wcagLevel: score >= 95 ? 'AAA' : score >= 85 ? 'AA' : 'A',
      testedUrl: window.location.href
    };
  }

  // Check image alt text
  private async checkImageAltText(): Promise<void> {
    const images = this.element.querySelectorAll('img');

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      const selector = this.getElementSelector(img);

      if (alt === null) {
        this.addError({
          id: `img-alt-missing-${index}`,
          severity: 'error',
          element: selector,
          description: 'Image is missing alt attribute',
          wcagCriteria: ['1.1.1'],
          suggestion: 'Add alt attribute with descriptive text or alt="" for decorative images',
          selector
        });
      } else if (alt.trim() === '' && !img.hasAttribute('role')) {
        // Empty alt is okay for decorative images, but should be intentional
        this.addWarning({
          id: `img-alt-empty-${index}`,
          element: selector,
          description: 'Image has empty alt text',
          suggestion: 'Verify this image is decorative or add descriptive alt text'
        });
      } else if (alt && (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture'))) {
        this.addWarning({
          id: `img-alt-redundant-${index}`,
          element: selector,
          description: 'Alt text contains redundant words like "image" or "picture"',
          suggestion: 'Remove redundant words from alt text'
        });
      }

      // Check for extremely long alt text
      if (alt && alt.length > 125) {
        this.addWarning({
          id: `img-alt-long-${index}`,
          element: selector,
          description: 'Alt text is very long (over 125 characters)',
          suggestion: 'Consider using a shorter alt text and providing detailed description elsewhere'
        });
      }
    });
  }

  // Check form labels
  private async checkFormLabels(): Promise<void> {
    const formControls = this.element.querySelectorAll('input, select, textarea');

    formControls.forEach((control, index) => {
      const selector = this.getElementSelector(control);
      const id = control.getAttribute('id');
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledby = control.getAttribute('aria-labelledby');
      const type = control.getAttribute('type');

      // Skip hidden inputs
      if (type === 'hidden') return;

      const hasLabel = id && this.element.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = ariaLabel || ariaLabelledby;

      if (!hasLabel && !hasAriaLabel) {
        this.addError({
          id: `form-label-missing-${index}`,
          severity: 'error',
          element: selector,
          description: 'Form control is missing accessible label',
          wcagCriteria: ['1.3.1', '3.3.2'],
          suggestion: 'Add a <label> element or aria-label attribute',
          selector
        });
      }

      // Check for placeholder-only labels
      const placeholder = control.getAttribute('placeholder');
      if (placeholder && !hasLabel && !hasAriaLabel) {
        this.addError({
          id: `form-placeholder-only-${index}`,
          severity: 'error',
          element: selector,
          description: 'Form control relies only on placeholder for labeling',
          wcagCriteria: ['3.3.2'],
          suggestion: 'Add a persistent label element in addition to placeholder',
          selector
        });
      }
    });
  }

  // Check if an element is focusable
  private checkFocusable(element: HTMLElement): boolean {
    // Elements that are naturally focusable
    const focusableElements = ['input', 'select', 'textarea', 'button', 'a'];

    if (focusableElements.includes(element.tagName.toLowerCase())) {
      // Check if element is disabled
      return !element.hasAttribute('disabled');
    }

    // Check for explicit tabindex
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex !== null) {
      const tabIndexValue = parseInt(tabIndex);
      return tabIndexValue >= 0;
    }

    // Check for interactive roles that should be focusable
    const role = element.getAttribute('role');
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];
    if (role && interactiveRoles.includes(role)) {
      return element.hasAttribute('tabindex') && parseInt(element.getAttribute('tabindex') || '0') >= 0;
    }

    // Elements with onclick handlers should be focusable
    if (element.hasAttribute('onclick') || element.hasAttribute('onkeydown')) {
      return element.hasAttribute('tabindex') && parseInt(element.getAttribute('tabindex') || '0') >= 0;
    }

    return false;
  }

  // Check heading structure
  private async checkHeadingStructure(): Promise<void> {
    const headings = this.element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const selector = this.getElementSelector(heading);
      headingLevels.push(level);

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        this.addError({
          id: `heading-empty-${index}`,
          severity: 'error',
          element: selector,
          description: 'Heading element is empty',
          wcagCriteria: ['1.3.1'],
          suggestion: 'Add descriptive text to heading or remove if not needed',
          selector
        });
      }

      // Check for skipped heading levels
      if (index > 0) {
        const previousLevel = headingLevels[index - 1];
        if (level > previousLevel + 1) {
          this.addWarning({
            id: `heading-skip-${index}`,
            element: selector,
            description: `Heading level ${level} follows heading level ${previousLevel} - skipped levels`,
            suggestion: 'Use sequential heading levels for better structure'
          });
        }
      }
    });

    // Check for missing h1
    if (!this.element.querySelector('h1')) {
      this.addWarning({
        id: 'heading-h1-missing',
        element: 'document',
        description: 'Page is missing h1 heading',
        suggestion: 'Add an h1 heading to define the main topic of the page'
      });
    }
  }

  // Check color contrast
  private async checkColorContrast(): Promise<void> {
    const textElements = this.element.querySelectorAll('p, span, div, a, button, label, li, td, th, h1, h2, h3, h4, h5, h6');

    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      const selector = this.getElementSelector(element);

      // Convert RGB to hex for contrast checking
      const rgbToHex = (rgb: string): string => {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return '#000000';

        const [, r, g, b] = match;
        return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
      };

      try {
        const textColor = rgbToHex(color);
        const bgColor = rgbToHex(backgroundColor);

        // Determine if text is large (18pt+ or 14pt+ bold)
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 700));

        const contrastRatio = colorContrast.getContrastRatio(textColor, bgColor);
        const meetsAA = colorContrast.meetsWCAGAA(textColor, bgColor, isLargeText);

        if (!meetsAA) {
          this.addError({
            id: `contrast-fail-${index}`,
            severity: 'error',
            element: selector,
            description: `Insufficient color contrast: ${contrastRatio.toFixed(2)}:1 (minimum ${isLargeText ? '3:1' : '4.5:1'})`,
            wcagCriteria: ['1.4.3'],
            suggestion: 'Increase contrast between text and background colors',
            selector
          });
        }
      } catch (error) {
        // Skip contrast check if colors can't be parsed
      }
    });
  }

  // Check keyboard accessibility
  private async checkKeyboardAccessibility(): Promise<void> {
    const interactiveElements = this.element.querySelectorAll('button, a, input, select, textarea, [onclick], [onkeydown], [role="button"], [role="link"], [role="menuitem"]');

    interactiveElements.forEach((element, index) => {
      const selector = this.getElementSelector(element);
      const tabIndex = element.getAttribute('tabindex');
      const isClickable = element.hasAttribute('onclick');

      // Check if interactive element is focusable
      if (!this.checkFocusable(element as HTMLElement)) {
        this.addError({
          id: `keyboard-unfocusable-${index}`,
          severity: 'error',
          element: selector,
          description: 'Interactive element is not keyboard focusable',
          wcagCriteria: ['2.1.1'],
          suggestion: 'Add tabindex="0" or ensure element is naturally focusable',
          selector
        });
      }

      // Check for positive tabindex values
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addWarning({
          id: `tabindex-positive-${index}`,
          element: selector,
          description: 'Positive tabindex values should be avoided',
          suggestion: 'Use tabindex="0" or rely on natural tab order'
        });
      }

      // Check for click handlers without keyboard support
      if (isClickable && !element.hasAttribute('onkeydown')) {
        this.addWarning({
          id: `keyboard-handler-missing-${index}`,
          element: selector,
          description: 'Element with click handler may not support keyboard interaction',
          suggestion: 'Add keyboard event handlers for Enter and Space keys'
        });
      }
    });
  }

  // Check ARIA usage
  private async checkAriaUsage(): Promise<void> {
    const elementsWithAria = this.element.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role], [aria-expanded], [aria-selected], [aria-checked]');

    elementsWithAria.forEach((element, index) => {
      const selector = this.getElementSelector(element);
      const role = element.getAttribute('role');
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledby = element.getAttribute('aria-labelledby');
      const ariaDescribedby = element.getAttribute('aria-describedby');

      // Check for invalid roles
      if (role && !Object.values(ARIA_ROLES).includes(role as any)) {
        this.addError({
          id: `aria-invalid-role-${index}`,
          severity: 'error',
          element: selector,
          description: `Invalid ARIA role: "${role}"`,
          wcagCriteria: ['4.1.2'],
          suggestion: 'Use a valid ARIA role or remove the role attribute',
          selector
        });
      }

      // Check for empty aria-label
      if (ariaLabel && !ariaLabel.trim()) {
        this.addWarning({
          id: `aria-label-empty-${index}`,
          element: selector,
          description: 'aria-label is empty',
          suggestion: 'Provide descriptive text for aria-label or remove the attribute'
        });
      }

      // Check for invalid aria-labelledby references
      if (ariaLabelledby) {
        const ids = ariaLabelledby.split(' ');
        ids.forEach(id => {
          if (!this.element.querySelector(`#${id}`)) {
            this.addError({
              id: `aria-labelledby-invalid-${index}`,
              severity: 'error',
              element: selector,
              description: `aria-labelledby references non-existent element: "${id}"`,
              wcagCriteria: ['4.1.2'],
              suggestion: 'Ensure aria-labelledby references existing element IDs',
              selector
            });
          }
        });
      }

      // Check for invalid aria-describedby references
      if (ariaDescribedby) {
        const ids = ariaDescribedby.split(' ');
        ids.forEach(id => {
          if (!this.element.querySelector(`#${id}`)) {
            this.addError({
              id: `aria-describedby-invalid-${index}`,
              severity: 'error',
              element: selector,
              description: `aria-describedby references non-existent element: "${id}"`,
              wcagCriteria: ['4.1.2'],
              suggestion: 'Ensure aria-describedby references existing element IDs',
              selector
            });
          }
        });
      }
    });
  }

  // Check focus management
  private async checkFocusManagement(): Promise<void> {
    // Check for skip links
    const skipLinks = this.element.querySelectorAll('a[href^="#"]');
    let hasSkipToMain = false;

    skipLinks.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent?.toLowerCase();

      if (text?.includes('skip') && text?.includes('main')) {
        hasSkipToMain = true;

        // Verify skip link target exists
        const targetId = href?.substring(1);
        if (targetId && !this.element.querySelector(`#${targetId}`)) {
          this.addError({
            id: 'skip-link-invalid-target',
            severity: 'error',
            element: this.getElementSelector(link),
            description: 'Skip link points to non-existent target',
            wcagCriteria: ['2.4.1'],
            suggestion: 'Ensure skip link target element exists',
            selector: this.getElementSelector(link)
          });
        }
      }
    });

    if (!hasSkipToMain) {
      this.addWarning({
        id: 'skip-link-missing',
        element: 'document',
        description: 'No "skip to main content" link found',
        suggestion: 'Add a skip link to main content for keyboard users'
      });
    }
  }

  // Check landmark regions
  private async checkLandmarks(): Promise<void> {
    const hasMain = this.element.querySelector('main, [role="main"]');
    const hasNav = this.element.querySelector('nav, [role="navigation"]');
    const hasHeader = this.element.querySelector('header, [role="banner"]');

    if (!hasMain) {
      this.addWarning({
        id: 'landmark-main-missing',
        element: 'document',
        description: 'No main landmark found',
        suggestion: 'Add a <main> element or role="main" to identify main content'
      });
    }

    if (!hasNav) {
      this.addWarning({
        id: 'landmark-nav-missing',
        element: 'document',
        description: 'No navigation landmark found',
        suggestion: 'Add a <nav> element or role="navigation" for navigation areas'
      });
    }

    if (!hasHeader) {
      this.addWarning({
        id: 'landmark-header-missing',
        element: 'document',
        description: 'No banner landmark found',
        suggestion: 'Add a <header> element or role="banner" for page header'
      });
    }
  }

  // Additional check methods...
  private async checkSemanticStructure(): Promise<void> {
    // Check for proper list structure
    const lists = this.element.querySelectorAll('ul, ol');
    lists.forEach((list, index) => {
      const children = Array.from(list.children);
      const hasNonLiChildren = children.some(child => child.tagName !== 'LI');

      if (hasNonLiChildren) {
        this.addWarning({
          id: `list-structure-${index}`,
          element: this.getElementSelector(list),
          description: 'List contains non-li children',
          suggestion: 'Only <li> elements should be direct children of <ul> or <ol>'
        });
      }
    });
  }

  private async checkLiveRegions(): Promise<void> {
    const liveRegions = this.element.querySelectorAll('[aria-live]');
    liveRegions.forEach((region, index) => {
      const liveValue = region.getAttribute('aria-live');
      if (liveValue && !['polite', 'assertive', 'off'].includes(liveValue)) {
        this.addError({
          id: `live-region-invalid-${index}`,
          severity: 'error',
          element: this.getElementSelector(region),
          description: `Invalid aria-live value: "${liveValue}"`,
          wcagCriteria: ['4.1.2'],
          suggestion: 'Use "polite", "assertive", or "off" for aria-live',
          selector: this.getElementSelector(region)
        });
      }
    });
  }

  private async checkSkipLinks(): Promise<void> {
    // This is covered in checkFocusManagement
  }

  private async checkTabIndex(): Promise<void> {
    // This is covered in checkKeyboardAccessibility
  }

  private async checkInteractiveElements(): Promise<void> {
    // This is covered in checkKeyboardAccessibility
  }

  private async checkErrorHandling(): Promise<void> {
    const forms = this.element.querySelectorAll('form');
    forms.forEach((form, index) => {
      const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

      inputs.forEach((input, inputIndex) => {
        const hasErrorMessage = form.querySelector(`[aria-describedby*="${input.id}"]`) ||
                               input.getAttribute('aria-describedby');

        if (!hasErrorMessage) {
          this.addWarning({
            id: `error-message-missing-${index}-${inputIndex}`,
            element: this.getElementSelector(input),
            description: 'Required field lacks error message association',
            suggestion: 'Associate error messages with form fields using aria-describedby'
          });
        }
      });
    });
  }

  private async checkTimingFunctionality(): Promise<void> {
    // Check for auto-playing media
    const autoplayMedia = this.element.querySelectorAll('video[autoplay], audio[autoplay]');
    autoplayMedia.forEach((media, index) => {
      const hasControls = media.hasAttribute('controls');

      if (!hasControls) {
        this.addError({
          id: `autoplay-no-controls-${index}`,
          severity: 'error',
          element: this.getElementSelector(media),
          description: 'Auto-playing media lacks user controls',
          wcagCriteria: ['1.4.2'],
          suggestion: 'Add controls attribute to allow users to pause/stop media',
          selector: this.getElementSelector(media)
        });
      }
    });
  }

  // Utility methods
  private addError(error: AccessibilityError): void {
    this.errors.push(error);
  }

  private addWarning(warning: AccessibilityWarning): void {
    this.warnings.push(warning);
  }

  private getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const tagName = element.tagName.toLowerCase();
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const parent = element.parentElement;

    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        return `${tagName}${className}:nth-of-type(${index})`;
      }
    }

    return `${tagName}${className}`;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const errorTypes = new Set(this.errors.map(error => error.wcagCriteria).flat());

    if (errorTypes.has('1.1.1')) {
      recommendations.push('Add alt text to all images. Use alt="" for decorative images.');
    }

    if (errorTypes.has('1.4.3')) {
      recommendations.push('Improve color contrast between text and background to meet WCAG AA standards.');
    }

    if (errorTypes.has('2.1.1')) {
      recommendations.push('Ensure all interactive elements are keyboard accessible.');
    }

    if (errorTypes.has('3.3.2')) {
      recommendations.push('Provide clear labels for all form controls.');
    }

    if (errorTypes.has('4.1.2')) {
      recommendations.push('Fix invalid ARIA attributes and references.');
    }

    if (this.warnings.length > 0) {
      recommendations.push('Review warnings to improve overall accessibility.');
    }

    return recommendations;
  }
}

// Quick accessibility checker function
export const runQuickAccessibilityCheck = async (element?: HTMLElement): Promise<AccessibilityAuditReport> => {
  const tester = new AccessibilityTester(element);
  return await tester.runFullAudit();
};

// Continuous accessibility monitoring
export class AccessibilityMonitor {
  private observer: MutationObserver | null = null;
  private lastCheck = 0;
  private checkInterval = 5000; // 5 seconds

  public startMonitoring(callback: (report: AccessibilityAuditReport) => void): void {
    this.observer = new MutationObserver(() => {
      const now = Date.now();
      if (now - this.lastCheck > this.checkInterval) {
        this.lastCheck = now;
        runQuickAccessibilityCheck().then(callback);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'aria-describedby', 'role', 'alt', 'tabindex']
    });
  }

  public stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export default {
  AccessibilityTester,
  AccessibilityMonitor,
  runQuickAccessibilityCheck
};