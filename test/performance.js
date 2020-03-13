"use strict";

const { EETClient } = require('../src/EETClient');
const fs = require('fs');


const PRIVATE_KEY = fs.readFileSync('./test/keys/private.pem');
const CERTIFICATE = fs.readFileSync('./test/keys/certificate.pem');


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

	rezim: 0,

};

const TEST_CASES = 5;
const start = process.hrtime();
const timing = [];
const test = [];

const client = new EETClient(options);

for (let i = 0; i < TEST_CASES; i++) {

	const time = process.hrtime();

	test.push(
		client.request(items)
			.then(response => {

				const diff = process.hrtime(time);

				const elapsedMilliseconds = (diff[0] * 1000) + (diff[1] / 1000 / 1000);

				const processTime = Math.round(elapsedMilliseconds * 100) / 100 - response.duration;

				timing.push(processTime);

				//console.log('Processed in', elapsedMilliseconds, response);

			})
			.catch(err => {

				console.log(err);

			}),
	);

}

Promise.all(test)
	.then(() => {

		const diff = process.hrtime(start);
		const elapsedMilliseconds = (diff[0] * 1000) + (diff[1] / 1000 / 1000);

		const totalProcessTime = timing.reduce((sum, value) => (sum + value), 0);
		const averageProcessTime = totalProcessTime / timing.length;

		console.log('total tests:', timing.length);
		timing.forEach((t, i) => console.log(`  ${i + 1}. - ${t.toFixed(2)} ms`));
		console.log('total process time', totalProcessTime.toFixed(2) + ' ms');
		console.log('average process time', averageProcessTime.toFixed(2) + ' ms');
		console.log('time to complete:', elapsedMilliseconds.toFixed(2));

	});
