class CheckPayload {
    constructor() {
    }

    check(payload, keysToCheck, checkStarPayload) {
        let isPayloadOk = true;
        if(payload) {
            keysToCheck.map(function(item){
                if(!payload.hasOwnProperty(item)) {
                    isPayloadOk = false;
                } else {
                    if(!payload[item]) {
                        isPayloadOk = false;
                    }
                }
            });
        }
        // In case star register payload
        if(checkStarPayload) {
            if(payload.hasOwnProperty('star')) {
                console.log(payload.star);
                const jsonStarData = JSON.parse(JSON.stringify(payload.star));
                console.log(jsonStarData.dec);
                if(jsonStarData.hasOwnProperty('dec') && jsonStarData.hasOwnProperty('ra') && jsonStarData.hasOwnProperty('story')) {
                    if(!jsonStarData.dec || !jsonStarData.ra || !jsonStarData.story) {
                        isPayloadOk = false;
                    }
                } else {
                    isPayloadOk = false;
                }
            }
        }
        return isPayloadOk;
    }
}

module.exports = CheckPayload;