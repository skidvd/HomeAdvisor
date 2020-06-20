'use strict';

const db = require('../../../db')
const hours = require('./hours');

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use('/businesses/:businessId/hours', hours);

let testBusiness;
let testHour;

const resetDb = async (done) => {
    // We want to have a known starting point before each test, so we clear out any previous data and begin with
    // a known initial set of seed data
    await db.migrate.latest();
    await db.table('businesses').del();
    await db.seed.run();

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business.  However, the hour based operations are all relative to a known business id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses to fulfill this need and
    // enable proper testing.
    const businesses = await db('businesses').orderBy('name');
    testBusiness = businesses[1];

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business' Hour.  However, many hour based operations require a known hour id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses' hours to fulfill this need
    // and enable further testing.
    const hours = await db('hours').where({businessId: testBusiness.id}).orderBy('dayOfWeek');
    testHour = hours[5];

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

test('GET /businesses/<testBusiness.id>/hours for initial seed data (no filters, default order)', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/hours`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(6);
            expect(res.body[0].dayOfWeek).toEqual(1);
            expect(res.body[0].open).toEqual(10);
            expect(res.body[0].close).toEqual(19);
            expect(res.body[5].dayOfWeek).toEqual(6);
            expect(res.body[5].open).toEqual(9);
            expect(res.body[5].close).toEqual(12);
            done();
        });
});

test('GET /businesses/<testBusiness.id>/hours/<testHour.id> for initial seed data', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/hours/${testHour.id}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.dayOfWeek).toEqual(testHour.dayOfWeek);
            expect(res.body.open).toEqual(testHour.open);
            expect(res.body.close).toEqual(testHour.close);
            done();
        });
});

test('POST /businesses/<testBusiness.id>/hours to add new hour', async (done) => {
    await request(app).post(`/businesses/${testBusiness.id}/hours`)
        .send({dayOfWeek: 0, open: 11, close: 16})
        .expect(200)
        .expect(async (res) => {
            // Verify that the added hour is there
            await request(app).get(`/businesses/${testBusiness.id}/hours`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(7);
                    expect(res.body[0].dayOfWeek).toEqual(0);
                    expect(res.body[0].open).toEqual(11);
                    expect(res.body[0].close).toEqual(16);
                    done();
                });
        });
});

test('PUT /businesses/<testBusiness.id>/hours/<testHour.id> to change existing hour name', async (done) => {
    const revisedHour = {
        ...testHour,
        dayOfWeek: 0,
        close: 15
    };
    await request(app).put(`/businesses/${testBusiness.id}/hours/${testHour.id}`)
        .send(revisedHour)
        .expect(200)
        .expect(async (res) => {
            // Verify that the modified hour is there
            await request(app).get(`/businesses/${testBusiness.id}/hours`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(6);
                    expect(res.body[0].id).toEqual(testHour.id);
                    expect(res.body[0].dayOfWeek).toEqual(revisedHour.dayOfWeek);
                    expect(res.body[0].open).toEqual(revisedHour.open);
                    expect(res.body[0].close).toEqual(revisedHour.close);
                    done();
                });
        });
});

test('DEL /businesses/<testBusiness.id>/hours/<testHour.id> to delete an existing hour', async (done) => {
    await request(app).del(`/businesses/${testBusiness.id}/hours/${testHour.id}`)
        .expect(200)
        .expect(async (res) => {
            // Verify that the removed hour is no longer there
            await request(app).get(`/businesses/${testBusiness.id}/hours`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(5);
                    expect(res.body.filter((hour) => hour.dayOfWeek === testHour.dayOfWeek)).toEqual([]);
                    expect(res.body.filter((hour) => hour.id === testHour.id)).toEqual([]);
                    done();
                });
        });
});

