import { spawn, ChildProcess } from 'child_process';
import { Deferred } from '../deferred';

export class FuseDaemon {

    private static instance: FuseDaemon;

    public static get Instance() {
        return this.instance || (this.instance = new this());
    }

    requestId: number = 1;
    subscriptionId: number = 1;
    buffer: Buffer = Buffer.alloc(0);
    fuseClient?: ChildProcess;
    requests: {
        [x: number]: any
    } = {};

    public connected?: () => void;
    public disconnected?: () => void;
    public failed?: (why: string) => void;

    public buildStarted?: (data: any) => void;
    public buildEnded?: (data: any) => void;
    public buildIssueDetected?: (data: any) => void;
    public buildLogged?: (data: any) => void;

    public connect(): void {
        this.getClient();
    }

    public sendRequest<T = any>(data: FuseRequests) {
        data.Id = this.requestId++;

        const deferred = new Deferred<T>();
        this.send(this.getClient(), "Request", JSON.stringify(data));
        this.requests[data.Id] = deferred;

        return deferred.promise;
    }

    public sendEvent(data: FuseEvents): void {
        this.send(this.getClient(), "Event", JSON.stringify(data));
    }


    public subscribe(pattern: string, replay = false, subscriptionId?: number) {
        if (subscriptionId === undefined) {
            subscriptionId = this.subscriptionId++;
        }
        return this.sendRequest({
            Name: "Subscribe",
            Arguments: {
                Filter: pattern,
                Replay: replay,
                SubscriptionId: subscriptionId
            }
        });
    }



    private send(fuseClient: ChildProcess, msgType: "Request" | "Event", serializedMsg: string): void {
        var length = Buffer.byteLength(serializedMsg, "utf-8");
        var packedMsg = msgType + "\n" + length + "\n" + serializedMsg;

        try {
            fuseClient.stdin.write(packedMsg);
        }
        catch (e) {
            console.log(e);
        }
    }

    private onData(data: any) {
        var latestBuf = Buffer.concat([FuseDaemon.Instance.buffer, data]);
        FuseDaemon.Instance.buffer = FuseDaemon.Instance.parseMsgFromBuffer(latestBuf, (message: string) => {
            const json = JSON.parse(message);
            FuseDaemon.Instance.handleData(json.Id, json);
        });
    }

    private onClose(data: any): void {
        if (FuseDaemon.instance.disconnected) {
            FuseDaemon.instance.disconnected();
        }
        if (FuseDaemon.instance.fuseClient) {
            FuseDaemon.instance.fuseClient.kill();
            FuseDaemon.instance.fuseClient = void 0;
        }
    }

    private onError(data: any): void {
        if (FuseDaemon.instance.failed) {
            FuseDaemon.instance.failed(data);
        }
    }

    private getClient(): ChildProcess {
        if (this.fuseClient) {
            return this.fuseClient;
        }

        this.fuseClient = spawn("fuse", ['daemon-client', 'vscode client']);

        this.fuseClient.stdout.on('data', FuseDaemon.instance.onData);
        this.fuseClient.stderr.on('data', FuseDaemon.instance.onError);
        this.fuseClient.on('close', FuseDaemon.instance.onClose);

        if (this.connected) {
            this.connected();
        }

        return this.fuseClient;
    }

    private handleData(id: number, payload: FuseBuildEvents): void {
        if (payload.Name) {
            switch (payload.Name) {
                case "Fuse.BuildStarted":
                    if (this.buildStarted) {
                        this.buildStarted(payload);
                    }
                    break;
                case "Fuse.BuildEnded":
                    if (this.buildEnded) {
                        this.buildEnded(payload);
                    }
                    break;
                case "Fuse.BuildLogged":
                    if (this.buildLogged) {
                        this.buildLogged(payload);
                    }
                    break;
                case "Fuse.BuildIssueDetected":
                    if (this.buildIssueDetected) {
                        this.buildIssueDetected(payload);
                    }
                    break;
            }
        }
        if (this.requests[id]) {
            this.requests[id].resolve(payload);
            delete this.requests[id];
        }
    }

    private parseMsgFromBuffer(buffer: Buffer, msgCallback: Function) {
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


export interface CaretPosition {
    Line: number;
    Character: number;
}

type FuseSyntaxType = "UX" | "Uno" | string;

type FuseRequests = FuseSubscribeRequest | FuseGetCodeSuggestionsRequest | FuseGetGotoDefinitionRequest;
type FuseEvents =  FuseSelectionChangedEvent


type FuseSubscribeRequest = {
    Id?: number, // Unique request id
	Name: "Subscribe",
	Arguments:
	{
		Filter: string, // .Net style regex filtering incoming events based on type
		Replay: boolean, // Use replay if you want to receive messages that were sent before you connected
		SubscriptionId: number, // A locally unique number representing this subscription, so we can recognize the incoming events (and unsubscribe)
	}
}


export type FuseGetCodeSuggestionsRequest = {
    Id?: number, // Unique request id
	Name: "Fuse.GetCodeSuggestions",
	Arguments:
	{
		SyntaxType: FuseSyntaxType, // Typically "UX" or "Uno"
		Path: string, // Path to document where suggestion is requested
		Text: string, // Full source of document where suggestion is requested
		CaretPosition: CaretPosition // 1-indexed text position within Text where suggestion is requested
	}
}

export type FuseGetGotoDefinitionRequest = {
    Id?: number, // Unique request id
	Name: "Fuse.GotoDefinition",
	Arguments:
	{
		SyntaxType: FuseSyntaxType, // Typically "UX" or "Uno"
		Path: string, // Path to document where suggestion is requested
		Text: string, // Full source of document where suggestion is requested
		CaretPosition: CaretPosition // 1-indexed text position within Text where suggestion is requested
	}
}

type FuseSelectionChangedEvent = {
    Name:  "Fuse.Preview.SelectionChanged",
    Data:
    {
    	Path: string, // Path to the file where selection was changed
        Text: string, // Full source of document
        CaretPosition: CaretPosition // 1-indexed text position within Text where selection was changed
    }
}

type FuseBuildEvents = FuseBuildStartedEvent | FuseBuildEndedEvent | FuseBuildIssueDetectedEvent | FuseBuildLoggedEvent;

type FuseBuildStartedEvent = {
    Name: "Fuse.BuildStarted",
	SubscriptionId?: number,
	Data:
    {
		BuildType: "FullCompile" | "LoadMarkup", // This means the whole project is built. Can also be "LoadMarkup", which means that we're live-reloading an already built app
		BuildId: string, // A GUID that identifies this build, keep it around if you're intereseted in which build events are related to this build
		BuildTag: string, // Build-tag is a way to recognize build events from a build you started yourself. We can set it using `fuse preview --name=<YourTag>`. The default value is emtpy or null.
		PreviewId: string, // If build type is "LoadMarkup", the BuildId of the initial full compile used by preview
		ProjectPath: string, // The native path to the project file being built
		Target: "DotNetDll" | "iOS" | "Android", // The target of the build. The supported targets are "DotNetDll" (local preview), "iOS" and "Android". Other targets include "DotNetExe", "CMake", "MSVC12", "WebGL" and "Unknown".
    }
}

type FuseBuildLoggedEvent = {
    Name: "Fuse.BuildLogged",
	SubscriptionId?: number,
	Data:
	{
		BuildId:  string,
		Message: string
	}
}

export type FuseBuildIssueDetectedEvent = {
	Name: "Fuse.BuildIssueDetected",
	SubscriptionId: number,
	Data:
	{
		BuildId:  string;
		IssueType:  "Unknown" | "FatalError"|  "Error"|  "Warning" | "Message"
		Path?: string, // Path to the file where the error supposedly occurred. Can be empty in other words optional.
		StartPosition?: CaretPosition, // 1-indexed start position in the file where the error is occurred (Optional)
		EndPosition?: CaretPosition, // 1-indexed end position in the file where the error occurred (Optional)
		ErrorCode: string, // Error code generated by the Uno compiler
		Message: string // A human readable description of the issue
	}
}


type FuseBuildEndedEvent = {
	Name: "Fuse.BuildEnded",
	SubscriptionId: number,
	Data:
	{
		BuildId:  string,
		Status: "InternalError" | "Error" | "Success"
	}
}
