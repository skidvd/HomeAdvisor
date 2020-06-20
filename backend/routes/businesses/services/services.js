'use strict';

const express = require('express');
const router = express.Router({mergeParams: true});
const uuid = require('uuid');
const db = require('../../../db')

/**
 * @swagger
 *  components:
 *    schemas:
 *      Service:
 *        type: object
 *        required:
 *          - id
 *          - businessId
 *          - name
 *        properties:
 *          id:
 *            type: string
 *            description: Unique id for the Service.
 *          businessId:
 *            type: string
 *            description: The id of the business to associate the Service with.
 *          name:
 *            type: string
 *            description: Name for the Service, needs to be unique within the associated businessId.
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
 *   name: Services
 *   description: Business Service API
 */

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/services:
 *    get:
 *      summary: Retrieve the Services associated with the {businessId}
 *      tags: [Services]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      responses:
 *        "200":
 *          description: Services associated with the specified business
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Service'
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

        const services = await db('services').where({businessId}).orderBy('name');

        resp.status(200).json(services);
    } catch (err) {
        console.error(`Error while retrieving services for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/services/{id}:
 *    get:
 *      summary: Retrieve the unique Service identified by {id} and associated with {businessId}
 *      tags: [Services]
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
 *          description: The unique id for the Service
 *      responses:
 *        "200":
 *          description: The Service identified by {id} and associated with business {businessId}
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Service'
 *        "404":
 *          description: Service identified by {id} and associated with business {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.get('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    try {
        const services = await db('services').where({id, businessId});

        if (services && services.length) {
            resp.status(200).json(services[0]);
        } else {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }
    } catch (err) {
        console.error(`Error while retrieving services for businessId ${businessId}`);
        resp.status(500).render('error', { error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/services:
 *    post:
 *      summary: Add a new Service associated with the {businessId} business
 *      tags: [Services]
 *      parameters:
 *        - in: path
 *          name: businessId
 *          schema:
 *            type: string
 *          required: true
 *          description: The unique id for the business
 *      requestBody:
 *        description: A sparse Service object (i.e. only the name must be specified.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Service'
 *      responses:
 *        "200":
 *          description: The new Service has been added and associated with the {businessId} business
 *        "400":
 *          description: Bad Request - the Service name must be specified
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.post('/', async (req, resp, next) => {
    const businessId = req.params.businessId;

    const service = req.body;

    if (!service.name) {
        resp.status(400).send(`Service name must be specified`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the requested service does not already exist and return an
    // appropriate indication if it does.  However, for simplicity of this exercise, this is presently omitted.

    // TODO: Note: we ignore and override any ids that may have been specified in the body for simplicity reason for this
    // exercise.  However, we would typically want to detect this and notify the caller in some manner
    service.id = uuid.v4();
    service.businessId = businessId;

    try {
        const businessCount = await db('businesses')
            .count('* as c')
            .where({id: businessId});

        if (businessCount[0]['c'] < 1) {
            resp.status(404).send(`The specified business does not exist`);
            return;
        }
        const services = await db('services').insert(service);

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while adding service for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/services/{id}:
 *    put:
 *      summary: Update the unique Service identified by {id} and associated with {businessId}
 *      tags: [Services]
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
 *          description: The unique id for the Service
 *      requestBody:
 *        description: A sparse Service object (i.e. only the name must be specified.  All other attributes are ignored if specified)
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Service'
 *      responses:
 *        "200":
 *          description: The Service name has been successfully modified
 *        "400":
 *          description: Bad Request - the Service name must be specified
 *        "404":
 *          description: business identified by {businessId} not found
 *        "5XX":
 *          description: unexpected error
 */
router.put('/:id', async (req, resp, next) => {
    const businessId = req.params.businessId;
    const id = req.params.id;

    const service = req.body;
    if (!service.name) {
        resp.status(400).send(`Service name must be specified`);
        return;
    }

    // TODO: Note: we would typically want to check here to make sure the revised service name does not already exist and return
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

        const services = await db('services')
            .update({name: service.name})
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while updating service for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

/**
 * @swagger
 * path:
 *  /businesses/{businessId}/services/{id}:
 *    delete:
 *      summary: Delete the unique Service identified by {id} and associated with {businessId}
 *      tags: [Services]
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
 *          description: The unique id for the Service
 *      responses:
 *        "200":
 *          description: The Service has been successfully deleted
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

        const services = await db('services')
            .del()
            .where({id, businessId});

        resp.status(200).end();
    } catch (err) {
        console.error(`Error while deleting service for businessId ${businessId} ${JSON.stringify(err)}`);
        resp.status(500).send({ error: err });
    }
});

module.exports = router;
