const Hapi = require('hapi');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const RequestValidation = require('./model/request_validation');
const RequestValidationDB = require('./db_access/request_validation_db');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// Configuration
const validationWindow = 300; // 5 min to sign the message and validate the submition

// Request validation endpoint
server.route({
    method:'POST',
    path:'/requestValidation',
    handler:async function(request,h) {
        const payload = request.payload;
        let response;
        if(payload.hasOwnProperty("address")) {
            if(payload.address) {
                const requestValidationDB = new RequestValidationDB();
                // Check if a previous request for the same address was added to the DB. Assumption only one request per Address at time
                let prevRequestValidation = '';
                await requestValidationDB.getLevelDBData(payload.address)
                .then((value) => {
                    prevRequestValidation = value;
                })
                .catch((err) => {
                    console.log('No previous pending request');
                });
                if(!prevRequestValidation) {
                    const requestValidation = new RequestValidation();
                    requestValidation.address = payload.address;
                    requestValidation.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
                    requestValidation.message = payload.address + ':' + requestValidation.requestTimeStamp + ':starRegistry';
                    const addRequestValidationToDB = await requestValidationDB.addRequestValidation(requestValidation);
                    if (addRequestValidationToDB) {
                        response = h.response({"address": requestValidation.address,
                                        "requestTimeStamp": requestValidation.requestTimeStamp,
                                        "message": requestValidation.message,
                                        "validationWindow": validationWindow});
                        response.code(200);
                    } else {
                        response = h.response({"msg": "Not Successfully Done",
                                            "error": "Request Validation could not be saved in our DB"});
                        response.code(404);
                    }
                } else {
                    // Check if request is not expired
                    const jsonPrevReqValidation = JSON.parse(prevRequestValidation);
                    const currentTimeStamp = new Date().getTime().toString().slice(0,-3);
                    const currentvalidationWindow = validationWindow - (currentTimeStamp - jsonPrevReqValidation.requestTimeStamp);
                    if ((currentTimeStamp - jsonPrevReqValidation.requestTimeStamp) > validationWindow) {
                        // Delete the request validation from DB
                        await requestValidationDB.deleteLevelDBData(jsonPrevReqValidation.address)
                        .then(() => {
                            response = h.response({"msg": "Validation Window expired. Please try again.",
                                                "error": "Validation Window expired"});
                            response.code(200);
                        }).catch((err) => {
                            response = h.response({"msg": "An error ocurred during deleting previous request. Please contact our support team",
                                                "error": "An error ocurred during deleting previous request. Err: " + err});
                            response.code(404);
                        });
                    } else {
                        console.log('Request Validation Pending');
                        response = h.response({"address": jsonPrevReqValidation.address,
                                               "requestTimeStamp": jsonPrevReqValidation.requestTimeStamp,
                                               "message": jsonPrevReqValidation.message,
                                               "validationWindow": currentvalidationWindow});
                        response.code(200);
                    }
                }
            } else {
                response = h.response({"msg": "Not Successfully Done",
                                       "error": "Address key empty in request"});
                response.code(404);
            }
        } else {
            response = h.response({"msg": "Not Successfully Done",
                                   "error": "No data in body request"});
            response.code(404);
        }
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// TODO: Next step is create validate message endpoint to check if the message signed in electrom with the address is the same like we have.

// Request message signature validate
server.route({
    method:'POST',
    path:'/message-signature/validate',
    handler:async function(request,h) { 
        const payload = request.payload;
        let response;
        if(payload.hasOwnProperty("address") && payload.hasOwnProperty("signature")) {
            if(payload.address && payload.signature) {
                const requestValidationDB = new RequestValidationDB();
                // Get the request validation data for the address
                let requestValidationData = '';
                await requestValidationDB.getLevelDBData(payload.address)
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
                    const currentvalidationWindow = validationWindow - (currentTimeStamp - jsonReqValidationData.requestTimeStamp);
                    if ((currentTimeStamp - jsonReqValidationData.requestTimeStamp) > validationWindow) {
                        // Delete the request validation from DB
                        await requestValidationDB.deleteLevelDBData(jsonReqValidationData.address)
                        .then(() => {
                            response = h.response({"msg": "Validation Window expired. Please try again.",
                                                "error": "Validation Window expired"});
                            response.code(200);
                        }).catch((err) => {
                            response = h.response({"msg": "An error ocurred during deleting previous request. Please contact our support team",
                                                   "error": "An error ocurred during deleting previous request. Err: " + err});
                            response.code(404);
                        });
                    } else {
                        // Check if the message signature is already validated for this address
                        if (jsonReqValidationData.messageSignature) {
                            response = h.response({"address": jsonReqValidationData.address,
                                                   "requestTimeStamp": jsonReqValidationData.requestTimeStamp,
                                                   "message": jsonReqValidationData.message,
                                                   "validationWindow": currentvalidationWindow,
                                                   "messageSignature": "Success"});
                            response.code(200);
                        } else {
                            let isMessageSignatureValid = false;
                            try {
                                isMessageSignatureValid = bitcoinMessage.verify(jsonReqValidationData.message, jsonReqValidationData.address, payload.signature);
                                console.log(isMessageSignatureValid);
                            } catch(err) {
                                console.log('Server Error by verifiying message signature. ' + err);
                            }
                            if (isMessageSignatureValid) {
                                // Update the request validation data for this address to validate the signature
                                requestValidationData.messageSignature = true;
                                const updateRequestValidationToDB = await requestValidationDB.addRequestValidation(jsonReqValidationData);
                                if (updateRequestValidationToDB) {
                                    response = h.response({"address": jsonReqValidationData.address,
                                                           "requestTimeStamp": jsonReqValidationData.requestTimeStamp,
                                                           "message": jsonReqValidationData.message,
                                                           "validationWindow": currentvalidationWindow,
                                                           "messageSignature": "Success"});
                                    response.code(200);
                                } else {
                                    response = h.response({"msg": "An error occurred during DB update. Please try again to validate your message signature",
                                                           "error": "Error updating request validation in DB"});
                                    response.code(404);
                                }
                            } else {
                                response = h.response({"address": jsonReqValidationData.address,
                                                       "requestTimeStamp": jsonReqValidationData.requestTimeStamp,
                                                       "message": jsonReqValidationData.message,
                                                       "validationWindow": currentvalidationWindow,
                                                       "messageSignature": "Fail"});
                                response.code(200);
                            }
                        }
                    }
                } else {
                    // No previous request validation
                    response = h.response({"msg": "Please request a validation previous to validate your message signature",
                                           "error": "No previous request validation data in DB"});
                    response.code(404);
                }
            } else {
                response = h.response({"msg": "Not Successfully Done",
                                       "error": "address or signature key empty in request"});
                response.code(404);
            }
        } else {
            response = h.response({"msg": "Not Successfully Done",
                                   "error": "address or signature parameter missing the request"});
            response.code(404);
        }
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Start the server
async function start() {
    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
};

// Start the service
start();
