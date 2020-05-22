import { window, StatusBarAlignment, StatusBarItem } from 'vscode';

let showConnectionMessage = true;

export default class StatusBar {
    fuseStatusBarItem: StatusBarItem;
    localPreview: StatusBarItem;
    androidPreview: StatusBarItem;
    iosPreview: StatusBarItem;

    constructor() {
        this.fuseStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        this.fuseStatusBarItem.text = "Fuse";
        this.fuseStatusBarItem.show();

        this.localPreview = window.createStatusBarItem(StatusBarAlignment.Left, -3);
        this.localPreview.text = "Local";
        this.localPreview.command = "fuse.preview.local";
        this.localPreview.tooltip = "Start Fuse local preview";
        this.localPreview.show();

        this.localPreview = window.createStatusBarItem(StatusBarAlignment.Left, -5);
        this.localPreview.text = "Android";
        this.localPreview.command = "fuse.preview.android";
        this.localPreview.tooltip = "Start Fuse Android preview";
        this.localPreview.show();

        if (process.platform === "darwin") {
            this.localPreview = window.createStatusBarItem(StatusBarAlignment.Left, -7);
            this.localPreview.text = "iOS";
            this.localPreview.command = "fuse.preview.ios";
            this.localPreview.tooltip = "Start Fuse iOS preview";
            this.localPreview.show();
        }
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

    public buildStarted() {
        window.setStatusBarMessage("Build started...", 3000);
    }

    public buildSucceeded() {
        window.setStatusBarMessage("Build succeeded", 3000);
    }

    public buildFailed() {
        window.setStatusBarMessage("Build failed", 3000);
    }

}
