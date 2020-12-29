import {
    CancellationToken,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    Position,
    TextDocument,
    DefinitionProvider,
    Definition,
    Location,
    Uri,
    SnippetString
} from 'vscode';

import { FuseDaemon, CaretPosition } from '../Fuse/Daemon';

export class LanguageProvider implements CompletionItemProvider, DefinitionProvider {

    language: string;

    constructor(language: string) {
        this.language = language;
    }

    public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Promise<CompletionItem[]> {
        if (position.character <= 0) {
            return []
        }

        const requestPayload: any = this._getRequestPayload("Fuse.GetCodeSuggestions", document, position)

        try {
            const payload = await FuseDaemon.Instance.sendRequest<FuseGetSuggestionsResponse>(requestPayload)

            return this._processSuggestions(payload);
        } catch (err) {
            console.log(err);
        }

        return [];
    }


    async provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Promise<Definition | null> {
        if (position.character <= 0) {
            return null;
        }

        const requestPayload: any = this._getRequestPayload("Fuse.GotoDefinition", document, position)

        try {
            const payload = await FuseDaemon.Instance.sendRequest<FuseGotoDefinitionResponse>(requestPayload)
            return this._processGotoDefinition(payload);
        } catch (err) {
            console.log(err);
        }

        return null;
    }

    _getRequestPayload(Name: "Fuse.GetCodeSuggestions" | "Fuse.GotoDefinition", document: TextDocument, position: Position) {
        const Path = document.fileName;
        const Text = document.getText();
        const CaretPosition = {
            Line: 1 + position.line,
            Character: 1 + position.character
        };

        return {
            Name,
            Arguments: {
                CaretPosition,
                Path,
                Text,
                SyntaxType: this.language
            }
        }
    }

    _processSuggestions(payload: FuseGetSuggestionsResponse): CompletionItem[] | PromiseLike<CompletionItem[]> {
        if (payload.Status === 'Success') {
            const result = payload.Result;

            if (result.IsUpdatingCache) {
                return [];
            }

            return result.CodeSuggestions.map((item => {
                const kind = getRemapFuseKind(item.Type)

                let completionItem = new CompletionItem(item.Suggestion, kind);
                if (kind == CompletionItemKind.Property && this.language == 'UX') {
                    completionItem.insertText = new SnippetString(`${item.Suggestion}="$0"`);
                }
                return completionItem;
            }));
        }

        return []
    }

    _processGotoDefinition(payload: FuseGotoDefinitionResponse): Definition | PromiseLike<Definition | null> | null {
        if (payload.Status == "Success") {
            if (payload.Result.Path === '(unknown)', payload.Result.CaretPosition.Line === 0 || payload.Result.CaretPosition.Character === 0) {
                return null
            }

            const pos = new Position(payload.Result.CaretPosition.Line - 1, payload.Result.CaretPosition.Character - 1);
            const uri = Uri.file(payload.Result.Path)

            return new Location(uri, pos);
        }

        return null;
    }
}

function getRemapFuseKind(fusekind: string) {
    switch (fusekind) {
        case FuseSuggestItemKind.Event:
            return CompletionItemKind.Event;

        case FuseSuggestItemKind.Directory:
            return CompletionItemKind.Folder;

        case FuseSuggestItemKind.File:
            return CompletionItemKind.File;

        case FuseSuggestItemKind.TypeAlias:
        case FuseSuggestItemKind.GenericParameterType:
            return CompletionItemKind.TypeParameter;

        case FuseSuggestItemKind.Constructor:
            return CompletionItemKind.Constructor;

        case FuseSuggestItemKind.Interface:
            return CompletionItemKind.Interface;

        case FuseSuggestItemKind.Constant:
            return CompletionItemKind.Constant;

        case FuseSuggestItemKind.Variable:
            return CompletionItemKind.Variable;

        case FuseSuggestItemKind.Struct:
            return CompletionItemKind.Struct;

        case FuseSuggestItemKind.EnumValue:
            return CompletionItemKind.EnumMember;

        case FuseSuggestItemKind.Enum:
            return CompletionItemKind.Enum;

        case FuseSuggestItemKind.Field:
            return CompletionItemKind.Field;

        case FuseSuggestItemKind.Property:
            return CompletionItemKind.Property;

        case FuseSuggestItemKind.Namespace:
        case FuseSuggestItemKind.Importer:
            return CompletionItemKind.Module;

        case FuseSuggestItemKind.Method:
            return CompletionItemKind.Method;

        case FuseSuggestItemKind.Interface:
            return CompletionItemKind.Interface;

        case FuseSuggestItemKind.Class:
            return CompletionItemKind.Class;

        case FuseSuggestItemKind.Keyword:
            return CompletionItemKind.Keyword;
        default:
            return CompletionItemKind.Text;
    }

}

enum FuseSuggestItemKind {
    Keyword = "Keyword",
    Namespace = "Namespace",
    Class = "Class",
    Struct = "Struct",
    Interface = "Interface",
    Delegate = "Delegate",
    GenericParameterType = "GenericParameterType",
    Enum = "Enum",
    EnumValue = "EnumValue",
    Constant = "Constant",
    Field = "Field",
    Variable = "Variable",
    MethodArgument = "MethodArgument",
    Method = "Method",
    Property = "Property",
    Event = "Event",
    MetaProperty = "MetaProperty",
    Block = "Block",
    BlockFactory = "BlockFactory",
    Importer = "Importer",
    Directory = "Directory",
    File = "File",
    TypeAlias = "TypeAlias",
    Error = "Error",
    Constructor = "Constructor" //Need some way to differentiate between methods and constructors..
}


type FuseGetSuggestionsResponse = {
    Id: number, // Id of request
    Status: "Success",
    Result:
    {
        // If true you should consider trying again later
        IsUpdatingCache: boolean,
        CodeSuggestions: FuseSuggestion[]
    }
}


type FuseGotoDefinitionResponse = {
    Id: number, // Id of request
    Status: "Success",
    Result:
    {
        // If true you should consider trying again later
        Path: string,
        CaretPosition: CaretPosition
    }
}


type FuseSuggestion = {
    Suggestion: string,
    PreText: string,
    PostText: string,
    Type: any // "<datatype>",
    ReturnType: any //"<datatype>",
    AccessModifiers: any //[ "<accessmodifier>", ... ],
    FieldModifiers: any //[ "<fieldmodifier>", ... ],
    MethodArguments: FuseSuggestionMethodArguments[],
}

type FuseSuggestionMethodArguments = {
    Name: string;
    ArgType: any
    IsOut: "false" | "true"
}
