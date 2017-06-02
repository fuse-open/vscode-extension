import { spawn } from 'child_process';
import { workspace, commands, window } from 'vscode';


var outputChannel = window.createOutputChannel("Fuse local preview");

var preview;

function OutputToBuffer(data) {
    var str = "";
    data.forEach(function (element) {
        str = str + String.fromCharCode(element);
    }, this);
    outputChannel.append(str);
    str = "";
}

export function fuseLocalPreview(): void {
    preview = spawn("fuse", ['preview'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", OutputToBuffer);
    preview.stderr.on("data", OutputToBuffer);
};