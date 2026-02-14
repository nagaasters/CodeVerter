# CodeVerter Pro

**Built by nog & Claude Sonnet 4.5**

A free, browser-based developer tool that instantly converts code between 15+ programming languages and performs deep static analysis powered by AI.

🔗 **Live Demo:** [code-verter-rose.vercel.app](https://code-verter-rose.vercel.app/)

---

## ✨ Features

### 🔄 AI-Powered Code Conversion
- Convert between **15+ programming languages** including:
  - Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust
  - PHP, Ruby, Swift, Kotlin, Dart, Scala, R
- Powered by **Claude AI** via OpenRouter
- Instant conversion with syntax preservation
- Copy or download converted code

### 🔍 Advanced Code Analysis
CodeVerter uses a **dual-engine analysis system**:

#### Pattern Detection Engine (Instant, Offline)
- ✅ **Syntax Errors** - Missing colons, unclosed brackets, invalid operators
- ✅ **Runtime Risks** - Undefined variables, type mismatches, string concatenation errors
- ✅ **Security Issues** - SQL injection, hardcoded credentials, XSS vulnerabilities, weak hashing (MD5/SHA1), unsafe deserialization
- ✅ **Performance Problems** - Blocking async calls, unjoined threads, memory leaks
- ✅ **Code Quality** - Bare except blocks, mutable default arguments, shared class variables

#### AI Deep Analysis Engine (Powered by OpenRouter)
- 🤖 **Logic Errors** - Race conditions, incorrect algorithms, edge cases
- 🤖 **Security Context** - Complex attack vectors requiring semantic understanding
- 🤖 **Best Practices** - Architectural issues, anti-patterns, code smells
- 🤖 **Contextual Risks** - Issues that need full program context to identify

### 🛠️ Automated Code Fixing
- **Fix All Issues** - One-click fix for all detected problems
- **Fix Individual Issues** - Selective fixes for specific errors
- Shows exactly what was fixed with before/after comparison
- Combines pattern detection + AI analysis for comprehensive fixes

### 💡 Interactive Code Editor
- **Line-numbered editor** with syntax awareness
- **Click-to-highlight** - Click any error to jump to that line
- **Persistent highlighting** - Stays on the line until you select another error
- Upload files or paste code directly

### 📊 Smart Scoring System
- Real-time code quality score (0-100)
- **Two-stage scoring:**
  1. Instant pattern-based score
  2. Updated score after AI deep analysis completes
- Severity-weighted issue penalties
- Safe Local Mode when syntax errors are present

---

## 🚀 Getting Started

### Live Usage (No Installation)
Just visit [code-verter-rose.vercel.app](https://code-verter-rose.vercel.app/) and start using it immediately!

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/nagaasters/CodeVerter.git
cd CodeVerter
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Get your free OpenRouter API key at [openrouter.ai](https://openrouter.ai/)

4. **Run the development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

---

## 🎯 How to Use

### Code Checker
1. Select **"Code Checker"** tab
2. Choose your programming language from the dropdown
3. Paste your code or upload a file
4. Click **"Analyze Code (Pattern + AI)"**
5. Review results:
   - **Overall Score** - Instant quality metric
   - **✨ AI Deep Analysis** - Advanced issues found by AI
   - **Fix Issues** - One-click automated fixes
   - **Syntax/Runtime/Security/Quality** - Categorized findings
6. Click any error to highlight that line in your code
7. Use **"Fix All Issues"** or **"Fix this"** on individual errors
8. Copy or download the fixed code

### Code Converter
1. Select **"Code Converter"** tab
2. Paste your source code
3. Choose **source language** (auto-detected by default)
4. Choose **target language**
5. Click **"Convert Code (AI)"**
6. Copy or download the converted code

---

## 🔐 Privacy & Security

- ✅ **No data storage** - All analysis happens in real-time, nothing is saved
- ✅ **Open source** - Full code available on GitHub
- ✅ **Free tier AI** - Uses OpenRouter's free models (no credit card required)
- ✅ **Client-side processing** - Pattern detection runs entirely in your browser

---

## 🛡️ What CodeVerter Detects

### Security Issues
| Issue | Example |
|-------|---------|
| SQL Injection | `query = "SELECT * FROM users WHERE name = " + username` |
| Hardcoded Credentials | `password = "supersecret123"` |
| XSS Vulnerabilities | `innerHTML = userInput` |
| Weak Hashing | `hashlib.md5(password)` |
| Unsafe Deserialization | `pickle.loads(untrusted_data)` |

### Runtime Errors
| Issue | Example |
|-------|---------|
| Undefined Variables | `result = numberss + 5` (typo) |
| Type Mismatches | `"Score: " + 100` (string + int) |
| Mixed Type Lists | `[1, 2, "three", 4]` |
| Dict Addition Risks | `data["age"] + data["name"]` |

### Performance Issues
| Issue | Example |
|-------|---------|
| Blocking Async | `time.sleep(1)` inside `async def` |
| Unjoined Threads | Threads started without `.join()` |
| Memory Leaks | Unchecked list growth in loops |

### Code Quality
| Issue | Example |
|-------|---------|
| Bare Except | `except:` without specific exception type |
| Mutable Defaults | `def func(items=[]):` |
| Shared Class Variables | `class Bag: items = []` |
| Unawaited Coroutines | `orphan()` instead of `await orphan()` |

---

## 🤖 AI Models Used

CodeVerter uses OpenRouter's free tier models in priority order:

1. **arcee-ai/trinity-large-preview:free** - Primary model (best for code analysis)
2. **deepseek/deepseek-r1:free** - Reasoning-focused fallback
3. **deepseek/deepseek-chat:free** - DeepSeek V3
4. **google/gemini-2.0-flash-exp:free** - Google's fast model
5. **meta-llama/llama-3.3-70b-instruct:free** - Reliable backup
6. **openrouter/free** - Auto-router (last resort)

The system automatically tries models in order until one succeeds, ensuring maximum reliability.

---

## 📦 Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI:** OpenRouter API (Claude, DeepSeek, Gemini, Llama)
- **Deployment:** Vercel
- **Language:** JavaScript/JSX

---

## 🗂️ Project Structure

```
CodeVerter/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

---

## 🧪 Testing Examples

### Example 1: Security Issues
```python
import sqlite3
password = "admin123"
query = "SELECT * FROM users WHERE name = " + username
```
**Detects:** Hardcoded credential, SQL injection

### Example 2: Runtime Errors
```python
def greet(name, items=[]):
    items.append("flag")
    return "Hello " + name + items
```
**Detects:** Mutable default argument, type mismatch

### Example 3: Performance Issues
```python
async def fetch_data():
    time.sleep(5)  # Blocking!
    return data
```
**Detects:** Blocking call in async function

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** - Open an issue describing the problem
2. **Suggest Features** - Share your ideas in the issues
3. **Submit PRs** - Fork, make changes, and submit a pull request
4. **Improve Documentation** - Help make the README better
5. **Share** - Star the repo and share with other developers!

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- **Anthropic** - For Claude AI powering the conversions
- **OpenRouter** - For free tier API access to multiple AI models
- **Vercel** - For free hosting
- **React Team** - For the amazing framework
- **Tailwind CSS** - For utility-first styling

---

## 📧 Contact

Built by **nog**

- GitHub: [@nagaasters](https://github.com/nagaasters)
- Project Link: [https://github.com/nagaasters/CodeVerter](https://github.com/nagaasters/CodeVerter)
- Live Demo: [https://code-verter-rose.vercel.app/](https://code-verter-rose.vercel.app/)

---

## 🎯 Roadmap

- [ ] Support for more programming languages
- [ ] Custom rule creation for pattern detection
- [ ] Code formatting/beautification
- [ ] Diff viewer for before/after fixes
- [ ] Export analysis reports (PDF/JSON)
- [ ] VS Code extension
- [ ] API endpoint for CI/CD integration
- [ ] Multi-file project analysis

---

**⭐ If CodeVerter helped you, please star the repo!**
