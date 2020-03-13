"use strict";

import { getResponseItems, serializeSoapEnvelope } from './helpers';
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
				.then(response => {
					//const elapsedTime = this.options.measureResponseTime ? this.client.lastElapsedTime : undefined;
					const elapsedTime = undefined;

					try {

						validateHttpResponse(response);

						return resolve({
							request: {
								...header,
								...data,
							},
							response: getResponseItems(response, elapsedTime),
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
