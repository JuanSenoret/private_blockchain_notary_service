const Blockchain = require('../db_access/blockchain_db');

class StarsAddressEndPoint {
    constructor(address) {
        this.response = {
            "data": {},
            "code": 200
        };
        this.address = address;
    }

    async run() {
        console.log(this.address);
        return this.response;
    }
}

module.exports = StarsAddressEndPoint;
