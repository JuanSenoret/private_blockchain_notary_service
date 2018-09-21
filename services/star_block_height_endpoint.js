const Blockchain = require('../db_access/blockchain_db');

class StarBlockHeightEndPoint {
    constructor(height) {
        this.response = {
            "data": {},
            "code": 200
        };
        this.height = height;
    }

    async run() {
        if(this.height) {
            const blockhain = new Blockchain();
            let blockByHeight = '';
            await blockhain.getBlock(this.height)
            .then((value) => {
                blockByHeight = value;
            })
            .catch((err) => {
                console.log('An error ocurred during fetching data from request validation DB. Error: ' + err);
            });
            if(blockByHeight) {
                const jsonBlockByHeight = JSON.parse(blockByHeight);
                //console.log(jsonBlockByHeight);
                this.response.data = {
                    "hash": jsonBlockByHeight.hash,
                    "height": jsonBlockByHeight.height,
                    "body": {
                        "address": jsonBlockByHeight.body.address,
                        "star": {
                            "ra": jsonBlockByHeight.body.star.ra,
                            "dec": jsonBlockByHeight.body.star.dec,
                            "story": jsonBlockByHeight.body.star.story,
                            "storyDecoded": new Buffer(jsonBlockByHeight.body.star.story, 'hex').toString()
                        }
                    },
                    "time": jsonBlockByHeight.time,
                    "previousBlockHash": jsonBlockByHeight.previousBlockHash
                };
            } else {
                this.response.data = {
                    "msg": "No block found for this height",
                    "error": "No block found in the blockchain for the height " + this.height
                };
                this.response.code = 404;
            }
        } else {
            this.response.data = {
                "msg": " NOT Successfully Done",
                "error": "height parameter missing in the request or empty"
            };
            this.response.code = 404;
        }
        return this.response;
    }
}
module.exports = StarBlockHeightEndPoint;
