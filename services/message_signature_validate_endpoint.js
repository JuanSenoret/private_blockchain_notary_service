const bitcoinMessage = require('bitcoinjs-message');
const CheckPayload = require('../common/check_payload');
const RequestValidationDB = require('../db_access/request_validation_db');

class MessageSignatureValidateEndPoint {
    constructor(payload, validationWindow) {
        this.response = {"data": {},
                         "code": 200};
        this.payload = payload;
        this.validationWindow = validationWindow;
    }

    async run() {
        const checkPayload = new CheckPayload();
        const isPayloadOk = checkPayload.check(this.payload, ['address', 'signature'], false);
        if(isPayloadOk) {
            const requestValidationDB = new RequestValidationDB();
            // Get the request validation data for the address
            let requestValidationData = '';
            await requestValidationDB.getLevelDBData(this.payload.address)
            .then((value) => {
                requestValidationData = value;
            })
            .catch((err) => {
                console.log('No previous pending request');
            });
            if(requestValidationData) {
                // Check if validationWindow is not expired
                const currentTimeStamp = new Date().getTime().toString().slice(0,-3);
                const jsonReqValidationData = JSON.parse(requestValidationData);
                const currentvalidationWindow = this.validationWindow - (currentTimeStamp - jsonReqValidationData.requestTimeStamp);
                if ((currentTimeStamp - jsonReqValidationData.requestTimeStamp) > this.validationWindow) {
                    // Delete the request validation from DB
                    await requestValidationDB.deleteLevelDBData(jsonReqValidationData.address)
                    .then(() => {
                        this.response.data = {
                            "msg": "Validation Window expired. Please try again.",
                            "error": "Validation Window expired"
                        };
                        this.response.code = 404;
                    }).catch((err) => {
                        this.response.data = {
                            "msg": "An error ocurred during deleting previous request. Please contact our support team",
                            "error": "An error ocurred during deleting previous request. Err: " + err
                        };
                        this.response.code = 404;
                    });
                } else {
                    // Check if the message signature is already validated for this address
                    if (jsonReqValidationData.messageSignature) {
                        this.response.data = {
                            "address": jsonReqValidationData.address,
                            "requestTimeStamp": jsonReqValidationData.requestTimeStamp,
                            "message": jsonReqValidationData.message,
                            "validationWindow": currentvalidationWindow,
                            "messageSignature": "Success"
                        };
                        this.response.code = 200;
                    } else {
                        let isMessageSignatureValid = false;
                        try {
                            isMessageSignatureValid = bitcoinMessage.verify(jsonReqValidationData.message, jsonReqValidationData.address, this.payload.signature);
                        } catch(err) {
                            console.log('Server Error by verifiying message signature. ' + err);
                        }
                        if (isMessageSignatureValid) {
                            // Update the request validation data for this address to validate the signature
                            jsonReqValidationData.messageSignature = true;
                            const updateRequestValidationToDB = await requestValidationDB.addRequestValidation(jsonReqValidationData);
                            if (updateRequestValidationToDB) {
                                this.response.data = {
                                    "address": jsonReqValidationData.address,
                                    "requestTimeStamp": jsonReqValidationData.requestTimeStamp,
                                    "message": jsonReqValidationData.message,
                                    "validationWindow": currentvalidationWindow,
                                    "messageSignature": "Success"
                                };
                                this.response.code = 200;
                            } else {
                                this.response.data = {
                                    "msg": "An error occurred during DB update. Please try again to validate your message signature",
                                    "error": "Error updating request validation in DB"
                                };
                                this.response.code = 404;
                            }
                        } else {
                            this.response.data = {
                                "address": jsonReqValidationData.address,
                                "requestTimeStamp": jsonReqValidationData.requestTimeStamp,
                                "message": jsonReqValidationData.message,
                                "validationWindow": currentvalidationWindow,
                                "messageSignature": "Fail"
                            };
                            this.response.code = 200;
                        }
                    }
                }
            } else {
                // No previous request validation
                this.response.data = {
                    "msg": "Please request a validation previous to validate your message signature",
                    "error": "No previous request validation data in DB"
                };
                this.response.code = 404;
            }

        } else {
            this.response.data = {
                "msg": " NOT Successfully Done",
                "error": "address or signature parameter missing in the request or empty"
            };
            this.response.code = 404;
        }
        return this.response;
    }
}

module.exports = MessageSignatureValidateEndPoint;
