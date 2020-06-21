'use strict';

const express = require('express');
const router = express.Router({mergeParams: true});
const uuid = require('uuid');
const db = require('../../../db')

/**
 * @swagger
 *  components:
 *    schemas:
 *      Location:
 *        type: object
 *        required:
 *          - id
 *          - businessId
 *          - name
 *        properties:
 *          id:
 *            type: string
 *            description: Unique id for the Location.
 *          businessId:
 *            type: string
 *            description: The id of the business to associate the Location with.
 *          name:
 *            type: string
 *            description: Name for the Location, needs to be unique within the associated businessId.
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
 *   name: Locations
 *   description: Business Location API
 */

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/locations:
 *    get:
 *      summary: Retrieve the Locations associated with the {businessId}
 *      tags: [Locations]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      responses:
 *        "200":
 *          description: Locations associated with the specified business
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Location'
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

        const locations = await db('locations').where({businessId}).orderBy('name');

        resp.status(200).json(locations);
    } catch (err) {
        console.error(`Error while retrieving locations for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/locations/{id}:
 *    get:
 *      summary: Retrieve the unique Location identified by {id} and associated with {businessId}
 *      tags: [Locations]
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
 *          description: The unique id for the Location
 *      responses:
 *        "200":
 *          description: The Location identified by {id} and associated with business {businessId}
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Location'
 *        "404":
 *          description: Location identified by {id} and associated with business {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.get('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    try {
        const locations = await db('locations').where({id, businessId});

        if (locations && locations.length) {
            resp.status(200).json(locations[0]);
        } else {
            resp.status(404).send(`The specified business/location combination does not exist`);
            return;
        }
    } catch (err) {
        console.error(`Error while retrieving locations for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/locations:
 *    post:
 *      summary: Add a new Location associated with the {businessId} business
 *      tags: [Locations]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      requestBody:
 *        description: A sparse Location object (i.e. only the name must be specified.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Location'
 *      responses:
 *        "200":
 *          description: The new Location has been added and associated with the {businessId} business
 *        "400":
 *          description: Bad Request - the Location name must be specified
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.post('/', async (req, resp, next) => {
    const businessId = req.params.businessId;

    const location = req.body;

    if (!location.name) {
        resp.status(400).send(`Location name must be specified`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the requested location does not already exist and return an
    // appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

    // TODO: Note: we ignore and override any ids that may have been specified in the body for simplicity reason for this
    // exercise.  However, we would typically want to detect this and notify the caller in some manner
    location.id = uuid.v4();
    location.businessId = businessId;
    delete location['created_at'];
    delete location['updated_at'];

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id: businessId});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }
        const locations = await db('locations').insert(location);

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while adding location for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/locations/{id}:
 *    put:
 *      summary: Update the unique Location identified by {id} and associated with {businessId}
 *      tags: [Locations]
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
 *          description: The unique id for the Location
 *      requestBody:
 *        description: A sparse Location object (i.e. only the name must be specified.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Location'
 *      responses:
 *        "200":
 *          description: The Location name has been successfully modified
 *        "400":
 *          description: Bad Request - the Location name must be specified
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.put('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    const location = req.body;
    if (!location.name) {
        resp.status(400).send(`Location name must be specified`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the revised location name does not already exist and return
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

        const locations = await db('locations')
            .update({name: location.name, 'updated_at': db.fn.now()})
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while updating location for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/locations/{id}:
 *    delete:
 *      summary: Delete the unique Location identified by {id} and associated with {businessId}
 *      tags: [Locations]
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
 *          description: The unique id for the Location
 *      responses:
 *        "200":
 *          description: The Location has been successfully deleted
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

        const locations = await db('locations')
            .del()
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while deleting location for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

module.exports = router;
