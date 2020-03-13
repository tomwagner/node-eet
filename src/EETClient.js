"use strict";

import { getResponseItems, parseResponseXML, serializeSoapEnvelope } from './helpers';
import { validateHttpResponse } from './utils';
import { ValidationError, ResponseError } from './errors';
import { parseRequest } from './schema';
import { generateBKP, generatePKP } from './crypto';
import fetch from 'node-fetch';


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

		return new Promise((resolve, reject) => {

			const { header, data } = parseRequest(request);
			const message = serializeSoapEnvelope(this.options.privateKey, this.options.certificate, header, data);

			fetch('https://pg.eet.cz/eet/services/EETServiceSOAP/v3/', { method: 'POST', body: message })
				.then(response => response.text())
				.then(response => parseResponseXML(response, this.options.measureResponseTime ? this.lastElapsedTime : undefined))
				.then(response => {
					console.log(response);

					try {

						//validateHttpResponse(response);

						return resolve({
							request: {
								...header,
								...data,
							},
							response: response,
						});

					} catch (err) {

						if (!this.options.offline) {
							return reject(err);
						}

						const pkp = generatePKP(this.options.privateKey, data);
						const bkp = generateBKP(pkp);

						return resolve({
							request: {
								...header,
								...data,
							},
							response: {
								pkp,
								bkp,
							},
							error: err,
						});

					}
				}).catch(err => reject(err));

		});

	}

}

module.exports.EETClient = EETClient;
