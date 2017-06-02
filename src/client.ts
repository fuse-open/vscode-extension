import { spawn, ChildProcess } from 'child_process';
import { Deferred } from './deferred';

export default class Client {

    private static instance: Client;

    public static get Instance() {
        return this.instance || (this.instance = new this());
    }

    requestId: number;
    buffer: Buffer;
    fuseClient: ChildProcess;
    requests: {};

    public connected: () => void;
    public disconnected: () => void;
    public failed: (string) => void;

    private constructor() {
        this.requestId = 1;
        this.buffer = new Buffer(0);
    }

    public connect(): void {
        this.getClient();
    }

    public sendRequest(data): void {
        data.Id = this.requestId++;

        const deferred = new Deferred();
        this.send(this.getClient(), "Request", JSON.stringify(data));
        this.requests[data.Id] = deferred;

        return deferred.promise;
    }

    public sendEvent(data): void {
        this.send(this.getClient(), "Event", JSON.stringify(data));
    }

    private send(fuseClient, msgType, serializedMsg): void {
        var length = Buffer.byteLength(serializedMsg, "utf-8");
        var packedMsg = msgType + "\n" + length + "\n" + serializedMsg;

        try {
            fuseClient.stdin.write(packedMsg);
        }
        catch (e) {
            console.log(e);
        }
    }

    private onData(data) {
        // Data is a stream and must be parsed as that
        var latestBuf = Buffer.concat([this.buffer, data]);
        this.buffer = this.parseMsgFromBuffer(latestBuf, function (message) {
            const json = JSON.parse(message);
            this.handleReply(json.Id, json);
        });
    }

    private onClose(data): void {
        if (Client.instance.disconnected) {
            Client.instance.disconnected();
        }
        if (Client.instance.fuseClient) {
            Client.instance.fuseClient.kill();
            Client.instance.fuseClient = null;
        }
    }

    private onError(data): void {
        if (Client.instance.failed) {
            Client.instance.failed(data);
        }
    }

    private getClient(): ChildProcess {
        if (this.fuseClient) {
            return this.fuseClient;
        }

        this.fuseClient = spawn("fuse", ['daemon-client', 'vscode client']);

        this.fuseClient.stdout.on('data', Client.instance.onData);
        this.fuseClient.stderr.on('data', Client.instance.onError);
        this.fuseClient.on('close', Client.instance.onClose);

        if (this.connected) {
            this.connected();
        }

        return this.fuseClient;
    }

    private handleReply(id, payload): void {
        if (this.requests[id]) {
            this.requests[id].resolve(payload);
            delete this.requests[id];
        }
    }

    private parseMsgFromBuffer(buffer, msgCallback) {
        var start = 0;

        while (start < buffer.length) {
            var endOfMsgType = buffer.indexOf('\n', start);
            if (endOfMsgType < 0)
                break; // Incomplete or corrupt data

            var startOfLength = endOfMsgType + 1;
            var endOfLength = buffer.indexOf('\n', startOfLength);
            if (endOfLength < 0)
                break; // Incomplete or corrupt data

            var msgType = buffer.toString('utf-8', start, endOfMsgType);
            var length = parseInt(buffer.toString('utf-8', startOfLength, endOfLength));
            if (isNaN(length)) {
                console.log('fuse: Corrupt length in data received from Fuse.');
                // Try to recover by starting from the beginning
                start = endOfLength + 1;
                continue;
            }

            var startOfData = endOfLength + 1;
            var endOfData = startOfData + length;
            if (buffer.length < endOfData)
                break; // Incomplete data

            var jsonData = buffer.toString('utf-8', startOfData, endOfData);
            msgCallback(jsonData);

            start = endOfData;
        }

        return buffer.slice(start, buffer.length);
    }

}
