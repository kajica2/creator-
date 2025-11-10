/**
 * UX/UI Testing Suite - Comprehensive testing framework for viral hashtag & image AI application
 *
 * This testing suite provides:
 * - Interactive Testing Components
 * - Performance Monitoring
 * - Accessibility Testing
 * - Visual Regression Testing
 * - User Flow Testing
 * - Mobile UX Testing
 * - Integration Testing
 * - Automated Reports
 * - User Feedback Collection
 */

export { default as UXTestSuite } from './UXTestSuite';
export type { TestResult, TestSuite, UXTestConfig } from './UXTestSuite';

export { PerformanceMonitor } from './PerformanceMonitor';
export type { PerformanceData, PerformanceThresholds } from './PerformanceMonitor';

export { AccessibilityTester } from './AccessibilityTester';
export type { AccessibilityTestResult, AccessibilityCheck } from './AccessibilityTester';

export { UserFlowTester } from './UserFlowTester';
export type { UserFlowStep, UserFlowResult } from './UserFlowTester';

export { VisualRegressionTester } from './VisualRegressionTester';
export type { VisualTestCase, VisualTestResult } from './VisualRegressionTester';

export { MobileTester } from './MobileTester';
export type { TouchGesture, MobileTestCase, MobileTestResult } from './MobileTester';

export { IntegrationTester } from './IntegrationTester';
export type { IntegrationTest, IntegrationTestResult } from './IntegrationTester';

export { TestReport } from './TestReport';
export type { TestReportProps } from './TestReport';

export { UserFeedbackCollector } from './UserFeedbackCollector';
export type { UserFeedback } from './UserFeedbackCollector';