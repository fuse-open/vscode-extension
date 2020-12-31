'use strict';

import * as vscode from 'vscode';
import { StatusBar } from './Code/StatusBar';
import { FuseDaemon } from './Fuse/Daemon';
import { fuseLocalPreview, fuseAndroidPreview, fuseiOSPreview, fuseLocalDebug } from './Fuse/Launcher';
import { LanguageProvider } from './Providers/LanguageProvider';
import { HighlightProvider } from './Providers/HighlightProvider';
import { Diagnostics } from './Providers/Diagnostics';
import { uxAutoCloseTag, uxAutoQuotes } from './Providers/SyntaxProvider'

let statusBar: StatusBar;
let diagnostics: Diagnostics;

export function activate(context: vscode.ExtensionContext) {

    diagnostics = new Diagnostics();

    // Commands
    const connectToDaemon = vscode.commands.registerCommand('fuse.connect', () => {
        FuseDaemon.Instance.connect();
    });
    const commandLocalPreview = vscode.commands.registerCommand('fuse.preview.local', () => {
        fuseLocalPreview();
    });
    const commandAndroidPreview = vscode.commands.registerCommand('fuse.preview.android', () => {
        fuseAndroidPreview();
    });
    const commandiOSPreview = vscode.commands.registerCommand('fuse.preview.ios', () => {
        fuseiOSPreview();
    });
    const commandLocalDebug = vscode.commands.registerCommand('fuse.preview.local.debug', () => {
        fuseLocalDebug();
    });

    context.subscriptions.push(
        connectToDaemon,
        commandLocalPreview,
        commandAndroidPreview,
        commandiOSPreview,
        commandLocalDebug);

    // Status bar
    statusBar = new StatusBar();

    // Daemon connection/disconnect
    FuseDaemon.Instance.connected = async () => {
        statusBar.connected();
        FuseDaemon.Instance.subscribe("Fuse.BuildStarted");
        // Client.Instance.subscribe("Fuse.BuildLogged");
        FuseDaemon.Instance.subscribe("Fuse.BuildIssueDetected");
        FuseDaemon.Instance.subscribe("Fuse.BuildEnded");
    }

    FuseDaemon.Instance.disconnected = () => {
        statusBar.disconnected();
        vscode.window.showInformationMessage("Disconnected from Fuse daemon", "Reconnect").then((command) => {
            if (command === "Reconnect") {
                FuseDaemon.Instance.connect();
            }
        });
    }

    FuseDaemon.Instance.buildStarted = (data) => {
        statusBar.buildStarted();
        diagnostics.clear();
    };

    FuseDaemon.Instance.buildEnded = (data) => {
        diagnostics.ended(data);
        if (data.Data.Status === "Error") {
            statusBar.buildFailed();
        } else {
            statusBar.buildSucceeded();
        }
    };

    FuseDaemon.Instance.buildLogged = (data) => {
        //console.log("Build logged: " + JSON.stringify(data));
    };

    FuseDaemon.Instance.buildIssueDetected = (data) => {
        diagnostics.set(data);
    };

    FuseDaemon.Instance.connect();

    // Syntax hiliting
    vscode.languages.registerDocumentHighlightProvider({ scheme: 'file', language: 'ux' }, new HighlightProvider());

    const uxLanguageFeatures = new LanguageProvider('UX');
    const unoLanguageFeatures = new LanguageProvider('Uno');
    // Auto completion
    vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'ux' }, uxLanguageFeatures);
    vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'uno' }, unoLanguageFeatures);
    vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'ux' }, uxLanguageFeatures);
    vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'uno' }, unoLanguageFeatures);
    // Auto close tag, Auto add quotes when type sign (=)
    vscode.workspace.onDidChangeTextDocument(event => {
        uxAutoCloseTag(event);
        uxAutoQuotes(event);
    });
    // Auto Indent when hit enter
    vscode.languages.setLanguageConfiguration('ux', {
        onEnterRules: [
            {
                beforeText: new RegExp(`<([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>/i,
                action: { indentAction: vscode.IndentAction.IndentOutdent }
            },
            {
                beforeText: new RegExp(`<(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                action: { indentAction: vscode.IndentAction.Indent }
            }
        ],
    });
}


export function deactivate() {

}