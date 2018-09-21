/* ===== Block Class ==============================
|  Class with a constructor for block 			  |
|  ===============================================*/
class Block{
	constructor(story='',ra='', dec='', address='', hashStar=''){
     this.hash = '',
     this.height = 0,
     this.body = {"address":address,
                  "star": {
                    "dec": dec,
                    "ra": ra,
                    "story": story,
                    "hashStar": hashStar
                  }
                 },
     this.time = 0,
     this.previousBlockHash = ""
    }
};

module.exports = Block;