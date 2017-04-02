"use strict";

import path from 'path';
import soap from 'soap';

import WSSecurityCert from './WSSecurityCert';
import { getBodyItems, getFooterItems, getResponseItems } from './helpers';
import { httpResponse as validateHttpResponse } from './validate';
import { BaseError, ValidationError, ResponseError } from './errors';
import { generateBKP, generatePKP } from './crypto';


const WSDL = path.join(__dirname, '..', 'wsdl/WSDL.wsdl');
const PG_WSDL_URL = 'https://pg.eet.cz:443/eet/services/EETServiceSOAP/v3/';


export class EETClient {

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


/**
 * Creates new EETClient with given options
 * @param options
 * @return {Promise.<EETClient>}
 */
export function createClient(options) {

	if (!options.privateKey || !options.certificate) {
		throw new Error('privateKey and certificate options are required.')
	}

	const soapOptions = {};

	if (options.playground) {
		soapOptions.endpoint = PG_WSDL_URL
	}

	if (options.httpClient) {
		soapOptions.httpClient = options.httpClient
	}

	options.timeout = options.timeout || 2000;
	options.offline = options.offline || false;
	options.measureResponseTime = options.measureResponseTime || false;

	return new Promise((resolve, reject) => {

		soap.createClient(WSDL, soapOptions, (err, client) => {

			if (err) return reject(err);

			client.setSecurity(new WSSecurityCert(options.privateKey, options.certificate));

			resolve(new EETClient(client, options));

		});

	});

}


export {
	BaseError, ValidationError, ResponseError,
	generateBKP, generatePKP
};
