/*
 TODO: Global Notes:
 - while they normally would be, string lengths are generally not limited for simplicity purposes in this example
   as that does not appear to be the purpose of this exercise
 */

exports.up = (knex) => {
    const createPromises = [];

    createPromises.push(
        knex.schema
        .createTable('businesses', (table) => {
            table.uuid('id').primary();
            table.string('name').notNullable().unique();
            table.string('addressLine1');
            table.string('addressLine2');
            table.string('city');
            table.string('state');      // TODO: Note: This should typically be constrained, but is not for
                                                   // simplicity purposes in this example as that does not appear to be
                                                   // the purpose of this exercise
            table.string('postal');
            table.timestamps(true, true);
        })
        .then(() => {
            // console.log('created businesses');
        }));

    createPromises.push(
        knex.schema
            .createTable('services', (table) => {
                table.uuid('id').primary();
                table.uuid('businessId').notNullable();

                table.string('name').notNullable();     // TODO: Note: This should typically be constrained, but is not for
                                                                   // simplicity purposes in this example as that does not appear to be
                                                                   // the purpose of this exercise
                table.unique(['businessId', 'name']);
                table.timestamps(true, true);

                table.foreign('businessId').references('id').inTable('businesses')
                    .onDelete('CASCADE');
            })
            .then(() => {
                // console.log('created services');
            }));

    createPromises.push(
        knex.schema
            .createTable('hours', (table) => {
                table.uuid('id').primary();
                table.uuid('businessId').notNullable();

                // TODO: Note: the below columns for dayOfWeek, open and close and their associated constraints are
                // overly simplistic for a general purpose scheduling system.  However, they are used for this example
                // as that does not appear to be the point of the exercise
                table.integer('dayOfWeek').notNullable();
                table.unique(['businessId', 'dayOfWeek']);
                table.integer('open').notNullable();        // TODO: Note: This should typically be constrained, but is not for
                                                                       // simplicity purposes in this example as that does not appear to be
                                                                       // the purpose of this exercise
                table.integer('close').notNullable();       // TODO: Note: This should typically be constrained, but is not for
                                                                       // simplicity purposes in this example as that does not appear to be
                                                                       // the purpose of this exercise
                table.timestamps(true, true);

                table.foreign('businessId').references('id').inTable('businesses')
                    .onDelete('CASCADE');
            })
            .then(() => {
                // console.log('created hours');
            }));

    createPromises.push(
        knex.schema
            .createTable('locations', (table) => {
                table.uuid('id').primary();
                table.uuid('businessId').notNullable();

                table.string('name').notNullable();     // TODO: Note: This should typically be constrained, but is not for
                                                                   // simplicity purposes in this example as that does not appear to be
                                                                   // the purpose of this exercise
                table.timestamps(true, true);
                table.unique(['businessId', 'name']);

                table.foreign('businessId').references('id').inTable('businesses')
                    .onDelete('CASCADE');
            })
            .then(() => {
                // console.log('created locations');
            }));

    createPromises.push(
        knex.schema
            .createTable('reviews', (table) => {
                table.uuid('id').primary();
                table.uuid('businessId').notNullable();
                table.integer('rating').notNullable();
                table.string('comment');
                table.timestamps(true, true);

                table.foreign('businessId').references('id').inTable('businesses')
                    .onDelete('CASCADE');
            })
            .then(() => {
                // console.log('created reviews');
            }));

    return Promise.all(createPromises);
};

exports.down = (knex) => {
    const dropPromises = [];

    dropPromises.push(
            knex.schema.dropTable('businesses').then(() => {
                console.log('dropped businesses');
        }));
    dropPromises.push(
        knex.schema.dropTable('services').then(() => {
            console.log('dropped services');
        }));
    dropPromises.push(
        knex.schema.dropTable('hours').then(() => {
            console.log('dropped hours');
        }));
    dropPromises.push(
        knex.schema.dropTable('locations').then(() => {
            console.log('dropped locations');
        }));
    dropPromises.push(
            knex.schema.dropTable('reviews').then(() => {
                console.log('dropped reviews');
        }));

    return Promise.all(dropPromises);
};
