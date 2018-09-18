/* ===== Block Class ==============================
|  Class with a constructor for block 			  |
|  ===============================================*/
class RequestValidation{
	constructor(){
     this.address = "",
     this.message = "",
     this.requestTimeStamp = 0,
     this.messageSignature = false
    }
};

module.exports = RequestValidation;
