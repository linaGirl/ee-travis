# ee-travis

Encode private env varibles for travis using a travis public key

## installation

	npm install ee-travis

## build status

[![Build Status](https://travis-ci.org/eventEmitter/ee-travis.png?branch=master)](https://travis-ci.org/eventEmitter/ee-travis)


## API

The library fetches the repository public key from travis when not set using the construcotr or the setPublicKey() method.

### Contructor
	
	var Travis = require('ee-travis');

	// get public key from repo
	var travis = new Travis({ 
		repository: 'eventEmitter/ee-travis'
	});

	// add public key via constructor
	var travis = new Travis({ 
		publicKey: '-----BEGIN PUBLIC KEY--...'
	});

### travis.encrypt(data, cb)

encrypts data with the given public key, the public key will be downloaded from the travis repository if required

	travis.encrypt('MY_ENV_VARIABLE=mySecureValue', function(err, secureData){
		if (err) log.error('failed to encrypt data:'+err);
		else log('Encrypted data: '+secureData);
	};


### travis.getPublicKey(cb)

returns the public key, the public key will be downloaded from the travis repository if required

	travis.getPublicKey(function(err, publikKey){
		if (err) log.error('failed to fetch publickey:'+err);
		else log('Public Key: '+secureData);
	};


### travis.get(key, defaultValue)

returns either the key from the process env or the default value

	var mySecurePassword = travis.get('DB_PASS', config.password);


### travis.getMaxPayloadLength(cb)

returns the maximal length of the payload for the current publickey

	travis.getMaxPayloadLength(function(err, maxLength){
		if (err) log.error('failed to get max public key payload length:'+err);
		else log('max payload length: '+maxLength);
	});




## CHANGELOG

- 0.1.0: inital release
- 0.1.1: added the get() method
- 0.1.2: added the getMaxPayloadLength() method