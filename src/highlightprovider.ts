import {
    CancellationToken,
    DocumentHighlight,
    DocumentHighlightProvider,
    Position,
    Range,
    TextDocument,
} from 'vscode';

import Client from './client';

export class HighlightProvider implements DocumentHighlightProvider {

    provideDocumentHighlights(document: TextDocument, position: Position, token: CancellationToken): DocumentHighlight[] | Thenable<DocumentHighlight[]> {
        if (!document.isDirty) {
            Client.Instance.sendEvent({
                "Name": "Fuse.Preview.SelectionChanged",
                "Data":
                {
                    "Path": document.fileName, // Path to the file where selection was changed
                    "Text": document.getText(), // Full source of document
                    "CaretPosition": { "Line": position.line, "Character": position.character }
                }
            })
        }

        return Promise.reject(null);
    };

}