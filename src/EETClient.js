"use strict";

import { getBodyItems, getFooterItems, getResponseItems } from './helpers';
import { httpResponse as validateHttpResponse } from './validate';


export default class EETClient {

	constructor(client, options) {
		this.client = client;
		this.options = options;
	}

	/**
	 * Sends request to EET to get FIK
	 * @param items
	 * @return {Promise.<object>}
	 * @throws ValidationError
	 * @throws ResponseError
	 */
	request(items) {

		const body = getBodyItems(this.options.privateKey, items);

		return new Promise((resolve, reject) => {

			this.client.OdeslaniTrzby(body, (err, response) => {

				if (err) return reject(err);

				const elapsedTime = this.options.measureResponseTime ? this.client.lastElapsedTime : undefined;

				console.log(elapsedTime);

				try {
					validateHttpResponse(response);
					resolve(getResponseItems(response, elapsedTime));
				} catch (e) {
					reject(e)
				}

			}, { timeout: this.options.timeout, time: this.options.measureResponseTime });

		})
			.catch(err => {

				if (!this.options.offline) return Promise.reject(err);

				const code = getFooterItems(this.options.privateKey, items);
				const bkp = code.bkp;
				const pkp = code.pkp;

				return Promise.resolve({ pkp: pkp.$value, bkp: bkp.$value, err });

			});

	}

}
