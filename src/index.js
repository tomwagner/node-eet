"use strict";

import fetch from 'node-fetch';

import { generateBKP, generatePKP } from './crypto';
import { parseRequest } from './schema';
import { extractResponse, parseResponseXML, serializeSoapEnvelope } from './xml';
import { isDefined } from './utils';


export const PLAYGROUND_URL = 'https://pg.eet.cz/eet/services/EETServiceSOAP/v3';
export const PRODUCTION_URL = 'https://prod.eet.cz/eet/services/EETServiceSOAP/v3';

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

	/* istanbul ignore next */
	const startTime = options.measureResponseTime ? process.hrtime.bigint() : undefined;

	return fetch(url, {

		// these properties are part of the Fetch Standard
		method: 'POST',
		headers: {
			'Accept-Encoding': 'gzip,deflate',
			'Accept': 'application/xml',
			'Connection': 'close',
			'User-Agent': 'nfctron/eet (+github.com/NFCtron/eet/tree/rewrite)',
			'Content-type': ['application/xml; charset=UTF-8'],
		},
		body: message,
		redirect: 'error', // `error` to reject redirects
		// TODO: add support for signal

		// the following properties are node-fetch extensions
		follow: 0, // maximum redirect count. 0 to not follow redirect
		/* istanbul ignore next */
		timeout: isDefined(options.timeout) ? options.timeout : 10000,
		size: 65536, // (= 64 KB) maximum response size in bytes, unofficial
		// TODO: consider supporting custom agent option

	})
		.then(rawResponse => rawResponse.text())
		// TODO: check content type instead assuming XML?
		.then(xml => parseResponseXML(xml))
		.then(parsed => extractResponse(parsed))
		.then(response => {

			if (options.measureResponseTime) {
				// save response timeout in milliseconds
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

			// TODO: why are we rethrowing error here? why not remove catch clause at all?
			// rethrow error
			throw error;

		});

};
