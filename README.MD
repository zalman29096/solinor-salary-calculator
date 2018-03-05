# Wage calculator. Solinor test assignment
#### Description

  * Allows shift's start and end to be written with any step. It does not rely on the step at all.
  * Allows shifts to be shuffled e.g evening shift may go before morning
  * Auto-defines if first line of given file is a CSV header or just a data line
  * Supports STD or FILE output of results
  * CSV field separator might be specified
  * Input file path should be specified
  * Supports daily or monthly grouping of result
  * Filters out lines that do not match pattern : ```Sequence of characters | Whole number | Date [DD.MM.YYYY] | Shift start [HH:mm] | Shift end [HH:mm]```
  
  
Result is a CSV of format ` PERSON_ID | PERSON_NAME | (DATE|MONTH) | SALARY `

#### Fetch it

```
git clone https://github.com/zalman29096/solinor-salary-calculator.git
cd solinor-salary-calculator
```

#### Dependencies

Install node.js >= v9.x.x and local dependencies

  ```
  sudo apt install npm
  sudo npm install -g n
  sudo n stable
  npm install 
  ```

#### Build it
Code is written using features of ES6 so you need to build it in order to use. 

Build results would be stored in a ./build/ directory

Install babel >= v6.x.x

```
sudo npm install -g babel-cli
```

Build project
```
npm install babel-cli

npm run build
```

#### Run it


View flags usage

  ```
  node build/index.js --help
  ```

Calculate your wages


  ```
  node build/index.js -i [PATH_TO_CSV_WITH_WORK_SHIFTS] -s [SEPARATOR] -g [GROUP_OUTPUT_BY] -o [PATH_TO_OUTPUT_FILE]
  ```

#### Test it

Install dev-dependencies

```
npm install --only=dev
```

Run tests

```
npm test
```
