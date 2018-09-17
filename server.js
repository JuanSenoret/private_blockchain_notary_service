const Hapi = require('hapi');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

server.route({
    method:'POST',
    path:'/block',
    handler:async function(request,h) {
        const payload = request.payload;
        console.log(payload);
        let response;
        response = h.response({"msg": "Successfully"});
        response.code(200);
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