import {
    CancellationToken,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    Position,
    Range,
    TextDocument,
} from 'vscode';

import Client from './client';

export class CompletionProvider implements CompletionItemProvider {

    language: string;

    constructor(language: string) {
        this.language = language;
    }

    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken) : Promise<CompletionItem[]> {
        return new Promise((resolve, reject) => {
            const filename = document.fileName;

            if (position.character <= 0) {
                return resolve([]);
            }

            const source = document.getText();

            return resolve(Client.Instance.sendRequest({
                "Name": "Fuse.GetCodeSuggestions",
                "Arguments":
                {
                    "SyntaxType": this.language,
                    "Path": document.fileName,
                    "Text": source,
                    "CaretPosition": { "Line": 1 + position.line, "Character": 1 + position.character }
                }
            }).then((payload) => {
                if (payload.Status === 'Success') {
                    const result = payload.Result;

                    if (result.IsUpdatingCache) {
                        return [];
                    }

                    return result.CodeSuggestions.map((item => {
                        const kind = CompletionItemKind[item.Type]

                        //return new CompletionItem(item.Suggestion, kind);
                        return new CompletionItem(item.Suggestion);
                    }));
                }

                return [];
            }));
        });
    }
}