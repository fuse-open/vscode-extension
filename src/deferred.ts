export class Deferred {
    promise: any;
    resolve: any;
    reject: any;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        })
    }
}