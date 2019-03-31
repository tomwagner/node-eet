"use strict";

import { isDefined } from './utils';
import { generatePKP, generateBKP } from './crypto';


/**
 * Generates data for XML element KontrolniKody
 */
export const getFooterItems = (privateKey, data) => {

	const pkp = generatePKP(privateKey, data);
	const bkp = generateBKP(pkp);

	return {
		pkp: {
			attributes: {
				digest: 'SHA256',
				cipher: 'RSA2048',
				encoding: 'base64',
			},
			$value: pkp,
		},
		bkp: {
			attributes: {
				digest: 'SHA1',
				encoding: 'base16',
			},
			$value: bkp,
		},
	};

};

/**
 * Generates content for SOAP body
 */
export const getBodyItems = (privateKey, header, data) => {

	return {
		Hlavicka: {
			attributes: header,
		},
		Data: {
			attributes: data,
		},
		KontrolniKody: getFooterItems(privateKey, data),
	};

};

const getWarnings = warnings => {

	if (!warnings || warnings.length <= 0) {
		return [];
	}

	return warnings.map(warning => warning.$value);

};

/**
 * Processes success response from server
 */
export const getResponseItems = (response, duration) => {

	const header = response.Hlavicka.attributes;

	const body = response.Potvrzeni.attributes;

	const data = {
		uuid: header.uuid_zpravy,
		bkp: header.bkp,
		date: new Date(header.dat_prij),
		test: body.test === 'true',
		fik: body.fik,
		warnings: getWarnings(response.Varovani),
	};

	if (isDefined(duration)) {
		data.duration = duration;
	}

	return data;

};
