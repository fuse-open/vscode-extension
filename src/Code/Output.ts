import { window, OutputChannel } from 'vscode';

const outputChannels = {};

export function getOutputChannel(channel: string): OutputChannel {
    if (channel in outputChannels) {
        return outputChannels[channel];
    } else {
        let outputChannel = window.createOutputChannel(channel);
        outputChannels[channel] = outputChannel;
        return outputChannel;
    }
}

export function writeToChannel(data, outChannel: OutputChannel): void {
    var str = "";
    data.forEach(function (element) {
        str = str + String.fromCharCode(element);
    }, this);
    outChannel.append(str);
    str = "";
}