const express = require('express');
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const {Account, Journal, Ledger, Transaction, TransactionType, ErrorResponse, HttpStatusCodes} = require('./types');
const app = express();
const uri = `mongodb://nikhil:${process.argv[2]}@nikhilcluster-shard-00-00-hbvph.mongodb.net:27017,nikhilcluster-shard-00-01-hbvph.mongodb.net:27017,nikhilcluster-shard-00-02-hbvph.mongodb.net:27017/test?ssl=true&replicaSet=NikhilCluster-shard-0&authSource=admin`;
const DATA = process.argv[3];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use((request, response, next) => {
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  response.header('Access-Control-Allow-Origin', '*');
  response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

app.get('/', function (req, res) {
  res.status(HttpStatusCodes.OK);
  res.send('Welcome to the Credit Card API!');
});

app.get('/health', function (req, res) {
  res.status(HttpStatusCodes.OK);
  res.send('Hello Capital One!');
  MongoClient.connect(uri).then(db => {
    const collection = db.collection(DATA);
    collection.count().then(count =>{
      const newID = count.toString(); // Note: This can be made more secure by adding a random string hash to the ID, so that it's less likely for attackers to guess (and brute force) an account ID.
      collection.insertOne(new Account(newID)).then(() => {
        db.close();
        res.status(HttpStatusCodes.OK);
        res.send({id: newID});
      }).catch(err => {
        db.close();
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
        res.send(ErrorResponse.DB_INSERT);
      });
    });
  }).catch(err => {
    db.close();
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    res.send(ErrorResponse.DB_CONNECTION);
  });
});

app.post('/accounts', function (req, res) {
  res.type('application/json');
  MongoClient.connect(uri).then(db => {
    const collection = db.collection(DATA);
    collection.count().then(count =>{
      const newID = count.toString(); // Note: This can be made more secure by adding a random string hash to the ID, so that it's less likely for attackers to guess (and brute force) an account ID.
      collection.insertOne(new Account(newID)).then(() => {
        db.close();
        res.status(HttpStatusCodes.OK);
        res.send({id: newID});
      }).catch(err => {
        db.close();
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
        res.send(ErrorResponse.DB_INSERT);
      });
    });
  }).catch(err => {
    db.close();
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    res.send(ErrorResponse.DB_CONNECTION);
  });
});

app.get('/accounts/:id', function (req, res) {
  res.type('application/json');
  const id = req.params.id;
  MongoClient.connect(uri).then(db => {
    const collection = db.collection(DATA);

    collection.find({id: id}).toArray().then(accounts => {
      db.close();
      switch(accounts.length) {
        case 0:
          // Return an error if we were unable to find an account.
          res.status(HttpStatusCodes.NOT_FOUND);
          res.send(ErrorResponse.RECORD_DNE);
          break;
        case 1:
          const account = accounts[0];
          const outstandingPrincipal = account.principalLedger.credit.reduce((sum, transaction) => {
            return sum + transaction.amount;
          }, 0);
          res.status(HttpStatusCodes.OK);
          res.send({
            id: account.id,
            principal: outstandingPrincipal,
            transactions: account.journal.transactions
          });
          break;
        default:
          // Return an error if multiple accounts were found (this should never happen).
          res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
          res.send(ErrorResponse.INTERNAL_ERROR);
          break;
      }
    }).catch(() => {
      db.close();
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      res.send(ErrorResponse.DB_LOOKUP);
    });
  }).catch(() => {
    db.close();
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    res.send(ErrorResponse.DB_CONNECTION);
  });
});

// This function will return true if insertion was successful, false otherwise.
function insertTransaction(account, transaction) {
  switch(transaction.type) {
    case TransactionType.PURCHASE:
      account.journal.transactions.push(transaction);
      account.cashOutLedger.debit.push(transaction);
      account.principalLedger.credit.push(transaction);
      break;
    default:
      console.log(`Unhandled TransactionType: ${transaction.type}`);
      return false;
      break;
  }
  return true;
}

function isValidTransactionType(type) {
  return Object.keys(TransactionType)
      .map((type) => TransactionType[type])
      .indexOf(type) > -1;
}

app.post('/transactions', function (req, res) {
  req.accepts('application/json');
  res.type('application/json');

  const accountID = req.body.account;
  const type = req.body.type;
  const amount = req.body.amount;

  if (typeof accountID != "string" || !isValidTransactionType(type) || isNaN(amount)) {
    res.status(HttpStatusCodes.BAD_REQUEST);
    res.send(ErrorResponse.INVALID_INPUT);
    return;
  }

  MongoClient.connect(uri).then(db => {
    let collection = db.collection(DATA);

    collection.findOne({id: accountID}).then(account => {
      const timestamp = new Date().toUTCString();
      const transactionID = account.id + '-' + account.journal.transactions.length.toString(); // We want each transaction to have a unique ID, which we can guarantee by deriving an ID based on the account ID and transaction ID. This will also allow transactions to be tied to their unique account. For added security, an optimization here would be to append a HASHED version of the account ID to the transaction or obfuscate part of the ID.
      const transaction = new Transaction(transactionID, type, timestamp, amount);
      const insertSuccessful = insertTransaction(account, transaction);

      if (!insertSuccessful) {
        db.close();
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
        res.send(ErrorResponse.INTERNAL_ERROR);
      }

      collection.updateOne(
        {id: account.id},
        {
          $set: {
            journal: account.journal,
            principalLedger: account.principalLedger,
            cashOutLedger: account.cashOutLedger
          }
        }).then(() => {
          db.close();
          res.status(HttpStatusCodes.OK);
          res.send();
        }).catch(() => {
          db.close();
          res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
          res.send(ErrorResponse.DB_UPDATE);
        });
    });
  }).catch(() => {
    db.close();
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    res.send(ErrorResponse.DB_CONNECTION);
  });
});

app.listen(3000, function () {
  console.log('API Running on port 3000!')
});
