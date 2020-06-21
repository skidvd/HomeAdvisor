# HomeAdvisor

## Solution Abstract

If you are not familiar with the assignment, you may wish to review it below [problem definition](https://github.com/skidvd/HomeAdvisor#homeadvisor-problem-definition).

The assignment requests that a *RESTful system* be built in accordance with the domain and high-level specs as described.
My solution for this assignment includes the following high-level architecture and components:

- A Node and Express based backend server that is used to accept and respond to the REST API requests to support the requested functionality
- The REST API I created is documented via Swagger and a browsable version of this documentation is also served up via the Node backend.  This documentation
includes the various Schemas and Endpoints available across the API.  Additionally, it also offer the ability to **"Try it out"** directly within the browser.
- In response to REST API requests, the Node backend will consult with a SQLite database (memory only version for testing purposes) 
- The database schema is initially created and seeded with the provided sample data via Knex.  This provides the further ability
manage any future migrations that may become necessary cleanly and systematically.
- I have added a few additional attributes above and beyond the requested ones as I believe they are important to either the proper operation of the API as requested and/or are common best practices that should be followed.  Examples of this most notably include the use of surrogate keys for both primary and foreign key references and the inclusion of created and updated timestamps.
- A Jest testing library provides ample coverage across the API for demonstration and validation purposes. 
 
## Assumptions

I have made the following primary assumptions (some additional assumptions are documented only in the code):

- As the focus of this exercise appears to be on the REST API alone, I have not provided a UI that integrates with it.  However, I have provided multiple avenues to demonstrate and test the API (please see below for more info) 
- Additional API specific assumptions are included in the Swagger docs 
- For purposes of this exercise, the DB schema and it's associated validations are quite minimalistic (as this does not appear to be a main focus of the exercise) - such common constraints as string lengths, enumerated values, etc are omitted in the interest of simplicity for now; foreign keys are however employed as this appears central
- For purposes of this exercise, it is desired to seed the database initially with the provided sample data
- For purposes of this exercise, the open and close times do not need to have any greater granularity that an hour
- For purposes of this exercise, the internal storage of open and close times as well as those exchanged via the API can assume a 24 hour clock (i.e. that the UI would be responsible for rendering then in the 12 hour format that is apparent in the sample data)
- When the assignment refers to sorting by "Rating (up/down)", I am assuming that they mean to perform the requested sort over the set of Businesses that match the specified filter criteria.  As each Business can have multiple ratings associated with it, I made the assumption that this sorting should be based upon an average across those associated ratings (avgRating is computed dynamically upon request when necessary and is also returned as an additional attribute via the API).   
- For purposes of this exercise, it is sufficient to run both the backend and testing processes on the local machine.  Furthermore, this is the only manner in which this can presently be expected to work well
- For purposes of this exercise, the only browser that this was developed for and is supported on is Chrome; however, current and modern versions (as of this writing) may likely work - but they are not supported as they have not been tested/validated.
- For purposes of this exercise running with the development version/build is sufficient
- For purposes of this exercise, no security requirements are necessary: no SSL, CORS, authentication nor authorization are in place - any proper API would certainly need these beyond just the demo phase
- My development and testing has been on a Unix box and this is therefore, all that is presently supported.  However, there are no known limitations that would preclude operation on a Windows platform - this is officially unsupported though.
- While I typically do not like lingering console log stmts nor commented out src lines (that are not intentional comments) in committed code, I have left a few in this baseline that have been useful throughout development/debugging and/or that may be useful in the future. 

## How to install, build and run

1. Prerequisites
    ```
   - You will need to have npm installed (I have a rather old version 6.14.4 presently)
   - You will need a current version of node installed (I have v12.16.3)
   - You will need to have cloned this repository
   - You will need to have localhost ports 4000 available and unused
    ```
2. Backend/Server
    ```
   - cd into <repository-dir>/backend 
   - npm install
   - npm start
    ```
3. Access the Swagger docs (http://localhost:4000/docs)
    ```
   - When the above have all completed and there are no errors, navigate in Chrome to (http://localhost:4000/docs) 
   - Please note that there are many expandable/collapsible elements within the documentation and that you will need to
     explore a bit to find increasingly further detailed information as you click inward.  In general though, it is fairly intuitive.  
     **Tagged** Endpoints are listed on top and the associated Schemas are referenced within the endpoints as well as listed at the bottom.
    ```   
4. Running the Jest tests
    ```
   - When 1. and 2. above have been completed and there are no errors 
   - cd into <repository-dir>/backend
   - npm run test (this will run all of the configured tests once and report the cumulative results across them).
   - Please note: If you will be modifying the test cases for additional investigation and/or testing purposes, you may wish
     to alterately use the following command instead of the above
   
     npm run test-watch  (This variant will automatically re-run the tests in response to a changed file - making ongoing testing more efficient)
    ```   
5. Test the API via Swagger docs
    ```
   - When 1., 2. and 3. above have been completed and there are no errors 
   - navigate in Chrome to (http://localhost:4000/docs) 
   - choose a desired Enpoint and click on the <Try it out> button
   - Populate any of the required and/or optional fields as appropriate to your testing purposes
   - Click on the <Execute> button
   - See the response below when available
    ```   
6. Other ways to test the API
    ```
   - When 1. and 2. above have been completed and there are no errors 
   - You may wish to send curl request to the appropriate endpoint at http://localhost:4000
   - You may aslo wish to make appropriate requests via Postman or similar tools to the desired http://localhost:4000 endpoint 
   - 
   - In all cases, please remember that the DB is intially seeded with the provided sample data.  Additionally, unlike
     the memory only version used by the Jest tests, testing via this approach will be have API request results persisted to the local DB file.
     This persistence will only last until the server is restarted as such a restart will reintialize the DB with the
     provided sample data.
    ```   
   

## HomeAdvisor problem definition
As a staff engineer at HomeAdvisor you are asked to help a team design a RESTful system that allows a user to set and retrieve information about businesses within our network. Take as much time as needed to showcase your strengths and skills, though we anticipate thing taking around 2-3 hours.

A minimum solution should meet the following requirements:
Requirements:
- Filter by:
  - Business name
  - Business hours
  - Jobs
  - Geographical location
  - Review Rating
- Sort by:
  - Alphabetical (up/down)
  - Rating (up/down)
- Business information:
  - Name
  - Hours
  - Business location
  - Cities they operate within
  - Jobs they do
  - Reviews
    - Customer comments
    - Score out of 5
- Setting of data accepts JSON
- Test cases
- Git repo (either local and zipped up or checked in) that we can access
- Documentation on how to execute and run this locally  Please see the attached file as it contains a sample dataset for you to get started with. 
	
