"use strict";

import { parseResponseXML, serializeSoapEnvelope } from './helpers';
import { ValidationError, ResponseError } from './errors';
import { parseRequest } from './schema';
import { generateBKP, generatePKP } from './crypto';
import fetch from 'node-fetch';


const PLAYGROUND_URL = 'https://pg.eet.cz/eet/services/EETServiceSOAP/v3/';
const SOAP_URL = 'https://prod.eet.cz/eet/services/EETServiceSOAP/v3';

class EETClient {

	constructor(options) {
		this.options = options;
	}

	/**
	 * Sends request to EET to get FIK
	 * @param request {object}
	 * @return {Promise.<object>}
	 * @throws ValidationError
	 * @throws ResponseError
	 */
	request(request) {

		const { header, data } = parseRequest(request);
		const message = serializeSoapEnvelope(this.options.privateKey, this.options.certificate, header, data);

		const url = this.options.playground ? PLAYGROUND_URL : SOAP_URL;

		return fetch(SOAP_URL, { method: 'POST', body: message })
			.then(response => response.text())
			.then(response => parseResponseXML(response, this.options.measureResponseTime ? this.lastElapsedTime : undefined))
			.then(response => {

				return {
					request: {
						...header,
						...data,
					},
					response: response,
				};
			})
			.catch(error => {
				if (!this.options.offline) {
					// Do not use offline regime
					throw error;
				}

				// Use generated PKP instead of FIK
				const pkp = generatePKP(this.options.privateKey, data);
				const bkp = generateBKP(pkp);

				return {
					request: {
						...header,
						...data,
					},
					response: {
						pkp,
						bkp,
					},
					error: error,
				};
			});
	}
}

module.exports.EETClient = EETClient;
