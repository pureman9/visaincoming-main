# VISAincoming

Automated testing framework for VISA incoming transactions using Robot Framework and Selenium.

## Prerequisites

Before setting up this project, ensure you have the following installed:

### 1. Python
- **Python 3.8 or higher** is required
- Download from [python.org](https://www.python.org/downloads/)
- Verify installation: `python --version`

### 2. Robot Framework Libraries

This project uses the following Robot Framework libraries:

| Library | Purpose | Installation |
|---------|---------|--------------|
| **SeleniumLibrary** | Web browser automation | `pip install robotframework-seleniumlibrary` |
| **BuiltIn** | Core Robot Framework keywords | Included with Robot Framework |
| **DebugLibrary** | Interactive debugging | `pip install robotframework-debuglibrary` |
| **Collections** | List and dictionary operations | Included with Robot Framework |
| **OperatingSystem** | File and OS operations | Included with Robot Framework |
| **String** | String manipulation | Included with Robot Framework |
| **DateTime** | Date and time operations | Included with Robot Framework |

### 3. Web Browser & Driver

- **Chrome Browser** (recommended) or Firefox
- **ChromeDriver** - Download from [chromedriver.chromium.org](https://chromedriver.chromium.org/)
  - Ensure ChromeDriver version matches your Chrome browser version
  - Add ChromeDriver to your system PATH

## Installation

Follow these steps to set up the project:

### Step 1: Clone the Repository

```bash
git clone https://gitlab.com/protocoltoto/visaincoming.git
cd visaincoming
```

### Step 2: Create Virtual Environment

It's recommended to use a virtual environment to isolate project dependencies:

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies

Install all required Python packages using the requirements.txt file:

```bash
pip install -r requirements.txt
```

This will install:
- `robotframework>=7.3.2`
- `robotframework-seleniumlibrary>=6.7.0`
- `selenium>=4.0.0`
- `robotframework-debuglibrary>=2.3.0`

### Step 4: Verify Installation

Verify that Robot Framework is installed correctly:

```bash
robot --version
```

Expected output:
```
Robot Framework 7.3.2 (Python 3.x.x on win32)
```

### Step 5: Install ChromeDriver

1. Check your Chrome browser version: `chrome://version/`
2. Download matching ChromeDriver from [chromedriver.chromium.org](https://chromedriver.chromium.org/)
3. Extract and add to system PATH, or place in project directory

## Project Structure

```
visaincoming-main/
├── src/
│   ├── Mobius_login.robot          # Main login automation script
│   ├── import-csvlists.robot       # CSV data import utilities
│   └── ...
├── py-input/
│   └── SOD-SIM-TEST.csv           # Test data CSV file
├── getApprovalCode.py             # Python script for approval codes
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

## Usage

### Running Robot Framework Tests

To run a specific test file:

```bash
cd src
robot Mobius_login.robot
```

To run with console output:

```bash
robot --console verbose Mobius_login.robot
```

To run all tests in the src directory:

```bash
robot src/
```

### Viewing Test Results

After running tests, Robot Framework generates:
- `output.xml` - Detailed test execution data
- `log.html` - Detailed test log (open in browser)
- `report.html` - Test summary report (open in browser)

## Test Cases

### Mobius Login Test
- **File:** `src/Mobius_login.robot`
- **Purpose:** Automated login flow for Mobius system
- **Features:**
  - User authentication with primary and secondary passwords
  - Dynamic password field handling
  - Customer navigation and search

### CSV Data Import Test
- **File:** `src/import-csvlists.robot`
- **Purpose:** Read and process CSV test data
- **Features:**
  - Read all rows from CSV
  - Read specific row by index
  - Handle BOM characters
  - Console output formatting

## Troubleshooting

### Common Issues

**Issue: `ModuleNotFoundError: No module named 'SeleniumLibrary'`**
- Solution: Install SeleniumLibrary: `pip install robotframework-seleniumlibrary`

**Issue: `WebDriverException: 'chromedriver' executable needs to be in PATH`**
- Solution: Download ChromeDriver and add to system PATH

**Issue: `Unresolved library: DebugLibrary`**
- Solution: Install DebugLibrary: `pip install robotframework-debuglibrary`

**Issue: Browser version mismatch**
- Solution: Ensure ChromeDriver version matches your Chrome browser version

## Support

For issues or questions:
- Create an issue in the GitLab repository
- Contact the project maintainers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Create a merge request

## License

This project is proprietary software. All rights reserved.

## Authors

- Protocol Team

## Project Status

Active development - regularly maintained and updated.

*** File Structure Now: ***

*** Settings ***
(Libraries and imports)

*** Variables ***
(Test configuration variables)

*** Keywords ***
- Input secondary password
- Read CSV Data As List
- Read CSV Data Single Row
- Write Data To CSV
- Run Node JS Script

*** Test Cases ***
- Visa Incoming Authorization Test  ← Your main test is here now!


