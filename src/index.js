"use strict";

import { generateBKP, generatePKP } from './crypto';
import { parseRequest } from './schema';
import { extractResponse, parseResponseXML, serializeSoapEnvelope } from './xml';
import fetch from 'node-fetch';

const PLAYGROUND_URL = 'https://pg.eet.cz/eet/services/EETServiceSOAP/v3/';
const PRODUCTION_URL = 'https://prod.eet.cz/eet/services/EETServiceSOAP/v3';

/**
 * Generates PKP and BKP from data object
 * @param data {object}
 * @param privateKey {Buffer}
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
 * Sends request to EET server
 * @param request {object}
 * @param options {object}
 * @return {Promise.<object>}
 * @throws {RequestParsingError}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
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
			'User-Agent': 'nfctron/eet (+github.com/NFCtron/eet/tree/rewrite)',
			'Content-type': ['application/xml; charset=UTF-8'],
		},
		redirect: 'error',
		follow: 0,
		timeout: options.timeout || 10000,
		size: 65536, // maximum response size, unofficial
	})
		.then(rawResponse => rawResponse.text())
		.then(xml => parseResponseXML(xml))
		.then(parsed => extractResponse(parsed))
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

			// Rethrow error
			throw error;

		});

};
