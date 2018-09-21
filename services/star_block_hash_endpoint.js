const Blockchain = require('../db_access/blockchain_db');

class StarBlockHashEndPoint {
    constructor(hash) {
        this.response = {
            "data": {},
            "code": 200
        };
        this.hash = hash;
    }

    async run() {
        if(this.hash) {
            const blocchain = new Blockchain();
            let blockByHash = '';
            await blocchain.getBlockByHash(this.hash)
            .then((value) => {
                blockByHash = value;
            })
            .catch((value, err) => {
                blockByHash = value;
                console.log('An error ocurred during fetching data from request validation DB. Error: ' + err);
            });
            if(blockByHash) {
                this.response.data = {
                    "hash": blockByHash.hash,
                    "height": blockByHash.height,
                    "body": {
                        "address": blockByHash.body.address,
                        "star": {
                            "ra": blockByHash.body.star.ra,
                            "dec": blockByHash.body.star.dec,
                            "story": blockByHash.body.star.story,
                            "storyDecoded": new Buffer(blockByHash.body.star.story, 'hex').toString()
                        }
                    },
                    "time": blockByHash.time,
                    "previousBlockHash": blockByHash.previousBlockHash
                };
            } else {
                this.response.data = {
                    "msg": "No block found for this hash",
                    "error": "No block found in the blockchain for the address " + this.hash
                };
                this.response.code = 404;
            }
        } else {
            this.response.data = {
                "msg": " NOT Successfully Done",
                "error": "hash parameter missing in the request or empty"
            };
            this.response.code = 404;
        }
        return this.response;
    }
}

module.exports = StarBlockHashEndPoint;