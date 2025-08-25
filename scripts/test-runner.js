/**
 * Wave 5: Testing & Coverage Enterprise
 * Automated Testing Pipeline Script
 * 
 * Comprehensive testing automation including:
 * - Unit tests with coverage reporting
 * - Integration tests
 * - E2E tests with multiple browsers
 * - Accessibility testing
 * - Performance benchmarks
 * - CI/CD integration
 * 
 * @since Wave 5 - Testing & Coverage Enterprise
 * @author Sistema ERP
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      accessibility: null,
      performance: null,
      coverage: null
    };
    
    this.config = {
      coverageThreshold: 85,
      testTimeout: 300000, // 5 minutes
      retries: 2
    };
  }

  async runAllTests() {
    console.log('🚀 Wave 5: Testing & Coverage Enterprise - Pipeline Starting...\n');
    
    try {
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runE2ETests();
      await this.runAccessibilityTests();
      await this.runPerformanceTests();
      await this.generateReports();
      
      this.displayResults();
      this.exitWithStatus();
    } catch (error) {
      console.error('❌ Test pipeline failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('🧪 Running Unit Tests...');
    
    try {
      const result = execSync(
        'npx vitest run --config vitest.config.clients.js --coverage --reporter=json --reporter=verbose',
        { 
          encoding: 'utf8',
          timeout: this.config.testTimeout 
        }
      );
      
      // Parse coverage results
      const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        this.results.coverage = coverage.total;
      }
      
      this.results.unit = {
        status: 'passed',
        output: result
      };
      
      console.log('✅ Unit tests passed\n');
    } catch (error) {
      this.results.unit = {
        status: 'failed',
        error: error.message
      };
      
      console.log('❌ Unit tests failed\n');
      throw error;
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...');
    
    try {
      const result = execSync(
        'npx vitest run src/test/clients/ --config vitest.config.clients.js',
        { 
          encoding: 'utf8',
          timeout: this.config.testTimeout 
        }
      );
      
      this.results.integration = {
        status: 'passed',
        output: result
      };
      
      console.log('✅ Integration tests passed\n');
    } catch (error) {
      this.results.integration = {
        status: 'failed',
        error: error.message
      };
      
      console.log('❌ Integration tests failed\n');
      throw error;
    }
  }

  async runE2ETests() {
    console.log('🌐 Running E2E Tests...');
    
    try {
      // Start dev server for E2E tests
      const server = spawn('npm', ['run', 'dev'], { 
        detached: true,
        stdio: 'pipe'
      });
      
      // Wait for server to be ready
      await this.waitForServer('http://localhost:5173', 30000);
      
      try {
        const result = execSync(
          'npx playwright test src/test/e2e/ --reporter=json',
          { 
            encoding: 'utf8',
            timeout: this.config.testTimeout 
          }
        );
        
        this.results.e2e = {
          status: 'passed',
          output: result
        };
        
        console.log('✅ E2E tests passed\n');
      } finally {
        // Kill server
        process.kill(-server.pid);
      }
    } catch (error) {
      this.results.e2e = {
        status: 'failed',
        error: error.message
      };
      
      console.log('❌ E2E tests failed\n');
      throw error;
    }
  }

  async runAccessibilityTests() {
    console.log('♿ Running Accessibility Tests...');
    
    try {
      // Run accessibility-specific tests
      const result = execSync(
        'npx vitest run --config vitest.config.clients.js --reporter=verbose src/test/clients/ --grep="Accessibility"',
        { 
          encoding: 'utf8',
          timeout: this.config.testTimeout 
        }
      );
      
      this.results.accessibility = {
        status: 'passed',
        output: result
      };
      
      console.log('✅ Accessibility tests passed\n');
    } catch (error) {
      this.results.accessibility = {
        status: 'failed',
        error: error.message
      };
      
      console.log('❌ Accessibility tests failed\n');
      throw error;
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...');
    
    try {
      // Run performance-specific tests
      const result = execSync(
        'npx vitest run --config vitest.config.clients.js --reporter=verbose src/test/clients/ --grep="Performance"',
        { 
          encoding: 'utf8',
          timeout: this.config.testTimeout 
        }
      );
      
      this.results.performance = {
        status: 'passed',
        output: result
      };
      
      console.log('✅ Performance tests passed\n');
    } catch (error) {
      this.results.performance = {
        status: 'failed',
        error: error.message
      };
      
      console.log('❌ Performance tests failed\n');
      throw error;
    }
  }

  async generateReports() {
    console.log('📊 Generating Test Reports...');
    
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Generate comprehensive test report
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: this.generateSummary(),
      coverage: this.results.coverage,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(
      path.join(reportDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Generate HTML report
    this.generateHTMLReport(report, reportDir);
    
    console.log('✅ Test reports generated in test-results/\n');
  }

  generateSummary() {
    const testTypes = ['unit', 'integration', 'e2e', 'accessibility', 'performance'];
    const passed = testTypes.filter(type => this.results[type]?.status === 'passed').length;
    const total = testTypes.length;
    
    return {
      passed,
      failed: total - passed,
      total,
      successRate: Math.round((passed / total) * 100),
      coveragemet: this.results.coverage ? 
        this.results.coverage.lines.pct >= this.config.coverageThreshold : false
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.coverage && this.results.coverage.lines.pct < this.config.coverageThreshold) {
      recommendations.push({
        type: 'coverage',
        message: `Code coverage (${this.results.coverage.lines.pct}%) is below threshold (${this.config.coverageThreshold}%). Add more unit tests.`,
        priority: 'high'
      });
    }
    
    if (this.results.unit?.status === 'failed') {
      recommendations.push({
        type: 'unit',
        message: 'Unit tests are failing. Fix failing tests before deployment.',
        priority: 'critical'
      });
    }
    
    if (this.results.accessibility?.status === 'failed') {
      recommendations.push({
        type: 'accessibility',
        message: 'Accessibility tests are failing. Ensure WCAG 2.1 AA compliance.',
        priority: 'high'
      });
    }
    
    if (this.results.performance?.status === 'failed') {
      recommendations.push({
        type: 'performance',
        message: 'Performance tests are failing. Optimize component rendering and API calls.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  generateHTMLReport(report, reportDir) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Wave 5: Testing & Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .metric.success { border-color: #28a745; }
        .metric.warning { border-color: #ffc107; }
        .metric.danger { border-color: #dc3545; }
        .results { margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 8px; }
        .test-result.passed { background: #d4edda; border: 1px solid #c3e6cb; }
        .test-result.failed { background: #f8d7da; border: 1px solid #f5c6cb; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; }
        .rec-item { margin: 10px 0; padding: 10px; border-left: 4px solid #ffc107; }
        .rec-item.critical { border-left-color: #dc3545; }
        .rec-item.high { border-left-color: #fd7e14; }
        .rec-item.medium { border-left-color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Wave 5: Testing & Coverage Enterprise Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric ${report.summary.successRate === 100 ? 'success' : 'warning'}">
            <h3>Test Success Rate</h3>
            <p style="font-size: 2em; margin: 0;">${report.summary.successRate}%</p>
            <p>${report.summary.passed}/${report.summary.total} passed</p>
        </div>
        
        ${report.coverage ? `
        <div class="metric ${report.coverage.lines.pct >= 85 ? 'success' : 'warning'}">
            <h3>Code Coverage</h3>
            <p style="font-size: 2em; margin: 0;">${report.coverage.lines.pct}%</p>
            <p>Lines covered</p>
        </div>
        ` : ''}
    </div>

    <div class="results">
        <h2>Test Results</h2>
        ${Object.entries(report.results).map(([type, result]) => {
          if (!result) return '';
          return `
            <div class="test-result ${result.status}">
                <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Tests</h3>
                <p>Status: <strong>${result.status}</strong></p>
                ${result.error ? `<p>Error: ${result.error}</p>` : ''}
            </div>
          `;
        }).join('')}
    </div>

    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="rec-item ${rec.priority}">
                <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `;

    fs.writeFileSync(path.join(reportDir, 'test-report.html'), html);
  }

  displayResults() {
    console.log('📋 Test Pipeline Results:');
    console.log('========================');
    
    Object.entries(this.results).forEach(([type, result]) => {
      if (result) {
        const icon = result.status === 'passed' ? '✅' : '❌';
        console.log(`${icon} ${type.padEnd(15)} ${result.status.toUpperCase()}`);
      }
    });
    
    console.log('\n📊 Summary:');
    const summary = this.generateSummary();
    console.log(`   Success Rate: ${summary.successRate}%`);
    console.log(`   Tests Passed: ${summary.passed}/${summary.total}`);
    
    if (this.results.coverage) {
      console.log(`   Coverage:     ${this.results.coverage.lines.pct}%`);
    }
    
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('\n⚠️  Recommendations:');
      recommendations.forEach(rec => {
        console.log(`   ${rec.priority.toUpperCase()}: ${rec.message}`);
      });
    }
  }

  exitWithStatus() {
    const summary = this.generateSummary();
    const allTestsPassed = summary.successRate === 100;
    const coverageMet = !this.results.coverage || 
      this.results.coverage.lines.pct >= this.config.coverageThreshold;
    
    if (allTestsPassed && coverageMet) {
      console.log('\n🎉 All tests passed! Ready for deployment.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed or coverage is insufficient.');
      process.exit(1);
    }
  }

  async waitForServer(url, timeout) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        // Simple HTTP check using node's built-in http module
        const http = await import('http');
        
        const response = await new Promise((resolve, reject) => {
          const req = http.get(url, resolve);
          req.on('error', reject);
          req.setTimeout(1000, () => reject(new Error('Timeout')));
        });
        
        if (response.statusCode === 200) return;
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Server at ${url} did not start within ${timeout}ms`);
  }
}

// CLI interface
const runner = new TestRunner();

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'unit':
    runner.runUnitTests().catch(() => process.exit(1));
    break;
  case 'integration':
    runner.runIntegrationTests().catch(() => process.exit(1));
    break;
  case 'e2e':
    runner.runE2ETests().catch(() => process.exit(1));
    break;
  case 'accessibility':
    runner.runAccessibilityTests().catch(() => process.exit(1));
    break;
  case 'performance':
    runner.runPerformanceTests().catch(() => process.exit(1));
    break;
  case 'all':
  default:
    runner.runAllTests().catch(() => process.exit(1));
}

export default TestRunner;
