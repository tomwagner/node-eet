"use strict";

import test from 'ava';
import * as utils from '../src/utils';


test('convertDateToString', t => {

	const date = new Date('2016-08-05T00:30:12+02:00');

	t.is(utils.convertDateToString(date), '2016-08-04T22:30:12Z');

});

test('convertAmountToString positive', t => {
	t.is(utils.convertAmountToString(1200), '12.00');
});

test('convertAmountToString negative', t => {
	t.is(utils.convertAmountToString(-123456), '-1234.56');
});

test('convertAmountToString 0.12', t => {
	t.is(utils.convertAmountToString(12), '0.12');
});

test('convertAmountToString 0.01', t => {
	t.is(utils.convertAmountToString(1), '0.01');
});

test('validateVatId', t => {
	t.truthy(utils.validateCzVatId('CZ1212121218'));
	t.falsy(utils.validateCzVatId(1212121218));
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

test('validateDate', t => {

	t.truthy(utils.validateDate('2020-03-05T19:56:02+01:00'));
	t.falsy(utils.validateAmount('1234-03-05T19:56:02+01:00'));
	t.falsy(utils.validateDate('2020-03-50T19:56:02+01:00'));
	t.falsy(utils.validateDate('yesterday'));

});
