import * as vscode from 'vscode';


let typingTimer: NodeJS.Timeout | undefined;
let editRevision = 0;

export function activate(context: vscode.ExtensionContext) {
    console.log('🔥 GrillCode ACTIVATED');

    const changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || event.document !== editor.document ||
            event.contentChanges.length === 0) {
            return;
        }

        const revision = ++editRevision;
        const document = event.document;

        if (typingTimer) {
            clearTimeout(typingTimer);
        }

        typingTimer = setTimeout(async () => {
            const code = document.getText();
            const version = document.version;

            if (!code.trim()) {
                return;
            }

            // Has the user edited this file or switched files since this request?
            const isStillCurrent = () =>
                revision === editRevision &&
                document.version === version &&
                vscode.window.activeTextEditor?.document === document;

            try {
                const roast = await generateAIRoast(code);

                if (isStillCurrent()) {
                    vscode.window.showInformationMessage(roast);
                }
            } catch (error) {
                console.error('AI roast failed:', error);

                if (isStillCurrent()) {
                    vscode.window.showInformationMessage(generateRoast(code));
                }
            }
        }, 3000);
    });

    context.subscriptions.push(changeListener);
}

export function deactivate() {
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
}

function generateRoast(code: string): string {
    if (code.includes('console.log')) {
        return 'Debugging with console.log? Classic.';
    }
    if (code.includes('TODO')) {
        return "Ah yes, TODO: future you's problem.";
    }
    if (code.length > 1000) {
        return 'This file is getting a little too comfortable being huge.';
    }
    return 'Nothing roast-worthy yet. Keep coding.';
}

async function generateAIRoast(code: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing. Fully restart VS Code after setting it.');
    }
     const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

    const response = await ai.interactions.create({
        model: 'gemini-3.8-flash',
        input:  `You are GrillCode, a witty, a bit annoying, but accurate coding interview coach.

Review only what is visible in this code. Identify the clearest real issue.
Check whether the function name matches what the code actually does.
Do not invent bugs or discuss time complexity unless it matters here.
Reply in less than two sentences:
either  A professional, playful roast that names the specific issue.
or an  interview question about that issue.
Your role is to guide whoever is writing code as they practice in a playful way, but playful does not mean unserious.
ask technical questions sometimes that are actually used in tech interviews.

Use plain text, with no Markdown or math notation.

CODE:
${code.slice(0, 6000)}`,
    });

    const roast = response.output_text?.trim();

    if (!roast) {
        throw new Error('Gemini returned an empty response.');
    }

    return roast;
}