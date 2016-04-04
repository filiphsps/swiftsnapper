namespace Snapchat {
    export class User {
        public username: string;

        //Only used by current user
        public password: string;
        public google_username: string;
        public google_password: string;
    }

    export class Snap {
        public conversationId: string;
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
    export interface RegisterDetails {
        username: string,
        password: string,
        email: string,
        cellphoneNumber: number,
    }

    export interface CasperResponse {
        code: number,
        endpoints: [{
            endpoint: string,
            cache_millis: number,
            header: any,
            params: any
        }],
        settings: any
    }
}