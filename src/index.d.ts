// Type definitions for index.js
/// <reference types="node" />

import { Agent } from 'https';
import { KeyLike } from 'crypto';

export const PLAYGROUND_URL: string;
export const PRODUCTION_URL: string;

// server returned error
export class ResponseServerError extends Error {

	message: string;
	code: string;
	datOdmit: string;

	constructor(message: string, code: string, datOdmit: string);

}

// response could not be parsed
export class ResponseParsingError extends Error {

	message: string;
	code: string;
	line: string;

	constructor(message: string, code: string, line: string);

}

// request could not be parsed
export class RequestParsingError extends Error {

	message: string;

	constructor(message: string);

}

// server sent wrong or unexpected response
export class WrongServerResponse extends Error {

	message: string;

	constructor(message: string);

}

interface EETRequest {

	uuidZpravy?: string;
	datOdesl?: Date;
	prvniZaslani?: boolean;
	overeni?: boolean;
	dicPopl: string;
	dicPoverujiciho?: string;
	idProvoz: number;
	idPokl: string;
	poradCis: string;
	datTrzby: Date;
	celkTrzba: number;
	zaklNepodlDph?: number;
	zaklDan1?: number;
	dan1?: number;
	zaklDan2?: number;
	dan2?: number;
	zaklDan3?: number;
	dan3?: number;
	cestSluz?: number;
	pouzitZboz1?: number;
	pouzitZboz2?: number;
	pouzitZboz3?: number;
	urcenoCerpZuct?: number;
	cerpZuct?: number;
	rezim?: number;

}

interface EETOptions {

	/**
	 * Private key for request digital signature
	 */
	privateKey: KeyLike;

	/**
	 * Certificate containing public key associated to the private key
	 */
	certificate: KeyLike;

	/**
	 * Response timeout in milliseconds, default is 10000
	 */
	timeout?: number;

	/**
	 * If true, playground URL is used instead of production URL to submit data, default is false
	 */
	playground?: boolean;

	/**
	 * Optional request to response time measurement, default is false
	 * If set to true, time will be returned in response.requestTime
	 */
	measureResponseTime?: boolean;

	/**
	 * Custom HTTP User-Agent header
	 * Default is 'nfctron/eet (+github.com/NFCtron/eet)'
	 */
	userAgent?: string;

	/**
	 * Custom Node HTTPS Agent to send request through
	 * @see https://nodejs.org/api/https.html#https_class_https_agent
	 */
	agent?: Agent;

}

interface EETParsedRequest {

	/**
	 * UUID of message, default is UUID v4 generated via uuidjs/uuid library
	 * @see https://github.com/uuidjs/uuid
	 */
	uuidZpravy: string;

	/**
	 * Time of request sending, default is new Date()
	 */
	datOdesl: string;

	/**
	 * If true, flags request as first submit trial, default is true
	 */
	prvniZaslani: string;

	/**
	 * If true, submits request verification mode, default is false
	 */
	overeni: string;

	dicPopl: string;
	dicPoverujiciho?: string;
	idProvoz: string;
	idPokl: string;
	poradCis: string;
	datTrzby: string;
	celkTrzba: number;
	zaklNepodlDph?: string;
	zaklDan1?: string;
	dan1?: string;
	zaklDan2?: string;
	dan2?: string;
	zaklDan3?: string;
	dan3?: string;
	cestSluz?: string;
	pouzitZboz1?: string;
	pouzitZboz2?: string;
	pouzitZboz3?: string;
	urcenoCerpZuct?: string;
	cerpZuct?: string;

	/**
	 * EET mode, default is '0'
	 */
	rezim: '0' | '1';

}

interface EETError {

	message: string;
	code: string;

}

interface EETResponse {

	uuidZpravy: string;
	bkp: string;
	datPrij: Date;
	datOdmit?: Date;
	test: boolean;
	fik: string;
	error?: EETError;
	warnings: Array<EETError>;
	responseTime?: number;

}

interface EETReturn {

	request: EETParsedRequest;
	response: EETResponse;
	rawResponse: string;

}

/**
 * Sends request to EET server
 * @param request {EETRequest}
 * @param options {EETOptions}
 * @return {Promise<EETReturn>}
 * @throws {RequestParsingError}
 * @throws {ResponseParsingError}
 * @throws {ResponseServerError}
 * @throws {WrongServerResponse}
 */
export function sendEETRequest(request: EETRequest, options: EETOptions): Promise<EETReturn>;
