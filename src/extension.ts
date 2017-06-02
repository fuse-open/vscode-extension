'use strict';

import * as vscode from 'vscode';
import StatusBar from './statusbar';
import Client from './client';
import { fuseLocalPreview, fuseAndroidPreview, fuseiOSPreview } from './launch';
import { CompletionProvider } from './completionprovider';
import { HighlightProvider } from './highlightprovider';

let statusBar;

export function activate(context: vscode.ExtensionContext) {

    // Commands
    const connectToDaemon = vscode.commands.registerCommand('fuse.connect', () => {
        Client.Instance.connect();
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

    context.subscriptions.push(
        connectToDaemon,
        commandLocalPreview,
        commandAndroidPreview,
        commandiOSPreview);

    // Status bar
    statusBar = new StatusBar();

    // Daemon connection/disconnect
    Client.Instance.connected = () => {
        statusBar.connected();
    }

    Client.Instance.disconnected = () => {
        statusBar.disconnected();
        vscode.window.showInformationMessage("Disconnected from Fuse daemon", "Reconnect").then((command) => {
            if (command === "Reconnect") {
                Client.Instance.connect();
            }
        });
    }

    Client.Instance.connect();

    // Syntax hiliting
    vscode.languages.registerDocumentHighlightProvider('ux', new HighlightProvider());

    // Auto completion
    vscode.languages.registerCompletionItemProvider('ux', new CompletionProvider('UX'));
    vscode.languages.registerCompletionItemProvider('uno', new CompletionProvider('Uno'));
}


export function deactivate() {

}