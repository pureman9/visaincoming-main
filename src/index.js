const fs = require("fs");
const path = require("path");
const moment = require("moment");
const UTILITY = require("./common/utility");
const luhn = require("./common/luhn");
const util = new UTILITY();

// Config Paths
const INPUTPATH = "./data/";
const OUTPUTPATH = "./output/";
const NEWLINE = "\n";

// Config Constant
// const FILESEQUENCE = "001"; // ไม่ใช้ค่าคงที่แล้ว จะรับค่ามาจาก loop แทน
const CIB = "701505";
const ACQBIN = "476135";
const ACQBUID = util.padding(ACQBIN, "0", 8, true);
const BATCHNO = util.padding("1", "0", 6, true);
const processingDate = `${moment().format("YY")}${moment().dayOfYear()}`;

// Load config file once
const country = JSON.parse(fs.readFileSync("./countryMap.json").toString());

const calculateARN = (tccode) => {
    let ARN = tccode === "07" ? "7" : "2";
    let julianDate = processingDate.substring(1);
    let ifilm = util.randomid(11);
    ARN += ACQBIN;
    ARN += julianDate;
    ARN += ifilm;
    return luhn.generate(ARN, { pad: 23 });
};

// เพิ่ม parameter fileSequence เพื่อรับค่าลำดับไฟล์ (001, 002, ...)
const processSingleFile = (fileName, fileSequence) => {
    const fullInputPath = path.join(INPUTPATH, fileName);

    // Skip if it is directory
    if (fs.lstatSync(fullInputPath).isDirectory()) return false;

    // ใช้ try...catch ครอบ logic ทั้งหมดของไฟล์นี้ เพื่อดักจับ Error
    try {
        // 1. Read File Content
        const contentinputfile = fs.readFileSync(fullInputPath).toString();

        // 2. Prepare Data Object (Reset per file)
        const jsonObject = contentinputfile
            .split(NEWLINE)
            .filter((line) => line.trim() !== "")
            .map((element) => {
                const jsonRecord = element.split(",");
                // เช็คว่ามี data เพียงพอหรือไม่
                if (jsonRecord.length < 13) {
                    throw new Error(`Invalid record format in file. Line content: ${element}`);
                }
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
                    motoCode: jsonRecord[13], // อ่านค่า MOTOCode (index 13)
                };
            });

        const ArrayBufferFile = [];
        let counterrecord = 0;

        // --- Start Generation Logic ---
        // ใช้ fileSequence ที่ส่งเข้ามา แทนค่าคงที่
        const tc90Record = `90${CIB}${processingDate}      2211200400TEST 0000      000000000000000000CRDX2022      ${fileSequence}                                                                  `;
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

            // --- Logic สำหรับ MOTOCode ใน record01 (แก้ไขใหม่) ---
            // ถ้าไม่มีค่า -> "  " (Space 2 ตัว)
            // ถ้ามีค่า (เช่น "07") -> เอาตัวสุดท้าย "7" + Space 1 ตัว -> "7 "
            let motoString = "  ";
            if (element.motoCode && element.motoCode.trim() !== "") {
                const code = element.motoCode.trim();
                // slice(-1) คือการเอาตัวอักษรตัวสุดท้าย
                motoString = `${code.slice(-1)} `;
            }

            countertransaction++;
            const record00 = `${tccode}00${element.accountNumber}000Z  ${visaARN}${ACQBUID}${purchaseDate}${desAmount}${destCCY}${srcAmount}${srcCCY}${merchantName}${city}${countryCode}${mcc}10200     1000N${approveCode}0 4 ${posEntryMode}${transactionDate}0`;
            const record01 = `${tccode}01   A0241    000000 VCMS AP 20221025 1626                                SY${merchantid}TERMID01000000000000${motoString}2080 0  0 V 0                             000000000`;
            const record05 = `${tccode}05302080240210819000000000000             0000 000000000000                    0000530000000000000695036C0673948007299204000000000000N             0000000000000000  M`;

            counterline++;
            ArrayBufferFile.push(record00);
            counterline++;
            ArrayBufferFile.push(record01);
            counterline++;
            ArrayBufferFile.push(record05);
            counterrecord++;
        });

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
        let counter92 = util.padding(counterrecord.toString(), "0", 9, true);
        const tc92Record = `9200${CIB}${processingDate}${finalDestinationAmount}${finalcountermonetarytxn}${BATCHNO}${nooftcr92}000000        ${counter92}000000000000000000${finalSourceAmount}000000000000000000000000000000000000000000000`;
        ArrayBufferFile.push(tc92Record);

        const contentFileOutput = ArrayBufferFile.join(NEWLINE);
        const originalNameNoExt = path.parse(fileName).name;
        const outputFileName = `${originalNameNoExt}_OUTPUT_SETTLED.csv`;

        fs.writeFileSync(path.join(OUTPUTPATH, outputFileName), contentFileOutput);
        fs.unlinkSync(fullInputPath);

        console.log(`${fileName} is settle to path visaincoming-main\\src\\output`);
        return true; // สำเร็จ ส่งค่า true กลับไป

    } catch (err) {
        console.error(`${fileName} is error please check error in file with ..... ${err.message}`);
        return false; // ไม่สำเร็จ ส่งค่า false กลับไป
    }
};

const mainprocess = () => {
    try {
        const files = fs.readdirSync(INPUTPATH);

        if (files.length === 0) {
            console.log("No files found in input directory.");
            return;
        }

        let fileSequenceCounter = 1; // ตัวนับลำดับไฟล์ เริ่มต้นที่ 1

        files.forEach((file) => {
            if (file.toLowerCase().endsWith('.csv') || file.toLowerCase().endsWith('.txt')) {
                // จัดรูปแบบเลขให้เป็น 3 หลัก เช่น 001, 002
                const formattedSeq = util.padding(fileSequenceCounter.toString(), "0", 3, true);

                // ส่งลำดับเข้าไป process
                const isSuccess = processSingleFile(file, formattedSeq);

                // ถ้าทำสำเร็จ ให้บวกตัวนับเพิ่ม
                if (isSuccess) {
                    fileSequenceCounter++;
                }
            }
        });

    } catch (err) {
        console.error("Error reading input directory:", err);
    }
};

mainprocess();