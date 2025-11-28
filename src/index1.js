const fs = require("fs");
const path = require("path");
const moment = require("moment");
const UTILITY = require("./common/utility");
const luhn = require("./common/luhn");
const util = new UTILITY();
const INPUTPATH = "./data/";
const OUTPUTPATH = "./output/";
const FILESEQUENCE = "003";
//seqno of that date 
const OUTPUTFILENAME = `${FILESEQUENCE}Incoming${moment().format(
  "YYYYMMDD_HHmmss"
)}`;
const INPUTFILENAME = "test-input"; //name should be the same as ./data/
const FILEEXTENSION = ".txt";
const NEWLINE = "\n";
const CIB = "701505";
const ACQBIN = "476135";
const ACQBUID = util.padding(ACQBIN, "0", 8, true);
const BATCHNO = util.padding("1", "0", 6, true);
const processingDate = `${moment().format("YY")}${moment().dayOfYear()}`;
const contentinputfile = fs
  .readFileSync(path.join(INPUTPATH, `${INPUTFILENAME}${FILEEXTENSION}`))
  .toString();

const country = JSON.parse(fs.readFileSync("./countryMap.json").toString());

const jsonObject = contentinputfile.split(NEWLINE).map((element) => {
  const jsonRecord = element.split(",");
  return {
    accountNumber: jsonRecord[0],
    mcc: jsonRecord[1],
    destinationAmount: jsonRecord[2],
    destinationCurrency: jsonRecord[3],
    sourceAmount: jsonRecord[4],
    sourceCurrency: jsonRecord[5],
    merchantName: jsonRecord[6],
    approveCode: jsonRecord[7],
    transactionDate: jsonRecord[8],
    MerchantCountry: jsonRecord[9],
    transactionCode: jsonRecord[10],
    merchantCode: jsonRecord[11],
    posEntryMode: jsonRecord[12],
  };
});
const ArrayBufferFile = [];

const calculateARN = (tccode) => {
  let ARN = tccode === "07" ? "7" : "2";
  let julianDate = processingDate.substring(1);
  let ifilm = util.randomid(11);
  ARN += ACQBIN;
  ARN += julianDate;
  ARN += ifilm;
  return luhn.generate(ARN, { pad: 23 });
};

const mainprocess = () => {
  let counterrecord = 0;

  const tc90Record = `90${CIB}${processingDate}      2211200400TEST 0000      000000000000000000CRDX2022      ${FILESEQUENCE}                                                                                         `;
  counterrecord++;

  ArrayBufferFile.push(tc90Record);
  let summarySourceAmount = 0;
  let summaryDestinationAmount = 0;
  let counterline = 1;
  let countertransaction = 0;
  jsonObject.forEach((element) => {
    const tccode = element.transactionCode ? element.transactionCode : "05";
    const merchantName =
      element.merchantName.length > 25
        ? element.merchantName.substring(0, 25)
        : util.padding(element.merchantName, " ", 25, false);
    const mcc = element.mcc || "5999";
    let countryCode =
      country.find((e) => e.code === element.MerchantCountry)?.code || "TH";
    countryCode = util.padding(countryCode, " ", 3, false);
    const merchantid = element.merchantCode
      ? util.padding(element.merchantCode, "0", 15, true)
      : util.padding("1", "0", 15, true);
    const posEntryMode = element.posEntryMode ? element.posEntryMode : "01";
    const approveCode = element.approveCode
      ? element.approveCode
      : util.randomid(6, false);
    let purchaseDate = element.transactionDate;
    let transactionDate = element.transactionDate
      ? `${moment().format("YY").substring(1)}${moment(
        `2022${element.transactionDate}`,
        "YYYYMMDD"
      ).format("DDDD")}`
      : processingDate.substring(1);
    const srcCCY = element.sourceCurrency ? element.sourceCurrency : "764";
    const srcAmount = util.padding(
      parseFloat(element.sourceAmount).toFixed(2).replace(".", ""),
      "0",
      12,
      true
    );
    summarySourceAmount =
      parseFloat(summarySourceAmount) +
      parseFloat(
        (Math.round(parseFloat(element.sourceAmount) * 100) / 100).toFixed(2)
      );
    summaryDestinationAmount =
      parseFloat(summaryDestinationAmount) +
      parseFloat(
        (Math.round(parseFloat(element.destinationAmount) * 100) / 100).toFixed(
          2
        )
      );
    const destCCY = element.destinationCurrency
      ? element.destinationCurrency
      : "764";
    const desAmount = util.padding(
      parseFloat(element.destinationAmount).toFixed(2).replace(".", ""),
      "0",
      12,
      true
    );
    let city =
      country.find((e) => e.code === element.MerchantCountry)?.city || "Bangkok";
    city = util.padding(city, " ", 13, false);
    const visaARN = calculateARN(tccode);
    countertransaction++;
    const record00 = `${tccode}00${element.accountNumber}000Z  ${visaARN}${ACQBUID}${purchaseDate}${desAmount}${destCCY}${srcAmount}${srcCCY}${merchantName}${city}${countryCode}${mcc}10200     1000N${approveCode}0 4 ${posEntryMode}${transactionDate}0`;
    const record01 = `${tccode}01   A0241    000000 VCMS AP 20221025 1626                                  SY${merchantid}TERMID01000000000000  2080 0  0 V 0                           000000000`;
    const record05 = `${tccode}05302080240210819000000000000             0000 000000000000                    0000530000000000000695036C0673948007299204000000000000N             0000000000000000  M`;
    counterline++;
    ArrayBufferFile.push(record00);
    counterline++;
    ArrayBufferFile.push(record01);
    counterline++;
    ArrayBufferFile.push(record05);
    counterrecord++;
  });
  let recordCounter = util.padding(counterline.toString(), "0", 6, true);
  // console.log(recordCounter);
  // console.log(summarySourceAmount, summaryDestinationAmount);
  let finalSourceAmount = util.padding(
    summarySourceAmount.toFixed(2).replace(".", ""),
    "0",
    15,
    true
  );
  let finalDestinationAmount = util.padding(
    summaryDestinationAmount.toFixed(2).replace(".", ""),
    "0",
    15,
    true
  );
  // console.log(finalSourceAmount, finalDestinationAmount);
  let nooftcr91 = util.padding(counterline.toString(), "0", 12, true);
  counterline++;

  let finalcountermonetarytxn = util.padding(
    countertransaction.toString(),
    "0",
    12,
    true
  );

  let counter91 = util.padding(counterrecord.toString(), "0", 9, true);

  const tc91Record = `9100${CIB}${processingDate}${finalDestinationAmount}${finalcountermonetarytxn}${BATCHNO}${nooftcr91}000000        ${counter91}000000000000000000${finalSourceAmount}000000000000000000000000000000000000000000000`;
  ArrayBufferFile.push(tc91Record);
  counterrecord++;
  let nooftcr92 = util.padding(counterline.toString(), "0", 12, true);
  // recordCounter = util.padding(counterline.toString(), "0", 12, true);
  // console.log(recordCounter);
  let counter92 = util.padding(counterrecord.toString(), "0", 9, true);
  // console.log(counter92);
  const tc92Record = `9200${CIB}${processingDate}${finalDestinationAmount}${finalcountermonetarytxn}${BATCHNO}${nooftcr92}000000        ${counter92}000000000000000000${finalSourceAmount}000000000000000000000000000000000000000000000`;
  ArrayBufferFile.push(tc92Record);
  //   console.log(ArrayBufferFile.join(NEWLINE));
  const contentFileOutput = ArrayBufferFile.join(NEWLINE);
  //   console.log(contentFileOutput);
  fs.writeFileSync(
    path.join(OUTPUTPATH, `${OUTPUTFILENAME}${FILEEXTENSION}`),
    contentFileOutput
  );
};

mainprocess();
