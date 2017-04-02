"use strict";

const fs = require('fs');
const eet = require('../dist/index');


const PRIVATE_KEY = fs.readFileSync('./test/keys/private.pem');
const CERTIFICATE = fs.readFileSync('./test/keys/certificate.pem');


const options = {
	privateKey: PRIVATE_KEY,
	certificate: CERTIFICATE,
	playground: true,
	timeout: 2000,
	measureResponseTime: true,
	offline: true
};

const items = {

	// uuidZpravy: uuid.v4(), // by default
	// datOdesl: new Date(), // by default
	prvniZaslani: true,
	overeni: false,

	dicPopl: 'CZ1212121218',
	idProvoz: '273',
	idPokl: '/5546/RO24',

	poradCis: '0/6460/ZQ42',
	datTrzby: new Date(),

	// celkTrzba: 1000.00,
	// urcenoCerpZuct: 1000.00,

	celkTrzba: 121.00,
	zaklDan1: 100.00,
	dan1: 21.00,
	cerpZuct: 121.00,

	rezim: 0

};


eet(options)
	.then(client => {

		client.request(items)
			.then(response => {

				console.log(response);

			})
			.catch(err => {

				console.log(err);

			})

	});
