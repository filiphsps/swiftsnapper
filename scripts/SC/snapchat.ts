/// <reference path="snapchat.agent.ts" />
/// <reference path="snapchat.models.ts" />

namespace Snapchat {
    export class Client {
        private SnapchatAgent: Snapchat.Agent;

        public AllUpdatesData;
        public CurrentUser: Snapchat.User;

        public Initialize() {
            this.SnapchatAgent = new Snapchat.Agent();
            this.CurrentUser = new Snapchat.User();
            console.log(this.CurrentUser);

            return new Promise((resolve, reject) => {
                this.SnapchatAgent.Initialize(this.CurrentUser).then(() => {
                    resolve(this);
                }).catch((err) => {
                    reject(err);
                });
            });
        }

        /*
            Get the current user's pending Snapchat feed
        */
        public GetPendingFeed(): Array<Snapchat.Snap> {
            return null;
        }

        /*
            Get the media for the provided snap
        */
        public GetSnapMedia(snap: Snapchat.Snap) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }

        /*
            Get user's SnapTag
        */
        public GetSnapTag(username: string) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }

        public PostSnap(URI, parameters) {
            return this.SnapchatAgent.PostSnapchat(URI, parameters);
        }

        /* 
            Register a new user
        */
        public Register(details: Snapchat.RegisterDetails) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }

        /*
            Login a user
        */
        public Login(details: Snapchat.LoginDetails) {
            return new Promise((resolve, reject) => {
                this.CurrentUser['username'] = details.username;
                this.CurrentUser['password'] = details.password;

                let ts = this.SnapchatAgent.GenerateTimeStamp();
                this.SnapchatAgent.LoginSnapchatCasper(ts).then((res: any) => {
                    if (res.code !== 200)
                        return reject(res.message);

                    resolve(this);
                    //TODO
                }).catch((res) => {
                    return reject(res.message);
                });
            });
        }
    }
}
