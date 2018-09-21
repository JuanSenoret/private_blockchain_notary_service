const SHA256 = require('crypto-js/sha256');
const CheckPayload = require('../common/check_payload');
const Blockchain = require('../db_access/blockchain_db');
const Block = require('../model/block');
const RequestValidationDB = require('../db_access/request_validation_db');

class BlockEndPoint {
    constructor(payload, validationWindow) {
        this.response = {
            "data": {},
            "code": 200
        };
        this.payload = payload;
        this.validationWindow = validationWindow;
    }

    async run() {
        const checkPayload = new CheckPayload();
        const isPayloadOk = checkPayload.check(this.payload, ['address', 'star'], true);
        if(isPayloadOk) {
            // Check if user validate message signature and validationWindow is not expired
            const requestValidationDB = new RequestValidationDB();
            let requestValidationData = '';
            await requestValidationDB.getLevelDBData(this.payload.address)
            .then((value) => {
                requestValidationData = value;
            })
            .catch((err) => {
                console.log('No previous pending request');
            });
            if(requestValidationData) {
                const jsonReqValidationData = JSON.parse(requestValidationData);
                // Check if the validationWindow is not expired
                const currentTimeStamp = new Date().getTime().toString().slice(0,-3);
                if ((currentTimeStamp - jsonReqValidationData.requestTimeStamp) > this.validationWindow) {
                    this.response.data = {
                        "msg": "Validation Window expired. Please try again the process.",
                        "error": "validationWindow expired"
                    };
                    this.response.code = 404;
                } else {
                    // Check if message signature was validated
                    if(jsonReqValidationData.messageSignature) {
                        const blockChainDB = new Blockchain();
                        const jsonStarData = JSON.parse(JSON.stringify(this.payload.star));
                        const newBlock = new Block(jsonStarData.story,
                                                   jsonStarData.ra,
                                                   jsonStarData.dec,
                                                   this.payload.address,
                                                   SHA256(jsonStarData.ra + jsonStarData.dec).toString());
                        // TODO: add checking to verify if the star was already registered
                        const addedBlock = await blockChainDB.addBlock(newBlock);
                        if(addedBlock) {
                            this.response.data = {
                                "hash": addedBlock.hash,
                                "height": addedBlock.height,
                                "address": addedBlock.body.address,
                                "star": {
                                    "ra": addedBlock.body.star.ra,
                                    "dec": addedBlock.body.star.dec,
                                    "story": addedBlock.body.star.story
                                },
                                "time": addedBlock.time,
                                "previousBlockHash": addedBlock.previousBlockHash
                            };
                            this.response.code = 200;
                        }
                    }
                }
            } else {
                this.response.data = {
                    "msg": "You has to previous request for validation before to register a star",
                    "error": "No previous request for message signature validation"
                };
                this.response.code = 404;
            }

        } else {
            this.response.data = {
                "msg": " NOT Successfully Done",
                "error": "address or star parameter missing in the request, or star format not well formatted"
            };
            this.response.code = 404;
        }
        return this.response;
    }
}

module.exports = BlockEndPoint;
