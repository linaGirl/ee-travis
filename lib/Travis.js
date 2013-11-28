!function(){

	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, request 		= require('request')
		, ursa 			= require('ursa');



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
							crypted = keyObject.encrypt(data, 'utf8', 'base64', ursa.RSA_PKCS1_PADDING);
						} catch(err) {
							return callback(new Error('Failed to encrypt data: '+err).setName('EncryptionException'));
						}

						callback(null, crypted);
					}
				}
			}.bind(this));
		}



		/**
		 * the get() method returns a key which may reside in the env variables
		 * because travis decoded it from the secure config. if the value is not 
		 * found in the env the the default value is returned
		 *
		 * @praram <String> env name, process.env[key]
		 * @praram <String> default value to return when env[key] doesnt exist
		 */
		, get: function(key, dflt){
			return process.env[key] ? process.env[key] : dflt;
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
							this.publicKeyObject = ursa.createPublicKey(pemKey);
							this.maxPayloadLength = this.publicKeyObject.getModulus().length - 11;
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
					if (err) callback(err);
					else {
						try{
							this.publicKey = JSON.parse(body).key;
						} catch(err){
							return callback(new Error('Failed to parse publickey from travis: '+err).setName('ParserException'));
						}

						// replace RSA, the decoder fails becaue of it
						this.publicKey = this.publicKey.replace(/-----BEGIN RSA PUBLIC KEY-----/gi, '-----BEGIN PUBLIC KEY-----');
						this.publicKey = this.publicKey.replace(/-----END RSA PUBLIC KEY-----/gi, '-----END PUBLIC KEY-----');

						callback(null, this.publicKey);
					}
				}.bind(this));
			}
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
