const CheckPayload = require('../common/check_payload');
const RequestValidationDB = require('../db_access/request_validation_db');
const RequestValidation = require('../model/request_validation');

class RequestValidationEndPoint {
    constructor(payload, validationWindow) {
        this.response = {"data": {},
                         "code": 200};
        this.payload = payload;
        this.validationWindow = validationWindow;
    }

    async run() {
        const checkPayload = new CheckPayload();
        const isPayloadOk = checkPayload.check(this.payload, ['address'], false);
        if(isPayloadOk) {
            const requestValidationDB = new RequestValidationDB();
            // Check if a previous request for the same address was added to the DB. Assumption only one request per Address at time
            let prevRequestValidation = '';
            await requestValidationDB.getLevelDBData(this.payload.address)
            .then((value) => {
                prevRequestValidation = value;
            })
            .catch((err) => {
                console.log('No previous pending request');
            });
            if(!prevRequestValidation) {
                const requestValidation = new RequestValidation();
                requestValidation.address = this.payload.address;
                requestValidation.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
                requestValidation.message = this.payload.address + ':' + requestValidation.requestTimeStamp + ':starRegistry';
                const addRequestValidationToDB = await requestValidationDB.addRequestValidation(requestValidation);
                if (addRequestValidationToDB) {
                    this.response.data = {
                        "address": requestValidation.address,
                        "requestTimeStamp": requestValidation.requestTimeStamp,
                        "message": requestValidation.message,
                        "validationWindow": this.validationWindow
                    };
                    this.response.code = 200;
                } else {
                    this.response.data = {
                        "msg": "Not Successfully Done",
                        "error": "Request Validation could not be saved in our DB"
                    };
                    this.response.code = 404;
                }
            } else {
                // Check if request is not expired
                const jsonPrevReqValidation = JSON.parse(prevRequestValidation);
                const currentTimeStamp = new Date().getTime().toString().slice(0,-3);
                const currentvalidationWindow = this.validationWindow - (currentTimeStamp - jsonPrevReqValidation.requestTimeStamp);
                if ((currentTimeStamp - jsonPrevReqValidation.requestTimeStamp) > this.validationWindow) {
                    // Delete the request validation from DB
                    await requestValidationDB.deleteLevelDBData(jsonPrevReqValidation.address)
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
                    console.log('Request Validation Pending');
                    this.response.data = {
                        "address": jsonPrevReqValidation.address,
                        "requestTimeStamp": jsonPrevReqValidation.requestTimeStamp,
                        "message": jsonPrevReqValidation.message,
                        "validationWindow": currentvalidationWindow
                    };
                    this.response.code = 200;
                }
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

module.exports = RequestValidationEndPoint;
