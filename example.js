"use strict";

const eet = require('./index');


const options = {
	privateKey: '...',
	certificate: '...',
	playground: true,
	currentDate: new Date(),
};

// polozky, ktere se posilaji do EET
const items = {

	dicPopl: 'CZ1212121218',
	idProvoz: '273',
	idPokl: '/5546/RO24',

	poradCis: '0/6460/ZQ42',
	datTrzby: new Date(),
	celkTrzba: 1000,

};

// <Data dic_popl="CZ00000019" id_provoz="71" id_pokl="MC007" porad_cis="26-jre-90"
// dat_trzby="2018-04-11T09:21:05+02:00" celk_trzba="1000.00" urceno_cerp_zuct="1000.00"
// rezim="0" />


eet(options, items)
	.then(response => {

		console.log(response);

	})
	.catch(err => {

		console.log(err);

	});
