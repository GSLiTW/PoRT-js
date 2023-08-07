# PoRT-js
A doubly-linked PoRT Blockchain approach

## Using Swagger and JSDoc for API Documentation

This guide will introduce you to two powerful tools, Swagger and JSDoc, and explain how you can use them to create comprehensive and well-documented APIs.

### Swagger

Swagger is an open-source framework that allows you to design, build, and document RESTful APIs. It provides a set of tools and specifications that enable developers to describe API endpoints, request/response models, authentication methods, and more. Swagger offers a user-friendly interface for exploring and testing APIs, making it a popular choice for API documentation.

To use Swagger for API documentation:

1. **Install Swagger**: Start by installing the Swagger npm package in your project.

   ```bash
   npm install swagger-jsdoc swagger-ui-express --save-dev
   ```

2. **Configure Swagger**: Create a Swagger configuration file (e.g., swagger.js) to specify the API details and endpoints.

   ```javascript
   const swaggerJsdoc = require('swagger-jsdoc');
   const swaggerUi = require('swagger-ui-express');

   const swaggerOptions = {
     swaggerDefinition: {
       info: {
         title: 'Your API Name',
         version: '1.0.0',
         description: 'Your API description',
       },
       servers: [{ url: 'http://localhost:3000' }],
     },
     apis: ['path/to/api/routes.js'], // Path to your API routes
   };

   const swaggerSpecs = swaggerJsdoc(swaggerOptions);
   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
   ```

3. **Add Swagger Annotations**: In your API route files, use Swagger annotations to document the endpoints, request/response models, and other relevant information.

   ```javascript
   /**
    * @swagger
    * /api/users:
    *   get:
    *     description: Get all users
    *     responses:
    *       200:
    *         description: Successful operation
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/User'
    */
   ```


5. **Generate API Documentation**: Run your server and navigate to the Swagger UI URL (e.g., http://localhost:3000/api-docs) to access the API documentation.
    ```
    npm run swagger-autogen
    ```
Swagger offers extensive documentation and customization options. Visit the official [Swagger Documentation](https://swagger.io/docs/) for more details.

### JSDoc

JSDoc is a markup language used to document JavaScript code. It allows you to describe the purpose, parameters, return values, and other important details of functions, classes, and modules. By using JSDoc annotations, you can generate well-structured and informative documentation for your JavaScript codebase.

To use JSDoc for API documentation:

1. **Install JSDoc**: Begin by installing the JSDoc package globally.

   ```bash
   npm install -g jsdoc
   ```

2. **Add JSDoc Annotations**: In your JavaScript files, use JSDoc annotations to document the functions, classes, and variables.

   ```javascript
   /**
    * Get all users from the database.
    *
    * @async
    * @function getUsers
    * @param {string} query - The search query.
    * @returns {Promise<Array<User>>} - A promise that resolves to an array of users.
    */
   async function getUsers(query) {
     // Implementation here
   }
   ```

3. **Generate Documentation**: Run the JSDoc command to generate the documentation based on the annotations.

   ```bash
   jsdoc path/to/your/files/*.js -d path/to/output/folder

   jsdoc path/to/your/files -r -d path/to/output/folder
   ```



# Usage
1. Use Node.js version >= v14.
2. run ```npm i``` first.
3. run ```npm audit fix``` to update some packages.
4. run ```./run.sh``` to start running.
5. run ```./kill.sh``` to stop testing.

# Run some test
**./run.sh**

由於有可能沒有辦法執行Script```./run.sh```：
```
#!/bin/bash
for i in {3000..3008}
do
    echo "Starting port $i"
    npm run $i > out$i 
done
```

也可以自己寫另外的Script來開啟3000-3001的port

```
#!/bin/bash
npm run 3000 > out3000 &
npm run 3001 > out3001 &
```

**實驗操作**

1.在執行腳本後，可以先開啟3000這個port來查看blockchain是否成功建立:
(http://localhost:3000/blockchain)
在成功建立的blockchain裡會存放genesis block(block 0)
![](https://i.imgur.com/IKlXtQi.png)


2.首先我在MPT裡指派了3002這個port來當作C2，以及3004、3006、3008這3個port來當作V2，接著透過(http://localhost:3002/Creator)
讓3002這個port去create block 2，同時3004、3006、3008這3個port也會去verify block 1，接著當block 2 create成功後，3002會把block 2 broadcast出去，每個node在收到block 2後會把block 1(temporary block)上鍊，最後把block 2設為新的temporary block

3.此時可以再透過(http://localhost:3000/blockchain)
來查看目前的區塊鍊，這時候鍊上應該要有2個block(block0、block1)!
![](https://i.imgur.com/LgYxta3.png)

4.接著執行下一輪，下一輪的creator和voter為C3、V3，也就是block 1裡面紀錄的next creator和next voter，而在這裡我把C3設定成port 3001，V3設定成3003、3005、3007，因此現在可以透過(http://localhost:3001/Creator)
讓3001 create block 3，同時3003、3005、3007會verify block 2，接著3001把block 3 broadcast出去後，每個node便會把block 2上鍊並將temporary block設為block 3

5.再執行一次(http://localhost:3000/blockchain)
可以發現目前區塊鍊上確實有3個block了!
![](https://i.imgur.com/qEtTAMU.png)

6.接著再下一輪的C4、V4是block 2裡面紀錄的next creator和next voter，這裡我查表的結果是C4是3149這個port，而V4分別為3141、3139、3022這3個port，但因為我目前電腦無法同時開啟這麼多port，因此我沒有繼續做這一輪。

在每次實驗後，我們會透過執行```./kill.sh```來把所有port關掉。

**補充**

測試Voter掉線的問題，測試方法一開始一樣是透過```./run.sh```
來開啟這些PORT。而在開啟後，我們會透過CMD把3004這個PORT(Voter之一)關掉，並透過和以上一樣的流程來檢查少了一個Voter後是否還能正常運作。

# Using Codehawk and Jest for Quality Testing

In this guide, we will explore how to utilize Codehawk and Jest to perform quality testing on your codebase. Codehawk is a static code analysis tool that helps identify potential security vulnerabilities and coding errors, while Jest is a popular JavaScript testing framework for unit testing.

## Codehawk

Codehawk is a powerful static code analysis tool that can assist in finding bugs and security vulnerabilities in your code. It provides automated analysis and offers actionable recommendations to help you improve the quality and security of your software.

To use Codehawk for quality testing:

1. **Install Codehawk**: Start by installing Codehawk on your local machine. You can find the installation instructions on the Codehawk website.

2. **Analyze Code**: Use Codehawk to analyze your codebase. This can be done through the Codehawk command-line interface or by integrating Codehawk into your CI/CD pipeline.
```
    npm run codehawk
```

3. **Review Analysis Results**: Codehawk will generate a detailed report highlighting potential issues, vulnerabilities, and recommended fixes. Review the analysis results and prioritize addressing the identified issues.

4. **Address Issues**: Follow the recommendations provided by Codehawk to fix the identified issues. This may involve modifying your code, applying security patches, or updating dependencies.

Codehawk offers a comprehensive set of features to help improve code quality. Visit the official [Codehawk Documentation](https://www.codehawk.com/documentation) for detailed information on using and configuring Codehawk.

## Jest

Jest is a widely-used JavaScript testing framework that provides a simple and intuitive way to write unit tests. It offers a range of powerful features, including test runners, assertions, mocking, and code coverage analysis.

To use Jest for quality testing:

1. **Install Jest**: Begin by installing Jest as a development dependency in your project.

   ```bash
   npm install --save-dev jest
   ```

2. **Write Test Cases**: Create test files and write test cases using the Jest testing syntax. Test files should be placed in a directory named `__tests__` or have a `.test.js` or `.spec.js` file extension.

   ```javascript
   // math.test.js

   const math = require('./math');

   test('adds two numbers correctly', () => {
     expect(math.add(2, 3)).toBe(5);
   });

   test('multiplies two numbers correctly', () => {
     expect(math.multiply(2, 3)).toBe(6);
   });
   ```

3. **Run Tests**: Execute the Jest command to run your tests.

   ```bash
   npm run test
   ```

4. **Review Test Results**: Jest will run your test cases and provide a detailed report indicating the status of each test, including any failures or errors.

5. **Address Failures**: If any test cases fail, review the failure messages and make the necessary adjustments to your code until all tests pass successfully.

Jest offers a rich set of features for testing JavaScript code, including test suites, test coverage analysis, and test mocking. Visit the official [Jest Documentation](https://jestjs.io/docs) for more information on using Jest effectively.

By combining Codehawk's static code analysis capabilities with Jest's unit testing framework, you can significantly enhance the quality and reliability of your codebase.

