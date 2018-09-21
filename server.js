const Hapi = require('hapi');
const Blockchain = require('./db_access/blockchain_db');
const CheckValidationWindow = require('./common/validation_window_expiration');
const BlockEndPoint = require('./services/block_endpoint');
const RequestValidationEndPoint = require('./services/request_validation_endpoint');
const MessageSignatureValidateEndPoint = require('./services/message_signature_validate_endpoint');
const StarsBlockAddressEndPoint = require('./services/stars_block_address_endpoint');
const StarBlockHashEndPoint = require('./services/star_block_hash_endpoint');
const StarBlockHeightEndPoint = require('./services/star_block_height_endpoint');

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

// Fetch star blocks for address
server.route({
    method:'GET',
    path:'/stars/address:{address}',
    handler:async function(request,h) {
        const address = encodeURIComponent(request.params.address);
        const starsBlockAddressEndPoint = new StarsBlockAddressEndPoint(address);
        const responseEndpoint = await starsBlockAddressEndPoint.run();
        const response = h.response(responseEndpoint.data);
        response.code(responseEndpoint.code);
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Fetch star block for hash
server.route({
    method:'GET',
    path:'/stars/hash:{hash}',
    handler:async function(request,h) {
        const hash = encodeURIComponent(request.params.hash);
        const starBlockHashEndPoint = new StarBlockHashEndPoint(hash);
        const responseEndpoint = await starBlockHashEndPoint.run();
        const response = h.response(responseEndpoint.data);
        response.code(responseEndpoint.code);
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Fetch star block for height
server.route({
    method:'GET',
    path:'/block/{height}',
    handler:async function(request,h) {
        const height = encodeURIComponent(request.params.height);
        const starBlockHeightEndPoint = new StarBlockHeightEndPoint(height);
        const responseEndpoint = await starBlockHeightEndPoint.run();
        const response = h.response(responseEndpoint.data);
        response.code(responseEndpoint.code);
        response.header('Content-Type', 'application/json; charset=utf-8');
        return response;
    }
});

// Endpoint to test existing star in the blockchain
server.route({
    method:'GET',
    path:'/star/exist/{starHash}',
    handler:async function(request,h) {
        const blockChainDB = new Blockchain();
        const starHash = encodeURIComponent(request.params.starHash);
        let blockByStarHash = '';
        await blockChainDB.getBlockByHashStar(starHash)
        .then((value) => {
            blockByStarHash = value;
        })
        .catch((value, err) => {
            blockByStarHash = value;
            console.log('An error ocurred during fetching data from request validation DB. Error: ' + err);
        });
        if(blockByStarHash) {
            console.log(blockByStarHash);
            response = h.response({"msg": "Successfully Done",
                               "error": ""});
            response.code(200);
        } else {
            response = h.response({"msg": "Not found",
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
