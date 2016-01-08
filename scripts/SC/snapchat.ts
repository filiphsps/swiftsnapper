/// <reference path="snapchat.agent.ts" />
/// <reference path="snapchat.models.ts" />

namespace Snapchat {
    export class Client {
        private SnapchatAgent: SnapchatAgent;

        public Initialize() {
            this.SnapchatAgent = new SnapchatAgent();

            return new Promise((resolve) => {
                this.SnapchatAgent.Initialize().then(function () {
                    resolve(this);
                });
            });
        }

        public Login(username, password) {
            //TODO
        }
    }
}