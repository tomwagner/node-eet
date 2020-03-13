"use strict";

import fs from 'fs';
import test from 'ava';
const { EETClient } = require('../src/EETClient');
import * as crypto from '../src/crypto';
import * as utils from '../src/utils';
import * as schema from '../src/schema';


const PRIVATE_KEY = fs.readFileSync('./test/certificate-CZ1212121218/private.pem');
const CERTIFICATE = fs.readFileSync('./test/certificate-CZ1212121218/certificate.pem');
const TEST_PKP = 'QEIvS/3ETSJuAK7agvrVlQUN1Oi4DoPrNBmC+sQueNknhsr48RGElLpzTnxH/KUdfde91xFOcRbgyiXapK4beRTRaZ/CQ1qug4Y7JbnhB60WUH61E2NlTzxTfmidcNIlQohrVDC5awyrZQj2T1cG+3gGPHQ/oveM4ozt5gLaHFDwl421eLQctxeQfXK4dDrZDANX6AVB8Q92X89o9YouISCjIrYk7ZnLhDe+cXxlB0GGJq5i1P2uALOgQyZBU5mBWLolL2n06C73Sja7HjCt9E8s6bV9y1cJZcjXo1tWOEUqfU8ir/wYstO11v/JmiRADGwGoCuCszktUmf4K3PaDg==';


test('generatePKP', t => {

	const result = crypto.generatePKP(PRIVATE_KEY, {
		dic_popl: 'CZ1212121218',
		id_provoz: '273',
		id_pokl: '/5546/RO24',
		porad_cis: '0/6460/ZQ42',
		dat_trzby: '2016-08-05T00:30:12+02:00',
		celk_trzba: '34113.00',
	});

	t.is(result, TEST_PKP);

});

test('generateBKP', t => {
	t.is(crypto.generateBKP(TEST_PKP), 'b8f8392b-f73c8643-0ba0c171-142caa01-4c7a4078');
});

test('convertDateToString', t => {

	const date = new Date('2016-08-05T00:30:12+02:00');

	t.is(utils.convertDateToString(date), '2016-08-04T22:30:12Z');

});

test('convertAmountToString', t => {
	t.is(utils.convertAmountToString(1200), '12.00');
});

test('parseRequest required', t => {

	t.notThrows(() => schema.parseRequest({
		dicPopl: 'CZ1212121218',
		idPokl: '1',
		idProvoz: 1,
		poradCis: '2016-0001s',
		datTrzby: new Date(),
		celkTrzba: 1000,
	}));

	t.throws(() => schema.parseRequest({
		idPokl: '1',
	}));

});

test('validateVatId', t => {
	t.truthy(utils.validateVatId('CZ1212121218'));
	t.falsy(utils.validateVatId(1212121218));
});

test('validateIdProvoz', t => {
	t.truthy(utils.validateIdProvoz(25));
	t.falsy(utils.validateIdProvoz(12345678));
});

test('validateIdPokl', t => {
	t.truthy(utils.validateIdPokl('0aA.,:;/#-_'));
	t.falsy(utils.validateIdPokl('@@@'));
});

test('validatePoradCis', t => {
	t.truthy(utils.validatePoradCis('0aA.,:;/#-_'));
	t.falsy(utils.validatePoradCis('@@@'));
});

test('validateAmount', t => {
	t.truthy(utils.validateAmount(1000));
	t.truthy(utils.validateAmount(0));
	t.truthy(utils.validateAmount(-1000));
	t.falsy(utils.validateAmount(78.8));
	t.falsy(utils.validateAmount('1000.00'));
	t.falsy(utils.validateAmount('1000,00'));
	t.falsy(utils.validateAmount('test'));
});

test('parseRequest', t => {

	const result = schema.parseRequest({
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2016-08-05T00:30:12+02:00'),
		celkTrzba: -3411380,
		idProvoz: 273,
	});

	const expected = {
		dic_popl: 'CZ1212121218',
		id_pokl: '/5546/RO24',
		porad_cis: '0/6460/ZQ42',
		dat_trzby: '2016-08-04T22:30:12Z',
		celk_trzba: '-34113.80',
		id_provoz: 273,
		rezim: 0,
	};

	t.deepEqual(result.data, expected);

});

test('do request', async t => {

	const data = {
		prvniZaslani: true,
		overeni: false,
		dicPopl: 'CZ1212121218',
		idPokl: '/5546/RO24',
		poradCis: '0/6460/ZQ42',
		datTrzby: new Date('2016-08-05T00:30:12+02:00'),
		celkTrzba: 3411300,
		idProvoz: 273,
	};

	const options = {
		playground: true,
		privateKey: PRIVATE_KEY,
		certificate: CERTIFICATE,
	};

	const { response: { fik } } = await new EETClient(options).request(data);

	t.truthy(fik && fik.length === 39);

	t.log('fik', fik);

	// TODO test offline

});
