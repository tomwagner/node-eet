"use strict";

const { EETClient } = require('../dist/EETClient');

const fs = require('fs');


const PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/private.pem');
const CERTIFICATE = fs.readFileSync('./test/certificate-CZ1212121218/certificate.pem');


const options = {
	privateKey: PRIVATE_KEY,
	certificate: CERTIFICATE,
	playground: true,
	timeout: 2000,
	measureResponseTime: true,
	offline: true,
};

const items = {

	// uuidZpravy: uuid.v4(), // by default
	// datOdesl: new Date(), // by default
	prvniZaslani: true,
	overeni: false,

	dicPopl: 'CZ1212121218',
	idProvoz: 273,
	idPokl: '/554/RO24',

	poradCis: '0/6460/ZQ42',
	datTrzby: new Date(),

	// celkTrzba: 100000, // 1000 CZK
	// urcenoCerpZuct: 100000, // 1000 CZK

	celkTrzba: 12100, // 121 CZK
	zaklDan1: 10000, // 100 CZK
	dan1: 2100, // 21 CZK
	cerpZuct: 12100, // 121 CZK

	rezim: 0,

};

const client = new EETClient(options);
client.request(items)
	.then(({ request, response }) => {

		console.log('ok', response);

	})
	.catch(err => {

		console.error('error', err);

	});
