const RequestValidationDB = require('../db_access/request_validation_db');

class CheckValidationWindow {
    constructor(validationWindow) {
        this.validationWindow = validationWindow;
        this.requestValidationDB = new RequestValidationDB();
    }

    async checkExpiration() {
        let dbItems = 0;
        await this.requestValidationDB.getLevelDBItems()
        .then((value) => {
            dbItems = value;
        })
        .catch((value, err) => {
            dbItems = value;
            console.log('An error ocurred during fetching data from request validation DB');
        });
        if(dbItems) {
            dbItems.forEach(async (element) => {
                const currentTimeStamp = new Date().getTime().toString().slice(0,-3);
                const jsonElementData = JSON.parse(element.value);
                if ((currentTimeStamp - jsonElementData.requestTimeStamp) > this.validationWindow) {
                    console.log('Element expired');
                    // Delete the element in levelDB
                    await this.requestValidationDB.deleteLevelDBData(jsonElementData.address)
                    .then(() => {
                        console.log('Register validation for address: ' + jsonElementData.address + ' was successfully deleted due expiration time.');
                    })
                    .catch((err) => {
                        console.log('Register validation for address: ' + jsonElementData.address + ' was NOT successfully deleted due expiration time. Error: ' + err);
                    });
                }
            });
        }
    }
}

module.exports = CheckValidationWindow;