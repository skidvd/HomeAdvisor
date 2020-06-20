const uuid = require('uuid');

exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('businesses').del()
    .then(function () {
      // Inserts seed entries
      let businessId = uuid.v4();
      return knex('businesses').insert({
          id: businessId,
          name: 'Sample Business #1',
          addressLine1: '1234 Fake St',
          addressline2: 'Suite 500',
          city: 'Denver',
          state: 'CO',
          postal: '80210'
      }).then(async () => {
          await knex('services').insert([
              {id: uuid.v4(), businessId, name: 'Maid Services'},
              {id: uuid.v4(), businessId, name: 'House Cleaning'},
              {id: uuid.v4(), businessId, name: 'Moving Services'}
          ]);
      })
      .then(async () => {
          await knex('hours').insert([
              {id: uuid.v4(), businessId, dayOfWeek: 1, open: 9, close: 17},
              {id: uuid.v4(), businessId, dayOfWeek: 2, open: 9, close: 17},
              {id: uuid.v4(), businessId, dayOfWeek: 3, open: 9, close: 17},
              {id: uuid.v4(), businessId, dayOfWeek: 4, open: 9, close: 17},
              {id: uuid.v4(), businessId, dayOfWeek: 5, open: 9, close: 17}
          ]);
      }).then(async () => {
          await knex('locations').insert([
              {id: uuid.v4(), businessId, name: 'Denver'},
              {id: uuid.v4(), businessId, name: 'Lakewood'},
              {id: uuid.v4(), businessId, name: 'Thorton'},
              {id: uuid.v4(), businessId, name: 'Golden'},
              {id: uuid.v4(), businessId, name: 'Arvada'},
              {id: uuid.v4(), businessId, name: 'Centennial'},
              {id: uuid.v4(), businessId, name: 'Parker'}
          ]);
      }).then(async () => {
          await knex('reviews').insert([
              {id: uuid.v4(), businessId, rating: 4.5, comment: 'Use them weekly to clean our home. Do a great job every time'},
              {id: uuid.v4(), businessId, rating: 4, comment: 'Helped us move homes, very timely'},
              {id: uuid.v4(), businessId, rating: 4, comment: 'On time, did a good job'}
          ]);
      }).then(async () => {
          // console.log(`Data seeded for Sample Business #1`);

          businessId = uuid.v4();
          await knex('businesses').insert({
              id: businessId,
              name: 'Sample Business #2',
              addressLine1: '1234 Foobar St',
              addressline2: 'Suite 500',
              city: 'Denver',
              state: 'CO',
              postal: '80201'
          }).then(async () => {
              await knex('services').insert([
                  {id: uuid.v4(), businessId, name: 'Maid Services'},
                  {id: uuid.v4(), businessId, name: 'House Cleaning'},
                  {id: uuid.v4(), businessId, name: 'Moving Services'},
                  {id: uuid.v4(), businessId, name: 'Packing'}
              ]);
          })
          .then(async () => {
              await knex('hours').insert([
                  {id: uuid.v4(), businessId, dayOfWeek: 1, open: 10, close: 19},
                  {id: uuid.v4(), businessId, dayOfWeek: 2, open: 9, close: 19},
                  {id: uuid.v4(), businessId, dayOfWeek: 3, open: 10, close: 19},
                  {id: uuid.v4(), businessId, dayOfWeek: 4, open: 9, close: 19},
                  {id: uuid.v4(), businessId, dayOfWeek: 5, open: 10, close: 19},
                  {id: uuid.v4(), businessId, dayOfWeek: 6, open: 9, close: 12}
              ]);
          }).then(async () => {
              await knex('locations').insert([
                  {id: uuid.v4(), businessId, name: 'Denver'},
                  {id: uuid.v4(), businessId, name: 'Thorton'},
                  {id: uuid.v4(), businessId, name: 'Golden'},
                  {id: uuid.v4(), businessId, name: 'Arvada'},
                  {id: uuid.v4(), businessId, name: 'Centennial'},
                  {id: uuid.v4(), businessId, name: 'Parker'}
              ]);
          }).then(async () => {
              await knex('reviews').insert([
                  {id: uuid.v4(), businessId, rating: 4, comment: 'Move out cleaning'},
                  {id: uuid.v4(), businessId, rating: 2, comment: 'Broke our dishes because they didn\'t pack right'},
                  {id: uuid.v4(), businessId, rating: 5},
              ])
          })
          .then(async () => {
              // console.log(`Data seeded for Sample Business #2`);

              businessId = uuid.v4();
              await knex('businesses').insert({
                  id: businessId,
                  name: 'Sample Business #3',
                  addressLine1: '23456 5th Ave',
                  addressline2: 'Suite A',
                  city: 'Henderson',
                  state: 'CO',
                  postal: '80640'
              }).then(async () => {
                  await knex('services').insert([
                      {id: uuid.v4(), businessId, name: 'Packing'},
                      {id: uuid.v4(), businessId, name: 'Moving Services'}
                  ]);
              })
              .then(async () => {
                  await knex('hours').insert([
                      {id: uuid.v4(), businessId, dayOfWeek: 1, open: 8, close: 18},
                      {id: uuid.v4(), businessId, dayOfWeek: 2, open: 8, close: 18},
                      {id: uuid.v4(), businessId, dayOfWeek: 3, open: 8, close: 18},
                      {id: uuid.v4(), businessId, dayOfWeek: 4, open: 8, close: 18},
                      {id: uuid.v4(), businessId, dayOfWeek: 5, open: 8, close: 18},
                      {id: uuid.v4(), businessId, dayOfWeek: 6, open: 8, close: 18}
                  ]);
              }).then(async () => {
                  await knex('locations').insert([
                      {id: uuid.v4(), businessId, name: 'Denver'},
                      {id: uuid.v4(), businessId, name: 'Commerce City'},
                      {id: uuid.v4(), businessId, name: 'Thorton'},
                      {id: uuid.v4(), businessId, name: 'Henderson'},
                      {id: uuid.v4(), businessId, name: 'Northglenn'}
                  ]);
              }).then(async () => {
                  await knex('reviews').insert([
                      {id: uuid.v4(), businessId, rating: 5, comment: 'Helped us move across the country, they\'re great'}
                  ])
              })
              .then(() => {
                  // console.log(`Data seeded for Sample Business #3`);
              });
          });
      }).catch((reason) => {
          console.error(`Error while seeding dependant data ${reason} - all bets are now off!!`);
      });
    })
    .catch((reason) => {
        console.error(`Error while seeding data ${reason} - all bets are now off!!`);
    });
};



