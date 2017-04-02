"use strict";


/**
 * Converts Date so string
 *
 * Datum je potreba prevest na  ISO 8601, je ale potreba dat pryc ms,
 * protoze jinak vraci EET servery chybu "spatny format".
 *
 */
export function formatDate(date) {

	return date.toISOString().split('.')[0] + 'Z';

}

export function formatBool(value, defaultValue) {

	if (value === undefined) {
		value = defaultValue;
	}

	return value ? 'true' : 'false';

}

export function formatNumber(num) {

	return !isNaN(+num) ? (+num).toFixed(2) : num;

}

export function isDefinedAndNotNull(value) {

	return value !== undefined && value !== null;

}
