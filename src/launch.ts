import { spawn } from 'child_process';
import { workspace, commands, window } from 'vscode';

var localOutputChannel = window.createOutputChannel("Fuse: Local preview");
var androidOutputChannel = window.createOutputChannel("Fuse: Android preview");
var iosOutputChannel = window.createOutputChannel("Fuse: iOS preview");

function OutputToBuffer(data, outChannel) {
    var str = "";
    data.forEach(function (element) {
        str = str + String.fromCharCode(element);
    }, this);
    outChannel.append(str);
    str = "";
}

export function fuseLocalPreview(): void {
    const preview = spawn("fuse", ['preview'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", (data) => { OutputToBuffer(data, localOutputChannel); });
    preview.stderr.on("data", (data) => { OutputToBuffer(data, localOutputChannel); });
};

export function fuseAndroidPreview(): void {
    const preview = spawn("fuse", ['preview', '-tandroid', '-r'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", (data) => { OutputToBuffer(data, androidOutputChannel); });
    preview.stderr.on("data", (data) => { OutputToBuffer(data, androidOutputChannel); });
}

export function fuseiOSPreview(): void {
    const preview = spawn("fuse", ['preview', '-tios', '-r'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", (data) => { OutputToBuffer(data, iosOutputChannel); });
    preview.stderr.on("data", (data) => { OutputToBuffer(data, iosOutputChannel); });
}