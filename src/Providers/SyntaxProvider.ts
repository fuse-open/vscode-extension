import * as vscode from 'vscode';

export function uxAutoQuotes(event: vscode.TextDocumentChangeEvent): void {
    if (event.document.languageId !== 'ux')
        return;
    if (!event.contentChanges[0]) {
        return;
    }
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    let selection = editor.selection;
    let originalPosition = selection.start.translate(0, 1);
    let middlePosition = selection.start.translate(0, 2);

    let textLine = editor.document.lineAt(selection.start);
    let withinOpenTag = /<([a-zA-Z][a-zA-Z0-9:\-_.]*)/.test(textLine.text)
    if (withinOpenTag && event.contentChanges[0].text === "=") {
        let result = /=(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/.exec(textLine.text) // check if it's inside a string
        if (result == null)
            editor.edit((editBuilder) => {
                editBuilder.insert(originalPosition, '""');
            }).then(() => {
                if (editor)
                    editor.selection = new vscode.Selection(middlePosition, middlePosition);
            });
    }
}

export function uxAutoCloseTag(event: vscode.TextDocumentChangeEvent): void {
    if (event.document.languageId !== 'ux')
        return;
    if (!event.contentChanges[0]) {
        return;
    }
    let isRightAngleBracket = CheckRightAngleBracket(event.contentChanges[0]);
    if (!isRightAngleBracket && event.contentChanges[0].text !== "/") {
        return;
    }
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    let selection = editor.selection;
    let originalPosition = selection.start.translate(0, 1);

    if (isRightAngleBracket || event.contentChanges[0].text === "/") {
        let textLine = editor.document.lineAt(selection.start);
        let text = textLine.text.substring(0, selection.start.character + 1);
        let result = /<([a-zA-Z][a-zA-Z0-9:\-_.]*)(?:\s+[^<>]*?[^\s/<>=]+?)*?\s?(\/|>)$/.exec(text);
        if (result !== null && ((occurrenceCount(result[0], "'") % 2 === 0)
            && (occurrenceCount(result[0], "\"") % 2 === 0) && (occurrenceCount(result[0], "`") % 2 === 0))) {
            if (result[2] === ">") {
                editor.edit((editBuilder) => {
                    editBuilder.insert(originalPosition, "</" + result![1] + ">");
                }).then(() => {
                    if (editor)
                        editor.selection = new vscode.Selection(originalPosition, originalPosition);
                });
            } else {
                if (textLine.text.length <= selection.start.character + 1 || textLine.text[selection.start.character + 1] !== '>') { // if not typing "/" just before ">", add the ">" after "/"
                    editor.edit((editBuilder) => {
                        editBuilder.insert(originalPosition, ">");
                    })
                }
            }
        }
    }
}

function CheckRightAngleBracket(contentChange: vscode.TextDocumentContentChangeEvent): boolean {
    return contentChange.text === ">" || CheckRightAngleBracketInVSCode_1_8(contentChange);
}

function CheckRightAngleBracketInVSCode_1_8(contentChange: vscode.TextDocumentContentChangeEvent): boolean {
    return contentChange.text.endsWith(">") && contentChange.range.start.character === 0
        && contentChange.range.start.line === contentChange.range.end.line
        && !contentChange.range.end.isEqual(new vscode.Position(0, 0));
}

function occurrenceCount(source: string, find: string): number {
    return source.split(find).length - 1;
}