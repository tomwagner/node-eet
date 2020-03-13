"use strict";

import { serializeSoapBody, getResponseItems, serializeSoapEnvelope } from './helpers';
import { validateHttpResponse } from './utils';
import { ValidationError, ResponseError } from './errors';
import { parseRequest } from './schema';
import { generateBKP, generatePKP } from './crypto';
import fetch from 'node-fetch';


export default class EETClient {

	constructor(client, options) {
		this.client = client;
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
			console.log(header);
			console.log(data);
			console.log(this.options);

			const message = serializeSoapEnvelope(this.options.privateKey, this.options.certificate, header, data);
			console.log(message);

			const bodyBuffer = Buffer.from(message, 'utf8');
			fetch('https://pg.eet.cz/eet/services/EETServiceSOAP/v3/', {method: 'POST', body: message})
				.then(resp => resp.text())
				.then(txt => console.log(txt));

			/*this.client.OdeslaniTrzby(
				body,
				(err, response) => {

					if (err) {
						return reject(err);
					}

					const elapsedTime = this.options.measureResponseTime ? this.client.lastElapsedTime : undefined;

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

				},
				{
					// proxy: 'http://localhost:8080',
					// strictSSL: false,
					timeout: this.options.timeout,
					time: this.options.measureResponseTime,
				},
			);*/

		});

	}

}
