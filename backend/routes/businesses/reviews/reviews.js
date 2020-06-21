'use strict';

const express = require('express');
const router = express.Router({mergeParams: true});
const uuid = require('uuid');
const db = require('../../../db')

/**
 * @swagger
 *  components:
 *    schemas:
 *      Review:
 *        type: object
 *        required:
 *          - id
 *          - businessId
 *          - rating
 *        properties:
 *          id:
 *            type: string
 *            description: Unique id for the Review.
 *          businessId:
 *            type: string
 *            description: The id of the business to associate the Review with.
 *          rating:
 *            type: number
 *            format: float
 *            description: Review Rating score out of 5
 *          comment:
 *            type: string
 *            description: The review comment
 *          created_at:
 *            type: string
 *            description: Timestamp of creation
 *          updated_at:
 *            type: string
 *            description: Timestamp of last update
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Business Review API
 */

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/reviews:
 *    get:
 *      summary: Retrieve the Reviews associated with the {businessId}
 *      tags: [Reviews]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      responses:
 *        "200":
 *          description: Reviews associated with the specified business
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Review'
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.get('/', async (req, resp, next) => {
    const businessId = req.params.businessId;

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id: businessId});
        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }

        const reviews = await db('reviews').where({businessId}).orderBy('created_at');

        resp.status(200).json(reviews);
    } catch (err) {
        console.error(`Error while retrieving reviews for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/reviews/{id}:
 *    get:
 *      summary: Retrieve the unique Review identified by {id} and associated with {businessId}
 *      tags: [Reviews]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the Review
 *      responses:
 *        "200":
 *          description: The Review identified by {id} and associated with business {businessId}
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Review'
 *        "404":
 *          description: Review identified by {id} and associated with business {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.get('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    try {
        const reviews = await db('reviews').where({id, businessId});

        if (reviews && reviews.length) {
            resp.status(200).json(reviews[0]);
        } else {
            resp.status(404).send(`The specified business/review combination does not exist`);
            return;
        }
    } catch (err) {
        console.error(`Error while retrieving reviews for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/reviews:
 *    post:
 *      summary: Add a new Review associated with the {businessId} business
 *      tags: [Reviews]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      requestBody:
 *        description: A sparse Review object (i.e. only the rating and optional comment will be meaningful.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Review'
 *      responses:
 *        "200":
 *          description: The new Review has been added and associated with the {businessId} business
 *        "400":
 *          description: Bad Request - the Review rating is missing or invalid
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.post('/', async (req, resp, next) => {
    const businessId = req.params.businessId;

    const review = req.body;
    if (review.rating === undefined || review.rating < 0 || review.rating > 5) {
        resp.status(400).send(`Review rating must be specified: 0 <= rating <= 5`);
        return;
    }

    // TODO: Note: we ignore and override any ids that may have been specified in the body for simplicity reason for this
    // exercise.  However, we would typically want to detect this and notify the caller in some manner
    review.id = uuid.v4();
    review.businessId = businessId;
    delete review['created_at'];
    delete review['updated_at'];

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id: businessId});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }
        const reviews = await db('reviews').insert(review);

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while adding review for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * TODO: Decide if we want to support modification of reviews or make them immutable.  In the absence of any specification
 * in the assignment, this is ability is included for now
 *
 * @swagger
 * path:
 *  /businesses/{businessId}/reviews/{id}:
 *    put:
 *      summary: Update the unique Review identified by {id} and associated with {businessId}
 *      tags: [Reviews]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the Review
 *      requestBody:
 *        description: A sparse Review object (i.e. only the rating and optional comment will be meaningful.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Review'
 *      responses:
 *        "200":
 *          description: The Review has been successfully modified
 *        "400":
 *          description: Bad Request - the Review rating is missing or invalid
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.put('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    const review = req.body;
    if (review.rating === undefined || review.rating < 0 || review.rating > 5) {
        resp.status(400).send(`Review rating must be specified: 0 <= rating <= 5`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure that only allowable modification are specified and return
    // an appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id: businessId});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }

        const reviewUpdates = {
            rating: review.rating
        };
        if (review.comment !== undefined) {
            // support removal of a comment via null sentinel
            reviewUpdates.comment = review.comment === null ? db.raw('DEFAULT') : review.comment;
        }
        const reviews = await db('reviews')
            .update(reviewUpdates)
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while updating review for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * TODO: Decide if we want to support deletion of reviews or make them immutable.  In the absence of any specification
 * in the assignment, this is ability is included for now
 *
 * @swagger
 * path:
 *  /businesses/{businessId}/reviews/{id}:
 *    delete:
 *      summary: Delete the unique Review identified by {id} and associated with {businessId}
 *      tags: [Reviews]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the Review
 *      responses:
 *        "200":
 *          description: The Review has been successfully deleted
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.delete('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id: businessId});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }

        const reviews = await db('reviews')
            .del()
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while deleting review for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

module.exports = router;
