declare var Hashes: any;
var sha256 = new Hashes.SHA256

namespace Snapchat {
    export class SnapchatAgent{
        public SNAPCHAT_IOS_USER_AGENT = 'Snapchat/{sc_ver} (iPhone5,1; iOS 8.4; gzip)'
        public SNAPCHAT_ANDROID_USER_AGENT = 'Snapchat/{sc_ver} (SM-G900F; Android 6.0.1#a5175b00e7#23; gzip)'
        public SNAPCHAT_BASE_ENDPOINT = 'https://app.snapchat.com';
        public SNAPCHAT_EVENTS_ENDPOINT = 'https://sc-analytics.appspot.com/post_events';
        public SNAPCHAT_ANALYTICS_ENDPOINT = 'https://sc-analytics.appspot.com/analytics/b';
        public SNAPCHAT_HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
        public SNAPCHAT_API_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
        public SNAPCHAT_API_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
        public SNAPCHAT_VERSION = 'WILLCHANGE';

        public CASPER_USER_AGENT = 'Casper/1.5.2.3 (SM-G900F; Android 6.0.1#a5175b00e7#23; gzip; SwiftSnapper)';
        public CASPER_ENDPOINT = 'https://api.casper.io';
        public CASPER_API_KEY = '740c1d60b292fc8a44cdc9a3301e124a';
        public CASPER_API_TOKEN = '9UpsYwhthWspIoHonKjniOMu09UBkS9w';
        public CASPER_API_SECRET = 'fuckinginsecuresecretkey'; //API secret taken from io.casper.android.n.a.a
        public CASPER_SIGNATURE = 'v1:3d603604ff4a56d8a6821e9edfd8bb1257af436faf88c1a9bbb9dcefe8a56849';
        public CASPER_VERSION = '1.5.2.3';
        public CASPER_DEVICE_ID = null;

        public Initialize() {
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
                let configCallback = function (config) {
                    if (config.code !== 200)
                        console.log('Failed to fetch Casper config!'); //TODO: Show error dialog through custom message class

                    var sc_ver = self.SNAPCHAT_VERSION;
                    self.SNAPCHAT_VERSION = config.configuration.snapchat.login.snapchat_version;
                    self.SNAPCHAT_IOS_USER_AGENT = self.SNAPCHAT_IOS_USER_AGENT.replace('{sc_ver}', self.SNAPCHAT_VERSION);
                    self.SNAPCHAT_ANDROID_USER_AGENT = self.SNAPCHAT_IOS_USER_AGENT.replace('{sc_ver}', self.SNAPCHAT_VERSION);

                    resolve(this);
                };

                this.PostCasper(configCallback, '/config', [
                    ['casper_version', this.CASPER_VERSION],
                    ['device_id', this.CASPER_DEVICE_ID],
                    ['snapchat_version', this.SNAPCHAT_VERSION],
                    ['timestamp', timestamp.toString()],
                    ['token', this.CASPER_API_TOKEN],
                    ['token_hash', this.GenerateCasperTokenHash()]
                ],
                    {
                        'Connection': 'Keep-Alive',
                        'AcceptEncoding': 'gzip'
                    });
            });
        }

        /*
	        Post request to Casper.io's API
        */
        public PostCasper(callback, URI, parameters, headers?) {
            if (headers == null) {
                headers = {};
            }

            if (URI == null || parameters == null)
                return -1;
            URI = new Windows.Foundation.Uri(this.CASPER_ENDPOINT + URI);

            let REQ = Windows.Web['Http'].HttpStringContent(this.ArrayToURIParameters(parameters), Windows.Storage.Streams.UnicodeEncoding.utf8, 'application/x-www-form-urlencoded'),
                HTTP = new Windows.Web['Http'].HttpClient(),
                HEAD = HTTP.defaultRequestHeaders;
	
            //TODO: Custom headers?
            if (typeof headers.AcceptEncoding !== 'undefined') {
                HEAD.acceptEncoding.clear();
                HEAD.acceptEncoding.parseAdd(headers.AcceptEncoding);
            }
            if (typeof headers.Connection !== 'undefined')
                HEAD.connection.parseAdd(headers.Connection);
            if (typeof headers.CacheControl !== 'undefined')
                HEAD.cacheControl.parseAdd(headers.CacheControl);
            else
                HEAD.cacheControl.clear();

            HEAD.userAgent.parseAdd(this.CASPER_USER_AGENT);
            HEAD.append('X-Casper-API-Key', this.CASPER_API_KEY);
            HEAD.append('X-Casper-Signature', this.GenerateCasperRequestSignature(parameters));

            let promise = HTTP.postAsync(URI, REQ).done(function (res) {
                res.content.readAsStringAsync().done(function (e) {
                    callback(JSON.parse(e));
                });
            });
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

        /*
	        Generates Token hash to be used with Casper's API
        */
        private GenerateCasperTokenHash() {
            //TODO
            return 'todo';
        }

        //TODO: Investigate how Android's device id is generated
        private GenerateCasperDeviceId() {
            var id = '';
            var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i <= 16; i++)
                id += charset.charAt(Math.floor(Math.random() * charset.length));
            return id;
        }

        /*
	        Converts an Array of Arrys to uri parameters
	        Ex. input [['para1', 'val1'], ['para2', 'val2'], ['para3', 'val3']].
        */
        public ArrayToURIParameters(data: Array<Array<string>>) {
            data = data.sort(function (a, b) {
                return a[0] > b[0] ? 1 : -1;
            })

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
}