declare var Hashes: any;
var sha256 = new Hashes.SHA256

namespace Snapchat {
    export class Agent{
        public SNAPCHAT_BASE_ENDPOINT = 'https://app.snapchat.com';
        public SNAPCHAT_EVENTS_ENDPOINT = 'https://sc-analytics.appspot.com/post_events';
        public SNAPCHAT_ANALYTICS_ENDPOINT = 'https://sc-analytics.appspot.com/analytics/b';
        public SNAPCHAT_HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
        public SNAPCHAT_API_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
        public SNAPCHAT_API_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
        public SNAPCHAT_CLIENT_AUTH_TOKEN = null; //TODO: Use val from http://heroku.casper.io/snapchat/ios/endpointauth 
        public SNAPCHAT_CLIENT_TOKEN = null; //TODO: Use from http://heroku.casper.io/snapchat/ios/endpointauth 
        public SNAPCHAT_AUTH_TOKEN = null;
        public SNAPCHAT_UUID = null; //TODO: Use val from http://heroku.casper.io/snapchat/ios/endpointauth 
        public SNAPCHAT_USER_AGENT = null;
        public SNAPCHAT_VERSION = '9.18.2.0';

        public CASPER_USER_AGENT = 'Casper/1.5.2.3 (SwiftSnapper; Windows 10; gzip)';
        public CASPER_ENDPOINT = 'https://api.casper.io';
        public CASPER_HASH_PATTERN = '0100011111110000101111101001101011110010100110011101110010101000';
        public CASPER_API_KEY = '740c1d60b292fc8a44cdc9a3301e124a';
        public CASPER_API_TOKEN = '9UpsYwhthWspIoHonKjniOMu09UBkS9w';
        public CASPER_API_SECRET = 'fuckinginsecuresecretkey'; //API secret taken from io.casper.android.n.a.a
        public CASPER_SIGNATURE = 'v1:3d603604ff4a56d8a6821e9edfd8bb1257af436faf88c1a9bbb9dcefe8a56849';
        public CASPER_VERSION = '1.5.2.3';
        public CASPER_DEVICE_ID = null;

        private CURRENT_USER_REFERENCE: Snapchat.User;

        public Initialize(cur) {
            this.CURRENT_USER_REFERENCE = cur;

            return new Promise((resolve) => {
                this.InitializeCasper().then(function () {
                    resolve(this);
                });
            });
        }

        /*
            Generates a UNIX timestamp
        */
        public GenerateTimeStamp() {
            return Math.round((new Date).getTime());
        }

        /*
            Generates req_token
            based on https://github.com/cuonic/SnapchatDevWiki/wiki/Generating-the-req_token
        */
        public GenerateRequestToken(token, timestamp) {
            let hash1: string = sha256.hex(this.SNAPCHAT_API_SECRET + token);
            let hash2: string = sha256.hex(timestamp.toString() + this.SNAPCHAT_API_SECRET);

            let res = '';
            for (var n = 0; n < this.SNAPCHAT_HASH_PATTERN.length; n++) {
                if (parseInt(this.SNAPCHAT_HASH_PATTERN.substr(n, 1))) {
                    res += hash2[n];
                } else {
                    res += hash1[n];
                }
            }
            return res;
        }

        /*
	        Post request to Snapchat's API
        */
        public PostSnapchat(URI, parameters, headers?): Promise<string> {
            if (headers == null) {
                headers = {};
            }

            if (URI == null || parameters == null)
                return null;
            URI = new Windows.Foundation.Uri(this.SNAPCHAT_BASE_ENDPOINT + URI);

            let REQ = Windows.Web['Http'].HttpStringContent(this.ArrayToURIParameters(parameters, false), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'),
                HTTP = new Windows.Web['Http'].HttpClient(),
                HEAD = HTTP.defaultRequestHeaders;

            HEAD = Snapchat.Http.ConfigureHeaders(HEAD, headers);

            return new Promise((resolve) => {
                let promise = HTTP.postAsync(URI, REQ).done(function (res) {
                    res.content.readAsStringAsync().done(function (e) {
                        resolve(e)
                    });
                });
            });
        }

        /*
            Casper Related functions.
            TODO: move to snapchat.casper.agent.ts
            ==================================================
        */

        /*
	        Initialize Casper for use
        */
        private InitializeCasper() {
            this.CASPER_DEVICE_ID = this.GenerateCasperDeviceId();
            var timestamp = this.GenerateTimeStamp();

            var self = this;
            return new Promise((resolve) => {
                let headers = {
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': this.CASPER_USER_AGENT,
                };

                this.PostCasper('/config', [
                    ['casper_version', this.CASPER_VERSION],
                    ['device_id', this.CASPER_DEVICE_ID],
                    ['timestamp', timestamp.toString()],
                    ['token', this.CASPER_API_TOKEN],
                    ['token_hash', this.GenerateCasperTokenHash(timestamp)]
                ], headers).then(function (conf) {
                    let config = JSON.parse(conf);

                    if (config.code !== 200)
                        console.log('Failed to fetch Casper config!'); //TODO: Show error dialog through custom message class

                    var sc_ver = self.SNAPCHAT_VERSION;
                    self.SNAPCHAT_VERSION = config.configuration.snapchat.login.snapchat_version;

                    resolve(this);
                });
            });
        }

        /*
	        Post request to Casper.io's API
        */
        public PostCasper(URI, parameters, headers?): Promise<string> {
            if (headers == null) {
                headers = {};
            }

            if (URI == null || parameters == null)
                return null;
            URI = new Windows.Foundation.Uri(this.CASPER_ENDPOINT + URI);

            let REQ = Windows.Web['Http'].HttpStringContent(this.ArrayToURIParameters(parameters, true), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'),
                HTTP = new Windows.Web['Http'].HttpClient(),
                HEAD = HTTP.defaultRequestHeaders;

            HEAD = Snapchat.Http.ConfigureHeaders(HEAD, headers);
            HEAD.append('X-Casper-API-Key', this.CASPER_API_KEY);
            HEAD.append('X-Casper-Signature', this.GenerateCasperRequestSignature(parameters));

            return new Promise((resolve) => {
                let promise = HTTP.postAsync(URI, REQ).done(function (res) {
                    res.content.readAsStringAsync().done(function (e) {
                        resolve(e)
                    });
                });
            });
        }

        /*
	        Generates Token hash to be used with Casper's API
        */
        public GenerateCasperTokenHash(timestamp) {
            let s1: string = sha256.hex(this.CASPER_DEVICE_ID + this.CASPER_API_TOKEN),
                s2: string = sha256.hex(this.CASPER_API_TOKEN + timestamp.toString());

            let res = '';
            for (var n = 0; n < this.CASPER_HASH_PATTERN.length; n++) {
                if (this.CASPER_HASH_PATTERN.charAt(n) === '0') {
                    res += s1[n];
                } else {
                    res += s2[n];
                }
            }
            return res;
        }

        /*
	        Generates Signature to be used with Casper's API
	        P.S Casper expects the parameters to be in alphabetical order.
        */
        private GenerateCasperRequestSignature(parameters) {
            let req = '';
            parameters = parameters.sort(function (a, b) {
                return a[0].localeCompare(b[0]);
            })
            for (var n = 0; n < parameters.length; n++) {
                req += parameters[n][0] + parameters[n][1];
            }

            return 'v1:' + sha256.hex_hmac(this.CASPER_API_SECRET, req);
        }

        //TODO: Investigate how Android's device id is generated
        private GenerateCasperDeviceId() {
            var id = '';
            var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i <= 16; i++)
                id += charset.charAt(Math.floor(Math.random() * charset.length));
            return id;
        }

        public GetSnapchatAuthFromCasper(endpoint, timestamp) {
            let URI = new Windows.Foundation.Uri('http://heroku.casper.io/snapchat/ios/endpointauth'),
                parameters = [
                    ['auth_token', this.SNAPCHAT_AUTH_TOKEN],
                    ['casper_version', this.CASPER_VERSION],
                    ['endpoint', endpoint],
                    ['snapchat_version', this.SNAPCHAT_VERSION],
                    ['timestamp', timestamp],
                    ['username', this.CURRENT_USER_REFERENCE.username],
                    ['password', this.CURRENT_USER_REFERENCE.password]
                ],
                headers = {
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': this.CASPER_USER_AGENT,
                };

            let REQ = Windows.Web['Http'].HttpStringContent(this.ArrayToURIParameters(parameters, true), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'),
                HTTP = new Windows.Web['Http'].HttpClient(),
                HEAD = HTTP.defaultRequestHeaders;

            HEAD = Snapchat.Http.ConfigureHeaders(HEAD, headers);
            HEAD.append('X-Casper-API-Key', this.CASPER_API_KEY);
            HEAD.append('X-Casper-Signature', this.GenerateCasperRequestSignature(parameters));

            return new Promise((resolve) => {
                let promise = HTTP.postAsync(URI, REQ).done(function (res) {
                    res.content.readAsStringAsync().done(function (e) {
                        resolve(e)
                    });
                });
            });
        }

        /*
	        Converts an Array of Arrys to uri parameters
	        Ex. input [['para1', 'val1'], ['para2', 'val2'], ['para3', 'val3']].
        */
        public ArrayToURIParameters(data: Array<Array<string>>, shouldSort) {
            if (shouldSort) {
                data = data.sort(function (a, b) {
                    return a[0] > b[0] ? 1 : -1;
                })
            }

            var res = '';
            for (var n = 0; n < data.length; n++) {
                if (res != '') {
                    res += '&';
                }
                res += data[n][0] + '=' + data[n][1];
            }
            return res;
        }
    }

    export module Http {
        export function ConfigureHeaders(HEAD, headers) {

            //TODO: Custom headers?
            if (typeof headers['Accept-Encoding'] !== 'undefined') {
                HEAD.acceptEncoding.clear();
                HEAD.acceptEncoding.parseAdd(headers['Accept-Encoding']);
            }

            if (typeof headers.Accept !== 'undefined')
                HEAD.accept.parseAdd(headers.Accept);

            if (typeof headers['Accept-Language'] !== 'undefined')
                HEAD.acceptLanguage.parseAdd(headers['Accept-Language']);

            if (typeof headers['Accept-Locale'] !== 'undefined')
                HEAD.append('Accept-Locale', headers['Accept-Locale']);

            if (typeof headers.Connection !== 'undefined')
                HEAD.connection.parseAdd(headers.Connection);

            if (typeof headers['Cache-Control'] !== 'undefined')
                HEAD.cacheControl.parseAdd(headers.CacheControl);

            if (typeof headers['User-Agent'] !== 'undefined')
                HEAD.userAgent.parseAdd(headers['User-Agent']);

            if (typeof headers['X-Snapchat-Client-Token'] !== 'undefined')
                HEAD.append('X-Snapchat-Client-Token', headers['X-Snapchat-Client-Token']);

            if (typeof headers['X-Snapchat-Client-Auth-Token'] !== 'undefined')
                HEAD.append('X-Snapchat-Client-Auth-Token', headers['X-Snapchat-Client-Auth-Token']);

            if (typeof headers['X-Snapchat-UUID'] !== 'undefined')
                HEAD.append('X-Snapchat-UUID', headers['X-Snapchat-UUID']);

            if (typeof headers['X-Timestamp'] !== 'undefined')
                HEAD.append('X-Timestamp', headers['X-Timestamp']);

            return HEAD;
        }
    }
}