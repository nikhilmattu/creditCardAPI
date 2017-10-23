class Account {
  constructor(id) {
    this.id = id;
    this.journal = new Journal();
    this.principalLedger = new Ledger();
    this.cashOutLedger = new Ledger();
  }
}

class Transaction {
  constructor(id, type, timestamp, amount) {
    this.id = id;
    this.type = type;
    this.timestamp = timestamp;
    this.amount = amount;
  }
}

class Journal {
  constructor() {
    this.transactions = [];
  }
}

class Ledger {
  constructor() {
    this.debit = [];
    this.credit = [];
  }
}

TransactionType = {
  PURCHASE: 0,
}

ErrorResponse = {
  DB_CONNECTION: constructErrorResponse('Failed to establish database connection.'),
  DB_LOOKUP: constructErrorResponse('Failed to find record in database.'),
  DB_INSERT: constructErrorResponse('Failed to insert record in database.'),
  DB_UPDATE: constructErrorResponse('Failed to update record in database.'),
  RECORD_DNE: constructErrorResponse('Record does not exist.'),
  INVALID_INPUT: constructErrorResponse('Invalid input.'),
  INTERNAL_ERROR: constructErrorResponse('Internal error.') // This error is purposefully ambiguous, as a detailed message would expose major issues. For example, we may want to print this message if we somehow ended up in a state where multiple accounts with the same ID were created.
}

function constructErrorResponse(msg) {
  return {error: `Error: ${msg}`};
}

HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
}

exports.Account = Account;
exports.Transaction = Transaction;
exports.Journal = Journal;
exports.Ledger = Ledger;
exports.TransactionType = TransactionType;
exports.ErrorResponse = ErrorResponse;
exports.HttpStatusCodes = HttpStatusCodes;
