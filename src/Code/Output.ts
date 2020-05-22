import { window, OutputChannel } from 'vscode';

const outputChannels: { [x: string]: OutputChannel } = {};

export function getOutputChannel(channel: string): OutputChannel {
    if (channel in outputChannels) {
        return outputChannels[channel];
    } else {
        let outputChannel = window.createOutputChannel(channel);
        outputChannels[channel] = outputChannel;
        return outputChannel;
    }
}

export function writeToChannel(data: any, outChannel: OutputChannel): void {
    var str = "";
    data.forEach(function (element: any) {
        str = str + String.fromCharCode(element);
    });
    outChannel.append(str);
    str = "";
}