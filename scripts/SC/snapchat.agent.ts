class SnapchatAgent {
    private API_STATIC_TOKEN = 'm198sOkJEn37DjqZ32lpRu76xmw288xSQ9';
    private API_SECRET = 'iEk21fuwZApXlz93750dmW22pw389dPwOk';
    private USER_AGENT = 'Snapchat/9.16.2.0 (HTC One; Android 5.0.2#482424.2#21; gzip)';
    private ENDPOINT = 'https://feelinsonice-hrd.appspot.com';
    private HASH_PATTERN = '0001110111101110001111010101111011010001001110011000110001000110';
    private BLOB_ENCRYPTION_KEY = 'M02cnQ51Ji97vwT4';

    public GenerateTimeStamp() {
        return Math.round((new Date).getTime());
    }

    public DecryptCBC(data, key, iv) {

    }
    public DecryptECB(data) {

    }
    public EncryptECB(data) {

    }
    public Hash(d1, d2) {
        d1 = this.API_SECRET + d1;
        d2 = d2 + this.API_SECRET;
        
        //TODO: Find a good PHP-like Cryptography library.

        /*var hash = new sha256();
        hash.update(hash, d1);
        var value1 = sha256.final();

        hash = new sha256();
        hash.update(hash, d2);
        var value2: string = hash.final();

        var res = '';
        for (var n = 0; n < this.HASH_PATTERN.length; n++) {
            res += this.HASH_PATTERN.substr(n, 1) ? value1.charAt(n) : value2.charAt(n);
        }
        return res*/
    }
}