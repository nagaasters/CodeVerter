import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowRight, Code, Loader2, Copy, Check, Download, Upload, RefreshCw, Sparkles, Shield, AlertTriangle, CheckCircle, Info, XCircle, Zap } from 'lucide-react';

const TRANSLATIONS = {
  "en-US": {
    "appTitle": "CodeVerter Pro",
    "appSubtitle": "AI-Powered Code Conversion & Analysis",
    "sourceLanguagePlaceholder": "Source Language",
    "targetLanguagePlaceholder": "Target Language",
    "convertButton": "Convert Code",
    "converting": "Converting...",
    "sourceCodeTitle": "Source Code",
    "convertedCodeTitle": "Converted Code",
    "sourceCodePlaceholder": "Paste or type your source code here...",
    "convertedCodePlaceholder": "Converted code will appear here...",
    "convertingPlaceholder": "Converting...",
    "footerText1": "CodeVerter Pro uses AI to intelligently convert and analyze code.",
    "footerText2": "Checker uses free pattern-based analysis. Results may require manual review.",
    "searchLanguagesPlaceholder": "Search languages...",
    "noLanguagesFound": "No languages found",
    "errorEmptyCode": "Please enter some code to convert",
    "errorConversionFailed": "Failed to convert code. Please try again.",
    "exampleComment": "# Example Python code",
    "copied": "Copied!",
    "copy": "Copy",
    "download": "Download",
    "uploadFile": "Upload File",
    "clearCode": "Clear",
    "explainCode": "Explain Code",
    "optimizeCode": "Optimize",
    "addComments": "Add Comments",
    "enhancing": "Enhancing...",
    "lines": "lines",
    "characters": "chars",
    "tabConverter": "Converter",
    "tabChecker": "Code Checker",
    "checkCode": "Analyze Code",
    "checking": "Analyzing...",
    "codeToCheck": "Code to Check",
    "codeToCheckPlaceholder": "Paste your code here to check for issues, vulnerabilities, and best practices...",
    "analysisResults": "Analysis Results",
    "noAnalysis": "Run a check to see analysis results",
    "securityIssues": "Security Issues",
    "performanceIssues": "Performance Issues",
    "bestPractices": "Best Practices",
    "codeQuality": "Code Quality",
    "overallScore": "Overall Score",
    "noIssuesFound": "No issues found",
    "critical": "Critical",
    "warning": "Warning",
    "info": "Info",
    "suggestion": "Suggestion",
  }
};

const appLocale = '{{APP_LOCALE}}';
const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const findMatchingLocale = (locale) => {
  if (TRANSLATIONS[locale]) return locale;
  const lang = locale.split('-')[0];
  const match = Object.keys(TRANSLATIONS).find(key => key.startsWith(lang + '-'));
  return match || 'en-US';
};
const locale = (appLocale !== '{{APP_LOCALE}}') ? findMatchingLocale(appLocale) : findMatchingLocale(browserLocale);
const t = (key) => TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en-US'][key] || key;

// ============= STATIC ANALYSIS RULES =============

const SyntaxRules = {
  python: [
    {
      id: 'PY-SYN-001',
      name: 'Missing Colon',
      severity: 'critical',
      check: (code) => {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, idx) => {
          if (/^\s*(if|for|while|def|class|with|try|except|elif|else)\s+[^:\n#]+$/.test(line.trim())) {
            issues.push({
              line: idx + 1,
              message: 'Syntax Error: Missing colon at end of statement'
            });
          }
        });
        return issues;
      },
      message: 'Syntax Error: Missing colon',
    },
    {
      id: 'PY-SYN-002',
      name: 'Unclosed Parenthesis',
      severity: 'critical',
      check: (code) => {
        const issues = [];
        let balance = 0;
        let lastOpenLine = -1;
        const lines = code.split('\n');
        
        lines.forEach((line, idx) => {
          for (let char of line) {
            if (char === '(') {
              balance++;
              lastOpenLine = idx + 1;
            }
            if (char === ')') balance--;
          }
        });
        
        if (balance !== 0) {
          issues.push({
            line: lastOpenLine,
            message: 'Syntax Error: Unclosed parenthesis'
          });
        }
        return issues;
      },
      message: 'Syntax Error: Mismatched parentheses',
    },
  ],
};

const RuntimeRules = {
  python: [
    {
      id: 'PY-RUN-001',
      name: 'Undefined Variable',
      severity: 'critical',
      safe_local: true, // Can run even with syntax errors
      check: (code) => {
        const issues = [];
        const lines = code.split('\n');
        
        // Built-in functions and types
        const builtins = new Set(['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'open', 'sum', 'max', 'min', 'abs', 'round', 'sorted', 'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'type', 'isinstance', 'input', 'file']);
        
        const defined = new Set(builtins);
        const definedFunctions = new Set();
        const imports = new Set();
        
        // First pass: collect all definitions, functions, and imports
        lines.forEach((line) => {
          // Track variable assignments
          const assignMatch = line.match(/^\s*(\w+)\s*=/);
          if (assignMatch) {
            defined.add(assignMatch[1]);
          }
          
          // Track function definitions
          const funcDefMatch = line.match(/def\s+(\w+)\s*\(/);
          if (funcDefMatch) {
            definedFunctions.add(funcDefMatch[1]);
            defined.add(funcDefMatch[1]);
          }
          
          // Track function parameters
          const funcParamMatch = line.match(/def\s+\w+\s*\(([^)]*)\)/);
          if (funcParamMatch && funcParamMatch[1]) {
            funcParamMatch[1].split(',').forEach(param => {
              const p = param.trim().split('=')[0].trim().replace('*', '');
              if (p) defined.add(p);
            });
          }
          
          // Track imports: import json, import math
          const importMatch = line.match(/import\s+(\w+)/);
          if (importMatch) {
            imports.add(importMatch[1]);
            defined.add(importMatch[1]);
          }
          
          // Track from imports: from X import Y
          const fromImportMatch = line.match(/from\s+\w+\s+import\s+(\w+)/);
          if (fromImportMatch) {
            defined.add(fromImportMatch[1]);
          }
          
          // Track class definitions
          const classMatch = line.match(/class\s+(\w+)/);
          if (classMatch) {
            defined.add(classMatch[1]);
          }
          
          // Track for loop variables
          const forMatch = line.match(/for\s+(\w+)\s+in/);
          if (forMatch) {
            defined.add(forMatch[1]);
          }
        });
        
        // Second pass: check for undefined variables (line-by-line, safe even with syntax errors)
        const keywords = ['if', 'for', 'while', 'def', 'class', 'return', 'import', 'from', 'as', 'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False', 'with', 'try', 'except', 'finally', 'elif', 'else', 'break', 'continue', 'pass', 'raise', 'assert', 'yield', 'lambda', 'del', 'global', 'nonlocal', 'String', 'Error', 'True', 'False', 'None'];

        // Track already-reported (varName) to avoid duplicate findings for the same undefined variable
        const reportedUndefined = new Set();

        lines.forEach((line, idx) => {
          // Skip comment lines — variables in comments are not real usages
          if (line.match(/^\s*#/)) return;

          // Strip inline comments before analysis so "# String concat" doesn't trigger on 'String'
          const codePart = line.split('#')[0];

          // Skip definition lines
          if (codePart.match(/^\s*(def|class|import|from)/)) {
            return;
          }
          
          // Look for obvious typos in variable names
          const typoPatterns = [
            /\b(\w+ss)\b/,        // numberss (double s typo)
            /\b(\w+es)\b(?=\))/,  // values when value expected
          ];
          
          typoPatterns.forEach(pattern => {
            const match = codePart.match(pattern);
            if (match) {
              const varName = match[1];
              if (!defined.has(varName) && !keywords.includes(varName) && !reportedUndefined.has(varName)) {
                const similar = Array.from(defined).find(d => 
                  d.length > 3 && varName.startsWith(d.slice(0, -1))
                );
                if (similar) {
                  reportedUndefined.add(varName);
                  issues.push({
                    line: idx + 1,
                    message: `Runtime Error: '${varName}' is undefined. Did you mean '${similar}'?`
                  });
                  return;
                }
              }
            }
          });
          
          // Check variables used in operations — only on the code portion, never comments
          const operationMatch = codePart.match(/[\+\-\*\/]\s*(\w+)|(\w+)\s*[\+\-\*\/]/g);
          if (operationMatch) {
            operationMatch.forEach(op => {
              const varMatch = op.match(/(\w+)/);
              if (varMatch) {
                const varName = varMatch[1];
                if (!keywords.includes(varName) && 
                    !defined.has(varName) && 
                    !/^\d+$/.test(varName) &&
                    !/^\d+\.\d+$/.test(varName) &&
                    varName.length > 2 &&
                    !reportedUndefined.has(varName)) {
                  reportedUndefined.add(varName);
                  issues.push({
                    line: idx + 1,
                    message: `Runtime Error: Variable '${varName}' is undefined`
                  });
                }
              }
            });
          }
        });
        
        return issues;
      },
      message: 'Runtime Error: Undefined variable',
    },
    {
      id: 'PY-RUN-002',
      name: 'Type Error - String Concatenation',
      severity: 'high',
      safe_local: true, // Safe to check even with syntax errors
      check: (code) => {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, idx) => {
          // Skip pure comment lines
          if (line.match(/^\s*#/)) return;
          const codePart = line.split('#')[0];
          // Pattern: "string" + variable (likely to cause TypeError)
          if (/["'][^"']*["']\s*\+\s*[a-zA-Z_]\w*/.test(codePart)) {
            issues.push({
              line: idx + 1,
              message: 'Runtime Error: Cannot concatenate string with non-string. Use str() or f-string'
            });
          }
        });
        return issues;
      },
      message: 'Runtime Error: Type mismatch in string concatenation',
    },
    {
      id: 'PY-RUN-003',
      name: 'Mixed Type List',
      severity: 'medium',
      safe_local: true, // Safe local check
      check: (code) => {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, idx) => {
          // Pattern: [1, 2, "string", 3] - mixed types in list literal
          const listMatch = line.match(/\[([^\]]+)\]/);
          if (listMatch) {
            const content = listMatch[1];
            const hasNumber = /\b\d+\b/.test(content);
            const hasString = /["'][^"']*["']/.test(content);
            
            if (hasNumber && hasString) {
              issues.push({
                line: idx + 1,
                message: 'Runtime Error: List contains mixed types (numbers and strings)'
              });
            }
          }
        });
        return issues;
      },
      message: 'Runtime Error: Mixed types in list',
    },
    {
      id: 'PY-RUN-004',
      name: 'Dictionary Type Addition',
      severity: 'high',
      safe_local: true,
      check: (code) => {
        const issues = [];
        const lines = code.split('\n');
        lines.forEach((line, idx) => {
          // Pattern: data["key1"] + data["key2"] - risky if different types
          if (/\w+\["[^"]+"\]\s*\+\s*\w+\["[^"]+"\]/.test(line)) {
            issues.push({
              line: idx + 1,
              message: 'Runtime Error: Adding dictionary values may fail if types differ (e.g., str + int)'
            });
          }
        });
        return issues;
      },
      message: 'Runtime Error: Unsafe dictionary value addition',
    },
    {
      id: 'PY-RUN-005',
      name: 'Negative Square Root',
      severity: 'high',
      safe_local: false, // Needs context
      check: (code) => {
        const issues = [];
        const lines = code.split('\n');
        const hasNegativeCheck = code.includes('if') && (code.includes('< 0') || code.includes('<= 0'));
        
        lines.forEach((line, idx) => {
          if ((line.includes('math.sqrt(') || line.includes('.sqrt(')) && !hasNegativeCheck) {
            if (line.includes('sqrt(-') || /sqrt\([a-zA-Z_]\w*\)/.test(line)) {
              issues.push({
                line: idx + 1,
                message: 'Runtime Error: Square root of negative number will raise ValueError. Add validation'
              });
            }
          }
        });
        return issues;
      },
      message: 'Runtime Error: Potential square root of negative',
    },
  ],
};

const SecurityRules = {
  python: [
    {
      id: 'PY-SEC-001',
      name: 'SQL Injection',
      severity: 'critical',
      pattern: /execute\s*\([^)]*\+[^)]*\)|cursor\.execute\s*\([^)]*\.format/i,
      message: 'SQL Injection vulnerability: Use parameterized queries',
      line_finder: (code) => code.split('\n').findIndex(line => /execute\s*\([^)]*\+/.test(line)) + 1,
    },
    {
      id: 'PY-SEC-002',
      name: 'Command Injection',
      severity: 'critical',
      pattern: /os\.system\s*\(|eval\s*\(|exec\s*\(/i,
      message: 'Command injection risk: Avoid os.system, eval, or exec',
      line_finder: (code) => code.split('\n').findIndex(line => /(os\.system|eval\s*\(|exec\s*\()/.test(line)) + 1,
    },
    {
      id: 'PY-SEC-003',
      name: 'Hardcoded Secret',
      severity: 'critical',
      pattern: /(password|secret|api_key|token)\s*=\s*["'][^"']{6,}["']/i,
      message: 'Hardcoded credential: Use environment variables',
      line_finder: (code) => code.split('\n').findIndex(line => /(password|secret|api_key|token)\s*=\s*["']/.test(line)) + 1,
    },
  ],
  javascript: [
    {
      id: 'JS-SEC-001',
      name: 'XSS Vulnerability',
      severity: 'critical',
      pattern: /innerHTML\s*=|document\.write\s*\(/i,
      message: 'XSS vulnerability: Use textContent or sanitize input',
      line_finder: (code) => code.split('\n').findIndex(line => /innerHTML|document\.write/.test(line)) + 1,
    },
  ],
};

const PerformanceRules = {
  python: [
    {
      id: 'PY-PERF-001',
      name: 'Inefficient Loop',
      severity: 'medium',
      pattern: /for\s+\w+\s+in\s+range\s*\(\s*len\s*\(/i,
      message: 'Use "for item in list" instead of "for i in range(len(list))"',
      line_finder: (code) => code.split('\n').findIndex(line => /for\s+\w+\s+in\s+range\s*\(\s*len/.test(line)) + 1,
    },
  ],
};

const QualityRules = {
  python: [
    {
      id: 'PY-QUAL-001',
      name: 'Bare Except',
      severity: 'medium',
      pattern: /except\s*:/,
      message: 'Bare except catches all exceptions. Specify exception types',
      line_finder: (code) => code.split('\n').findIndex(line => /except\s*:/.test(line)) + 1,
    },
  ],
  javascript: [
    {
      id: 'JS-QUAL-001',
      name: 'Var Usage',
      severity: 'low',
      pattern: /\bvar\s+\w+/,
      message: 'Use const or let instead of var',
      line_finder: (code) => code.split('\n').findIndex(line => /\bvar\s+/.test(line)) + 1,
    },
  ],
};

// ============= STATIC ANALYZER =============

class StaticAnalyzer {
  constructor(code, language) {
    this.code = code;
    this.language = language.toLowerCase();
    this.findings = [];
  }

  analyze() {
    // Analysis mode: NORMAL (0.9 confidence) or SAFE_LOCAL (0.6 confidence)
    // SAFE_LOCAL is used when syntax errors are present — skips deep global analysis
    // but continues safe local pattern-based checks so valid issues are never suppressed.
    const ANALYSIS_MODE = { NORMAL: 'NORMAL', SAFE_LOCAL: 'SAFE_LOCAL' };

    const hasSyntaxError = this.runSyntaxChecks();
    const analysisMode = hasSyntaxError ? ANALYSIS_MODE.SAFE_LOCAL : ANALYSIS_MODE.NORMAL;
    this.analysisMode = analysisMode;
    this.analysisConfidence = analysisMode === ANALYSIS_MODE.SAFE_LOCAL ? 0.6 : 0.9;

    // Always run runtime checks — SAFE_LOCAL mode filters to safe_local:true rules only,
    // disabling control flow, cross-function, scope resolution, call graph, and deep runtime inference.
    this.runRuntimeChecks(analysisMode);

    this.runSecurityChecks();
    this.runPerformanceChecks();
    this.runQualityChecks();
    return this.findings;
  }

  runSyntaxChecks() {
    const rules = SyntaxRules[this.language] || [];
    let hasSyntaxError = false;
    
    rules.forEach(rule => {
      if (rule.check) {
        const issues = rule.check(this.code);
        if (issues.length > 0) {
          hasSyntaxError = true;
        }
        issues.forEach(issue => {
          this.findings.push({
            category: 'syntax',
            severity: rule.severity,
            rule_id: rule.id,
            message: issue.message || rule.message,
            line: issue.line,
            confidence: 0.95,
          });
        });
      }
    });
    
    return hasSyntaxError;
  }

  runRuntimeChecks(analysisMode = 'NORMAL') {
    const isSafeLocal = analysisMode === 'SAFE_LOCAL';
    // Confidence is reduced in SAFE_LOCAL mode to reflect that global analysis is disabled.
    // Global checks disabled in SAFE_LOCAL: control flow, cross-function, scope resolution,
    // call graph analysis, and deep runtime inference (safe_local: false rules).
    const baseConfidence = isSafeLocal ? 0.6 : 0.75;

    const rules = RuntimeRules[this.language] || [];
    rules.forEach(rule => {
      // In SAFE_LOCAL mode, only run rules explicitly marked safe_local: true.
      // These are literal-based and pattern-based checks safe to run without a valid AST.
      if (isSafeLocal && rule.safe_local !== true) {
        return;
      }

      if (rule.check) {
        const issues = rule.check(this.code);
        issues.forEach(issue => {
          this.findings.push({
            category: 'runtime',
            severity: rule.severity,
            rule_id: rule.id,
            message: issue.message || rule.message,
            line: issue.line,
            confidence: baseConfidence,
          });
        });
      } else if (rule.pattern && rule.pattern.test(this.code)) {
        const line = rule.line_finder(this.code);
        if (line > 0) {
          this.findings.push({
            category: 'runtime',
            severity: rule.severity,
            rule_id: rule.id,
            message: rule.message,
            line: line,
            confidence: baseConfidence,
          });
        }
      }
    });
  }

  runSecurityChecks() {
    const rules = SecurityRules[this.language] || [];
    rules.forEach(rule => {
      if (rule.pattern.test(this.code)) {
        const line = rule.line_finder(this.code);
        if (line > 0) {
          this.findings.push({
            category: 'security',
            severity: rule.severity,
            rule_id: rule.id,
            message: rule.message,
            line: line,
            confidence: 0.85,
          });
        }
      }
    });
  }

  runPerformanceChecks() {
    const rules = PerformanceRules[this.language] || [];
    rules.forEach(rule => {
      if (rule.pattern.test(this.code)) {
        const line = rule.line_finder(this.code);
        if (line > 0) {
          this.findings.push({
            category: 'performance',
            severity: rule.severity,
            rule_id: rule.id,
            message: rule.message,
            line: line,
            confidence: 0.75,
          });
        }
      }
    });
  }

  runQualityChecks() {
    const rules = QualityRules[this.language] || [];
    rules.forEach(rule => {
      if (rule.pattern.test(this.code)) {
        const line = rule.line_finder(this.code);
        if (line > 0) {
          this.findings.push({
            category: 'quality',
            severity: rule.severity,
            rule_id: rule.id,
            message: rule.message,
            line: line,
            confidence: 0.8,
          });
        }
      }
    });
  }
}

// ============= SCORE CALCULATOR =============

function calculateScore(findings) {
  if (findings.length === 0) return 100;
  
  const weights = {
    critical: -25,
    high: -15,
    medium: -8,
    low: -3,
    info: -1,
  };

  const categoryMultiplier = {
    syntax: 1.0,
    runtime: 1.5,
    security: 1.3,
    performance: 0.8,
    quality: 0.6,
    practices: 0.4,
  };

  let totalPenalty = 0;
  
  findings.forEach(finding => {
    const basePenalty = weights[finding.severity] || 0;
    const confidenceMult = finding.confidence || 0.8;
    const categoryMult = categoryMultiplier[finding.category] || 1.0;
    totalPenalty += basePenalty * confidenceMult * categoryMult;
  });

  // Floor at 10 — a script with findings still produced a meaningful analysis.
  // Cap penalty contribution so a single extremely broken file can't push the
  // score below 10 regardless of how many duplicate or cascading issues are found.
  const baseScore = 100;
  const finalScore = Math.max(10, Math.min(100, baseScore + totalPenalty));
  
  return Math.round(finalScore);
}

// ============= MAIN COMPONENT =============

const CodeVerter = () => {
  const languages = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'C', 'Go', 
    'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'Scala', 'R'
  ];

  const [activeTab, setActiveTab] = useState('checker');
  const [sourceCode, setSourceCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [checkCode, setCheckCode] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('Python');
  const [targetLanguage, setTargetLanguage] = useState('JavaScript');
  const [checkLanguage, setCheckLanguage] = useState('Python');
  const [isConverting, setIsConverting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [copiedCheck, setCopiedCheck] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const fileInputRef = useRef(null);
  const checkFileInputRef = useRef(null);

  const convertCode = async () => {
    if (!sourceCode.trim()) {
      setError(t('errorEmptyCode'));
      return;
    }

    setIsConverting(true);
    setError('');
    setTargetCode('');

    try {
      const prompt = `Convert the following ${sourceLanguage} code to ${targetLanguage}. Only return the converted code:

${sourceCode}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://code-verter-rose.vercel.app",
          "X-Title": "CodeVerter Pro",
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      setTargetCode(text.replace(/```[\w]*\n?/g, '').trim());
    } catch (err) {
      setError(t('errorConversionFailed'));
    } finally {
      setIsConverting(false);
    }
  };

  const checkCodeQuality = () => {
    if (!checkCode.trim()) {
      setError(t('errorEmptyCode'));
      return;
    }

    setError('');
    setAnalysisResults(null);
    setIsChecking(true);

    // StaticAnalyzer is purely synchronous — defer via setTimeout so React can
    // flush the isChecking:true render before we block the thread with analysis,
    // then reset isChecking when done so the button is always re-enabled.
    setTimeout(() => {
      try {
        const analyzer = new StaticAnalyzer(checkCode, checkLanguage);
        const allFindings = analyzer.analyze();

        const groupedFindings = {
          syntax: allFindings.filter(f => f.category === 'syntax'),
          runtime: allFindings.filter(f => f.category === 'runtime'),
          security: allFindings.filter(f => f.category === 'security'),
          performance: allFindings.filter(f => f.category === 'performance'),
          quality: allFindings.filter(f => f.category === 'quality'),
          practices: allFindings.filter(f => f.category === 'practices'),
        };

        const score = calculateScore(allFindings);

        setAnalysisResults({
          overallScore: score,
          analysisMode: analyzer.analysisMode || 'NORMAL',
          analysisConfidence: analyzer.analysisConfidence || 0.9,
          syntax: groupedFindings.syntax,
          runtime: groupedFindings.runtime,
          security: groupedFindings.security,
          performance: groupedFindings.performance,
          bestPractices: groupedFindings.practices,
          quality: groupedFindings.quality,
          totalFindings: allFindings.length,
        });
      } catch (err) {
        setError('Analysis failed. Please try again.');
      } finally {
        setIsChecking(false);
      }
    }, 50);
  };

  const enhanceCode = async (action) => {
    if (!targetCode.trim()) return;
    setIsEnhancing(true);
    setError('');

    try {
      let prompt = '';
      if (action === 'comment') {
        prompt = `Add comments to this ${targetLanguage} code:\n\n${targetCode}`;
      } else if (action === 'optimize') {
        prompt = `Optimize this ${targetLanguage} code:\n\n${targetCode}`;
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://code-verter-rose.vercel.app",
          "X-Title": "CodeVerter Pro",
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      setTargetCode(text.replace(/```[\w]*\n?/g, '').trim());
    } catch (err) {
      setError(t('errorConversionFailed'));
    } finally {
      setIsEnhancing(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'source') {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    } else if (type === 'target') {
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    } else if (type === 'check') {
      setCopiedCheck(true);
      setTimeout(() => setCopiedCheck(false), 2000);
    }
  };

  const downloadCode = (code, language) => {
    const extensions = { 'Python': 'py', 'JavaScript': 'js', 'TypeScript': 'ts', 'Java': 'java' };
    const ext = extensions[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event, isChecker = false) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (isChecker) {
          setCheckCode(e.target.result);
        } else {
          setSourceCode(e.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const getCodeStats = (code) => {
    const lines = code.split('\n').length;
    const chars = code.length;
    return { lines, chars };
  };

  const sourceStats = getCodeStats(sourceCode);
  const targetStats = getCodeStats(targetCode);
  const checkStats = getCodeStats(checkCode);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/50 border-red-700';
      case 'high':
        return 'bg-orange-900/50 border-orange-700';
      case 'medium':
        return 'bg-yellow-900/50 border-yellow-700';
      case 'low':
        return 'bg-blue-900/50 border-blue-700';
      default:
        return 'bg-gray-900/50 border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {t('appTitle')}
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </h1>
              <span className="text-gray-300 text-sm">{t('appSubtitle')}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">by </span>
            <span className="text-sm font-bold text-purple-300">nog</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 border-b border-gray-700/50 px-6">
        <div className="max-w-7xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'converter' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              {t('tabConverter')}
            </div>
            {activeTab === 'converter' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />}
          </button>
          <button
            onClick={() => setActiveTab('checker')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'checker' ? 'text-purple-400' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('tabChecker')}
              <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">FREE</span>
            </div>
            {activeTab === 'checker' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'converter' ? (
            <>
              <div className="flex items-center justify-center gap-4 mb-6">
                <LanguageDropdown 
                  value={sourceLanguage}
                  onChange={setSourceLanguage}
                  languages={languages}
                  placeholder={t('sourceLanguagePlaceholder')}
                />
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <ArrowRight className="w-6 h-6 text-blue-400" />
                </div>
                <LanguageDropdown 
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                  languages={languages}
                  placeholder={t('targetLanguagePlaceholder')}
                />
              </div>

              <div className="flex justify-center mb-6">
                <button
                  onClick={convertCode}
                  disabled={isConverting}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('converting')}
                    </>
                  ) : (
                    <>
                      <Code className="w-5 h-5" />
                      {t('convertButton')}
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6 text-center backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-xl">
                  <div className="bg-gray-700/50 px-4 py-3 border-b border-gray-600/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-200">{t('sourceCodeTitle')} ({sourceLanguage})</h3>
                      <span className="text-xs text-gray-400">
                        {sourceStats.lines} {t('lines')} · {sourceStats.chars} {t('characters')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e, false)}
                        accept=".txt,.py,.js,.java,.cpp,.c"
                        className="hidden"
                      />
                      <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('uploadFile')}>
                        <Upload className="w-4 h-4 text-gray-400" />
                      </button>
                      <button onClick={() => copyToClipboard(sourceCode, 'source')} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('copy')}>
                        {copiedSource ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                      <button onClick={() => setSourceCode('')} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('clearCode')}>
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    className="w-full h-96 p-4 bg-transparent text-gray-100 font-mono text-sm resize-none border-none outline-none"
                    placeholder={t('sourceCodePlaceholder')}
                    spellCheck="false"
                  />
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-xl">
                  <div className="bg-gray-700/50 px-4 py-3 border-b border-gray-600/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-200">{t('convertedCodeTitle')} ({targetLanguage})</h3>
                      {targetCode && (
                        <span className="text-xs text-gray-400">
                          {targetStats.lines} {t('lines')} · {targetStats.chars} {t('characters')}
                        </span>
                      )}
                    </div>
                    {targetCode && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(targetCode, 'target')} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('copy')}>
                          {copiedTarget ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button onClick={() => downloadCode(targetCode, targetLanguage)} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('download')}>
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      value={targetCode}
                      readOnly
                      className="w-full h-96 p-4 bg-transparent text-gray-100 font-mono text-sm resize-none border-none outline-none"
                      placeholder={isConverting ? t('convertingPlaceholder') : t('convertedCodePlaceholder')}
                      spellCheck="false"
                    />
                    {isConverting && (
                      <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-300">{t('converting')}</p>
                        </div>
                      </div>
                    )}
                    {isEnhancing && (
                      <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-300">{t('enhancing')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {targetCode && !isConverting && (
                    <div className="bg-gray-700/50 px-4 py-3 border-t border-gray-600/50 flex items-center gap-2 flex-wrap">
                      <button onClick={() => enhanceCode('comment')} disabled={isEnhancing} className="text-xs px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 rounded transition-colors disabled:opacity-50">
                        {t('addComments')}
                      </button>
                      <button onClick={() => enhanceCode('optimize')} disabled={isEnhancing} className="text-xs px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 rounded transition-colors disabled:opacity-50">
                        {t('optimizeCode')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 mb-4">
                <LanguageDropdown 
                  value={checkLanguage}
                  onChange={setCheckLanguage}
                  languages={languages}
                  placeholder={t('sourceLanguagePlaceholder')}
                />
              </div>

              <div className="flex flex-col items-center mb-6">
                <button
                  onClick={checkCodeQuality}
                  disabled={isChecking}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('checking')}
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      {t('checkCode')}
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span>100% Free • Pattern-Based Detection</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6 text-center backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-xl">
                  <div className="bg-gray-700/50 px-4 py-3 border-b border-gray-600/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-200">{t('codeToCheck')} ({checkLanguage})</h3>
                      <span className="text-xs text-gray-400">
                        {checkStats.lines} {t('lines')} · {checkStats.chars} {t('characters')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={checkFileInputRef}
                        onChange={(e) => handleFileUpload(e, true)}
                        accept=".txt,.py,.js,.java"
                        className="hidden"
                      />
                      <button onClick={() => checkFileInputRef.current?.click()} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('uploadFile')}>
                        <Upload className="w-4 h-4 text-gray-400" />
                      </button>
                      <button onClick={() => copyToClipboard(checkCode, 'check')} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('copy')}>
                        {copiedCheck ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                      <button onClick={() => setCheckCode('')} className="p-1.5 hover:bg-gray-600/50 rounded transition-colors" title={t('clearCode')}>
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={checkCode}
                    onChange={(e) => setCheckCode(e.target.value)}
                    className="w-full h-[600px] p-4 bg-transparent text-gray-100 font-mono text-sm resize-none border-none outline-none"
                    placeholder={t('codeToCheckPlaceholder')}
                    spellCheck="false"
                  />
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-xl">
                  <div className="bg-gray-700/50 px-4 py-3 border-b border-gray-600/50">
                    <h3 className="font-medium text-gray-200">{t('analysisResults')}</h3>
                  </div>
                  <div className="h-[600px] overflow-y-auto p-4">
                    {isChecking ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-300">{t('checking')}</p>
                        </div>
                      </div>
                    ) : analysisResults ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-300">{t('overallScore')}</span>
                            <span className="text-2xl font-bold text-purple-400">{analysisResults.overallScore}/100</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${analysisResults.overallScore}%` }}
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-400">
                            {analysisResults.totalFindings} issue{analysisResults.totalFindings !== 1 ? 's' : ''} found
                          </div>
                          {analysisResults.analysisMode === 'SAFE_LOCAL' && (
                            <div className="mt-3 flex items-start gap-2 bg-yellow-900/40 border border-yellow-600/50 rounded-lg p-2.5">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-yellow-300">Safe Local Mode (confidence: {Math.round(analysisResults.analysisConfidence * 100)}%)</p>
                                <p className="text-xs text-yellow-400/80 mt-0.5">Syntax errors detected — deep global analysis disabled. Local pattern checks (typos, type mismatches, mixed literals) are still active.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {analysisResults.syntax && analysisResults.syntax.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Syntax Errors ({analysisResults.syntax.length})
                            </h4>
                            <div className="space-y-2">
                              {analysisResults.syntax.map((issue, idx) => (
                                <div key={idx} className={`${getSeverityColor(issue.severity)} border rounded-lg p-3`}>
                                  <div className="flex items-start gap-2">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">{issue.rule_id}</span>
                                        <span className="text-xs px-2 py-0.5 bg-red-800 rounded uppercase">SYNTAX</span>
                                      </div>
                                      <p className="text-sm text-gray-200 font-semibold">{issue.message}</p>
                                      {issue.line && issue.line > 0 && (
                                        <p className="text-xs text-gray-400 mt-1">Line {issue.line}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResults.runtime && analysisResults.runtime.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Runtime Errors ({analysisResults.runtime.length})
                            </h4>
                            <div className="space-y-2">
                              {analysisResults.runtime.map((issue, idx) => (
                                <div key={idx} className={`${getSeverityColor(issue.severity)} border rounded-lg p-3`}>
                                  <div className="flex items-start gap-2">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">{issue.rule_id}</span>
                                        <span className="text-xs px-2 py-0.5 bg-orange-800 rounded uppercase">RUNTIME</span>
                                      </div>
                                      <p className="text-sm text-gray-200 font-semibold">{issue.message}</p>
                                      {issue.line && issue.line > 0 && (
                                        <p className="text-xs text-gray-400 mt-1">Line {issue.line}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResults.security && analysisResults.security.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              {t('securityIssues')} ({analysisResults.security.length})
                            </h4>
                            <div className="space-y-2">
                              {analysisResults.security.map((issue, idx) => (
                                <div key={idx} className={`${getSeverityColor(issue.severity)} border rounded-lg p-3`}>
                                  <div className="flex items-start gap-2">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">{issue.rule_id}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded uppercase">{issue.severity}</span>
                                      </div>
                                      <p className="text-sm text-gray-200">{issue.message}</p>
                                      {issue.line && issue.line > 0 && (
                                        <p className="text-xs text-gray-400 mt-1">Line {issue.line}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResults.performance && analysisResults.performance.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              {t('performanceIssues')} ({analysisResults.performance.length})
                            </h4>
                            <div className="space-y-2">
                              {analysisResults.performance.map((issue, idx) => (
                                <div key={idx} className={`${getSeverityColor(issue.severity)} border rounded-lg p-3`}>
                                  <div className="flex items-start gap-2">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">{issue.rule_id}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded uppercase">{issue.severity}</span>
                                      </div>
                                      <p className="text-sm text-gray-200">{issue.message}</p>
                                      {issue.line && issue.line > 0 && (
                                        <p className="text-xs text-gray-400 mt-1">Line {issue.line}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResults.quality && analysisResults.quality.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              {t('codeQuality')} ({analysisResults.quality.length})
                            </h4>
                            <div className="space-y-2">
                              {analysisResults.quality.map((issue, idx) => (
                                <div key={idx} className={`${getSeverityColor(issue.severity)} border rounded-lg p-3`}>
                                  <div className="flex items-start gap-2">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">{issue.rule_id}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded uppercase">{issue.severity}</span>
                                      </div>
                                      <p className="text-sm text-gray-200">{issue.message}</p>
                                      {issue.line && issue.line > 0 && (
                                        <p className="text-xs text-gray-400 mt-1">Line {issue.line}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResults.totalFindings === 0 && (
                          <div className="flex flex-col items-center justify-center h-64 text-center">
                            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                            <h3 className="text-lg font-semibold text-green-400 mb-2">Great Job!</h3>
                            <p className="text-gray-400">No issues detected in your code.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center text-gray-400">
                        <div>
                          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>{t('noAnalysis')}</p>
                          <p className="text-xs mt-2 text-gray-500">Free pattern-based analysis • No API required</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 text-center text-gray-400 text-sm">
            <p className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {t('footerText1')}
            </p>
            <p className="mt-1">{t('footerText2')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LanguageDropdown = ({ value, onChange, languages, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredLanguages = languages.filter(lang =>
    lang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (language) => {
    onChange(language);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-gray-700/50 backdrop-blur-sm hover:bg-gray-600/50 px-4 py-3 rounded-lg min-w-52 text-left border border-gray-600/50 transition-all"
      >
        <span className="text-gray-200 font-medium">{value || placeholder}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700/95 backdrop-blur-lg border border-gray-600/50 rounded-lg shadow-2xl z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-600/50">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchLanguagesPlaceholder')}
              className="w-full px-3 py-2 bg-gray-800/80 text-gray-200 rounded border border-gray-600/50 text-sm outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-600/50 transition-colors ${
                    value === language ? 'bg-blue-600/80 text-white font-medium' : 'text-gray-200'
                  }`}
                >
                  {language}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-400 text-sm text-center">{t('noLanguagesFound')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeVerter;