const { Transfer } = require('./Survey');

const statusEnum = {
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
  };

const checkRequest = async (ctx, requestID) => {
    // check if request exists
    const requestBytes = await ctx.stub.getState(requestID);
    if (!requestBytes || requestBytes.length === 0) {
        throw new Error('NOT_FOUND_ERROR no request found with this Key');
    }
    const requestRecord = JSON.parse(requestBytes.toString());

    // check if submitter is request owner
    const submitter = ctx.clientIdentity.getID();
    if (submitter !== requestRecord.owner) {
        throw new Error('AUTHENTICATION_ERROR client is not the owner in this request');
    }

    // check if request is pending
    if (requestRecord.status !== statusEnum.pending) {
        throw new Error('CONFLICT_ERROR request is no longer pending');
    }

    return requestRecord;
};
/** request survey from client user */
exports.requestSurvey = async (ctx, requestID, surveyID, owner ) => {
    // check survey exists
    const surveyBytes = await ctx.stub.getState(surveyID);
    if (!surveyBytes || surveyBytes.length === 0) {
        throw new Error('NOT_FOUND_ERROR no survey found with this Key');
    }

    const requester = ctx.clientIdentity.getID();
    // get submitter MSPID
    const requesterMSPID = ctx.clientIdentity.getMSPID();
    // only accept requests from Org2 and Org3
    if (requesterMSPID !== 'Org1MSP' && requesterMSPID !== 'Org3MSP') {
        throw new Error('AUTHENTICATION_ERROR client is not authorized to create requests');
    }

    if (!owner.includes('org1') && !owner.includes('org2')) {
        throw new Error('AUTHENTICATION_ERROR Org1 and org2 clients has a survey');
    }

    // create request object
    const seconds = ctx.stub.getTxTimestamp().seconds.toString();
    const nanos = ctx.stub.getTxTimestamp().nanos.toString().slice(0, 3);
    const Record = {
        surveyID,
        requester,
        owner,
        status: statusEnum.pending,
        docType: 'request',
        createdAt: +`${seconds}${nanos}`,
    };

    await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(Record), 'utf8'));
    return JSON.stringify({ Key: requestID, Record });
};

/** change request status to approved */
exports.approveRequest = async (ctx, requestID ) => {
    // check if request exists and still pending
    const requestRecord = await checkRequest(ctx, requestID);
    requestRecord.status = statusEnum.approved;
    const { requester, surveyID } = requestRecord;
    await Transfer(ctx, requester, surveyID);
    await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(requestRecord), 'utf8'));
    return JSON.stringify({ Key: requestID, Record: requestRecord });
};

/** change request status to rejected */
exports.rejectRequest = async (ctx, requestID) => {
    // check if request exists with submitter as provider and still pending
    const requestRecord = await checkRequest(ctx, requestID);

    // change request status to canceled
    requestRecord.status = statusEnum.rejected;

    await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(requestRecord), 'utf8'));
    return JSON.stringify({ Key: requestID, Record: requestRecord });
};