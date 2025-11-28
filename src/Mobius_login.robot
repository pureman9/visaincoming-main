*** Settings ***
Library    SeleniumLibrary
Library    BuiltIn
Library    DebugLibrary
Library    Collections
Library    OperatingSystem
Library    String
Library    ../.venv/Lib/site-packages/robot/libraries/DateTime.py
Library    Process

*** Variables ***
${URL}                 https://kong-uat2-pci-clb.int-np.cardx.co.th/mobius
${USER_ID}             99362CDM22
${PASSWORD}            mobius
${SECONDARY_PW}        Ab1111
${BROWSER}             chrome
${WAIT_TIMEOUT}        30s
${CSV_FILE}            ${CURDIR}${/}..${/}py-input${/}SOD-SIM-TEST.csv


*** Keywords ***
Input secondary password
    [Documentation]    the 2nd password input box can be randomly disabled on some digits.
    ...                So we will check first which digit need to be filled in
    [Arguments]        ${2nd_password}

    Wait Until Element Is Visible    (//div[contains(@class, 'card-pin')]/div)
    ${elements}=     Get WebElements    (//div[contains(@class, 'card-pin')]/div)

    FOR    ${index}    ${element}    IN ENUMERATE    @{elements}
        ${class}=    Get Element Attribute    ${element}    class
        ${is_enabled}=    Run Keyword And Return Status    Should Not Contain    ${class}    disabled

        IF    ${is_enabled}
            ${xpath_index}=    Evaluate    ${index} + 1
            ${new_xpath}=      Catenate    SEPARATOR=    (//div[contains(@class, 'card-pin')]/div/input)[    ${xpath_index}    ]

            Wait Until Element Is Visible    ${new_xpath}
            Sleep    1s
            Input Text    ${new_xpath}    ${2nd_password}[${index}]
        END
    END

Read CSV Data As List
    [Documentation]    Read CSV file and return all rows as a list of dictionaries
    ${csv_content}=    Get File    ${CSV_FILE}
    ${lines}=    Split To Lines    ${csv_content}
    
    # Get header row and clean it (remove BOM if present)
    ${header}=    Get From List    ${lines}    0
    ${header_list}=    Split String    ${header}    ,
    
    # Process all data rows
    ${all_data}=    Create List
    ${line_count}=    Get Length    ${lines}
    
    FOR    ${i}    IN RANGE    1    ${line_count}
        ${line}=    Get From List    ${lines}    ${i}
        ${line_stripped}=    Strip String    ${line}
        
        # Skip empty lines
        Continue For Loop If    '${line_stripped}' == ''
        
        ${data_list}=    Split String    ${line}    ,
        
        # Create dictionary from header and data
        ${row_data}=    Create Dictionary
        ${index}=    Set Variable    0
        FOR    ${header_item}    IN    @{header_list}
            # Strip BOM and whitespace from header
            ${clean_header}=    Strip String    ${header_item}    characters=\ufeff
            ${data_value}=    Get From List    ${data_list}    ${index}
            Set To Dictionary    ${row_data}    ${clean_header}    ${data_value}
            ${index}=    Evaluate    ${index} + 1
        END
        
        Append To List    ${all_data}    ${row_data}
    END
    
    RETURN    ${all_data}

Read CSV Data Single Row
    [Documentation]    Read CSV file and return first data row as dictionary
    [Arguments]    ${row_index}=1
    ${csv_content}=    Get File    ${CSV_FILE}
    ${lines}=    Split To Lines    ${csv_content}
    ${header}=    Get From List    ${lines}    0
    ${data_line}=    Get From List    ${lines}    ${row_index}
    
    ${header_list}=    Split String    ${header}    ,
    ${data_list}=    Split String    ${data_line}    ,
    
    # Create dictionary from header and data
    ${csv_data}=    Create Dictionary
    ${index}=    Set Variable    0
    FOR    ${header_item}    IN    @{header_list}
        # Strip BOM and whitespace from header
        ${clean_header}=    Strip String    ${header_item}    characters=\ufeff
        ${data_value}=    Get From List    ${data_list}    ${index}
        Set To Dictionary    ${csv_data}    ${clean_header}    ${data_value}
        ${index}=    Evaluate    ${index} + 1
    END
    
    RETURN    ${csv_data}

Write Data To CSV
    [Arguments]    ${all_rows_data}
    
    # 1. กำหนด path และชื่อไฟล์ตามเวลา
    ${current_date}=    Get Current Date    result_format=%Y%m%d_%H%M%S
    ${output_dir}=      Set Variable    ${CURDIR}${/}..${/}src${/}data
    ${filename}=        Set Variable    VisaIncoming_${current_date}.csv
    ${full_path}=       Set Variable    ${output_dir}${/}${filename}
    
    # สร้าง Folder ถ้ายังไม่มี (กรณี folder src ยังไม่ถูกสร้าง)
    Create Directory    ${output_dir}
    
    # 2. กำหนด Column ที่ต้องการ (ตัด env ออก และเรียงตามลำดับที่ต้องการ)
    # --- แก้ไขตรงนี้: เพิ่ม MOTOCode ต่อท้าย POS Entry Mode ---
    @{headers}=    Create List    
    ...    F2_Primary_Account_Number    F18_Merchant    F6_Amount_Cardholder    
    ...    F51_CurrecyCode_Cardholder   F4_Amount_Transaction    F49_CurrecyCode_Transaction    
    ...    F43_1_Card_AcceptorName      Approval Code            F13_Date_Transmisson    
    ...    F43_3_CountryCode            TXN_CODE                 Terminal ID    
    ...    POS Entry Mode               MOTOCode
    
    # 3. สร้างไฟล์เปล่าๆ (ไม่ต้องเขียน Header บรรทัดแรกตาม requirement)
    Create File    ${full_path}    ${EMPTY}    encoding=UTF-8
    
    # 4. วน Loop ข้อมูลทั้งหมดเพื่อเขียนลงไฟล์
    FOR    ${row}    IN    @{all_rows_data}
        ${line_values}=    Create List
        
        # ดึงค่าจาก Dictionary ตามลำดับ
        FOR    ${col}    IN    @{headers}
            # ถ้าไม่มีข้อมูลใน column นั้น ให้ใส่ค่าว่าง
            ${val}=    Get From Dictionary    ${row}    ${col}    default=${EMPTY}
            Append To List    ${line_values}    ${val}
        END

        # 5. เพิ่มค่าว่าง 2 ตัว เพื่อให้ output ท้ายบรรทัดเป็น ,,
        Append To List    ${line_values}    ${EMPTY}
        Append To List    ${line_values}    ${EMPTY}
        
        # แปลง List เป็น String คั่นด้วย comma
        ${line_string}=    Evaluate    ",".join($line_values)
        
        # เขียนต่อท้ายไฟล์
        Append To File    ${full_path}    ${line_string}\n    encoding=UTF-8
    END
    
    Log To Console    Saved output to: ${full_path}

Run Node JS Script
    [Documentation]    Execute the Node.js script (index.js) to process the CSV data
    ${script_dir}=    Set Variable    ${CURDIR}
    ${result}=    Run Process    node    index.js    cwd=${script_dir}    shell=True
    Log To Console    \nNode.js Script Output:
    Log To Console    ${result.stdout}
    IF    '${result.stderr}' != ''
        Log To Console    Node.js Script Errors:
        Log To Console    ${result.stderr}
    END
    Should Be Equal As Integers    ${result.rc}    0    msg=Node.js script failed with return code ${result.rc}
    ${separator}=    Evaluate    '='*80
    Log To Console    \n${separator}
    Log To Console    All files in visaincoming-main\\src\\data was settled
    Log To Console    Please check files in "visaincoming-main\\src\\output" for move files in link:
    Log To Console    https://ap-southeast-1.console.aws.amazon.com/s3/buckets/cdx-uat2-pci-sftp?region=ap-southeast-1&prefix=crs/VISA/inbound/LGC_006_9/card/&showversions=false
    Log To Console    ${separator}


*** Test Cases ***
Visa Incoming Authorization Test
    Open Browser    about:blank    ${BROWSER}
    # Set Window Size    1920    4000
    Maximize Browser Window
    Go To    ${URL}

    # Step 2
    Wait Until Element Is Visible    id=submitButton    ${WAIT_TIMEOUT}
    Click Element    id=submitButton

    # Step 3
    Wait Until Element Is Visible    id=userID    ${WAIT_TIMEOUT}
    Input Text    id=userID    ${USER_ID}

    # Step 4
    Wait Until Element Is Visible    id=submitBtn    ${WAIT_TIMEOUT}
    Click Element    id=submitBtn

    # Step 5
    Sleep    5s
    Wait Until Element Is Visible    id=password    ${WAIT_TIMEOUT}
    Input Text    id=password    ${PASSWORD}

    # Step 6
    Wait Until Element Is Visible    id=submitBtn    ${WAIT_TIMEOUT}
    Click Element    id=submitBtn

    # Step 7
    Input secondary password    ${SECONDARY_PW}
    Sleep    2s
    # Step 8
    Wait Until Element Is Visible    id=authenticateBtn    ${WAIT_TIMEOUT}
    Click Element    id=authenticateBtn
  
    # Step 9
    Wait Until Element Is Visible    //label[text()="Welcome Back"]    ${WAIT_TIMEOUT}
    ${all_data}  Read CSV Data As List
    ${row}  Read CSV Data Single Row

    FOR    ${row}    IN    @{all_data}
    # Step 10 - click customer
        Wait Until Element Is Visible    //a[text()='Account']    ${WAIT_TIMEOUT}
        Click Element    //a[text()='Account'] 
        Wait Until Element Is Visible    //h4[span[contains(text(),'Account Overview & Maintenance')]]    ${WAIT_TIMEOUT}
        # Click Element  //span[contains(text(),'Customer 360')]/..
        Click Element  //h4[span[contains(text(),'Account Overview & Maintenance')]]
        Sleep    2s

        # Step 11 - click customer
        Wait Until Element Is Visible  //h3[contains(text(),'Account Overview & Maintenance')]

        # Step 12 - loop for input search masking pan

        ${processed_data}=    Create List
        ${account_num}=    Set Variable    ${row}[F2_Primary_Account_Number]
        Log To Console    Primary Account Number: ${row}[F2_Primary_Account_Number]
        
        # 1. รอให้ DOM โหลดมาครบก่อน
        Wait Until Element Is Visible    id=cardNo    timeout=10s
        
        # 2. บังคับ Scroll ให้ Element นี้มาอยู่กลางจอ
        Scroll Element Into View    id=cardNo
        
        # 3. คลิกกระตุ้น 1 ที (กันเหนียว กรณีช่องมันต้อง Focus ก่อน)
        Click Element    id=cardNo
        
        # 4. ค่อยใส่ข้อความ
        Input Text    id=cardNo    ${account_num}
        # เพิ่มบรรทัดนี้: คลิก serach button หน้า Account Overview & Maintenance
        Wait Until Element Is Visible    //*[@id="searchBtn"]    ${WAIT_TIMEOUT}
        Click Element    //*[@id="searchBtn"]
        

        Wait Until Element Is Visible    xpath=//*[@id="accountSearchTable"]/tbody/tr/td[4]    ${WAIT_TIMEOUT}
        Mouse Over    xpath=//*[@id="accountSearchTable"]/tbody/tr/td[4]
        Sleep    0.5s
        Click Element  //*[@id="accountSearchTable"]/tbody/tr/td[4]

        Wait Until Element Is Visible  //*[@id="cardAccountHeader"]/div[2]/div/div[2]/i    ${WAIT_TIMEOUT}
        Scroll Element Into View  //*[@id="cardAccountHeader"]/div[2]/div/div[2]/i
        Click Element  //*[@id="cardAccountHeader"]/div[2]/div/div[2]/i

        Wait Until Element Is Visible  //*[@id="cardAccountHeader"]/div[2]/div/div[3]/div/div/div/input    ${WAIT_TIMEOUT}
        Input Text    xpath=//*[@id="cardAccountHeader"]/div[2]/div/div[3]/div/div/div/input    Auth

        #click <li/ authorization>
        Wait Until Page Contains Element    //*[@id="cardAccountHeader"]/div[2]/div/div[3]/div/ul/li[1]/a     ${WAIT_TIMEOUT}
        Scroll Element Into View  //*[@id="cardAccountHeader"]/div[2]/div/div[3]/div/ul/li[1]/a
        Click Element    //*[@id="cardAccountHeader"]/div[2]/div/div[3]/div/ul/li[1]/a 

        # Wait Until Element Is Visible  //*[@id="obAuthorizationDetailTable"]/tbody/tr[1]/td[9]    ${WAIT_TIMEOUT}
        # ${Authorization_code}=    Get Text    xpath=//*[@id="obAuthorizationDetailTable"]/tbody/tr[1]/td[9]
        # Log To Console    Authorization Result: ${Authorization_code}
        # กำหนดตัวแปร XPath ให้สั้นลง (เพื่อให้ดูง่าย)
        Wait Until Page Contains Element    //*[@id="obAuthorizationDetailTable"]    ${WAIT_TIMEOUT}
        Wait Until Element Is Visible    //*[@id="obAuthorizationDetailTable"]    ${WAIT_TIMEOUT}
        Scroll Element Into View    //*[@id="obAuthorizationDetailTable"]
        ${is_visible}=  Run Keyword And Return Status    Wait Until Element Is Visible  //td[text()='No data available'] 
        IF  ${is_visible}==${FALSE}
            Wait Until Page Contains Element    //*[@id="obAuthorizationDetailTable"]/tbody/tr[1]/td[9]    ${WAIT_TIMEOUT}
            Wait Until Element Is Visible    //*[@id="obAuthorizationDetailTable"]/tbody/tr[1]/td[9]    ${WAIT_TIMEOUT}
            Scroll Element Into View    //*[@id="obAuthorizationDetailTable"]/tbody/tr[1]/td[9]
            ${Authorization_code}=    Get Text   //*[@id="obAuthorizationDetailTable"]/tbody/tr[1]/td[9]
            IF    '${Authorization_code}'==''
                Log To Console    Authorization Code element not found. Skipping...
                Set To Dictionary    ${row}    Approval Code    ${EMPTY}
            ELSE
                Log To Console    Authorization Result: ${Authorization_code}
                Set To Dictionary    ${row}    Approval Code    ${Authorization_code}
            END
            Append To List    ${processed_data}    ${row}
        END
        Scroll Element Into View    //a[text()='Account']
    END
    # 3. จบ Loop แล้วค่อยสั่งเขียนไฟล์ทีเดียว
    Write Data To CSV    ${processed_data}
    # 4. เรียก Node JS มาทำงานต่อ
    Run Node JS Script