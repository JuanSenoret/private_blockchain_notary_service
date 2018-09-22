# private_blockchain_notary_service

For this project, we’ll build a RESTful API using a Node.js framework that will interface with the private blockchain we completed Project 4 - "Private Blockchain Notary Service". We’ll want to build this project out in steps.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Clone the repository in your local environment
```
git clone <url GitHuib Repo>
```
- Go to the project folder
```
cd <project name>
```
- Install the dependencies (crypto-js, level and hapi)
```
npm install
```
- To start the server
```
npm start
```

## Endpoints definition

### Post Request Validation
----
  Web API post endpoint validates request with JSON response. The web API will accept a Blockchain ID (The Blockchain ID is your wallet address, take a look again at Course 2 Blockchain Identity) with a request for star registration.

* **URL**

    http://localhost:8000/requestValidation

* **Method:**

    `POST`
  
*  **URL Params**

   None

* **Data Params**

  **Required:**
 
    `{"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"}`

 **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "requestTimeStamp": "1532296090",
  "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
  "validationWindow": 300
}`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Example Content:** `{msg: "Validation Window expired. Please try again.", error: "Validation Window expired"}`

* **Sample Call:**

  ```
  curl -X "POST" "http://localhost:8000/requestValidation"
     -H 'Content-Type: application/json; charset=utf-8'
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"}'
  ```

### Post Message Signature Validation
----
  Web API post endpoint validates message signature with JSON response. This signature proves the users blockchain identity. Upon validation of this identity, the user should be granted access to register a single star. To sing the message you can use electron wallet for example

* **URL**

    http://localhost:8000/message-signature/validate

* **Method:**

    `POST`
  
*  **URL Params**

   None

* **Data Params**

  **Required:**
 
    `{"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="}`

 **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{
  "registerStar": true,
  "status": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "requestTimeStamp": "1532296090",
    "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
    "validationWindow": 193,
    "messageSignature": "Success"
  }
}`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Example Content:** `{msg:"Please request a validation previous to validate your message signature","error":"No previous request validation data in DB"}`

* **Sample Call:**

  ```
  curl -X "POST" "http://localhost:8000/message-signature/validate"
     -H 'Content-Type: application/json; charset=utf-8'
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="}'
  ```

### Post Star registration Endpoint
----
  Web API post endpoint to submit star. After the message signature is validated the user can submit a star. A star can only once submitted.

* **URL**

    http://localhost:8000/block

* **Method:**

    `POST`
  
*  **URL Params**

   None

* **Data Params**

  **Required:**
 
    `{"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }}`

 **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{
  "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
  "height": 1,
  "body": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "ra": "16h 29m 1.0s",
      "dec": "-26° 29' 24.9",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
    }
  },
  "time": "1532296234",
  "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Example Content:** `{"msg":"You are trying to register an submitted star. Please register another star","error":"Star already registered in blockchain DB"}`

* **Sample Call:**

  ```
  curl -X "POST" "http://localhost:8000/block"
     -H 'Content-Type: application/json; charset=utf-8'
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"}}'
  ```

### Get Stars Blocks by Address
----
  Returns json data with the stars data registered under the address.

* **URL**

  http://localhost:8000/stars/address:[ADDRESS]

* **Method:**

    `GET`
  
*  **URL Params**

   **Required:**
 
    `ADDRESS=[HEX]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `[
  {
    "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
    "height": 1,
    "body": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "star": {
        "ra": "16h 29m 1.0s",
        "dec": "-26° 29' 24.9",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
      }
    },
    "time": "1532296234",
    "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
  },
  {
    "hash": "6ef99fc533b9725bf194c18bdf79065d64a971fa41b25f098ff4dff29ee531d0",
    "height": 2,
    "body": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "star": {
        "ra": "17h 22m 13.1s",
        "dec": "-27° 14' 8.2",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
      }
    },
    "time": "1532330848",
    "previousBlockHash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
  }
]`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{"msg": "No blocks found for this address", "error": "No blocks found in the blockchain for the address 142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"}`

* **Sample Call:**

  ```
  curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
  ```

### Get Stars Blocks by Hash
----
  Returns json data with the star data registered under the hash.

* **URL**

  http://localhost:8000/stars/hash:[HASH]

* **Method:**

    `GET`
  
*  **URL Params**

   **Required:**
 
    `HASH=[HEX]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{
  "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
  "height": 1,
  "body": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "ra": "16h 29m 1.0s",
      "dec": "-26° 29' 24.9",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
      "storyDecoded": "Found star using https://www.google.com/sky/"
    }
  },
  "time": "1532296234",
  "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{"msg":"No block found for this hash","error":"No block found in the blockchain for the hash a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"}`

* **Sample Call:**

  ```
  curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
  ```

### Get Stars Blocks by Height
----
  Returns json data with the star data registered under the height.

* **URL**

  http://localhost:8000/block/[HEIGHT]

* **Method:**

    `GET`
  
*  **URL Params**

   **Required:**
 
    `HEIGHT=[integer]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{
  "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
  "height": 1,
  "body": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "ra": "16h 29m 1.0s",
      "dec": "-26° 29' 24.9",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
      "storyDecoded": "Found star using https://www.google.com/sky/"
    }
  },
  "time": "1532296234",
  "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{"msg":"No block found for this height","error":"No block found in the blockchain for the height 4"}`

* **Sample Call:**

  ```
  curl "http://localhost:8000/block/1"
  ```