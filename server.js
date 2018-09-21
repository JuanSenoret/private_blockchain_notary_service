const Hapi = require('hapi');
const SHA256 = require('crypto-js/sha256');
const Blockchain = require('./db_access/blockchain_db');
const Block = require('./model/block');
const CheckValidationWindow = require('./common/validation_window_expiration');
const BlockEndPoint = require('./services/block_endpoint');
const RequestValidationEndPoint = require('./services/request_validation_endpoint');
const MessageSignatureValidateEndPoint = require('./services/message_signature_validate_endpoint');
const StarsAddressEndPoint = require('./services/stars_address_endpoint');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// Configuration
const validationWindow = 300; // 5 min to sign the message and validate the submition
const whiteListTimeWall = 5*1000; // Every 2 second check the list of registered address to delete the expired register address
const checkValidationWindow = new CheckValidationWindow(validationWindow);

// Star registration endpoint
server.route({
    method:'POST',
    path:'/block',
    handler:async function(request,h) {
        const blockEndPoint = new BlockEndPoint(request.payload, validationWindow);
        const responseEndpoint = await blockEndPoint.run();
        const response = h.response(responseEndpoint.data);
        response.code(responseEndpoint.code);
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Request validation endpoint
server.route({
    method:'POST',
    path:'/requestValidation',
    handler:async function(request,h) {
        const requestValidationEndPoint = new RequestValidationEndPoint(request.payload, validationWindow);
        const responseEndpoint = await requestValidationEndPoint.run();
        const response = h.response(responseEndpoint.data);
        response.code(responseEndpoint.code);
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Request validation endpoint
server.route({
    method:'POST',
    path:'/message-signature/validate',
    handler:async function(request,h) {
        const messageSignatureValidateEndPoint = new MessageSignatureValidateEndPoint(request.payload, validationWindow);
        const responseEndpoint = await messageSignatureValidateEndPoint.run();
        const response = h.response(responseEndpoint.data);
        response.code(responseEndpoint.code);
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Request validation endpoint
server.route({
    method:'GET',
    path:'/stars/address:{address}',
    handler:async function(request,h) {
        const address = encodeURIComponent(request.params.address);
        const starsAddressEndPoint = new StarsAddressEndPoint(address);
        const responseEndpoint = await starsAddressEndPoint.run();
        const response = h.response(responseEndpoint.data);
        response.code(responseEndpoint.code);
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Endpoint to test add block in the blockchain
server.route({
    method:'POST',
    path:'/test/block',
    handler:async function(request,h) {
        const blockChainDB = new Blockchain();
        const payload = request.payload;
        const jsonStarData = JSON.parse(JSON.stringify(payload.star));
        const newBlock = new Block(jsonStarData.story,
                                   jsonStarData.ra,
                                   jsonStarData.dec,
                                   payload.address,
                                   SHA256(jsonStarData.ra + jsonStarData.dec).toString());
        const addedBlock = await blockChainDB.addBlock(newBlock);
        if(addedBlock) {
            console.log(addedBlock);
            response = h.response({"msg": "Successfully Done",
                               "error": ""});
            response.code(200);
        } else {
            response = h.response({"msg": "NOT Successfully Done",
                                    "error": ""});
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

// Start to check if request for validation are not expired
function repeatLoop() {
    checkValidationWindow.checkExpiration();
    setTimeout(repeatLoop, whiteListTimeWall);
}
repeatLoop();
