"use strict";

import { getBodyItems, getResponseItems } from './helpers';
import { validateHttpResponse } from './utils';
import { ValidationError, ResponseError } from './errors';
import { generatePKPAndBKP } from './crypto';


export default class EETClient {

	constructor(client, options) {
		this.client = client;
		this.options = options;
	}

	/**
	 * Sends request to EET to get FIK
	 * Mutates request object (adds default values).
	 * @param request {object}
	 * @return {Promise.<object>}
	 * @throws ValidationError
	 * @throws ResponseError
	 */
	request(request) {

		return new Promise((resolve, reject) => {

			// add default values to the request object - mutates request object! and validates simultaneously
			const body = getBodyItems(this.options.privateKey, request);

			this.client.OdeslaniTrzby(
				body,
				(err, response) => {

					if (err) {
						return reject(err);
					}

					const elapsedTime = this.options.measureResponseTime ? this.client.lastElapsedTime : undefined;

					try {

						validateHttpResponse(response);

						return resolve(getResponseItems(response, elapsedTime));

					} catch (err) {

						if (!this.options.offline) {
							return reject(err);
						}

						return resolve({
							...generatePKPAndBKP(this.options.privateKey, items),
							err,
						});

					}

				},
				{
					timeout: this.options.timeout,
					time: this.options.measureResponseTime,
				},
			);

		});

	}

}
