const level = require('level');
const RequestValidation = require('../model/request_validation');
const requestValidationDB = './DB_request_validation';
const db = level(requestValidationDB);

class RequestValidationDB {
    constructor() {
    }

    // Add new block
    async addRequestValidation(newRequestValidation) {
        let response = false;
        await this.addLevelDBData(newRequestValidation.address, JSON.stringify(newRequestValidation).toString())
        .then(() => {
            console.log('Request Validation for address: ' + newRequestValidation.address + ' successfully added to the DB');
            response = true;
        })
        .catch((err) => {
            console.log('Request Validation for address: ' + newRequestValidation.address + ' NOT successfully added to the DB. Error: ' + err);
            response = false;
        });
        return response;
    }

    // Add new key, value data to levelDB
    addLevelDBData(key, value) {
        return new Promise(function(resolve, reject){
            db.put(key, value, function(err) {
            if (err) {
                console.log('Block ' + key + ' submission failed', err);
                reject(err);
            } else {
                resolve();
            }
            })
        });
    }

    // Get Request Vaidation data
    getLevelDBData(key){
        // return object as a single string
        return new Promise((resolve, reject) => {
          db.get(key, function(err, value) {
            if (err) {
              console.log('Request Validation for Address: ' + key + ' not found');
              reject(err);
            } else {
              resolve(value);
            }
          });
        });
    }

    // Delete Request Vaidation data
    deleteLevelDBData(key){
        // return object as a single string
        return new Promise((resolve, reject) => {
          db.del(key, function(err) {
            if (err) {
              console.log('Request Validation for Address: ' + key + ' could not be deleted');
              reject(err);
            } else {
              resolve();
            }
          });
        });
    }
}

module.exports = RequestValidationDB;