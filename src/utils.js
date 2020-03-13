"use strict";

import { ResponseError } from './errors';


/**
 * Checks whether the given value is not undefined and not null
 * @param value
 * @return {boolean}
 */
export const isDefined = value => value !== undefined && value !== null;

/**
 * Converts Date to string
 * Date needs to be converted to ISO 8601 but without ms string,
 * otherwise EET returns error 'spatny format'.
 * @param date {Date}
 * @return {string}
 */
export const convertDateToString = date => date.toISOString().split('.')[0] + 'Z';

/**
 * Converts boolean to string
 * @param value {boolean}
 * @return {string} 'true' for true, 'false' for false
 */
export const convertBooleanToString = value => value ? 'true' : 'false';

/**
 * Converts amount in hundredths of CZK (haléře, same as cents) to string
 * @param amount {number}
 * @return {string}
 */
export const convertAmountToString = amount => {

	const str = amount.toString(10);

	return str.slice(0, -2) + '.' + str.slice(-2);

};


export const VAT_ID_PATTERN = /^CZ[0-9]{8,10}$/;
export const ID_POKL_PATTERN = /^[0-9a-zA-Z\.,:;/#\-_ ]{1,20}$/;
export const PORAD_CIS_PATTERN = /^[0-9a-zA-Z\.,:;/#\-_ ]{1,25}$/;

export const validateVatId = value => typeof value == 'string' && VAT_ID_PATTERN.test(value);

export const validateIdProvoz = value => Number.isInteger(value) && value > 0 && value < 1000000;

export const validateIdPokl = value => typeof value == 'string' && ID_POKL_PATTERN.test(value);

export const validatePoradCis = value => typeof value == 'string' && PORAD_CIS_PATTERN.test(value);

export const validateAmount = value => Number.isInteger(value) && value > -10000000000 && value < 10000000000;
