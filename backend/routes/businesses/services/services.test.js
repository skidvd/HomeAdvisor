'use strict';

const db = require('../../../db')
const services = require('./services');

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use('/businesses/:businessId/services', services);

let testBusiness;
let testService;

const resetDb = async (done) => {
    // We want to have a known starting point before each test, so we clear out any previous data and begin with
    // a known initial set of seed data
    await db.migrate.latest();
    await db.table('businesses').del();
    await db.seed.run();

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business.  However, the service based operations are all relative to a known business id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses to fulfill this need and
    // enable proper testing.
    const businesses = await db('businesses').orderBy('name');
    testBusiness = businesses[1];

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business' Service.  However, many service based operations require a known service id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses' services to fulfill this need
    // and enable further testing.
    const services = await db('services').where({businessId: testBusiness.id}).orderBy('name');
    testService = services[2];

    done();
}

beforeAll(() => {
    process.env.NODE_ENV = 'test';
});


beforeEach(async (done) => {
    await resetDb(done);
});

/*
 TODO: General global note: I do not like the brittle way that the below tests reference the initial seed data by specific hard
 coded values and array indices.  This could be avoided by enhancing the seed initialization process to read its values
 from a separate common data-only module that these tests also reference as well.  However, for simplification of this
 exercise and as this does not appear to be it's intent, this has not been done.
 */

test('GET /businesses/<testBusiness.id>/services for initial seed data (no filters, default order)', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/services`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(4);
            expect(res.body[0].name).toEqual('House Cleaning');
            expect(res.body[3].name).toEqual('Packing');
            done();
        });
});

test('GET /businesses/<testBusiness.id>/services/<testService.id> for initial seed data', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/services/${testService.id}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.name).toEqual(testService.name);
            expect(res.body.name).toEqual('Moving Services');
            done();
        });
});

test('POST /businesses/<testBusiness.id>/services to add new service', async (done) => {
    await request(app).post(`/businesses/${testBusiness.id}/services`)
        .send({name: 'AAA'})
        .expect(200)
        .expect(async (res) => {
            // Verify that the added service is there
            await request(app).get(`/businesses/${testBusiness.id}/services`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(5);
                    expect(res.body[0].name).toEqual('AAA');
                    done();
                });
        });
});

test('PUT /businesses/<testBusiness.id>/services/<testService.id> to change existing service name', async (done) => {
    const revisedService = {
        ...testService,
        name: 'ZZZ'
    };
    await request(app).put(`/businesses/${testBusiness.id}/services/${testService.id}`)
        .send(revisedService)
        .expect(200)
        .expect(async (res) => {
            // Verify that the modified service is there
            await request(app).get(`/businesses/${testBusiness.id}/services`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(4);
                    expect(res.body[3].id).toEqual(testService.id);
                    expect(res.body[3].name).toEqual(revisedService.name);
                    done();
                });
        });
});

test('DEL /businesses/<testBusiness.id>/services/<testService.id> to delete an existing service', async (done) => {
    await request(app).del(`/businesses/${testBusiness.id}/services/${testService.id}`)
        .expect(200)
        .expect(async (res) => {
            // Verify that the removed service is no longer there
            await request(app).get(`/businesses/${testBusiness.id}/services`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(3);
                    expect(res.body.filter((service) => service.name === testService.name)).toEqual([]);
                    expect(res.body.filter((service) => service.id === testService.id)).toEqual([]);
                    done();
                });
        });
});

