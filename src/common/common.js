require("dotenv").config();
const openpgp = require("openpgp");

const uc_passphrase = process.env.UC_PGP_PASSPHRASE
  ? process.env.UC_PGP_PASSPHRASE
  : "changeit";
const email = process.env.UC_PGP_EMAIL
  ? process.env.UC_PGP_EMAIL
  : "person@organize.com";
const userid = process.env.UC_PGP_USERID ? process.env.UC_PGP_USERID : "person";

function common() {}

common.prototype = {
  generate: async () => {
    const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
      userIds: [{ name: userid, email: email }],
      curve: "ed25519",
      passphrase: uc_passphrase,
    });
    return { privateaKey: privateKeyArmored, publicKey: publicKeyArmored };
  },

  encrypt: async (publicKeyArmored, fileBuffer) => {
    const publickey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const data = await openpgp.createMessage({ text: fileBuffer.toString() });
    const encrypted = await openpgp.encrypt({
      message: data,
      encryptionKeys: publickey,
      config: { rejectPublicKeyAlgorithms: new Set([]) }, // Ignore weak algorithm
    });
    return encrypted;
  },

  decrypt: async (privateKeyArmored, fileBuffer, passPhrase = undefined) => {
    let privatekey = "";
    if (passPhrase) {
      privatekey = await openpgp.readPrivateKey({
        armoredKey: privateKeyArmored,
      });
    } else {
      privatekey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({
          armoredKey: privateKeyArmored,
        }),
        passphrase: passPhrase,
      });
    }

    const decrypted = await openpgp.decrypt({
      message: await openpgp.readMessage({ armoredMessage: fileBuffer }),
      decryptionKeys: privatekey,
      config: { rejectPublicKeyAlgorithms: new Set([]) }, // Ignore weak algorithm
    });

    return decrypted.data;
  },
  convertFixformatToJSON: async (pattern, data) => {
    const validatenumber = /^\d+$/;
    return await data.map((element) => {
      let tmptemplate = { ...pattern };
      for (const [key, value] of Object.entries(pattern)) {
        let start = value.split(",")[0];
        let end = value.split(",")[1];
        if (validatenumber.test(start) && validatenumber.test(end)) {
          tmptemplate[key] = element.substring(parseInt(start), parseInt(end));
        }
      }
      return tmptemplate;
    });
  },
  convertDelimiterToJSON: async (pattern, delimiter, data) => {
    let result = await data.map(async (element) => {
      const arr = element.split(delimiter);
      let index = 0;
      let _pattern = {};
      Object.assign(_pattern, pattern);
      for (const [key, value] of Object.entries(_pattern)) {
        _pattern[key] = arr[index];
        index++;
      }
      return _pattern;
    });
    return result;
  },
  convertJSONtofixlength: async (data) => {
    return await data
      .map((element) => {
        if (element) {
          let record = Object.values(element).join("");
          return record;
        }
      })
      .filter((e) => e);
  },
};

module.exports = common;
