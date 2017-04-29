"use strict";

import uuid from 'uuid';
import * as validate from './validate';
import { formatDate, formatBool, formatNumber, isDefinedAndNotNull } from './utils';
import { generatePKP, generateBKP } from './crypto';


/**
 * Generates content for SOAP body
 * @returns object
 * @throws ValidationError
 */
export function getBodyItems(privateKey, items) {

	validate.requiredItems(items);

	items.uuidZpravy = items.uuidZpravy || uuid.v4();
	items.datOdesl = items.datOdesl || new Date();

	return {
		Hlavicka: getHeaderItems(items.uuidZpravy, items.datOdesl, items.prvniZaslani, items.overeni),
		Data: getDataItems(items),
		KontrolniKody: getFooterItems(privateKey, items)
	}

}

/**
 * Generates attributes for XML element Hlavicka
 */
export function getHeaderItems(uuidZpravy, datOdesl, prvniZaslani, overeni) {

	return {
		attributes: {
			uuid_zpravy: uuidZpravy,
			dat_odesl: formatDate(datOdesl),
			prvni_zaslani: formatBool(prvniZaslani, true),
			overeni: formatBool(overeni, false)
		}
	}

}

/**
 * Generates attributes for XML element Data
 */
export function getDataItems(items) {

	const data = {};

	validate.vatIdNumber(items.dicPopl);
	data.dic_popl = items.dicPopl;

	validate.idProvoz(items.idProvoz);
	data.id_provoz = items.idProvoz;

	validate.idPokl(items.idPokl);
	data.id_pokl = items.idPokl;

	validate.poradCis(items.poradCis);
	data.porad_cis = items.poradCis;

	validate.date(items.datTrzby);
	data.dat_trzby = formatDate(items.datTrzby);

	if (isDefinedAndNotNull(items.rezim)) {
		validate.rezim(items.rezim);
		data.rezim = items.rezim;
	}
	else {
		data.rezim = 0;
	}

	if (isDefinedAndNotNull(items.dicPoverujiciho)) {
		validate.vatIdNumber(items.dicPoverujiciho);
		data.dic_poverujiciho = items.dicPoverujiciho;
	}

	validate.financialNumber(items.celkTrzba);
	data.celk_trzba = formatNumber(items.celkTrzba);

	const map = {
		zaklNepodlDph: 'zakl_nepodl_dph',
		zaklDan1: 'zakl_dan1',
		dan1: 'dan1',
		zaklDan2: 'zakl_dan2',
		dan2: 'dan2',
		zaklDan3: 'zakl_dan3',
		dan3: 'dan3',
		cestSluz: 'cest_sluz',
		pouzitZboz1: 'pouzit_zboz1',
		pouzitZboz2: 'pouzit_zboz2',
		pouzitZboz3: 'pouzit_zboz3',
		urcenoCerpZuct: 'urceno_cerp_zuct',
		cerpZuct: 'cerp_zuct'
	};

	Object.keys(map)
		.filter(key => isDefinedAndNotNull(items[key]))
		.forEach(key => {
			validate.financialNumber(items[key]);
			data[map[key]] = formatNumber(items[key]);
		});

	return {
		attributes: data
	};

}

/**
 * Generates data for XML element KontrolniKody
 */
export function getFooterItems(privateKey, items) {

	const pkp = generatePKP(
		privateKey,
		items.dicPopl,
		items.idProvoz,
		items.idPokl,
		items.poradCis,
		formatDate(items.datTrzby),
		formatNumber(items.celkTrzba)
	);

	const bkp = generateBKP(pkp);

	return {
		pkp: {
			attributes: {
				digest: 'SHA256',
				cipher: 'RSA2048',
				encoding: 'base64'
			},
			$value: pkp
		},
		bkp: {
			attributes: {
				digest: 'SHA1',
				encoding: 'base16'
			},
			$value: bkp
		}
	}

}

/**
 * Processes success response from server
 */
export function getResponseItems(response, duration) {

	const header = response.Hlavicka.attributes;

	const body = response.Potvrzeni.attributes;

	const data = {
		uuid: header.uuid_zpravy,
		bkp: header.bkp,
		date: new Date(header.dat_prij),
		test: body.test === 'true',
		fik: body.fik,
		warnings: getWarnings(response.Varovani)
	};

	if (duration !== undefined) {
		data.duration = duration;
	}

	return data;

}

export function getWarnings(warnings) {

	if (!warnings || !warnings.length) {
		return [];
	}

	return warnings.map(warning => warning.$value);

}
