
	
	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, fs 			= require('fs')
		, assert 		= require('assert');



	var Travis = require('../')





	describe('Travis', function(){
		var travis = new Travis({
			repository: 'eventEmitter/ee-bookshelf-schema'
		});

		it('Should be able to get a repository key', function(done){
			travis.getPublicKey(done);
		});

		it('Should be able to decode the repository key', function(done){
			travis.getPublicKeyObject(done);
		});

		it('Should be able to encrypt data', function(done){
			travis.encrypt('DB_PASS=mySecuureData', done);
		});
	});



	describe('Travis', function(){
		var travis = new Travis({
			publicKey: fs.readFileSync(__dirname+'/pub.pem')
		});

		it('Should be able to encrypt data without getting the key from the repository', function(done){
			travis.encrypt('DB_PASS=mySecuureData', done);
		});
	});
	