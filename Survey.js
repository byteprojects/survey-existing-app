/** a prefix for the composite key we use to get all surveys for a specific user */
const ownedSurveysPrefix = 'owned_surveys';
/** a prefix for the composite key we use to get result answers for survey */
const ownedResultsPrefix = 'owned_results';

/** access survey from another other */
exports.Transfer = async (ctx, to, surveyID) => {
    await _transfer(ctx, to, surveyID);
    await _results(ctx, to, surveyID);
    return true;
};

const _transfer = async (ctx, to, surveyID) => {
    // check survey exists
    const surveyBytes = await ctx.stub.getState(surveyID);
    if (!surveyBytes || surveyBytes.length === 0) {
        throw new Error('NOT_FOUND_ERROR no survey found with this Key');
    }
    const surveyRecord = JSON.parse(surveyBytes.toString());

    const surveyKey = ctx.stub.createCompositeKey(ownedSurveysPrefix, [
        to,
        surveyID,
    ]);
    await ctx.stub.putState(surveyKey, Buffer.from(JSON.stringify(surveyRecord), "utf8"));

    return true;
};

const _results = async (ctx, to, surveyID) => {
    // check survey exists
    const surveyBytes = await ctx.stub.getState(surveyID);
    if (!surveyBytes || surveyBytes.length === 0) {
        throw new Error('NOT_FOUND_ERROR no survey found with this Key');
    }
    const surveyRecord = JSON.parse(surveyBytes.toString());
    
    const { question, resultID } = surveyRecord;

    // check result exists
    const resultBytes = await ctx.stub.getState(resultID);
    if (!resultBytes || resultBytes.length === 0) {
        throw new Error('NOT_FOUND_ERROR no result found with this survey');
    }
    const resultRecord = JSON.parse(surveyBytes.toString());

    const { answer1, answer2, answer3 } = resultRecord;
    const Record = { answer1, answer2, answer3, question, surveyID };
    const surveyKey = ctx.stub.createCompositeKey(ownedResultsPrefix, [
        to,
        surveyID,
    ]);
    await ctx.stub.putState(surveyKey, Buffer.from(JSON.stringify(Record), "utf8"));

    return true;
};

//create survey by the organization
exports.createSurvey = async (ctx, surveyID, title, type, question, answersRecord) => {
    const resultID = surveyID.concat('result');
    // validate submitter to belong to Org1MSP or Org2MSP
    const clientMSPID = ctx.clientIdentity.getMSPID();
    if (clientMSPID !== 'Org1MSP' && clientMSPID !== 'Org2MSP') {
        throw new Error('AUTHENTICATION_ERROR client is not authorized to create survey');
    }
    // Get ID of submitting client identity
    const creator = ctx.clientIdentity.getID();

    const Record = { creator, title, type, question, resultID, docType: 'survey' };
    const resultRecord = { creator, result: answersRecord, docType: 'resultSurvey' };

    const seconds = ctx.stub.getTxTimestamp().seconds.toString();
    const nanos = ctx.stub.getTxTimestamp().nanos.toString().slice(0, 3);
    Record.createdAt = +`${seconds}${nanos}`;
    resultRecord.createdAt = +`${seconds}${nanos}`;

    await ctx.stub.putState(surveyID, Buffer.from(JSON.stringify(Record), 'utf8'));
    await ctx.stub.putState(resultID, Buffer.from(JSON.stringify(resultRecord), 'utf8'));
    return JSON.stringify({ Key: surveyID, Record });
};

//answer survey by the admin or taker
exports.answerSurvey = async (ctx, answerID, surveyID, answer, surveyResult) => {
    // validate submitter to belong to Org1MSP or Org2MSP
    const clientMSPID = ctx.clientIdentity.getMSPID();
    if (clientMSPID !== 'Org1MSP' && clientMSPID !== 'Org3MSP') {
        throw new Error('AUTHENTICATION_ERROR client is not authorized to create survey');
    }
    // check survey exists
    const surveyBytes = await ctx.stub.getState(surveyID);
    if (!surveyBytes || surveyBytes.length === 0) {
        throw new Error('NOT_FOUND_ERROR no survey found with this Key');
    }
    const surveyRecord = JSON.parse(surveyBytes.toString());

    const { resultID } = surveyRecord;
    // Get ID of submitting client identity
    const creator = ctx.clientIdentity.getID();

    const Record = { creator, surveyID, answer, docType: 'answer' };

    const seconds = ctx.stub.getTxTimestamp().seconds.toString();
    const nanos = ctx.stub.getTxTimestamp().nanos.toString().slice(0, 3);
    Record.createdAt = +`${seconds}${nanos}`;

    await ctx.stub.putState(answerID, Buffer.from(JSON.stringify(Record), 'utf8'));
    await ctx.stub.putState(resultID, Buffer.from(JSON.stringify(surveyResult), "utf8"));
    return JSON.stringify({ Key: answerID, Record });
};

/*const updateSurveyResult = async (ctx, resultID, question, answer) => {
    let Record;
    const resultBytes = await ctx.stub.getState(resultID);
    if (!resultBytes || resultBytes.length === 0) {
        Record = { answer1: "0", answer2: "0", answer3: "0" }
    } else {
        const resultRecord = JSON.parse(resultBytes.toString());
        const { answer1, answer2, answer3 } = resultRecord;
        Record = { answer1: question.answer1 == answer ? (parseInt(answer1) + 1).toString() : answer1, answer2: question.answer2 == answer ? (parseInt(answer2) + 1).toString() : answer2, answer3: question.answer3 == answer ? (parseInt(answer3) + 1).toString() : answer3 }
    }
    await ctx.stub.putState(resultID, Buffer.from(JSON.stringify(Record), "utf8"));
    return true;
};*/

/** get all surveys for a user */
exports.getOwnedSurveys = async (ctx) => {
    const creator = ctx.clientIdentity.getID();
    const surveys = [];

    // Query the ownedDoctosPrefix index by submitter id
    // This will execute a key range query on all keys starting with 'submitter'
    let ownedSurveysIterator = await ctx.stub.getStateByPartialCompositeKey(ownedSurveysPrefix,
        [creator]);

    // Iterate through result set and for each survey found, get user ID
    let responseRange = await ownedSurveysIterator.next();
    while (!responseRange.done) {
        if (!responseRange || !responseRange.value || !responseRange.value.key) {
            return;
        }

        let attributes;
        (
            { attributes } = await ctx.stub.splitCompositeKey(responseRange.value.key)
        );

        let returnedSurveyID = attributes[1];


        surveys.push({ surveyID: returnedSurveyID });

        responseRange = await ownedSurveysIterator.next();
    }

    // now we return owned surveys for this user
    return surveys;
};

exports.assignSurvey = async (ctx, to, surveyID) => {
    // get submitter MSPID
    const submitterMSPID = ctx.clientIdentity.getMSPID();
    // only accept requests from Org2 and Org3
    if (submitterMSPID !== 'Org1MSP') {
        throw new Error('AUTHENTICATION_ERROR client is not authorized to assign survey');
    }
    await _transfer(ctx, to, surveyID);
    return {
        message: "user has access now"
    };
};

/** get all surveys for a user */
exports.getOwnedAnswers = async (ctx) => {
    const creator = ctx.clientIdentity.getID();
    const surveys = [];

    // Query the ownedDoctosPrefix index by submitter id
    // This will execute a key range query on all keys starting with 'submitter'
    let ownedSurveysIterator = await ctx.stub.getStateByPartialCompositeKey(ownedResultsPrefix,
        [creator]);

    // Iterate through result set and for each survey found, get user ID
    let responseRange = await ownedSurveysIterator.next();
    while (!responseRange.done) {
        if (!responseRange || !responseRange.value || !responseRange.value.key) {
            return;
        }

        let attributes;
        (
            { attributes } = await ctx.stub.splitCompositeKey(responseRange.value.key)
        );

        let returnedSurveyID = attributes[1];


        surveys.push({ surveyID: returnedSurveyID });

        responseRange = await ownedSurveysIterator.next();
    }

    // now we return owned surveys for this user
    return surveys;
};