"use strict";

import path from 'path';
import soap from 'soap';

import WSSecurityCert from './WSSecurityCert';
import EETClient from './EETClient';


const WSDL = path.join(__dirname, '..', 'wsdl/WSDL.wsdl');
const PG_WSDL_URL = 'https://pg.eet.cz:443/eet/services/EETServiceSOAP/v3/';


/**
 * Creates new EETClient with given options
 * @param options
 * @return {Promise.<EETClient>}
 */
export default function createClient(options) {

	if (!options.privateKey || !options.certificate) {
		throw new Error('privateKey and certificate options are required.');
	}

	const soapOptions = {};

	if (options.playground) {
		soapOptions.endpoint = PG_WSDL_URL;
	}

	if (options.httpClient) {
		soapOptions.httpClient = options.httpClient;
	}

	options.timeout = options.timeout || 2000;
	options.offline = options.offline || false;
	options.measureResponseTime = options.measureResponseTime || false;

	return new Promise((resolve, reject) => {

		soap.createClient(WSDL, soapOptions, (err, client) => {

			if (err) {
				return reject(err);
			}

			client.setSecurity(new WSSecurityCert(options.privateKey, options.certificate));

			resolve(new EETClient(client, options));

		});

	});

}
