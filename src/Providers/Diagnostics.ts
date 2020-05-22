import { DiagnosticCollection, DiagnosticSeverity, languages, Uri, Diagnostic, Range, Position } from 'vscode';

export default class Diagnostics {
    collection: DiagnosticCollection;
    diagnostics: {} = {};

    constructor() {
        this.collection = languages.createDiagnosticCollection("Fuse");
    }

    public clear() {
        this.collection.clear();
        this.diagnostics = {};
    }

    public set(data) {
        var severity: DiagnosticSeverity = 0;

        switch (data.Data.IssueType) {
            case "Error":
            case "FatalError":
                severity = 0;
                break;
            case "Warning":
                severity = 1;
                break;
            case "Unknown":
            case "Message":
                severity = 2;
                break;
            default:
                return;
        }

        if (!data.Data.StartPosition) {
            data.Data.StartPosition = {
                Line: 1,
                Character: 1
            };
        }
        if (!data.Data.EndPosition) {
            data.Data.EndPosition = {
                Line: data.Data.StartPosition.Line,
                Character: 1000
            };
        }

        const diagnostic = new Diagnostic(new Range(data.Data.StartPosition.Line - 1,
            data.Data.StartPosition.Character,
            data.Data.EndPosition.Line - 1,
            data.Data.EndPosition.Character), data.Data.Message,
            severity);

        if (data.Data.Path in this.diagnostics) {
            this.diagnostics[data.Data.Path].push(diagnostic);
        } else {
            this.diagnostics[data.Data.Path] = [diagnostic];
        }

    }

    public ended(data) {
        Object.keys(this.diagnostics).forEach((key) => {
            this.collection.set(Uri.file(key),
                this.diagnostics[key]);
        });
    }

}