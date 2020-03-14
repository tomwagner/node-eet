"use strict";

import crypto from 'crypto';


/**
 * Generates PKP (podpisovy kod poplatnika)
 * @see http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1.pdf (section 4.1)
 */
export const generatePKP = (privateKey, { dic_popl, id_provoz, id_pokl, porad_cis, dat_trzby, celk_trzba }) => {
	const options = [dic_popl, id_provoz, id_pokl, porad_cis, dat_trzby, celk_trzba];
	const strToHash = options.join('|');
	return signSha256Base64(privateKey, strToHash);
};

/**
 * Generates BKP (bezpecnostni kod poplatnika)
 * @see http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1.pdf (section 4.2)
 */
export const generateBKP = (pkp) => {
	const buffer = Buffer.from(pkp, 'base64');
	const sha1str = hashSha1Hex(buffer);
	return sha1str.match(/(.{1,8})/g).join('-');
};


export const signSha256Base64 = (privateKey, data) => {
	const sign = crypto.createSign('rsa-sha256');
	sign.write(data);
	sign.end();
	return sign.sign(privateKey, 'base64');
};


export const hashSha1Hex = data => {
	const hash = crypto.createHash('sha1');
	hash.write(data);
	// hash.end();
	// ^^^ this causes to return constant hash no matter what passed on Node.js 10.x
	// because it causes new data to be passed to the stream in and new hash is calculated (digest returns the last one)
	// note: it causes the same thing even in Node.js 13.* when hash.on('readable', ...) listener is set up
	return hash.digest('hex');
};


export const hashSha256Base64 = data => {
	const hash = crypto.createHash('sha256');
	hash.write(data);
	hash.end();
	return hash.digest('base64');
};

/**
 * Parse PKCSC#1 RSA private key and extracts the private key
 * @returns {string}
 */
export const getPublicKey = certificate => {
	return certificate
		.toString()
		.replace(/\r?\n/g, '')
		.replace(/-----BEGIN CERTIFICATE-----([A-Za-z0-9+/=]+)-----END CERTIFICATE-----/, '$1');
};
