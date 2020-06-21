'use strict';

const express = require('express');
const router = express.Router({mergeParams: true});
const uuid = require('uuid');
const db = require('../../db')

const MAX_BUSINESS_PER_PAGE = 25;

/**
 * @swagger
 *  components:
 *    schemas:
 *      Business:
 *        type: object
 *        required:
 *          - id
 *          - name
 *        properties:
 *          id:
 *            type: string
 *            description: Unique id for the Business.
 *          name:
 *            type: string
 *            description: Name for the Business, needs to be unique.
 *          addressLine1:
 *            type: string
 *            description: addressLine1 for the Business
 *          addressLine2:
 *            type: string
 *            description: addressLine2 for the Business
 *          city:
 *            type: string
 *            description: city for the Business
 *          state:
 *            type: string
 *            description: state for the Business
 *          postal:
 *            type: string
 *            description: postal code for the Business
 *          locations:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/Location'
 *          hours:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/Hour'
 *          services:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/Service'
 *          reviews:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/Review'
 *          avgRating:
 *            type: number
 *            format: float
 *            description: The average (rounded to 1 decimal place) across all review rating associated with the Business (undefined if no ratings yet)
 *          created_at:
 *            type: string
 *            description: Timestamp of creation
 *          updated_at:
 *            type: string
 *            description: Timestamp of last update
 *
 *      Search:
 *        type: object
 *        properties:
 *          name:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the Business name.
 *          addressLine1:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the Business addressLine1.
 *          addressLine2:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the Business addressLine2.
 *          city:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the Business city.
 *          state:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the Business state.
 *          postal:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the Business postal.
 *          dayOfWeek:
 *            type: integer
 *            description: An optional parameter that will be used to compare against the Business' Hours (only those Businesses who are open during the dayOfWeek and hour values specified will be returned).  TODO - Please note that this is an overly simplistic approach to specifying a time based search that would likely need to be enhanced; however, it will suffice for purposes of this exercise.
 *          hour:
 *            type: integer
 *            description: An optional parameter that will be used to compare against the Business' Hours (only those Businesses who are open during the dayOfWeek and hour values specified will be returned).  TODO - Please note that this is an overly simplistic approach to specifying a time based search that would likely need to be enhanced; however, it will suffice for purposes of this exercise.
 *          service:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the name of the Services offered by the Business.
 *          location:
 *            type: string
 *            description: An optional parameter that will be used to case-insensitive, partial-text match against the name of the Locations served by the Business.
 *          rating:
 *            type: integer
 *            description: An optional parameter that will be used to compare against the average across all ratings received for the Business (only those Businesses who average is >= to the value specified will be returned).
 *          sortBy:
 *            type: string
 *            description: An optional parameter that can be used to specify an attribute to sort matching results by.  The only supported values are 'name' and 'rating'; all other values will be ignored.  If not specified, this will default to sorting by 'name'.
 *          sortDirection:
 *            type: string
 *            description: An optional parameter that can be used to specify the sort direction for matching results by.  The only supported values are 'asc' and 'desc'; all other values will be ignored.  If not specified, this will default to sorting 'asc'.
 */

/**
 * @swagger
 * tags:
 *   name: Business
 *   description: Business API
 */

const getLocations = async  (businessId) => {
    return await db('locations')
        .where({businessId})
        .orderBy('name')
        .then((items) => items && items.length ? items : undefined);
}

const getHours = async  (businessId) => {
    return await db('hours')
        .where({businessId})
        .orderBy('dayOfWeek')
        .then((items) => items && items.length ? items : undefined);
}

const getServices = async  (businessId) => {
    return await db('services')
        .where({businessId})
        .orderBy('name')
        .then((items) => items && items.length ? items : undefined);
}

const getReviews = async  (businessId) => {
    return await db('reviews')
        .where({businessId})
        .orderBy('created_at')
        .then((items) => items && items.length ? items : undefined);
}

/**
 * @swagger
 * path:
 *  /businesses/{businessId}:
 *    get:
 *      summary: Retrieve the Business identified by {businessId}
 *      tags: [Business]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      responses:
 *        "200":
 *          description: Business associated with the specified business
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Business'
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.get('/:businessId', async (req, resp, next) => {
    const id = req.params.businessId;

    try {
        const businesses = await db('businesses')
            .select('*',
                db('reviews')
                    .select(db.raw('round(avg(rating),1)'))
                    .where('reviews.businessId', '=', db.ref('businesses.id'))
                    .as('avgRating')
            )
            .where({id})
            .then((results) => {
                return Promise.all(
                    results.map(async (b) => {
                        b.locations = await getLocations(b.id);
                        b.hours = await getHours(b.id);
                        b.services = await getServices(b.id);
                        b.reviews = await getReviews(b.id);
                        return b;
                    })
                );
            });

        if (businesses && businesses.length) {
            resp.status(200).json(businesses[0]);
        } else {
            resp.status(404).send(`The specified business does not exist`);
        }
    } catch (err) {
        console.error(`Error while retrieving businesses`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/search:
 *    post:
 *      summary: Retrieve the Businesses that match specified search criteria
 *      tags: [Business]
 *      requestBody:
 *        description: The optional Search parameters used to filter the desired Businesses with
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Search'
 *      responses:
 *        "200":
 *          description: Business associated with the specified business
 *          content:
 *            application/json:
 *              schema:
 *                type: array   (TODO - Please note, that a maximum of 25 Businesses will be returned at this time.  A proper pagination scheme would typically be added to address this)
 *                items:
 *                  $ref: '#/components/schemas/Business'
 *        "400":
 *          description: Bad Request - an invalid search combination has been specified
 *        "404":
 *          description: no Businesses matching the specified criteria could be found
 *        "5XX":
 *          description: unexpected error
 */
router.post('/search', async (req, resp, next) => {

    const search = req.body || {};

    if (search &&
        ((search.dayOfWeek !== undefined && search.hour === undefined) ||
         (search.dayOfWeek === undefined && search.hour !== undefined))) {
        resp.status(400).send(`Both the dayOfWeek and hour search parameters must be specified whenever either of them is specified`);
        return;
    }
    if (search && (search.dayOfWeek < 0 || search.dayOfWeek > 6)) {
        resp.status(400).send(`The dayOfWeek is invalid; 0 <= dayOfWeek <= 6 is expected`);
        return;
    }
    if (search && (search.hour < 0 || search.hour > 23)) {
        resp.status(400).send(`The hour is invalid; 0 <= hour <= 23 is expected`);
        return;
    }

    if (search && search.sortBy) {
        search.sortBy = search.sortBy.toLowerCase();
        if (search.sortBy !== 'name' && search.sortBy !== 'rating') {
            resp.status(400).send(`Invalid sortBy field: only \'name\' and \'rating\' are supported at this time`);
            return;
        }
    } else {
        search.sortBy = 'name';
    }
    if (search && search.sortDirection) {
        search.sortDirection = search.sortDirection.toLowerCase();
        if (search.sortDirection !== 'asc' && search.sortDirection !== 'desc') {
            resp.status(400).send(`Invalid sortDirection field: only \'asc\' and \'desc\' are supported at this time`);
            return;
        }
    } else {
        search.sortDirection = 'asc';
    }

    try {
        const businesses = await db('businesses')
            .select('*',
                    db('reviews')
                        .select(db.raw('round(avg(rating),1)'))
                        .where('reviews.businessId', '=', db.ref('businesses.id'))
                        .as('avgRating')
            )
            .limit(MAX_BUSINESS_PER_PAGE)
            .where((builder) => {
                if (search && search.name) {
                    builder.where('name', 'like', `%${search.name.toLowerCase()}%`);
                }
                if (search && search.addressLine1) {
                    builder.where('addressLine1', 'like', `%${search.addressLine1.toLowerCase()}%`);
                }
                if (search && search.addressLine2) {
                    builder.where('addressLine2', 'like', `%${search.addressLine2.toLowerCase()}%`);
                }
                if (search && search.city) {
                    builder.where('city', 'like', `%${search.city.toLowerCase()}%`);
                }
                if (search && search.state) {
                    builder.where('state', 'like', `%${search.state.toLowerCase()}%`);
                }
                if (search && search.postal) {
                    builder.where('postal', 'like', `%${search.postal.toLowerCase()}%`);
                }
                if (search && search.dayOfWeek !== undefined && search.hour !== undefined) {
                    builder.whereExists(
                        db('hours')
                            .where('dayOfWeek', '=', search.dayOfWeek)
                            .where('open', '<=', search.hour)
                            .where('close', '>=', search.hour)
                            .where('hours.businessId', '=', db.ref('businesses.id')));
                }
                if (search && search.service) {
                    builder.whereExists(
                        db('services')
                            .where('name', 'like', `%${search.service.toLowerCase()}%`)
                            .where('services.businessId', '=', db.ref('businesses.id')));
                }
                if (search && search.location) {
                    builder.whereExists(
                        db('locations')
                            .where('name', 'like', `%${search.location.toLowerCase()}%`)
                            .where('locations.businessId', '=', db.ref('businesses.id')));
                }
                if (search && search.rating !== undefined) {
                    builder.where(db.ref('avgRating'), '>=', search.rating);
                }
            })
            .orderBy(search.sortBy === 'rating' ? 'avgRating' : search.sortBy, search.sortDirection)
            .then((results) => {
                return Promise.all(
                    results.map(async (b) => {
                        b.locations = await getLocations(b.id);
                        b.hours = await getHours(b.id);
                        b.services = await getServices(b.id);
                        b.reviews = await getReviews(b.id);
                        return b;
                    })
                );
            });

        if (businesses && businesses.length) {
            resp.status(200).json(businesses);
        } else {
            resp.status(404).send('no Businesses matching the specified criteria could be found');
        }
    } catch (err) {
        console.error(`Error while retrieving businesses ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses:
 *    post:
 *      summary: Add a new Business
 *      tags: [Business]
 *      requestBody:
 *        description: A sparse Business object (i.e. only the name must be specified.  The id attribute will be ignored if specified.  Any optionally included Locations, Hours, Services and/or Reviews will be atomically inserted within the transaction used to add the new Business.)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Business'
 *      responses:
 *        "200":
 *          description: The new Business has been successfully added
 *          content:
 *            application/json:
 *              schema:
 *                type: string
 *                description: the unique id for the new Business
 *        "400":
 *          description: Bad Request - the Business name must be specified
 *        "5XX":
 *          description: unexpected error
 */
router.post('/', async (req, resp, next) => {

    const business = {
        ...req.body
    }

    // TODO: Note: we ignore and override any ids that may have been specified in the body for simplicity reason for this
    // exercise.  However, we would typically want to detect this and notify the caller in some manner
    business.id = uuid.v4();

    const locations = addIds(req.body.locations, business.id);
    const hours = addIds(req.body.hours, business.id);
    const services = addIds(req.body.services, business.id);
    const reviews = addIds(req.body.reviews, business.id);
    delete business.locations;
    delete business.hours;
    delete business.services;
    delete business.reviews;
    delete business.avgRating;
    delete business['created_at'];
    delete business['updated_at'];

    if (!business.name) {
        resp.status(400).send(`Business name must be specified`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the requested business does not already exist and return an
    // appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

    try {
        await db.transaction(async (trx) => {
            const businesses = await db('businesses')
                .insert(business)
                .transacting(trx);

            if (locations && locations.length) {
                await db('locations')
                    .insert(locations)
                    .transacting(trx);
            }
            if (hours && hours.length) {
                await db('hours')
                    .insert(hours)
                    .transacting(trx);
            }
            if (services && services.length) {
                await db('services')
                    .insert(services)
                    .transacting(trx);
            }
            if (reviews && reviews.length) {
                await db('reviews')
                    .insert(reviews)
                    .transacting(trx);
            }

            resp.status(200).send({id: business.id});
        });
    } catch (err) {
        console.error(`Error while adding business ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

const addIds = (list, businessId) => {
    return list && list.length ? list.map((item) => {
        // TODO: Note: we ignore and override any ids that may have been specified in the body for simplicity reason for this
        // exercise.  However, we would typically want to detect this and notify the caller in some manner
        item.id = uuid.v4();
        item.businessId = businessId;
        return item;
    }) : list;
}

/**
 * @swagger
 * path:
 *  /businesses/{businessId}:
 *    put:
 *      summary: Update the unique Business identified by {businessId}
 *      tags: [Business]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      requestBody:
 *        description: A sparse Business object (i.e. only the name and/or address information must be specified.  The id attribute will be ignored if specified.  Please note that any optionally included Locations, Hours, Services and/or Reviews will be ignored if provided - please use the respective endpoints for each to make any desired changes to them directly.)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Business'
 *      responses:
 *        "200":
 *          description: The new Business has been successfully modified
 *          content:
 *            application/json:
 *              schema:
 *                type: string
 *                description: the unique id for the new Business
 *        "400":
 *          description: Bad Request - at least one of the Business name and/or address attributes must be specified
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.put('/:businessId', async (req, resp, next) => {
    const id = req.params.businessId;

    const business = {
        ...req.body
    }

    if (!business.name && !business.addressLine1 && !business.addressline2 &&
        !business.city && !business.state && !business.postal) {
        resp.status(400).send(`At least one of Business name and/or address attributes must be specified`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the revised Business name does not already exist and return
    // an appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

    // TODO: Note: we would typically want to check here to make sure that only allowable modifications are specified and return
    // an appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }

        const updatedBusiness = {
            name: business.name ? business.name : undefined,
            addressLine1: business.addressLine1 ? business.addressLine1 : undefined,
            addressLine2: business.addressLine2 ? business.addressLine2 : undefined,
            city: business.city ? business.city : undefined,
            state: business.state ? business.state : undefined,
            postal: business.postal ? business.postal : undefined,
            'updated_at': db.fn.now()
        }

        const businesses = await db('businesses')
            .update(updatedBusiness)
            .where({id});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while updating BusinessId ${id} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}:
 *    delete:
 *      summary: Delete the unique Business identified by {businessId}
 *      tags: [Business]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      responses:
 *        "200":
 *          description: The Business has been successfully deleted
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.delete('/:businessId', async (req, resp, next) => {
    const id = req.params.businessId;

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }

        const businesses = await db('businesses')
            .del()
            .where({id});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while deleting Business ${id} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

module.exports = router;
