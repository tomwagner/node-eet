"use strict";

import { isDefinedAndNotNull } from './utils';
import { ValidationError, ResponseError } from './errors';


/**
 * Zkontroluje, zda jsou zadany všechny povinné položky
 */
export function requiredItems(items) {

	[
		'dicPopl',
		'idPokl',
		'idProvoz',
		'poradCis',
		'datTrzby',
		'celkTrzba'
	].forEach(item => {
		if (!isDefinedAndNotNull(items[item])) {
			throw new ValidationError(`'${item}' is required.`)
		}
	});

}

/**
 * Validace DIČ
 */
export function vatIdNumber(value) {

	if (!/^CZ[0-9]{8,10}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match pattern for VAT ID number.`)
	}

}

/**
 * Validace označení provozovny
 */
export function businessPremisesId(value) {

	if (!/^[1-9][0-9]{0,5}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match pattern for business premises ID.`)
	}

}

/**
 * Validace označení pokladny
 */
export function cashRegisterId(value) {

	if (!/^[0-9a-zA-Z\.,:;/#\-_ ]{1,20}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match pattern for cash register ID.`)
	}

}

/**
 * Validace čísla účtenky
 */
export function receiptNumber(value) {

	if (!/^[0-9a-zA-Z\.,:;/#\-_]{1,20}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match pattern for serial number of receipt.`)
	}

}

/**
 * Validace data
 */
export function date(value) {

	if (Object.prototype.toString.call(value) !== '[object Date]' || isNaN(value)) {
		throw new ValidationError(`Value '${value}' is not a date object.`);
	}

}

/**
 * Validace režimu odeslání
 */
export function regime(value) {

	if (!/^[01]$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match pattern for sale regime.`);
	}

}

/**
 * Kontrola číselných hodnot
 */
export function financialNumber(value) {

	const num = Number(value);

	if (value !== num || num < -99999999.99 || num > 99999999.99) {
		throw new ValidationError(`Value '${value}' is not a valid number.`);
	}

}

/**
 * Zpracuje chybnou odpoved
 */
export function httpResponse(response) {

	if (!response) {
		throw new ResponseError('Unable to parse response.');
	}

	const errorAttrs = response.Chyba && response.Chyba.attributes;

	if (errorAttrs) {
		throw new ResponseError(`${response.Chyba.$value} (${errorAttrs.kod})`);
	}

	const body = response.Potvrzeni && response.Potvrzeni.attributes;

	const header = response.Hlavicka && response.Hlavicka.attributes;

	if (!body || !header) {
		throw new ResponseError('Unable to read response.')
	}

}
