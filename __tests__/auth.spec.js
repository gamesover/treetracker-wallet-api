require('dotenv').config()
const request = require('supertest');
const server = require("../server/app");
const { expect } = require('chai');
const seed = require('./seed');
const log = require('loglevel');
const Transfer = require("../server/models/Transfer");
const TrustRelationship = require("../server/models/TrustRelationship");
const sinon = require("sinon");
const chai = require("chai");
chai.use(require('chai-uuid'));

describe('Authentication', () => {
  let bearerToken;
  let bearerTokenB;

  before( async () => {
    await seed.clear();
    await seed.seed();
  });

  beforeEach(async () => {
    sinon.restore();
  })

  // Authorization path
  it(`[POST /auth] login with ${seed.wallet.name}`, (done) => {
    request(server)
      .post('/auth')
      .set('treetracker-api-key', seed.apiKey)
      .send({wallet: seed.wallet.name, password: seed.wallet.password})
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .end((err, res) => {
        if (err) done(err);
        expect(res.body).to.have.property('token');
        done();
      });
  });


  it(`[POST /auth] login with using wallet id: ${seed.wallet.id}`, (done) => {
    request(server)
      .post('/auth')
      .set('treetracker-api-key', seed.apiKey)
      .send({wallet: seed.wallet.id, password: seed.wallet.password})
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .end((err, res) => {
        if (err) done(err);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  // add this to test GET /wallets to optimize the performance
  it.only(`[POST /auth] login with using walletB id: ${seed.walletB.id}`, async () => {
    console.warn("start...");
    let res = await request(server)
      .post('/auth')
      .set('treetracker-api-key', seed.apiKey)
      .send({wallet: seed.walletB.id, password: seed.walletB.password})
      .expect('Content-Type', /application\/json/)
    console.warn("login:", res.body);
    
    expect(res).to.have.property('statusCode', 200);
    expect(res.body).to.have.property('token');
    bearerToken = res.body.token;
    console.warn("beartoken:", bearerToken);

    res = await request(server)
      .get(`/wallets?limit=100&start=1`)
      .set('treetracker-api-key', seed.apiKey)
      .set('Authorization', `Bearer ${bearerToken}`);
    
    expect(res).to.have.property('statusCode', 200);
    console.warn("res.body", res.body);
    expect(res.body.wallets).lengthOf(2);
    expect(res.body.wallets[0]).property('name').a('string');
    expect(res.body.wallets[0]).property('tokens_in_wallet').a('number');

    // change limit offset
    res = await request(server)
      .get(`/wallets?limit=1&start=2`)
      .set('treetracker-api-key', seed.apiKey)
      .set('Authorization', `Bearer ${bearerToken}`);
    
    expect(res).to.have.property('statusCode', 200);
    console.warn("res.body", res.body);
    expect(res.body.wallets).lengthOf(1);
    expect(res.body.wallets[0]).property('name').a('string');
    expect(res.body.wallets[0]).property('tokens_in_wallet').a('number');
    
  });
});
