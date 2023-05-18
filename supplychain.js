"use strict";

const Base = require("./base");
const {
  requestSurvey,
  approveRequest,
  rejectRequest
} = require("./Request");

const {
  createSurvey,
  answerSurvey,
  getOwnedSurveys,
  assignSurvey,
  getOwnedAnswers
} = require("./Survey");

const {
  surveySchema,
  answerSchema,
  requestSchema,
  handleRequestSchema,
  assignSurveySchema
} = require("../schemas");

class Supplychain extends Base {
  async initLedger(ctx) {
    // default implementation is do nothing
  }

  async ClientAccountID(ctx) {
    const clientAccountID = ctx.clientIdentity.getID();
    return clientAccountID;
  }

  async CreateSurvey(ctx) {
    const args = super.parseArgs(ctx);
    const Key = super.generateKey(ctx, 10);
    const validatedArgs = super.validateSchema(surveySchema, args);
    const { title, type, question, answersRecord } = validatedArgs;
    
    const output = await createSurvey(ctx, Key, title, type, question, answersRecord);
    return output;
  }

  async CreateAnswer(ctx) {
    const args = super.parseArgs(ctx);
    const Key = super.generateKey(ctx, 10);
    const validatedArgs = super.validateSchema(answerSchema, args);
    const { surveyID, answer, surveyResult } = validatedArgs;

    const output = await answerSurvey(ctx, Key, surveyID, answer, surveyResult);
    return output;
  }

  async CreateRequest(ctx) {
    const args = super.parseArgs(ctx);
    const Key = super.generateKey(ctx, 10);
    const validatedArgs = super.validateSchema(requestSchema, args);
    const { surveyID, owner } = validatedArgs;
    const output = await requestSurvey(ctx, Key, surveyID, owner);
    return output;
  }

  async ApproveRequest(ctx) {
    const args = super.parseArgs(ctx);
    const validatedArgs = super.validateSchema(handleRequestSchema, args);
    const { requestID } = validatedArgs;

    const output = await approveRequest(ctx, requestID);
    return output;
  }

  async RejectRequest(ctx) {
    const args = super.parseArgs(ctx);
    const validatedArgs = super.validateSchema(handleRequestSchema, args);
    const { requestID } = validatedArgs;

    const output = await rejectRequest(ctx, requestID);
    return output;
  }
  async GetOwnedSurveys(ctx) {
    const surveys = await getOwnedSurveys(ctx);
    return surveys;
  }
  async GetOwnedAnswers(ctx) {
    const surveys = await getOwnedAnswers(ctx);
    return surveys;
  }
  async AssignSurvey(ctx) {
    const args = super.parseArgs(ctx);
    const validatedArgs = super.validateSchema(assignSurveySchema, args);
    const { surveyID, surveyor } = validatedArgs;
    const output = await assignSurvey(ctx, surveyor, surveyID);
    return output;
  }
  async update(ctx) {
    const { Key, ...args } = super.parseArgs(ctx);

    // check if asset exist
    if (!Key) throw new Error("Key is required");
    const keyAsset = await ctx.stub.getState(Key);
    if (!keyAsset || keyAsset.length === 0) {
      throw new Error("no asset found with this Key");
    }
    const Record = JSON.parse(keyAsset.toString());

    Object.assign(Record, args);
    await ctx.stub.putState(Key, Buffer.from(JSON.stringify(Record), "utf8"));
    return JSON.stringify({ Key, Record });
  }
  async getAssetIfExists(ctx, args) {
    try {
      JSON.parse(args);
    } catch (error) {
      throw new Error("transaction argument must be a stringified object");
    }
    const { key } = JSON.parse(args);
    if (!key) throw new Error("key is required");
    const assetJSON = await ctx.stub.getState(key);
    if (!assetJSON || assetJSON.length === 0) return false;
    return assetJSON.toString();
  }

  async delete(ctx) {
    const { key } = super.parseArgs(ctx);
    if (!key) throw new Error("key is required");
    const assetJSON = await ctx.stub.getState(key);
    if (!assetJSON || assetJSON.length === 0)
      throw new Error(`The asset ${key} does not exist`);
    await ctx.stub.deleteState(key);
    return assetJSON.toString();
  }

  async findAll(ctx) {
    const iterator = await ctx.stub.getStateByRange("", "");
    const allResults = [];
    while (true) {
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        console.log(res.value.value.toString("utf8"));

        const Key = res.value.key;
        let Record;
        try {
          Record = JSON.parse(res.value.value.toString("utf8"));
        } catch (err) {
          console.log(err);
          Record = res.value.value.toString("utf8");
        }
        allResults.push({ Key, Record });
      }
      if (res.done) {
        console.log("end of data");
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }

  async findOne(ctx) {
    const { key } = super.parseArgs(ctx);
    if (!key) throw new Error("key is required");
    const assetJSON = await ctx.stub.getState(key);
    if (!assetJSON || assetJSON.length === 0)
      throw new Error(`The asset ${key} does not exist`);
    return assetJSON.toString();
  }
}

module.exports = Supplychain;
