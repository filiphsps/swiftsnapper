declare var sha256: any;

class SnapchatAgent {
    private USER_AGENT = 'Snapchat/9.21.0.1 (iPhone8,1; iOS 9.0.2; gzip)';
    private BASE_ENDPOINT = 'https://app.snapchat.com';
    private EVENTS_ENDPOINT = 'https://sc-analytics.appspot.com/post_events';
    private ANALYTICS_ENDPOINT = 'https://sc-analytics.appspot.com/analytics/b';
    private HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
    private APP_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
    private APP_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
    private BLOB_ENCRYPTION_KEY = 'M02cnQ51Ji97vwT4';

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
        let hash1: string = sha256(this.APP_SECRET + token);
        let hash2: string = sha256(timestamp.toString() + this.APP_SECRET);

        let res = '';
        for (var n = 0; n < this.HASH_PATTERN.length; n++) {
            if (parseInt(this.HASH_PATTERN.substr(n, 1))) {
                res += hash2[n];
            } else {
                res += hash1[n];
            }
        }
        return res;
    }

    /*
        TODO: Get this mess to work
        Currently returns 401 UNAUTHORIZED
    */
    public GetDeviceToken() {
        const TS = this.GenerateTimeStamp();

        let http = new XMLHttpRequest(),
            URI = this.BASE_ENDPOINT + '/loq/device_id';

        http.open('POST', URI, false);
        
        http.setRequestHeader('User-Agent', this.USER_AGENT);
        http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        http.setRequestHeader('Accept-Language', 'en');
        http.setRequestHeader('Accept-Locale', 'en_US');
        http.setRequestHeader('Accept-Encoding', 'gzip');
        http.setRequestHeader('X-Snapchat-Client-Auth-Token', 'Bearer ');
        http.setRequestHeader('X-Snapchat-Client-Auth', '');
        http.setRequestHeader('Authorization', 'Bearer ');

        http.send({
            'timestamp': TS,
            'req_token': this.GenerateRequestToken(this.APP_STATIC_TOKEN, TS)
        });

        return http.responseText;
    }
}