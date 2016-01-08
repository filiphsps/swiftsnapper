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

        public Login(details: Snapchat.LoginDetails) {
            //TODO
            let headers = {
                'Connection': 'Keep-Alive',
                'Accept-Encoding': 'gzip',
                'User-Agent': this.SnapchatAgent.CASPER_USER_AGENT,
            };
            let timestamp = this.SnapchatAgent.GenerateTimeStamp(),
                self = this;

            this.SnapchatAgent.PostCasper('/snapchat/auth', [
                ['username', details.username],
                ['password', details.password],
                ['snapchat_version', this.SnapchatAgent.SNAPCHAT_VERSION],
                ['timestamp', timestamp.toString()],
                ['token', this.SnapchatAgent.CASPER_API_TOKEN],
                ['token_hash', this.SnapchatAgent.GenerateCasperTokenHash(timestamp)]
            ], headers).then(function (snapchatData) {
                var data = JSON.parse(snapchatData);
                self.SnapchatAgent.SNAPCHAT_CLIENT_AUTH_TOKEN = data.headers['X-Snapchat-Client-Auth-Token'];
                self.SnapchatAgent.SNAPCHAT_CLIENT_TOKEN = data.headers['X-Snapchat-Client-Token'];
                self.SnapchatAgent.SNAPCHAT_UUID = data.headers['X-Snapchat-UUID'];

                headers = data.headers;
                //TODO: Post to snapchat
            });
        }
    }
}