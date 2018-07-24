
const alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const base = alphabet.length;

const base58 = {
    encode: (num) => {
        if(typeof num !=='number' || num !== parseInt(num))
            throw new Error('"encode" only accepts integers.');
        let enc = num;
        let encoded = '';
        while(enc) {
            const remainder = enc % base;
            enc = Math.floor(enc / base);
            encoded = alphabet[remainder].toString() + encoded;        
        }
        return encoded;
    },
    decode: (str) => {
        if(typeof str !== 'string')
            throw new Error('"decode" only accepts strings.');
        let decoded = 0;
        let dec = str;
        while(dec) {
            const alphabetPosition = alphabet.indexOf(dec[0]);
            if (alphabetPosition < 0)
                throw new Error('"decode" can\'t find "' + dec[0] + '" in the alphabet: "' + alphabet + '"');
            const powerOf = dec.length - 1;
            decoded += alphabetPosition * (Math.pow(base, powerOf));
            dec = dec.substring(1);
        }
        return decoded;
    },
    check: (str) => {
        try {
            base58.decode(str);
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = base58;