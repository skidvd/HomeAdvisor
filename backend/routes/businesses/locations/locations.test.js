'use strict';

const db = require('../../../db')
const locations = require('./locations');

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use('/businesses/:businessId/locations', locations);

let testBusiness;
let testLocation;

const resetDb = async (done) => {
    // We want to have a known starting point before each test, so we clear out any previous data and begin with
    // a known initial set of seed data
    await db.migrate.latest();
    await db.table('businesses').del();
    await db.seed.run();

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business.  However, the location based operations are all relative to a known business id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses to fulfill this need and
    // enable proper testing.
    const businesses = await db('businesses').orderBy('name');
    testBusiness = businesses[1];

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business' Location.  However, many location based operations require a known location id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses' locations to fulfill this need
    // and enable further testing.
    const locations = await db('locations').where({businessId: testBusiness.id}).orderBy('name');
    testLocation = locations[2];

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

test('GET /businesses/<testBusiness.id>/locations for initial seed data (no filters, default order)', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/locations`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(6);
            expect(res.body[0].name).toEqual('Arvada');
            expect(res.body[5].name).toEqual('Thorton');
            done();
        });
});

test('GET /businesses/<testBusiness.id>/locations/<testLocation.id> for initial seed data', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/locations/${testLocation.id}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.name).toEqual(testLocation.name);
            expect(res.body.name).toEqual('Denver');
            done();
        });
});

test('POST /businesses/<testBusiness.id>/locations to add new location', async (done) => {
    await request(app).post(`/businesses/${testBusiness.id}/locations`)
        .send({name: 'AAA'})
        .expect(200)
        .expect(async (res) => {
            // Verify that the added location is there
            await request(app).get(`/businesses/${testBusiness.id}/locations`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(7);
                    expect(res.body[0].name).toEqual('AAA');
                    done();
                });
        });
});

test('PUT /businesses/<testBusiness.id>/locations/<testLocation.id> to change existing location name', async (done) => {
    const revisedLocation = {
        ...testLocation,
        name: 'ZZZ'
    };
    await request(app).put(`/businesses/${testBusiness.id}/locations/${testLocation.id}`)
        .send(revisedLocation)
        .expect(200)
        .expect(async (res) => {
            // Verify that the modified location is there
            await request(app).get(`/businesses/${testBusiness.id}/locations`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(6);
                    expect(res.body[5].id).toEqual(testLocation.id);
                    expect(res.body[5].name).toEqual(revisedLocation.name);
                    done();
                });
        });
});

test('DEL /businesses/<testBusiness.id>/locations/<testLocation.id> to delete an existing location', async (done) => {
    await request(app).del(`/businesses/${testBusiness.id}/locations/${testLocation.id}`)
        .expect(200)
        .expect(async (res) => {
            // Verify that the removed location is no longer there
            await request(app).get(`/businesses/${testBusiness.id}/locations`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(5);
                    expect(res.body.filter((location) => location.name === testLocation.name)).toEqual([]);
                    expect(res.body.filter((location) => location.id === testLocation.id)).toEqual([]);
                    done();
                });
        });
});

