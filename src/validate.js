"use strict";

import { isDefinedAndNotNull } from './utils';
import { ValidationError, ResponseError } from './errors';


/**
 * Check if all required items are set
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
 * Validate VAT ID
 */
export function vatIdNumber(value) {

	if (!/^CZ[0-9]{8,10}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match pattern for VAT ID number.`)
	}

}

/**
 * Validate idProvoz
 */
export function idProvoz(value) {

	if (!/^[1-9][0-9]{0,6}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match required pattern for idProvoz.`)
	}

}

/**
 * Validate idPokl
 */
export function idPokl(value) {

	if (!/^[0-9a-zA-Z\.,:;/#\-_ ]{1,20}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match required pattern for idPokl.`)
	}

}

/**
 * Validate poradCis
 */
export function poradCis(value) {

	if (!/^[0-9a-zA-Z\.,:;/#\-_ ]{1,25}$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match required pattern for poradCis.`)
	}

}

/**
 * Validate date
 */
export function date(value) {

	if (Object.prototype.toString.call(value) !== '[object Date]' || isNaN(value)) {
		throw new ValidationError(`Value '${value}' is not a date object.`);
	}

}

/**
 * Validate rezim
 */
export function rezim(value) {

	if (!/^[01]$/.test(value)) {
		throw new ValidationError(`Value '${value}' doesn't match required pattern for rezim.`);
	}

}

/**
 * Validate financial number
 */
export function financialNumber(value) {

	const num = Number(value);

	if (value !== num || num < -99999999.99 || num > 99999999.99) {
		throw new ValidationError(`Value '${value}' is not a valid number.`);
	}

}

/**
 * Process error response
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
