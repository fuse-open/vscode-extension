import { window, StatusBarAlignment, StatusBarItem } from 'vscode';

let showConnectionMessage = true;

export default class StatusBar {
    fuseStatusBarItem: StatusBarItem;

    constructor() {
        this.fuseStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        this.fuseStatusBarItem.text = "Fuse";
        this.fuseStatusBarItem.show();
    }

    public connected() {
        this.fuseStatusBarItem.text = "Fuse $(rss)";
        this.fuseStatusBarItem.command = null;
        this.fuseStatusBarItem.tooltip = "Connected to Fuse daemon";
        if (showConnectionMessage) {
            window.setStatusBarMessage("Connected to Fuse daemon", 3000);
            showConnectionMessage = false;
        }
    }

    public disconnected() {
        this.fuseStatusBarItem.text = "Fuse $(stop)";
        this.fuseStatusBarItem.command = "fuse.connect";
        this.fuseStatusBarItem.tooltip = "Connect to Fuse daemon";
    }

}
