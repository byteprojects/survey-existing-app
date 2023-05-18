'use strict';
///
const { Contract } = require('fabric-contract-api');
const Hashids = require('hashids/cjs');
const Ajv = require('ajv');
const ajv = new Ajv({ useDefaults: true, allErrors: true, jsonPointers: true });
require('ajv-errors')(ajv, { singleError: true });

class BaseContract extends Contract {

    generateKey(ctx, length = 15) {
        /**
         * transaction hash is guaranteed to be unique for each transaction
         * so we don't need to encode different strings each time
         */
        const hashids = new Hashids(ctx.stub.getTxID(), length);
        const key = hashids.encode(12345);
        return key;
    }

    parseArgs(ctx) {
        let args = ctx.stub.getStringArgs();
        if (args.length < 2) throw new Error('transaction accepts at least two arguments');
        let argumentsObject;
        try {
            argumentsObject = JSON.parse(args[1]);
        } catch (error) {
            throw new Error('transaction second argument must be a stringified object');
        }
        return argumentsObject;
    }

    transactionMetaData(ctx) {
        return {
            txId: ctx.stub.getTxID(),
            creator: ctx.stub.getCreator(),
            timestamp: ctx.stub.getTxTimestamp().seconds.toString(),
        }
    }

    validateSchema(schema, Record) {
        let valid = ajv.validate(schema, Record);
        if (!valid) {
            throw new Error(ajv.errorsText());
        }
        return Record;
    }

    async getQueryResult(ctx, query) {
        const iterator = await ctx.stub.getQueryResult(query);
        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }

}

module.exports = BaseContract;
