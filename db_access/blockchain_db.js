const SHA256 = require('crypto-js/sha256');
const level = require('level');
const Block = require('../model/block');
const blockChainDB = './DB_blockchain';
const db = level(blockChainDB);

class Blockchain {
    constructor() {
      this.addBlock(new Block('Genesis block'));
    }
  
    // Add new block
    async addBlock(newBlock) {
      // Check if exist genesis block
      let blockAdded = '';
      const exist = await this.existGenesisBlock();
      if(!exist) {
        console.log('------ Adding Genesis Block --------');
        const genesisBlock = new Block('Genesis block');
        genesisBlock.height = 0;
        genesisBlock.time = new Date().getTime().toString().slice(0,-3);
        genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
        await this.addLevelDBData(genesisBlock.height, JSON.stringify(genesisBlock).toString());
        console.log('------ Genesis Block already added ------');
      }
      // Check the call is not comming from constructor
      if(newBlock.body.star.story != 'Genesis block') {
        await this.getBlockHeight()
        .then((height) => {
          newBlock.height = height + 1;
        })
        .catch((height, err) => {
          console.log('Error getting block height. Error: ' + err);
          newBlock.height = height;
        });
        if(newBlock.height > 0) {
          // Get previous hash
          let prevBlock = '';
          await this.getBlock(newBlock.height - 1)
          .then((value) => {
            prevBlock = value;
          }).catch((err) => {
            console.log("Previous Block not found. Error: " + err);
          });
          if(prevBlock) {
            newBlock.previousBlockHash = JSON.parse(prevBlock).hash;
            newBlock.time = new Date().getTime().toString().slice(0,-3);
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            await this.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString());
            blockAdded = newBlock;
            console.log('New Block with height ' + newBlock.height + ' was already added to the chain');
          } else {
            console.log('New Block could not be added to the chain because no previous block found');
          }
        } else {
          console.log('New Block could not be added to the chain because no block height not found');
        }
      }
      return blockAdded;
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

    // Check if Genesis Block Exist
    async existGenesisBlock() {
      let exist = false;
      await this.getBlock(0)
      .then(() => {
        exist = true;
      })
      .catch((err) => {
        console.log('Genesis Block not found. Err: ' + err);
      });
      return exist;
    }
  
    // Get block height
    getBlockHeight(){
      let i = 0;
      return new Promise(function(resolve, reject){
        db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
          console.log('Unable to read data stream!', err)
          reject(-1, err);
        }).on('close', function() {
          resolve(i - 1);
        });
      });
    }
  
    // get block
    getBlock(blockHeight){
      // return object as a single string
      return new Promise((resolve, reject) => {
        db.get(blockHeight, function(err, value) {
          if (err) {
            console.log('Block# ' + blockHeight + ' not found');
            reject(err);
          } else {
            resolve(value);
          }
        });
      });
    }
  }

  module.exports = Blockchain;