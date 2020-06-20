'use strict';

const db = require('../../../db')
const reviews = require('./reviews');

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use('/businesses/:businessId/reviews', reviews);

let testBusiness;
let testReview;

const resetDb = async (done) => {
    // We want to have a known starting point before each test, so we clear out any previous data and begin with
    // a known initial set of seed data
    await db.migrate.latest();
    await db.table('businesses').del();
    await db.seed.run();

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business.  However, the review based operations are all relative to a known business id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses to fulfill this need and
    // enable proper testing.
    const businesses = await db('businesses').orderBy('name');
    testBusiness = businesses[1];

    // As the ids are dynamically determined and assigned, we cannot rely upon pre-determined values to
    // identify a business' Review.  However, many review based operations require a known review id.  Therefore, for
    // testing purposes, we will arbitrarily choose one of the initial seed data businesses' reviews to fulfill this need
    // and enable further testing.
    const reviews = await db('reviews').where({businessId: testBusiness.id}).orderBy('created_at');
    testReview = reviews[0];

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

test('GET /businesses/<testBusiness.id>/reviews for initial seed data (no filters, default order)', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/reviews`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(3);
            expect(res.body[0].rating).toEqual(4);
            expect(res.body[0].comment).toEqual('Move out cleaning');
            expect(res.body[2].rating).toEqual(5);
            expect(res.body[2].comment).toBeNull();
            done();
        });
});

test('GET /businesses/<testBusiness.id>/reviews/<testReview.id> for initial seed data', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}/reviews/${testReview.id}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.rating).toEqual(testReview.rating);
            expect(res.body.comment).toEqual(testReview.comment);
            done();
        });
});

test('POST /businesses/<testBusiness.id>/reviews to add new review', async (done) => {
    await request(app).post(`/businesses/${testBusiness.id}/reviews`)
        .send({rating: 5, comment: 'Fast, affordable, dependable!'})
        .expect(200)
        .expect(async (res) => {
            // Verify that the added review is there
            await request(app).get(`/businesses/${testBusiness.id}/reviews`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(4);
                    expect(res.body[3].rating).toEqual(5);
                    expect(res.body[3].comment).toEqual('Fast, affordable, dependable!');
                    done();
                });
        });
});

test('PUT /businesses/<testBusiness.id>/reviews/<testReview.id> to change existing review name', async (done) => {
    const revisedReview = {
        ...testReview,
        rating: 3
    };
    await request(app).put(`/businesses/${testBusiness.id}/reviews/${testReview.id}`)
        .send(revisedReview)
        .expect(200)
        .expect(async (res) => {
            // Verify that the modified review is there
            await request(app).get(`/businesses/${testBusiness.id}/reviews`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(3);
                    expect(res.body[0].rating).toEqual(revisedReview.rating);
                    expect(res.body[0].comment).toEqual(testReview.comment);
                    done();
                });
        });
});

test('DEL /businesses/<testBusiness.id>/reviews/<testReview.id> to delete an existing review', async (done) => {
    await request(app).del(`/businesses/${testBusiness.id}/reviews/${testReview.id}`)
        .expect(200)
        .expect(async (res) => {
            // Verify that the removed review is no longer there
            await request(app).get(`/businesses/${testBusiness.id}/reviews`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.length).toEqual(2);
                    expect(res.body.filter((review) => review.id === testReview.id)).toEqual([]);
                    done();
                });
        });
});

