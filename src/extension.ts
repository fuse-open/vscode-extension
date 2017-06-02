'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import StatusBar from './statusbar';
import Client from './client';
import { fuseLocalPreview } from './launch';

let statusBar;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let connectToDaemon = vscode.commands.registerCommand('fuse.connect', Client.Instance.connect);
    let commandLocalPreview = vscode.commands.registerCommand('fuse.preview.local', fuseLocalPreview);

    context.subscriptions.push(connectToDaemon);
    context.subscriptions.push(commandLocalPreview);

    statusBar = new StatusBar();

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
}

// this method is called when your extension is deactivated
export function deactivate() {
}