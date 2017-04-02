"use strict";


export class BaseError extends Error {

	constructor(code, message, previousError) {

		super(message);

		Error.captureStackTrace(this, this.constructor);

		this.name = 'BaseError';

		if (!message && previousError) {
			this.message = previousError.message;
		}

		this.code = code;

		if (previousError) {
			this.previous = previousError;
		}

	}

}

export class ValidationError extends BaseError {

	constructor(code, message, previousError) {

		super(code, message, previousError);

		this.name = 'ValidationError';

	}

}

export class ResponseError extends BaseError {

	constructor(code, message, previousError) {

		super(code, message, previousError);

		this.name = 'ResponseError';

	}

}
