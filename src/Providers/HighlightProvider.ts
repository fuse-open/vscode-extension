import {
    CancellationToken,
    DocumentHighlightProvider,
    Position,
    Range,
    TextDocument,
} from 'vscode';

import { FuseDaemon } from '../Fuse/Daemon';

export class HighlightProvider implements DocumentHighlightProvider {

    async provideDocumentHighlights(document: TextDocument, position: Position, token: CancellationToken): Promise<null> {
        if (!document.isDirty) {
            await FuseDaemon.Instance.sendEvent({
                Name: "Fuse.Preview.SelectionChanged",
                Data:
                {
                    Path: document.fileName, // Path to the file where selection was changed
                    Text: document.getText(), // Full source of document
                    CaretPosition: {
                        Line: position.line + 1,
                        Character: position.character
                    }
                }
            })
        }

        return null;
    };

}