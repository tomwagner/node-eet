"use strict";

import { ResponseError, ValidationError } from './errors';
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

	/* istanbul ignore next */
	const url = options.playground ? PLAYGROUND_URL : PRODUCTION_URL;

	const startTime = process.hrtime.bigint();

	return fetch(url, {
		method: 'POST',
		body: message,
		headers: {
			'Accept-Encoding': 'gzip,deflate',
			'Accept': 'application/xml',
			'Connection': 'close',
			'User-Agent': 'nfctron/eet',
			'Content-type': ['text/xml; charset=UTF-8'],
		},
		redirect: 'error',
		follow: 0,
		timeout: options.timeout || 10000,
		size: 65536,
	})
		.then(response => response.text())
		.then(response => parseResponseXML(response))
		.then(response => {

			if (options.measureResponseTime) {
				// Save response timeout in milliseconds
				const endTime = process.hrtime.bigint();
				response.responseTime = Number((endTime - startTime)) / 1000000;
			}

			return {
				request: {
					...header,
					...data,
				},
				response: response,
			};

		})
		.catch(error => {
			throw error;
		});

};
