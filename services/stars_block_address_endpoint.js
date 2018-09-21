const Blockchain = require('../db_access/blockchain_db');

class StarsBlockAddressEndPoint {
    constructor(address) {
        this.response = {
            "data": {},
            "code": 200
        };
        this.address = address;
    }

    async run() {
        if(this.address) {
            const blocchain = new Blockchain();
            let blocksByAddress = [];
            await blocchain.getBlocksByAddress(this.address)
            .then((value) => {
                blocksByAddress = value;
            })
            .catch((value, err) => {
                blocksByAddress = value;
                console.log('An error ocurred during fetching data from request validation DB. Error: ' + err);
            });
            if(blocksByAddress) {
                const responseArray = [];
                blocksByAddress.forEach((element) => {
                    responseArray.push({
                        "hash": element.hash,
                        "height": element.height,
                        "body": {
                            "address": element.body.address,
                            "star": {
                                "ra": element.body.star.ra,
                                "dec": element.body.star.dec,
                                "story": element.body.star.story,
                                "storyDecoded": new Buffer(element.body.star.story, 'hex').toString()
                            },
                        "time": element.time,
                        "previousBlockHash": element.previousBlockHash
                        }
                    });
                });
                this.response.data = responseArray;
                this.response.code = 200;
            } else {
                this.response.data = {
                    "msg": "No blocks found for this address",
                    "error": "No blocks found in the blockchain for the address " + this.address
                };
                this.response.code = 404;
            }
        } else {
            this.response.data = {
                "msg": " NOT Successfully Done",
                "error": "address parameter missing in the request or empty"
            };
            this.response.code = 404;
        }
        return this.response;
    }
}

module.exports = StarsBlockAddressEndPoint;
