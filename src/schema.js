"use strict";

import { v4 as uuidv4 } from 'uuid';
import {
	convertAmountToString,
	convertBooleanToString,
	convertDateToString,
	isDefined,
	validateAmount,
	validateIdPokl,
	validateIdProvoz,
	validatePoradCis,
	validateVatId,
} from './utils';
import { ValidationError } from './errors';


export const SCHEMA = {
	uuidZpravy: {
		type: 'header',
		name: 'uuid_zpravy',
		required: true,
		getDefault: () => uuidv4(),
		// TODO: validate
	},
	datOdesl: {
		type: 'header',
		name: 'dat_odesl',
		required: true,
		getDefault: () => new Date(),
		validate: value => value instanceof Date,
		format: convertDateToString,
	},
	prvniZaslani: {
		type: 'header',
		name: 'prvni_zaslani',
		required: true,
		getDefault: () => true,
		validate: value => typeof value === 'boolean',
		format: convertBooleanToString,
	},
	overeni: {
		type: 'header',
		name: 'overeni',
		required: true,
		getDefault: () => false,
		validate: value => typeof value === 'boolean',
		format: convertBooleanToString,
	},
	dicPopl: {
		type: 'data',
		name: 'dic_popl',
		required: true,
		validate: validateVatId,
	},
	dicPoverujiciho: {
		type: 'data',
		name: 'dic_poverujiciho',
		required: false,
		validate: validateVatId,
	},
	idProvoz: {
		type: 'data',
		name: 'id_provoz',
		required: true,
		validate: validateIdProvoz,
	},
	idPokl: {
		type: 'data',
		name: 'id_pokl',
		required: true,
		validate: validateIdPokl,
	},
	poradCis: {
		type: 'data',
		name: 'porad_cis',
		required: true,
		validate: validatePoradCis,
	},
	datTrzby: {
		type: 'data',
		name: 'dat_trzby',
		required: true,
		validate: value => value instanceof Date,
		format: convertDateToString,
	},
	celkTrzba: {
		type: 'data',
		name: 'celk_trzba',
		required: true,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklNepodlDph: {
		type: 'data',
		name: 'zakl_nepodl_dph',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklDan1: {
		type: 'data',
		name: 'zakl_dan1',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	dan1: {
		type: 'data',
		name: 'dan1',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklDan2: {
		type: 'data',
		name: 'zakl_dan2',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	dan2: {
		type: 'data',
		name: 'dan2',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	zaklDan3: {
		type: 'data',
		name: 'zakl_dan3',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	dan3: {
		type: 'data',
		name: 'dan3',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	cestSluz: {
		type: 'data',
		name: 'cest_sluz',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	pouzitZboz1: {
		type: 'data',
		name: 'pouzit_zboz1',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	pouzitZboz2: {
		type: 'data',
		name: 'pouzit_zboz2',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	pouzitZboz3: {
		type: 'data',
		name: 'pouzit_zboz3',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	urcenoCerpZuct: {
		type: 'data',
		name: 'urceno_cerp_zuct',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	cerpZuct: {
		type: 'data',
		name: 'cerp_zuct',
		required: false,
		validate: validateAmount,
		format: convertAmountToString,
	},
	rezim: {
		type: 'data',
		name: 'rezim',
		required: true,
		getDefault: () => 0,
		validate: value => value !== 0 || value !== 1,
	},
};


export const parseRequest = request => {

	if (!isDefined(request) || typeof request !== 'object') {
		throw new ValidationError('invalid_request', 'Invalid request data given. Data must be a non-null object.');
	}

	const result = {};

	for (const [key, {
		type,
		name,
		required,
		getDefault,
		validate = () => true,
		format = value => value
	}] of Object.entries(SCHEMA)) {

		// mutates the request object
		if (!isDefined(request[key]) && isDefined(getDefault)) {
			request[key] = getDefault();
		}

		const value = request[key];

		if (required && !isDefined(value)) {
			throw new ValidationError(name, `${key} must be set.`);
		}

		if (!isDefined(value)) {
			continue;
		}

		if (!validate(value)) {
			throw new ValidationError(name, `Validation failed for ${key}. '${value}' given.`);
		}

		if (!result[type]) {
			result[type] = {};
		}

		result[type][name] = format(value);

	}

	return result;

};
