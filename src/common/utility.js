require('dotenv').config();
const crypto = require("crypto");
const algorithm = "des-ecb";
function utility() {}

const _padding = (input, character, length, isleft = true) => {
  if (input === undefined){
    input = "";
  }
  if (typeof input !== "string") {
    throw "invalid input data";
  }
  if (input.length > length) {
    return input;
  }
  let strReturn = input;
  for (let index = 0; index < length - input.length; index++) {
    if (isleft) {
      strReturn = character + strReturn;
    } else {
      strReturn = strReturn + character;
    }
  }
  return strReturn;
};
// Convert a hex string to a byte array
const _hexToBytes = (hexstring) => {
  return Buffer.from(hexstring, "hex");
};

// Convert a byte array to a hex string
const _bytestohex = (byteArray) => {
  return Buffer.from(byteArray, "utf-8").toString("hex");
};

const _encrypt = (plaintext, key) => {
  let cipher = crypto.createCipheriv(algorithm, key, null);
  let encrypted = cipher.update(plaintext);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return _bytestohex(encrypted);
};

const _decrypt = (ciphertext, key) => {
  let decipher = crypto.createDecipheriv(algorithm, key, null);
  let decrypted = decipher.update(ciphertext, "hex", "utf-8");
  decrypted += decipher.final("utf8");
  return _bytestohex(decrypted);
};

const _3DESencrypt = (plaintext, key) => {
  const algo = "des-ede3";
  const extendkey = key + key.slice(0, 16);
  //   console.log("extend key", extendkey);
  let byteskey = _hexToBytes(key);
  let cipher = crypto.createCipheriv(algo, byteskey, null);
  let encrypted = cipher.update(plaintext);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return _bytestohex(encrypted);
};

const _3DESdecrypt = (plaintext, key) => {
  const algo = "des-ede3";
  let decipher = crypto.createDecipheriv(algo, key, "");
  let decrypted = decipher.update(ciphertext, "hex", "utf-8");
  decrypted += decipher.final("utf8");
  return _bytestohex(decrypted);
};
utility.prototype = {
  padding: (input, character, length, isleft = true) => {
    return _padding(input, character, length, isleft);
  },
  keycheckvalue: (key) => {
    let zeroespadding = _padding("", "0", 16);
    let byteszeroes = _hexToBytes(zeroespadding);
    switch (key.length / 16) {
      case 1:
        // single length
        let bytekey = _hexToBytes(key);
        return _encrypt(byteszeroes, bytekey).toUpperCase().slice(0, 16);
      case 2:
        // double length
        console.log("keyA:", key.slice(0, 16));
        console.log("keyB:", key.slice(16, 32));
        let bytekeyA = _hexToBytes(key.slice(0, 16));
        let bytekeyB = _hexToBytes(key.slice(16, 32));
        let tmpdouble = _encrypt(byteszeroes, bytekeyA);
        console.log("tmpdouble1", tmpdouble);
        tmpdouble = _decrypt(tmpdouble.slice(0, 16), bytekeyB);
        console.log("tmpdouble2", tmpdouble);
        return _encrypt(tmpdouble, bytekeyA);
      case 3:
        // triple length
        let bytekey1 = _hexToBytes(key.slice(0, 16));
        let bytekey2 = _hexToBytes(key.slice(16, 32));
        let bytekey3 = _hexToBytes(key.slice(32, 48));
        let tmptriple = _encrypt(byteszeroes, bytekey1);
        tmptriple = _decrypt(tmptriple, bytekey2);
        return _encrypt(tmptriple, bytekey3);
      default:
        return "do not support key length";
    }
  },
  hextobytes: (data) => {
    return _hexToBytes(data);
  },
  bytestohex: (databytes) => {
    return _bytestohex(databytes);
  },
  encrypt: (plaintext, key) => {
    return _encrypt(plaintext, key);
  },
  decrypt: (ciphertext, key) => {
    return _decrypt(ciphertext, key);
  },
  des3encrypt: (plaintext, key) => {
    return _3DESencrypt(plaintext, key);
  },
  des3decrypt: (ciphertext, key) => {
    return _3DESdecrypt(ciphertext, key);
  },
  randomid: (length, isChar = false) => {
    let result = "";
    let characters = "0123456789";
    if (isChar) {
      characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" + characters;
    }
    let charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },
};

module.exports = utility;
