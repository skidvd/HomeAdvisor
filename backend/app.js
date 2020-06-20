'use strict';

const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const db = require('./db');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// ensure any necessary migrations are complete
(async () => {
    if (process.env.NODE_ENV !== 'test') {
        // tests handle DB migrations and seeding independently.  We handle all other non-test scenarios here.
        await db.migrate.latest()
            .then(async () => {
                await db.seed.run();
            });
    }
})();

const app = express();
const businessesRoutes = require('./routes/businesses/businesses');
const locationsRoutes = require('./routes/businesses/locations/locations');
const hoursRoutes = require('./routes/businesses/hours/hours');
const reviewsRoutes = require('./routes/businesses/reviews/reviews');
const servicesRoutes = require('./routes/businesses/services/services');
const defaultRoutes = require('./routes/default');

app.use(bodyParser.json());
app.use(cors());    // Note: Typically we would want to be more restrictive here.  This placeholder is added just to
                    // acknowledge this important security concern that is assumed not to be tha main point of this assignment

app.use('/businesses', businessesRoutes);
app.use('/businesses/:businessId/locations', locationsRoutes);
app.use('/businesses/:businessId/hours', hoursRoutes);
app.use('/businesses/:businessId/reviews', reviewsRoutes);
app.use('/businesses/:businessId/services', servicesRoutes);

// Swagger set up
const options = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "HomeAdvisor sample API",
            version: "0.0.1",
            description:
                "An Express API created for HomeAdvisor technical assessment",
            license: {
                name: "MIT",
                url: "https://choosealicense.com/licenses/mit/"
            },
            contact: {
                name: "Swagger",
                url: "https://swagger.io",
                email: "contact@nowhere.com"
            }
        },
        servers: [
            {
                url: "http://localhost:4000/"
            }
        ]
    },
    apis: [
        './routes/businesses/businesses.js',
        './routes/businesses/locations/locations.js',
        './routes/businesses/hours/hours.js',
        './routes/businesses/reviews/reviews.js',
        './routes/businesses/services/services.js'
    ]
};
const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve);
app.get(
    "/docs",
    swaggerUi.setup(specs, {
        explorer: true
    })
);

app.use(defaultRoutes);

module.exports = app;
