!function(){

	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, request 		= require('request')
		, project 		= require('ee-project')
		, forge 		= require('node-forge')
		, Github		= require('github')
		, cp 			= require('child_process')
		, fs 			= require('fs');


	var travisConfig = null;

	// try to mount the travis.js file
	try {
		travisConfig = require(project.root+'travis.js');
	} catch(err){}



	module.exports = new Class({

		travisUrl: "https://api.travis-ci.org/repos/$repo/key"

		/**
		 * class consturctor
		 *
		 * @praram <Object> options object with a «respository» property
		 */
		, init: function(options) {
			this.repository = options.repository;
			this.publicKey = options.publicKey;
			this.githubPassword = options.password;
			this.githubUsername = options.username;

			if (Buffer.isBuffer(this.publicKey)) this.publicKey = this.publicKey.toString();			

			if (!this.repository && !this.publicKey) throw new Error('The constructor must receive an object with the «repository» or the «publicKey» property!').setName('InvalidArgumentException');	
		}



		/**
		 * the encrypt() method encrypts data with the repositories publc key
		 *
		 * @praram <String> utf8 encoded string to encrypt
		 * @praram <Function> callback(err, encryptedString)
		 */
		, encrypt: function(data, callback) {
			this.getPublicKeyObject(function(err, keyObject){
				if (err) callback(err);
				else {
					var crypted;

					if (this.maxPayloadLength < data.length){
						callback(new Error('The payload is too large, cannot encrypt, max len for this publickey is '+this.maxPayloadLength+', payload is '+data.length).setName('InvalidArgumentException'));
					}
					else {
						try{
							crypted = keyObject.encrypt(data, 'RSAES-PKCS1-V1_5');
						} catch(err) {log(err);
							return callback(new Error('Failed to encrypt data: '+err).setName('EncryptionException'));
						}

						callback(null, crypted);
					}
				}
			}.bind(this));
		}



		/**
		 * the get() method returns returns the value exported by the travis.js
		 * file, if that file cannot be loaded it will return the value from the
		 * environment variables, if available. if that fails too a default value
		 * is returned
		 *
		 * @praram <String> variable name, process.env[key]
		 * @praram <String> default value to return when env[key] doesnt exist
		 */
		, get: function(key, dflt){
			return travisConfig && travisConfig[key] ? travisConfig[key] : process.env[key] ? process.env[key] : dflt;
		}

		/**
		 * the get() method returns returns the value exported by the travis.js
		 * file, if that file cannot be loaded it will return the value from the
		 * environment variables, if available. if that fails too a default value
		 * is returned
		 *
		 * @praram <String> variable name, process.env[key]
		 * @praram <String> default value to return when env[key] doesnt exist
		 */
		, 'static get': function(key, dflt){
			return travisConfig && travisConfig[key] ? travisConfig[key] : process.env[key] ? process.env[key] : dflt;
		}



		/**
		 * the getMaxPayloadLength() returns the maximal length of the payload 
		 * for the current publickey
		 *
		 * @praram <Function> callback(err, length)
		 */
		, getMaxPayloadLength: function(callback) {
			this.getPublicKeyObject(function(err, key){
				if (err) callback(err);
				else callback(null, this.maxPayloadLength);
			}.bind(this));
		}


		/**
		 * the getPublicKeyObject() fetches the public key from the travis server 
		 * and creates an object where one encrypt dtaa with. you should use the
		 * encrypt method for encrypting data
		 *
		 * @praram <Function> callback(err, encryptedString)
		 */
		, getPublicKeyObject: function(callback) {
			if (this.publicKeyObject) callback(null, this.publicKeyObject);
			else {
				this.getPublicKey(function(err, pemKey){
					if (err) callback(err);
					else {
						try{
							this.publicKeyObject = forge.pki.publicKeyFromPem(pemKey);
							this.maxPayloadLength = this.publicKeyObject.n.bitLength()/8 - 11;
						} catch(err){
							return callback(new Error('Failed to decode publickey: '+err).setName('ParserException'));
						}

						callback(null, this.publicKeyObject);
					}
				}.bind(this));
			}
		}


		/**
		 * the getPublicKey() fetches the public key from the travis server and
		 * returns it in form of astring
		 *
		 * @praram <Function> callback(err, encryptedString)
		 */
		, getPublicKey: function(callback) {
			var url;

			if (this.publicKey) callback(null, this.publicKey);
			else {
				url = this.travisUrl.replace('$repo', this.repository);

				//log.debug('Requesting public key from «'+url+'» ...');
				request.get(url, function(err, response, body){
					var responseData;

					if (err) callback(err);
					else {
						try{
							responseData = JSON.parse(body);
						} catch(err){
							return callback(new Error('Failed to parse publickey from travis: '+err).setName('ParserException'));
						}

						if (!responseData || !responseData.key) {
							if (this.githubPassword){
								this._getPublicKeyFromGithub(function(err, key){
									if (err) callback(err);
									else {
										this.setPublicKey(key);
										callback(null, this.publicKey);
									}
								}.bind(this));
							}
							else callback(new Error('Failed to download public key from «'+url+'»: '+err).setName('DownloadException'));
						}
						else {
							this.setPublicKey(responseData.key);
							callback(null, this.publicKey);
						}
					}
				}.bind(this));
			}
		}



		/**
		 * the _convertSSHtoPEM() method converts a ssh encoded key into a pem encoded key
		 *
		 * @praram <String> ssh fomratted key
		 * @praram <Function> callback(err, encryptedString)
		 */
		, _convertSSHtoPEM: function(sshKey, callback){
			var path = '/tmp/ee-travis-'+Math.random()+Date.now()
				, errData = ''
				, pemKey;

			// store file on disk
			fs.writeFile(path, sshKey, function(err){
				if (err) callback(err);
				else {
					var child = cp.spawn('ssh-keygen', ['-f'+path, '-e', '-mPKCS8']);

					child.stdout.on('data', function(data){
						pemKey = data;
					}.bind(this));

					child.stderr.on('data', function(data){
						errData += data;
					}.bind(this));

					
					child.on('exit', function(code){
						if (code === 0){
							fs.unlink(path);
							callback(null, pemKey.toString());
						}
						else callback(new Error('Failed to convert ssh to pem key: '+ errData));
					})

					child.on('error', function(err){
						callback(err);
					});
				}
			}.bind(this));
		}




		/**
		 * the _getPublicKeyFromGithub() method fetcheds the travis public key from
		 * github
		 *
		 * @praram <Function> callback(err, encryptedString)
		 */
		, _getPublicKeyFromGithub: function(callback) {
			var repo = this.repository.split('/');

			if (!this.github) {
				this.github = new Github({
					  version: '3.0.0'
					, protocol: 'https'
				});
			}

			this.github.authenticate({
			      type: 'basic'
			    , username: this.githubUsername
			    , password: this.githubPassword
			});

			this.github.repos.getKeys({
				  user: repo[0]
				, repo: repo[1]
			}, function(err, keys){
				if (err) callback(err);
				else {
					var i = keys.length;

					while(i--){
						if (keys[i].title === 'magnum.travis-ci.com'){
							this._convertSSHtoPEM(keys[i].key, callback);
							return ; 
						}
					}
					
					callback(new Error('No travis publickey for repository «'+this.repository+'» found!').setName('DownloadException'));
				}
			}.bind(this));
		}


		/**
		 * the setPublicKey() method can be used to set the pem encoded key
		 * on the class so it has not to be fetched from the travis server
		 *
		 * @praram <String> pemEncodedKey pem encoeded public key
		 */
		, setPublicKey: function(pemEncodedKey){
			pemEncodedKey = pemEncodedKey.replace(/-----BEGIN RSA PUBLIC KEY-----/gi, '-----BEGIN PUBLIC KEY-----');
			this.publicKey = pemEncodedKey.replace(/-----END RSA PUBLIC KEY-----/gi, '-----END PUBLIC KEY-----');
		}
	});
}();
