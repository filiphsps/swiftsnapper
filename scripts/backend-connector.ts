
namespace SwiftSnapper {
    export class Backend {
        constructor() {
            Http.Initialize();
        }

        public Get(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                Http.Get(options).then((res: Object) => {
                    resolve(res);
                }).catch((err) => {
                    reject(err);
                });
            });
        }

        public Post(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                Http.Post(options).then((res: Object) => {
                    resolve(res);
                }).catch((err) => {
                    reject(err);
                });
            });
        }

        public Put(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                Http.Put(options).then((res: Object) => {
                    resolve(res);
                }).catch((err) => {
                    reject(err);
                });
            });
        }

        public Delete(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                Http.Delete(options).then((res: Object) => {
                    resolve(res);
                }).catch((err) => {
                    reject(err);
                });
            });
        }
    }

    module Http {
        let SWIFTSNAPPER_URI = 'https://swiftsnapper.playstr.link/v1/',
            SWIFTSNAPPER_USERAGENT = null;

        export function Initialize() {
            let device = 'device',
                os = 'os',
                appVersion = 'x.x.x.x';

            SWIFTSNAPPER_USERAGENT = 'SwiftSnapper/' + appVersion + ' (' + device + ', ' + os + '; gzip)';

            $.ajaxSetup({
                beforeSend: (xhr) => {
                    if (localStorage.getItem('Authorization') !== null)
                        xhr.setRequestHeader("Authorization", "Basic " + localStorage.getItem('Authorization'));
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                }
            });
        }

        export interface HttpOptions {
            endpoint: string,
            data?: any
        }

        export function Get(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: SWIFTSNAPPER_URI + options.endpoint,
                    type: 'GET',
                    success: (res) => {
                        resolve(res);
                    },
                    error: (err) => {
                        reject(err);
                    }
                });
            });
        }
        export function Post(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                $.post(SWIFTSNAPPER_URI + options.endpoint, options.data, (res) => {
                    resolve(res);
                }, 'json').fail((jqXHR, err) => {
                    reject(err);
                });
            });
        }
        export function Put(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: options.endpoint,
                    type: 'PUT',
                    contentType: "application/json",
                    data: options.data,
                    success: (res) => {
                        resolve(res);
                    },
                    error: (err) => {
                        reject(err);
                    }
                });
            });
        }
        export function Delete(options: Http.HttpOptions) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: options.endpoint,
                    type: 'DELETE',
                    contentType: "application/json",
                    data: options.data,
                    success: (res) => {
                        resolve(res);
                    },
                    error: (err) => {
                        reject(err);
                    }
                });
            });
        }
    }
}