namespace Snapchat {
    export class User {

    }

    export class Snap {
        public sender: string; //TODO: Switch to user
        public timer: Number = 0;
    }

    export interface LoginDetails {
        username: string,
        password: string,
    }
}