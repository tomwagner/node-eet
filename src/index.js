"use strict";

import { BaseError, ValidationError, ResponseError } from './errors';
import { generateBKP, generatePKP } from './crypto';
import { parseRequest } from './schema';
import { parseResponseXML, serializeSoapEnvelope } from './helpers';
import fetch from 'node-fetch';

const PLAYGROUND_URL = 'https://pg.eet.cz/eet/services/EETServiceSOAP/v3/';
const PRODUCTION_URL = 'https://prod.eet.cz/eet/services/EETServiceSOAP/v3';

/**
 * Generates PKP and BKP
 * @param data {object}
 * @param privateKey {string}
 * @returns {{PKP: string, BKP: string}}
 */
export const eetGenerateSecurityCodes = (data, privateKey) => {

	const pkp = generatePKP(privateKey, data);
	return {
		PKP: pkp,
		BKP: generateBKP(pkp),
	};

};

/**
 * Sends request to EET to get FIK
 * @param request {object}
 * @param options {object}
 * @return {Promise.<object>}
 * @throws ValidationError
 * @throws ResponseError
 */
export const eetSend = (request, options) => {

	const { header, data } = parseRequest(request);
	const message = serializeSoapEnvelope(options.privateKey, options.certificate, header, data);

	const url = options.playground ? PLAYGROUND_URL : PRODUCTION_URL;

	return fetch(url, { method: 'POST', body: message })
		.then(response => response.text())
		.then(response => parseResponseXML(response, options.measureResponseTime ? this.lastElapsedTime : undefined))
		.then(response => {

			return {
				request: {
					...header,
					...data,
				},
				response: response,
			};

		});

};
