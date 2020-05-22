import { spawn } from 'child_process';
import { workspace } from 'vscode';
import { getOutputChannel, writeToChannel } from './outputchannel';

export function fuseLocalPreview(): void {
    const preview = spawn("fuse", ['preview'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: Local preview")); });
    preview.stderr.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: Local preview")); });
};

export function fuseAndroidPreview(): void {
    const preview = spawn("fuse", ['preview', '.', '-tandroid', '-r'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: Android preview")); });
    preview.stderr.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: Android preview")); });
}

export function fuseiOSPreview(): void {
    const preview = spawn("fuse", ['preview', '.', '-tios', '-r'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: iOS preview")); });
    preview.stderr.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: iOS preview")); });
}

export function fuseLocalDebug(): void {
    const preview = spawn("fuse", ['preview', '.', '-DDEBUG_V8'], { detached: true, cwd: workspace.rootPath });
    preview.stdout.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: Local debug")); });
    preview.stderr.on("data", (data) => { writeToChannel(data, getOutputChannel("Fuse: Local debug")); });
}