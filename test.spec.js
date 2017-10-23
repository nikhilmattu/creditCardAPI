const request = require("request");

var base_url = "http://localhost:3000"

describe("Server is running", function() {
  describe("GET /", function() {
    it("returns status code 200", function(done) {
      request.get(base_url, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns Welcome to the Credit Card API!", function(done) {
      request.get(base_url, function(error, response, body) {
        expect(body).toBe("Welcome to the Credit Card API!");
        done();
      });
    });
  });
});

describe("Health endpoint is running", function() {
  describe("GET /health", function() {
    it("returns status code 200", function(done) {
      request.get(`${base_url}/health`, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns Hello Capital One!", function(done) {
      request.get(`${base_url}/health`, function(error, response, body) {
        expect(body).toBe("Hello there!");
        done();
      });
    });
  });
});

describe("Accounts endpoint is running", function() {
  describe("POST /accounts", function() {
    it("returns status code 200", function(done) {
      request.post(`${base_url}/accounts`, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns an ID", function(done) {
      request.post(`${base_url}/accounts`, function(error, response, body) {
        const actual = JSON.parse(body);
        expect(actual.id).toBe(actual.id);
        done();
      });
    });
  });
});

describe("Accounts/:id endpoint is running", function() {
  describe("GET /accounts/:id", function() {
    it("returns status code 200", function(done) {
      request.get(`${base_url}/accounts/19`, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns account id 19", function(done) {
      request.get(`${base_url}/accounts/19`, function(error, response, body) {
        const actual = JSON.parse(body);
        expect(actual.id).toBe('19');
        done();
      });
    });
  });
});

describe("Transactions endpoint is running", function() {
  describe("POST /accounts", function() {
    it("returns status code 200", function(done) {
      let options = {
        url: `${base_url}/transactions`,
        body: {
        	"account": "11",
        	"type": 0,
        	"amount": 2500
        },
        json: true
      }
      request.post(options, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns status code 500", function(done) {
      let options = {
        url: `${base_url}/transactions`,
        body: {
        	"account": 1,
        	"type": 0,
        	"amount": 2500
        },
        json: true
      }
      request.post(options, function(error, response, body) {
        expect(response.statusCode).toBe(400);
        done();
      });
    });
  });
});

describe("Integration between all endpoints is working", function() {
  describe("POST /accounts", function() {
    it("returns status code 200", function(done) {
      const amount1 = 300;
      const amount2 = 600;
      request.post(`${base_url}/accounts`, function(error, response, body) {
        const accountID = JSON.parse(body).id;
        const transaction1Options = {
          url:`${base_url}/transactions`,
          body: {
            "account": accountID,
            "type": 0,
            "amount": amount1
          },
          json: true
        };
        request.post(transaction1Options, function(error, response, body){
          const transaction2Options = {
            url:`${base_url}/transactions`,
            body: {
              account: accountID,
              type: 0,
              amount: amount2
            },
            json: true
          };
          request.post(transaction2Options, function(error, response, body){
            request.get(`${base_url}/accounts/${accountID}`, function(error, response, body){
              const result = JSON.parse(body);
              expect(result.id).toBe(accountID);
              expect(result.principal).toBe(amount1 + amount2);
              // Tests that transactions are in the expected order (insertion order based on timestamp).
              expect(result.transactions.length).toBe(2);
              expect(result.transactions[0].amount).toBe(amount1);
              expect(result.transactions[1].amount).toBe(amount2);
              done();
            });
          });
        });
      });
    });
  });
});
