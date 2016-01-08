/// <reference path="snapchat.agent.ts" />
/// <reference path="snapchat.models.ts" />

namespace Snapchat {
    export class Client {
        private SnapchatAgent: SnapchatAgent;

        constructor() {
            this.SnapchatAgent = new SnapchatAgent();
        }

        public Login(username, password) {
            //TODO
        }
    }
}