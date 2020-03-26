// Type definitions for index.js
/// <reference types="node" />

import { Agent } from 'https';
import { KeyLike } from 'crypto';

export const PLAYGROUND_URL: string;
export const PRODUCTION_URL: string;

export class ResponseServerError extends Error {
}

export class ResponseParsingError extends Error {
}

export class RequestParsingError extends Error {
}

export class WrongServerResponse extends Error {
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
	privateKey: KeyLike;
	certificate: KeyLike;
	timeout?: number;
	playground?: boolean;
	measureResponseTime?: boolean;
	userAgent?: string;
	agent?: Agent;
}

interface EETParsedRequest {
	uuidZpravy: string;
	datOdesl: string;
	prvniZaslani: string;
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
	test: boolean;
	fik: string;
	error?: EETError,
	warnings: Array<EETError>,
}

interface EETReturn {
	request: EETParsedRequest;
	response: EETResponse;
	rawResponse: string;
}

export function sendEETRequest(request: EETRequest, options: EETOptions): EETReturn;
