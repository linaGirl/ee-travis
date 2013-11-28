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

### travis.encrypt()

encrypts data with the given public key, the public key will be downloaded from the travis repository if required

	travis.encrypt('MY_ENV_VARIABLE=mySecureValue', function(err, secureData){
		if (err) log.error('failed to encrypt data:'+err);
		else log('Encrypted data: '+secureData);
	};


### travis.getPublicKey()

returns the public key, the public key will be downloaded from the travis repository if required

	travis.getPublicKey(function(err, publikKey){
		if (err) log.error('failed to fetch publickey:'+err);
		else log('Public Key: '+secureData);
	};

