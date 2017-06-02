'use strict';

import * as vscode from 'vscode';
import StatusBar from './statusbar';
import Client from './client';
import { fuseLocalPreview, fuseAndroidPreview, fuseiOSPreview } from './launch';
import { CompletionProvider } from './completionprovider';
import { HighlightProvider } from './highlightprovider';
import Diagnostics from './diagnostics';

let statusBar;
let diagnostics;

export function activate(context: vscode.ExtensionContext) {

    diagnostics = new Diagnostics();

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

    Client.Instance.buildStarted = (data) => {
        console.log("Build started: " + JSON.stringify(data));
        diagnostics.clear();
    };

    Client.Instance.buildEnded = (data) => {
        console.log("Build ended: " + JSON.stringify(data));
        diagnostics.ended(data);
    };

    Client.Instance.buildLogged = (data) => {
        console.log("Build logged: " + JSON.stringify(data));
    };

    Client.Instance.buildIssueDetected = (data) => {
        console.log("Build issue detected: " + JSON.stringify(data));
        diagnostics.set(data);
    };

    Client.Instance.connect();

    Client.Instance.subscribe("Fuse.BuildStarted");
    Client.Instance.subscribe("Fuse.BuildLogged");
    Client.Instance.subscribe("Fuse.BuildIssueDetected");
    Client.Instance.subscribe("Fuse.BuildEnded");

    // Syntax hiliting
    vscode.languages.registerDocumentHighlightProvider('ux', new HighlightProvider());

    // Auto completion
    vscode.languages.registerCompletionItemProvider('ux', new CompletionProvider('UX'));
    vscode.languages.registerCompletionItemProvider('uno', new CompletionProvider('Uno'));
}


export function deactivate() {

}