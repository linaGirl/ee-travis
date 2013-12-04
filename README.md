# ee-travis

Encode private env varibles for travis using a travis public key

## installation

	npm install ee-travis

## build status

[![Build Status](https://travis-ci.org/eventEmitter/ee-travis.png?branch=master)](https://travis-ci.org/eventEmitter/ee-travis)


## API

The library fetches the repository public key from travis or github when not set using the construcotr or the setPublicKey() method.

### Contructor

you have to pass either a publickey or a repo name. if you are using travis pro you should pass your github user & password.
	
	var Travis = require('ee-travis');

	// get public key from repo
	var travis = new Travis({ 
		repository: 'eventEmitter/ee-travis'
	});

	// add public key via constructor
	var travis = new Travis({ 
		publicKey: '-----BEGIN PUBLIC KEY--...'
	});

	// travis pro, get public key from repo
	var travis = new Travis({ 
		  repository: 'eventEmitter/ee-travis'
		, username: 'eventEmitter'
		, password: 'yes, this is my real password'
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



### travis.getMaxPayloadLength(cb)

returns the maximal length of the payload for the current publickey

	travis.getMaxPayloadLength(function(err, maxLength){
		if (err) log.error('failed to get max public key payload length:'+err);
		else log('max payload length: '+maxLength);
	});



### travis.get(key, defaultValue)

returns either the key from the travis.js file, the process env or the default value. This method may also invoked on the Class itself instead on an instance of it.

	var mySecurePassword = travis.get('DB_PASS', config.password);
	var mySecurePassword = Travis.get('DB_PASS', config.password);

the travis.js file must be located in the project.root dir, it should contain hashes

	module.exports = {
		  DB_HOST: 'mysecureHost.tld'
		, DB_PASS: 'bestPasswordEver'
		, DB_PORT: 1337
	};




## CHANGELOG

- 0.1.0: inital release
- 0.1.1: added the get() method
- 0.1.2: added the getMaxPayloadLength() method
- 0.1.3: added support for the travis.js file
- 0.1.4: added check for correct result wehn downloadin certificate
- 0.1.5: added support for travis pro
- 0.1.6: bugfix release
- 0.1.7: bugfix release
- 0.1.8: Added class method «get»