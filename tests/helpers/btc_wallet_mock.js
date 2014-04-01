(function() {
  var BtcWallet, exports, trTime, transactionData;

  trTime = Date.now() / 1000;

  transactionData = {
    amount: 1,
    txid: "unique_tx_id",
    confirmations: 6,
    time: trTime,
    details: [
      {
        account: "account",
        fee: 0.0001,
        address: "address",
        category: "send"
      }
    ]
  };

  BtcWallet = (function() {
    function BtcWallet() {}

    BtcWallet.prototype.getTransaction = function(txId, callback) {
      return callback(null, transactionData);
    };

    BtcWallet.prototype.getBalance = function(account, callback) {
      return callback(null, 1);
    };

    BtcWallet.prototype.chargeAccount = function(account, balance, callback) {
      return callback(null, true);
    };

    BtcWallet.prototype.sendToAddress = function(address, amount, callback) {
      return callback(null, "unique_tx_id_" + address);
    };

    return BtcWallet;

  })();

  exports = module.exports = BtcWallet;

}).call(this);
