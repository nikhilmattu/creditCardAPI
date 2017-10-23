AUTHOR: Nikhil Mattu (nikhilmattu@gmail.com)
LAST UPDATED: October 22, 2017

Instructions to run this project
-----------------------------------------------------------
1. Clone the repository @ (insert repo link here)
2. Make sure node is installed (https://nodejs.org/en/)
3. In the root folder run: "npm init"
4. Email nikhilmattu@gmail.com for the database password
5. Insert password into package.json "app" script and run: "npm run-script app"


Instructions to run tests (make sure previous steps are followed!)
-----------------------------------------------------------
1. In the root folder of the application, run: "npm run-script apptest" (make sure password is inserted in package.json "app" script)
2. In the root folder of the application, run: "npm run-script test"


Available endpoints
-----------------------------------------------------------
GET /
GET /health
POST /accounts
  Expected result: {id:string}
GET /accounts/:id
  Expected result: {id:string, principal:num, transactions:array}
POST /transactions
  Expected result: {account:string, type:num, amount: num}
  Currently only supports "type: 0" for "purchase" (see TransactionType defined in types.js). This type can be expanded for more detailed usage.


Future optimizations
-----------------------------------------------------------
- Generating secure unique ID strings (like UUIDs) for account IDs and transaction IDs. For ease of development, I've used single-digit integers as account IDs, which hackers can easily brute force to access sensitive transaction data.

- Implementing retry logic for failed asynchronous operations, such as connecting/inserting to/updating the database. Database issues can often be transient, and I'd like to retry failed database operations X number of times before returning an error response to the client (where X is a reasonable number derived from past experience with reliability of the database).

- Stricter type checking. Many places in the code assume that the stored "accounts" object is well-formed (for example, accounts.journal.transactions being defined). Although this is and should always be true if coded correctly, type checking (and throwing errors if necessary) will allow for more maintainable, easier to debug code.

- Developing test suite further to test database connection failures, insertion failures, and other errors. With the testing framework I'm using, Jasmine, these transient database issues were difficult to test since I wasn't able to mock the MongoDB database. While using a real database has advantages (allows for greater code coverage and better integration tests), it makes testing infrequent database issues difficult. I'd like to add more unit tests to increase code coverage.

- Adding more robust integration tests, creating multiple accounts with many transactions.
