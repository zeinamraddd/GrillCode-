import * as vscode from 'vscode';

let typingTimer: NodeJS.Timeout | undefined;
let editRevision = 0;

type FeedbackType = 'roast' | 'question';

export function activate(context: vscode.ExtensionContext) {
    let grillCodeEnabled = context.globalState.get<boolean>(
        'grillCode.enabled',
        true
    );

    const toggleCommand = vscode.commands.registerCommand(
        'grill-code.toggle',
        async () => {
            grillCodeEnabled = !grillCodeEnabled;

            await context.globalState.update(
                'grillCode.enabled',
                grillCodeEnabled
            );

            // Invalidate pending feedback when GrillCode is disabled.
            if (!grillCodeEnabled) {
                editRevision++;

                if (typingTimer) {
                    clearTimeout(typingTimer);
                    typingTimer = undefined;
                }
            }

            vscode.window.showInformationMessage(
                `GrillCode is now ${
                    grillCodeEnabled ? 'enabled' : 'disabled'
                }.`
            );
        }
    );

    console.log('GrillCode ACTIVATED');

    const changeListener =
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.activeTextEditor;

            if (!grillCodeEnabled) {
                return;
            }

            if (
                !editor ||
                event.document !== editor.document ||
                event.contentChanges.length === 0
            ) {
                return;
            }

            const currentRevision = ++editRevision;
            const document = event.document;

            if (typingTimer) {
                clearTimeout(typingTimer);
            }

            typingTimer = setTimeout(async () => {
                const code = document.getText();
                const documentVersion = document.version;

                if (!code.trim()) {
                    return;
                }

                const codeIsStillCurrent = () =>
                    grillCodeEnabled &&
                    currentRevision === editRevision &&
                    document.version === documentVersion &&
                    vscode.window.activeTextEditor?.document === document;

                const feedbackType: FeedbackType =
                    Math.random() < 0.5 ? 'roast' : 'question';

                try {
                    const feedback = await generateAIFeedback(
                        code,
                        feedbackType
                    );

                    if (codeIsStillCurrent()) {
                        vscode.window.showInformationMessage(feedback);
                    }
                } catch (error) {
                    console.error('AI feedback failed:', error);

                    if (codeIsStillCurrent()) {
                        vscode.window.showInformationMessage(
                            generateRoast(code)
                        );
                    }
                }
            }, 3000);
        });

    context.subscriptions.push(changeListener, toggleCommand);
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

async function generateAIFeedback(
    code: string,
    feedbackType: FeedbackType
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY is missing. Fully restart VS Code after setting it.'
        );
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.interactions.create({
        model: 'gemini-3.8-flash',

        input: `You are GrillCode, a witty, slightly annoying, but accurate coding interview coach.

For this response, produce only a ${feedbackType}.

Review only what is visible in this code and identify the clearest real issue.
Check whether function names match what the code actually does.
Do not invent bugs or discuss time complexity unless it matters here.

If the requested feedback type is "roast", give a professional and playful roast that names a specific issue.
If the requested feedback type is "question", ask a relevant technical interview question about the code, issue, design, or coding practice.

Your role is to guide the developer as they practice in a playful but serious way.
The technical questions should resemble questions that may actually be asked in interviews.

Reply in one or two short sentences.
Use plain text without Markdown or math notation.

CODE:
${code.slice(0, 6000)}`,
    });

    const feedback = response.output_text?.trim();

    if (!feedback) {
        throw new Error('Gemini returned an empty response.');
    }

    return feedback;
}