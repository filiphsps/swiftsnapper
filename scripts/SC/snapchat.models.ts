namespace Snapchat {
    export class User {
        public username: string;
    }

    export class Snap {
        public id: string;
        public mediaType: string;
        public sender: string;
        public recipient: string;
        public mediaState: string;
        public timer: Number = 0;
        public timestamp: number = 0;
    }

    export interface LoginDetails {
        username: string,
        password: string,
    }
}