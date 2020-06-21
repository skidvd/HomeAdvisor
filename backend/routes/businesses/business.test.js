'use strict';

const db = require('../../db')
const businesses = require('./businesses');

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use('/businesses', businesses);

let testBusiness;

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

test('GET /businesses/<testBusiness.id> for initial seed data', async (done) => {
    await request(app).get(`/businesses/${testBusiness.id}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.name).toEqual(testBusiness.name);
            expect(res.body.locations.length).toEqual(6);
            expect(res.body.hours.length).toEqual(6);
            expect(res.body.services.length).toEqual(4);
            expect(res.body.reviews.length).toEqual(3);
            expect(res.body.avgRating).toBeCloseTo(3.7);
            done();
        });
});

test('Search for initial seed data (no filters, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(3);
            expect(res.body[0].name).toEqual('Sample Business #1');
            expect(res.body[0].locations.length).toEqual(7);
            expect(res.body[0].hours.length).toEqual(5);
            expect(res.body[0].services.length).toEqual(3);
            expect(res.body[0].reviews.length).toEqual(3);
            expect(res.body[1].name).toEqual('Sample Business #2');
            expect(res.body[1].locations.length).toEqual(6);
            expect(res.body[1].hours.length).toEqual(6);
            expect(res.body[1].services.length).toEqual(4);
            expect(res.body[1].reviews.length).toEqual(3);
            expect(res.body[2].name).toEqual('Sample Business #3');
            expect(res.body[2].locations.length).toEqual(5);
            expect(res.body[2].hours.length).toEqual(6);
            expect(res.body[2].services.length).toEqual(2);
            expect(res.body[2].reviews.length).toEqual(1);
            done();
        });
});

test('Search for initial seed data (no filters, desc name sort order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            sortDirection: 'desc'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(3);
            expect(res.body[0].name).toEqual('Sample Business #3');
            expect(res.body[0].locations.length).toEqual(5);
            expect(res.body[0].hours.length).toEqual(6);
            expect(res.body[0].services.length).toEqual(2);
            expect(res.body[0].reviews.length).toEqual(1);
            expect(res.body[1].name).toEqual('Sample Business #2');
            expect(res.body[1].locations.length).toEqual(6);
            expect(res.body[1].hours.length).toEqual(6);
            expect(res.body[1].services.length).toEqual(4);
            expect(res.body[1].reviews.length).toEqual(3);
            expect(res.body[2].name).toEqual('Sample Business #1');
            expect(res.body[2].locations.length).toEqual(7);
            expect(res.body[2].hours.length).toEqual(5);
            expect(res.body[2].services.length).toEqual(3);
            expect(res.body[2].reviews.length).toEqual(3);
            done();
        });
});

test('Search for initial seed data (no filters, asc rating sort order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            sortBy: 'rating',
            sortDirection: 'asc'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(3);
            expect(res.body[0].name).toEqual('Sample Business #2');
            expect(res.body[0].locations.length).toEqual(6);
            expect(res.body[0].hours.length).toEqual(6);
            expect(res.body[0].services.length).toEqual(4);
            expect(res.body[0].reviews.length).toEqual(3);
            expect(res.body[0].avgRating).toBeCloseTo(3.7)
            expect(res.body[1].name).toEqual('Sample Business #1');
            expect(res.body[1].locations.length).toEqual(7);
            expect(res.body[1].hours.length).toEqual(5);
            expect(res.body[1].services.length).toEqual(3);
            expect(res.body[1].reviews.length).toEqual(3);
            expect(res.body[1].avgRating).toBeCloseTo(4.2)
            expect(res.body[2].name).toEqual('Sample Business #3');
            expect(res.body[2].locations.length).toEqual(5);
            expect(res.body[2].hours.length).toEqual(6);
            expect(res.body[2].services.length).toEqual(2);
            expect(res.body[2].reviews.length).toEqual(1);
            expect(res.body[2].avgRating).toBeCloseTo(5)
            done();
        });
});

test('Search for initial seed data (case-insensitive name filter, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            name: 'bUsInESs #2'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(1);
            expect(res.body[0].name).toEqual(testBusiness.name);
            done();
        });
});

test('Search for initial seed data (case-insensitive name and address attribute filter, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            name: 'bUsInESs',
            city: 'Enderson'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(1);
            expect(res.body[0].name).toEqual('Sample Business #3');
            expect(res.body[0].city).toEqual('Henderson');
            done();
        });
});

test('Search for initial seed data (case-insensitive service name filter, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'clean'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(2);
            expect(res.body[0].name).toEqual('Sample Business #1');
            expect(res.body[0].city).toEqual('Denver');
            expect(res.body[1].name).toEqual('Sample Business #2');
            expect(res.body[1].city).toEqual('Denver');
            done();
        });
});

test('Search for initial seed data (case-insensitive service name filter, asc rating sort order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'clean',
            sortBy: 'rating'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(2);
            expect(res.body[0].name).toEqual('Sample Business #2');
            expect(res.body[0].city).toEqual('Denver');
            expect(res.body[1].name).toEqual('Sample Business #1');
            expect(res.body[1].city).toEqual('Denver');
            expect(res.body[1].avgRating).toBeGreaterThanOrEqual(res.body[0].avgRating);
            done();
        });
});

test('Search for initial seed data (case-insensitive service name filter, desc rating sort order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'clean',
            sortBy: 'rating',
            sortDirection: 'desc'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(2);
            expect(res.body[0].name).toEqual('Sample Business #1');
            expect(res.body[0].city).toEqual('Denver');
            expect(res.body[1].name).toEqual('Sample Business #2');
            expect(res.body[1].city).toEqual('Denver');
            expect(res.body[0].avgRating).toBeGreaterThanOrEqual(res.body[1].avgRating);
            done();
        });
});

test('Search for initial seed data (case-insensitive service name and location name filter, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'clean',
            location: 'lake'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(1);
            expect(res.body[0].name).toEqual('Sample Business #1');
            expect(res.body[0].addressLine1).toEqual('1234 Fake St');
            done();
        });
});

test('Search for initial seed data (case-insensitive service name and hours filter, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'pack',
            dayOfWeek: 6,
            hour: 8
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(1);
            expect(res.body[0].name).toEqual('Sample Business #3');
            expect(res.body[0].addressLine1).toEqual('23456 5th Ave');
            done();
        });
});

test('Search for initial seed data (case-insensitive service name, case insensitive location name and hours filter before any open - Should not match any, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'pack',
            dayOfWeek: 6,
            hour: 8,
            location: 'arv'
        })
        .expect(404);
    done();
});

test('Search for initial seed data (case-insensitive service name, case insensitive location name and hours filter, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'pack',
            dayOfWeek: 6,
            hour: 11,
            location: 'arv'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(1);
            expect(res.body[0].name).toEqual('Sample Business #2');
            expect(res.body[0].postal).toEqual('80201');
            done();
        });
});

test('Search for initial seed data (case-insensitive service name filter and rating filter, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'clean',
            rating: 3.7
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(2);
            expect(res.body[0].name).toEqual('Sample Business #1');
            expect(res.body[0].city).toEqual('Denver');
            expect(res.body[1].name).toEqual('Sample Business #2');
            expect(res.body[1].city).toEqual('Denver');
            done();
        });
});

test('Search for initial seed data (case-insensitive service name filter and rating filter, desc rating sort order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'clean',
            rating: 3.7,
            sortBy: 'rating',
            sortDirection: 'desc'
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toEqual(2);
            expect(res.body[0].name).toEqual('Sample Business #1');
            expect(res.body[0].city).toEqual('Denver');
            expect(res.body[1].name).toEqual('Sample Business #2');
            expect(res.body[1].city).toEqual('Denver');
            expect(res.body[0].avgRating).toBeGreaterThanOrEqual(res.body[1].avgRating);
            done();
        });
});

test('Search for initial seed data (case-insensitive service name filter and rating filter - Should not match any, default order)', async (done) => {
    await request(app).post('/businesses/search')
        .send({
            service: 'clean',
            rating: 4.3
        })
        .expect(404)
        done();
});

test('POST /businesses to add new Business (without any dependant data)', async (done) => {
    const business = {
        name: 'ZZZ',
        addressLine1: '123 Main Street',
        city: 'Denver',
        state: 'CO'
    }
    await request(app).post(`/businesses`)
        .send(business)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(async (res) => {
            const newId = res.body.id;
            // Verify that the added Business is there and as expected
            await request(app).get(`/businesses/${newId}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toEqual(newId);
                    expect(res.body.name).toEqual(business.name);
                    expect(res.body.locations).toBeUndefined();
                    expect(res.body.hours).toBeUndefined();
                    expect(res.body.services).toBeUndefined();
                    expect(res.body.reviews).toBeUndefined();
                    done();
                });
        });
});

test('POST /businesses to add new Business (with dependant data)', async (done) => {
    const business = {
        name: 'ZZZ',
        addressLine1: '123 Main Street',
        city: 'Denver',
        state: 'CO',
        locations: [
            {
                name: 'Denver'
            },
            {
                name: 'Colorado Springs',
            },
            {
                name: 'Durango'
            }
        ],
        hours: [
            {
                dayOfWeek: 1,
                open: 8,
                close: 13
            },
            {
                dayOfWeek: 3,
                open: 8,
                close: 13
            },
            {
                dayOfWeek: 5,
                open: 8,
                close: 13
            }
        ],
        services: [
            {
                name: 'Drywall'
            },
            {
                name: 'Snow Removal'
            },
            {
                name: 'Gardening'
            }
        ],
        reviews: [
            {
                rating: 2,
                comment: 'Late and expensive'
            },
            {
                rating: 5,
                comment: 'Simply Great!'
            }
        ]
    }
    await request(app).post(`/businesses`)
        .send(business)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(async (res) => {
            const newId = res.body.id;
            // Verify that the added Business is there and as expected
            await request(app).get(`/businesses/${newId}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toEqual(newId);
                    expect(res.body.name).toEqual(business.name);
                    expect(res.body.locations.length).toEqual(3);
                    expect(res.body.locations[0].name).toEqual('Colorado Springs');
                    expect(res.body.locations[2].name).toEqual('Durango');
                    expect(res.body.hours.length).toEqual(3);
                    expect(res.body.hours[0].dayOfWeek).toEqual(1);
                    expect(res.body.hours[1].open).toEqual(8);
                    expect(res.body.hours[2].close).toEqual(13);
                    expect(res.body.services.length).toEqual(3);
                    expect(res.body.services[0].name).toEqual('Drywall');
                    expect(res.body.services[2].name).toEqual('Snow Removal');
                    expect(res.body.reviews.length).toEqual(2);
                    expect(res.body.reviews[1].rating).toEqual(5);
                    expect(res.body.reviews[1].comment).toEqual('Simply Great!');
                    done();
                });
        });
});

test('PUT /businesses/<testBusiness.id> to change existing business name', async (done) => {
    const revisedBusiness = {
        ...testBusiness,
        name: 'ZZZ'
    };
    await request(app).put(`/businesses/${testBusiness.id}`)
        .send(revisedBusiness)
        .expect(200)
        .expect(async (res) => {
            // Verify that the modified service is there
            await request(app).get(`/businesses/${testBusiness.id}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toEqual(testBusiness.id);
                    expect(res.body.name).toEqual(revisedBusiness.name);
                    done();
                });
        });
});

test('DEL /businesses/<testBusiness.id> to delete an existing Business', async (done) => {
    await request(app).del(`/businesses/${testBusiness.id}`)
        .expect(200)
        .expect(async (res) => {
            // Verify that the removed Business is no longer there
            await request(app).get(`/businesses/${testBusiness.id}`)
                .expect(404);
            done();
        });
});


