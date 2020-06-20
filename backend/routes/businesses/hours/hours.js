'use strict';

const express = require('express');
const router = express.Router({mergeParams: true});
const uuid = require('uuid');
const db = require('../../../db')

/**
 * @swagger
 *  components:
 *    schemas:
 *      Hour:
 *        type: object
 *        required:
 *          - id
 *          - businessId
 *          - dayOfWeek
 *          - open
 *          - close
 *        properties:
 *          id:
 *            type: string
 *            description: Unique id for the Hour.
 *          businessId:
 *            type: string
 *            description: The id of the business to associate the Hour with.
 *          dayOfWeek:
 *            type: integer
 *            description: Day of week for the Hour, needs to be unique within the associated businessId.  0 for Sunday, 1 for Monday, 2 for Tuesday, ..., 6 for Saturday
 *          open:
 *            type: integer
 *            description: The opening time (24 hour clock with 0 === midnight) on the associated Day of week for the associated business
 *          close:
 *            type: integer
 *            description: The closing time (24 hour clock with 0 === midnight) on the associated Day of week for the associated business
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
 *   name: Hours
 *   description: Business Hour API
 */

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/hours:
 *    get:
 *      summary: Retrieve the Hours associated with the {businessId}
 *      tags: [Hours]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      responses:
 *        "200":
 *          description: Hours associated with the specified business
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Hour'
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

        const hours = await db('hours').where({businessId}).orderBy('dayOfWeek');

        resp.status(200).json(hours);
    } catch (err) {
        console.error(`Error while retrieving hours for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/hours/{id}:
 *    get:
 *      summary: Retrieve the unique Hour identified by {id} and associated with {businessId}
 *      tags: [Hours]
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
 *          description: The unique id for the Hour
 *      responses:
 *        "200":
 *          description: The Hour identified by {id} and associated with business {businessId}
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Hour'
 *        "404":
 *          description: Hour identified by {id} and associated with business {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.get('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    try {
        const hours = await db('hours').where({id, businessId});

        if (hours && hours.length) {
            resp.status(200).json(hours[0]);
        } else {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }
    } catch (err) {
        console.error(`Error while retrieving hours for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/hours:
 *    post:
 *      summary: Add a new Hour associated with the {businessId} business
 *      tags: [Hours]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      requestBody:
 *        description: A sparse Hour object (i.e. only the dayOfWeek, open and close must be specified.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Hour'
 *      responses:
 *        "200":
 *          description: The new Hour has been added and associated with the {businessId} business
 *        "400":
 *          description: Bad Request - the Hour dayOfWeek, open and close value(s) are missing or invalid
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.post('/', async (req, resp, next) => {
    const businessId = req.params.businessId;

    const hour = req.body;
    if (hour.dayOfWeek === undefined || hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
        resp.status(400).send(`Hour dayOfWeek must be specified: 0 <= dayOfWeek <= 6 (0 for Sunday, 1 for Monday, 2 for Tuesday, ..., 6 for Saturday)`);
        return;
    }
    if (hour.open === undefined || hour.open < 0 || hour.open > 23) {
        resp.status(400).send(`Hour open must be specified: 0 <= open <= 23 (24 hour clock with 0 === midnight)`);
        return;
    }
    if (hour.close === undefined || hour.close < 0 || hour.close > 23) {
        resp.status(400).send(`Hour close must be specified: 0 <= close <= 23 (24 hour clock with 0 === midnight)`);
        return;
    }
    if (hour.open >= hour.close) {
        resp.status(400).send(`Hour open must be < close: (24 hour clock with 0 === midnight)`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the requested hour does not already exist and return an
    // appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

    // TODO: Note: we ignore and override any ids that may have been specified in the body for simplicity reason for this
    // exercise.  However, we would typically want to detect this and notify the caller in some manner
    hour.id = uuid.v4();
    hour.businessId = businessId;

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id: businessId});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }
        const hours = await db('hours').insert(hour);

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while adding hour for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/hours/{id}:
 *    put:
 *      summary: Update the unique Hour identified by {id} and associated with {businessId}
 *      tags: [Hours]
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
 *          description: The unique id for the Hour
 *      requestBody:
 *        description: A sparse Hour object (i.e. only the dayOfWeek, open and close must be specified.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Hour'
 *      responses:
 *        "200":
 *          description: The Hour has been successfully modified
 *        "400":
 *          description: Bad Request - the Hour dayOfWeek, open and close value(s) are missing or invalid
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.put('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    const hour = req.body;
    if (hour.dayOfWeek === undefined || hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
        resp.status(400).send(`Hour dayOfWeek must be specified: 0 <= dayOfWeek <= 6 (0 for Sunday, 1 for Monday, 2 for Tuesday, ..., 6 for Saturday)`);
        return;
    }
    if (hour.open === undefined || hour.open < 0 || hour.open > 23) {
        resp.status(400).send(`Hour open must be specified: 0 <= open <= 23 (24 hour clock with 0 === midnight)`);
        return;
    }
    if (hour.close === undefined || hour.close < 0 || hour.close > 23) {
        resp.status(400).send(`Hour close must be specified: 0 <= close <= 23 (24 hour clock with 0 === midnight)`);
        return;
    }
    if (hour.open >= hour.close) {
        resp.status(400).send(`Hour open must be < close: (24 hour clock with 0 === midnight)`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the revised hour dayOfWeek does not already exist and return
    // an appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

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

        const hours = await db('hours')
            .update({dayOfWeek: hour.dayOfWeek, open: hour.open, close: hour.close})
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while updating hour for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/hours/{id}:
 *    delete:
 *      summary: Delete the unique Hour identified by {id} and associated with {businessId}
 *      tags: [Hours]
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
 *          description: The unique id for the Hour
 *      responses:
 *        "200":
 *          description: The Hour has been successfully deleted
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

        const hours = await db('hours')
            .del()
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while deleting hour for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

module.exports = router;
