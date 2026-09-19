# GrillCode

GrillCode is an interactive VS Code extension that roasts your code while turning everyday programming into technical interview practice. It analyzes your work using the Gemini API and provides short, witty, and constructive feedback followed by an interview-style question.

## Features

* Gemini-powered code analysis
* Interactive feedback inside VS Code
* Professional and humorous code roasts
* Technical interview-style questions
* Automatic analysis after you stop typing
* Reviews readability, possible bugs, architecture, and coding practices
* Local fallback feedback if the AI request fails
* API key stored safely in an environment variable

## How It Works

1. GrillCode detects changes in the active code file.
2. It waits until the developer stops typing for three seconds.
3. The current code is sent to the Gemini API for analysis.
4. GrillCode displays a concise roast or an interview-style question as a VS Code notification.

## Example

Given this code:

```javascript
function subtract(a, b) {
    return a + b;
}
```

GrillCode may respond:

> I love the optimism of naming a function `subtract` while returning the sum of `a` and `b`. How would you test this function to ensure its implementation matches its intended behavior?

## Technologies Used

* TypeScript
* Visual Studio Code Extension API
* Google Gemini API
* Node.js
* esbuild

## Privacy Notice

GrillCode sends a portion of the active file to the Gemini API for analysis. Avoid testing it with private, confidential, or sensitive source code.

The Gemini API key is not included in this repository. Every user must provide their own key through the `GEMINI_API_KEY` environment variable.

## Project Status

GrillCode is currently under active development. Planned improvements include:

* A dedicated feedback panel
* Prevention of outdated responses while the user continues typing
* Configurable feedback delay
* Multiple roast intensity levels

## Author

Created by [Zeina Mrad](https://github.com/zeinamraddd).
