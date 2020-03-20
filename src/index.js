"use strict";

import fetch from 'node-fetch';

import { generateBKP, generatePKP } from './crypto';
import { parseRequest } from './schema';
import { extractResponse, parseResponseXML, serializeSoapEnvelope } from './xml';
import { isDefined } from './utils';
import { ResponseParsingError, WrongServerResponse } from './errors';


export const PLAYGROUND_URL = 'https://pg.eet.cz/eet/services/EETServiceSOAP/v3';
export const PRODUCTION_URL = 'https://prod.eet.cz/eet/services/EETServiceSOAP/v3';

/**
 * Sends request to EET server
 * @param request {object}
 * @param options {object}
 * @return {Promise.<object>}
 * @throws {RequestParsingError}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 */
export const sendEETRequest = async (request, options) => {

	const parsedRequest = parseRequest(request);
	const { header, data } = parsedRequest;
	const pkp = generatePKP(options.privateKey, data);
	const bkp = generateBKP(pkp);

	const message = serializeSoapEnvelope({
		header,
		data,
		pkp,
		bkp,
		privateKey: options.privateKey,
		certificate: options.certificate,
	});

	const url = options.playground ? PLAYGROUND_URL : PRODUCTION_URL;

	const startTime = options.measureResponseTime ? process.hrtime.bigint() : undefined;

	// TODO: return bkp and pkp in errors
	const rawResponse = await fetch(url, {

		// these properties are part of the Fetch Standard
		method: 'POST',
		headers: {
			'Accept-Encoding': 'gzip,deflate',
			'Accept': 'application/xml, text/xml',
			'Connection': 'close',
			'User-Agent': 'nfctron/eet (+github.com/NFCtron/eet)',
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

	});

	// check content-type header for text/xml of application/xml
	const contentType = rawResponse.headers.get('content-type');
	if (!(contentType.includes('text/xml') || contentType.includes('application/xml'))) {
		throw new WrongServerResponse('Unknown content-type', contentType);
	}

	const xml = await rawResponse.text();

	const parsed = parseResponseXML(xml);

	const response = extractResponse(parsed);

	if (options.measureResponseTime) {
		// save response timeout in milliseconds
		const endTime = process.hrtime.bigint();
		response.responseTime = Number((endTime - startTime)) / 1000000;
	}

	return {
		request: parsedRequest,
		response: response,
	};


};
