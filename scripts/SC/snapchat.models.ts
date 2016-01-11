namespace Snapchat {
    export class User {
        public username: string;
    }

    export class Snap {
        public sender: string; //TODO: Switch to user
        public timer: Number = 0;
        public timestamp: number = 0;
    }

    export interface LoginDetails {
        username: string,
        password: string,
    }
}