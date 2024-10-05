// 1. SETUP EXPRESS
const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const dbname = "company_xyz"; // CHANGE THIS TO YOUR ACTUAL DATABASE NAME

// enable dotenv (allow Express application to read .env files)
require('dotenv').config();

// set the mongoUri to be MONGO_URI from the .env file
// make sure to read data from process.env AFTER `require('dotenv').config()`
const mongoUri = process.env.MONGO_URI;

// function to generate an access token
function generateAccessToken(id, email) {
    // set the payload of the JWT (i.e, developers can add any data they want)
    let payload = {
        'user_id': id,
        'email': email,
    }

    // create the JWT
    // jwt.sign()
    // - parameter 1: the payload (sometimes known as 'claims')
    // - parameter 2: token secret,
    // - parameter 3: options (to set expiresIn)
    let token = jwt.sign(payload, process.env.TOKEN_SECRET, {
        'expiresIn': '1h' // h for hour, d for days, m is for minutes and s is for seconds
    });

    return token;
}

// middleware: a function that executes before a route function
function verifyToken(req, res, next) {
    // get the JWT from the headers
    let authHeader = req.headers['authorization'];
    let token = null;
    if (authHeader) {
        // the token will be stored as in the header as:
        // BEARER <JWT TOKEN>
        token = authHeader.split(' ')[1];
        if (token) {
            // the callback function in the third parameter will be called after
            // the token has been verified
            jwt.verify(token, process.env.TOKEN_SECRET, function (err, payload) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(403);
                }
                // save the payload into the request
                req.user = payload;
                // call the next middleware or the route function
                next();

            })
        } else {
            return res.sendStatus(403);
        }
    } else {
        return res.sendStatus(403);
    }
}

// 1a. create the app
const app = express();
app.use(cors()); // enable cross origin resources sharing

// 1b. enable JSON processing (i.e allow clients to send JSON data to our server)
app.use(express.json());

// uri = connection string
async function connect(uri, dbname) {
    // Create a Mongo Client
    // a client is a software or driver that allows us to communicate with a database
    // (i.e like the Mongo Shell)
    let client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    let db = client.db(dbname); // same as  'USE <database>' in Mongo Shell
    return db;
}

// 2. CREATE ROUTES
// All routes will be created in the `main` function
async function main() {

    // connect to the mongo database
    let db = await connect(mongoUri, dbname);

    app.get('/', function (req, res) {
        res.json({
            "message": "RESTful API with Mongo and Express!"
        });
    });


    app.get("/taskforce", async function (req, res) {
        try {

            // this is the same as let tags = req.query.tags etc. etc.
            // syntax: object destructuring
            let { members } = req.query;

            let criteria = {};

            if (members) {
                criteria["members.name"] = {
                    "$in": members.split(",").map(function (i) {
                        // case-in sensiitve search
                        return new RegExp(i, 'i');
                    })
                }
            }

            // mongo shell: db.taskforce.find({},{members.name:1, members.role:1})
            let taskforce = await db.collection("taskforce").find(criteria)
                .project({
                    "members.name": 1,
                    "members.role": 1
                }).toArray();
            res.json({
                'taskforce': taskforce
            })
        } catch (error) {
            console.error("Error fetching taskforce record:", error);
            res.status(500);
        }
    })

    app.get("/supervisor", async function (req, res) {
        try {

            // this is the same as let tags = req.query.tags etc. etc.
            // syntax: object destructuring
            let { review_report, name } = req.query;

            let criteria = {};

            if (review_report) {
                criteria["review_report.name"] = {
                    "$in": review_report.split(",").map(function (i) {
                        // case-insensitive search
                        return new RegExp(i, 'i');
                    })
                }
            }

            if (name) {
                criteria["name"] = {
                    "$regex": name, "$options": "i"
                }
            }

            // Now, you can test this route with various query parameters. 
            // Here are some examples:

            // Search by review_report: https://<server url>/supervisor?review_report=A
            // Search by name: https://<server url>/supervisor?name=jon%20tan
            // Combine multiple search criteria: https://<server url>/supervisor?review_report=ALex&name=JON%20Tan

            // This implementation allows for flexible searching across your database. 
            // Users can combine different search criteria to find exactly what they're looking for.


            // mongo shell: db.supervisor.find({},{name:1, review_report.name:1, review_report.rank:1})
            let supervisor = await db.collection("supervisor").find(criteria)
                .project({
                    "name": 1,
                    "review_report.name": 1,
                    "review_report.rank": 1
                }).toArray();
            res.json({
                'supervisor': supervisor
            })
        } catch (error) {
            console.error("Error fetching supervisor record:", error);
            res.status(500);
        }
    })

    app.get("/contact", async function (req, res) {
        try {

            let criteria = {};

            // mongo shell: db.contact.find({},{address1:1, address2:1, address3:1, mobile_phone:1, home_phone:1, personal_email:1})
            contact = await db.collection("contact").find(criteria)
                .project({
                    "address1": 1,
                    "address2": 1,
                    "address3": 1,
                    "mobile_phone": 1,
                    "home_phone": 1,
                    "personal_email": 1

                }).toArray();
            res.json({
                'contact': contact
            })
        } catch (error) {
            console.error("Error fetching contact record:", error);
            res.status(500);
        }
    })

    // There's a convention for RESTFul API when it comes to writing the URL
    // The URL should function like a file path  (always a resource, a noun)
    // Allow the user to search by name, tags, cuisine, ingredients:
    // eg
    // ?name=chicken rice
    // ?tags=appetizer&ingredients=chicken,duck

    //GET => Read

    // app.get("/employee", verifyToken, async function (req, res) {
    app.get("/employee", async function (req, res) {
        try {

            // this is the same as let tags = req.query.tags etc. etc.
            // syntax: object destructuring
            let { supervisor, name } = req.query;

            let criteria = {};

            if (supervisor) {
                criteria["supervisor.name"] = {
                    "$in": supervisor.split(",")
                }
            }

            if (name) {
                criteria["name"] = {
                    "$regex": name, "$options": "i"
                }
            }

            // mongo shell: db.employee.find({},{name:1, employee_id:1, designation:1, contact:1, supervisor:1})
            let employee = await db.collection("employee").find(criteria)
                .project({
                    "name": 1,
                    "employee_id": 1,
                    "designation": 1,
                    "contact": 1,
                    "supervisor": 1
                }).toArray();
            res.json({
                'employee': employee
            })
        } catch (error) {
            console.error("Error fetching employee record:", error);
            res.status(500);
        }
    })

    // /employee/66fe4e9fcb3d836d2346b510 => get the details of the employee with _id = 66fe4e9fcb3d836d2346b510
    app.get("/employee/:id", async function (req, res) {
        try {

            // get the id of the recipe that we want to get full details off
            let id = req.params.id;

            // mongo shell: db.employee.find({
            //   _id:ObjectId(id)
            //  })
            let employee = await db.collection('employee').findOne({
                "_id": new ObjectId(id)
            });

            // check the recipe is not null
            // because .findOne will return null if no document
            // not found
            if (!employee) {
                return res.status(404).json({
                    "error": "Sorry, employee not found"
                })
            }

            // send back a response
            res.json({
                'employee': employee
            })

        } catch (error) {
            console.error("Error fetching employee:", error);
            res.status(500);
        }
    });

    // we use app.post for HTTP METHOD POST - usually to add new data

    // POST => Create
    app.post("/employee", async function (req, res) {
        try {

            // name, employee_id, designation, department, contact, date_joined and supervisor
            // when we use POST, PATCH or PUT to send data to the server, the data are in req.body
            let { employee_id, name, designation, department, contact, date_joined, supervisor } = req.body;

            // basic validation: 
            // make sure that name and employee_id must be present
            if ((!name) || (!employee_id)) {
                return res.status(400).json({ "error": "Missing fields required" })
            }



            let supervisorDocument = {};
            let rank = null;

            if (supervisor === null) {
                supervisorDocument = null;
            } else {
                // find the _id of the related and add it to the supervisor
                supervisorDocument = await db.collection('supervisor').findOne({
                    "name": supervisor.name
                })

                if (!supervisorDocument) {
                    return res.status(400).json({ "error": "Invalid supervisor" })
                }


                // Create the new supervisor object
                const newSupervisorDocument = {
                    // _id: new ObjectId(),
                    employee_id: Number(employee_id),
                    name,
                    rank
                };

                supervisorDocument = {
                    employee_id: Number(supervisor.employee_id),
                    name: supervisor.name
                };

                // let result = false;

                //review_report is object
                // Add to the supervisor collection
                // const result = await db.collection("supervisor")
                // .insertOne(newSupervisorDocument);
                //review_report is array
                // Push to the supervisor collection

                const result = await db.collection('supervisor').updateOne(
                    { name: supervisor.name },
                    { $push: { review_report: newSupervisorDocument } }
                );





                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Supervisor not found' });
                }

                // res.status(201).json({
                // 'message': 'Supervisor added successfully',
                // 'supervisorId': newSupervisorDocument._id
                // });

                // }

                let address1 = contact.address1;
                let address2 = contact.address2;
                let address3 = contact.address3;
                let mobile_phone = contact.mobile_phone;
                let home_phone = contact.home_phone;
                let office_phone = contact.office_phone;
                let office_did = contact.office_did;
                let personal_email = contact.personal_email;
                let company_email = contact.company_email;

                // find all the tags that the client want to attach to the employee document
                // const contactDocument = await db.collection('contact').findOne({
                // "name": supervisor.name
                // })

                // if (!contactDocument) {
                // return res.status(400).json({"error":"Invalid contact"})
                // }

                const newContactId = new ObjectId();
                // Create the new contact object
                const newContactDocument = {
                    _id: newContactId,
                    address1,
                    address2,
                    address3,
                    mobile_phone,
                    home_phone,
                    office_phone,
                    office_did,
                    personal_email,
                    company_email
                };

                // Add the new contact
                // insert the new contact document into the collection
                let result3 = await db.collection("contact").insertOne(newContactDocument);


                if (result3.matchedCount === 0) {
                    return res.status(404).json({ error: 'Contact not found' });
                }

                // res.status(201).json({
                // 'message': 'Contact added successfully',
                // 'contactId': newContactDocument._id
                // });


                const contactDocument = {
                    _id: newContactDocument._id,
                    office_phone,
                    office_did,
                    company_email
                };

                let newEmployeeDocument = {
                    employee_id: Number(employee_id),
                    name,
                    designation, department,
                    "contact": contactDocument,
                    date_joined,
                    "supervisor": supervisorDocument
                }

                // insert the new employee document into the collection
                let result2 = await db.collection("employee").insertOne(newEmployeeDocument);
                res.status(201).json({
                    'message': 'New employee has been created',
                    '_id': result2.insertedId // insertedId is the _id of the new document
                })
            }

        } catch (e) {
            console.error(e);
            res.status(500);
        }
    })

    //PUT => Update by replace

    app.put("/employee/:id/contact/:contactId", async function (req, res) {
        try {

            let id = req.params.id;
            let contactId = req.params.contactId;
            // let supervisorId = req.params.supervisorId;

            // employee_id, name, designation, department, contact, date_joined, supervisor
            // when we use POST, PATCH or PUT to send data to the server, the data are in req.body
            let { employee_id, name, designation, department, contact, date_joined, supervisor } = req.body;

            // basic validation: 
            // make sure that name and employee_id is valid
            if ((!name) || (!employee_id)) {
                return res.status(400).json({ "error": "Missing fields required" })
            }

            let supervisorDocument = {};
            let rank = supervisor.rank;

            if (supervisor === null) {
                supervisorDocument = null;
            } else {
                // find the _id of the related and add it to the supervisor
                supervisorDocument = await db.collection('supervisor').findOne({
                    "name": supervisor.name,
                });

                if (!supervisorDocument) {
                    return res.status(400).json({ "error": "Invalid supervisor" })
                }

                // const supervisorIdDB = supervisorDocument._id;



                // Update the new supervisor object
                const updatedSupervisorDocument = {
                    // _id: new ObjectId(supervisorId),
                    employee_id: Number(employee_id),
                    name,
                    rank
                };

                supervisorDocument = {
                    employee_id: Number(supervisor.employee_id),
                    name: supervisor.name
                };

                // let result = false;

                //switch supervisor, so push to last array element
                // if (supervisorIdDB != supervisorId) {
                // Add to the supervisor collection
                const result = await db.collection('supervisor').updateOne(
                    { name: supervisor.name },
                    { $push: { review_report: updatedSupervisorDocument } }
                );

                //same supervisor, so update the array element
                // } else {
                // Update the specific supervisor.name in the supervisor document
                // const result = await db.collection("supervisor")
                // .updateOne({
                // name: supervisor.name
                // }, {
                // "$set": { review_report: updatedSupervisorDocument }
                // });
                // }

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Supervisor not found' });
                }

                // res.status(201).json({
                // 'message': 'Supervisor added successfully',
                // 'supervisorId': updatedSupervisorDocument.supervisor_id
                // });

                // }

                let address1 = contact.address1;
                let address2 = contact.address2;
                let address3 = contact.address3;
                let mobile_phone = contact.mobile_phone;
                let home_phone = contact.home_phone;
                let office_phone = contact.office_phone;
                let office_did = contact.office_did;
                let personal_email = contact.personal_email;
                let company_email = contact.company_email;

                // find all the tags that the client want to attach to the employee document
                let updatedContactDocument = await db.collection('contact').findOne({
                    _id: new ObjectId(contactId)
                })

                if (!updatedContactDocument) {
                    return res.status(400).json({ "error": "Invalid contact" })
                }

                // const newContactId = new ObjectId();
                // Update the new contact object
                updatedContactDocument = {
                    _id: new ObjectId(contactId),
                    address1,
                    address2,
                    address3,
                    mobile_phone,
                    home_phone,
                    office_phone,
                    office_did,
                    personal_email,
                    company_email
                };

                // Update the new contact
                // Update the new contact document into the collection
                // let result3 = await db.collection("contact").insertOne(newContactDocument);
                let result3 = await db.collection("contact")
                    .updateOne({
                        "_id": new ObjectId(contactId)
                    }, {
                        "$set": updatedContactDocument
                    });


                if (result3.matchedCount === 0) {
                    return res.status(404).json({ error: 'Contact not found' });
                }

                // res.status(201).json({
                // 'message': 'Contact added successfully',
                // 'contactId': updatedContactDocument._id
                // });


                const contactDocument = {
                    _id: updatedContactDocument._id,
                    office_phone,
                    office_did,
                    company_email
                };

                let updatedEmployeeDocument = {
                    employee_id: Number(employee_id),
                    name,
                    designation, department,
                    "contact": contactDocument,
                    date_joined,
                    "supervisor": supervisorDocument
                }



                // update the new employee document into the collection
                let result2 = await db.collection("employee")
                    .updateOne({
                        "_id": new ObjectId(id)
                    }, {
                        "$set": updatedEmployeeDocument
                    });

                // if there is no matches, means no update took place
                if (result2.matchedCount == 0) {
                    return res.status(404).json({
                        "error": "Employee not found"
                    })
                }

                res.status(200).json({
                    "message": "Employee updated"
                })
            }

        } catch (e) {
            console.error(e);
            res.status(500);
        }
    })


    //DELETE => Delete

    app.delete("/employee/:id", async function (req, res) {
        try {
            let id = req.params.id;

            // mongo shell:
            // db.recipes.deleteOne({
            //    _id:ObjectId(id)
            //})
            let results = await db.collection('employee').deleteOne({
                "_id": new ObjectId(id)
            });

            if (results.deletedCount == 0) {
                return res.status(404).json({
                    "error": "Employee not found"
                });
            }

            res.json({
                "message": "Employee has been deleted successful"
            })

        } catch (e) {
            console.error(e);
            res.status(500);
        }
    })

    // route for user to sign up
    // the user must provide an email and password
    app.post('/users', async function (req, res) {

        try {
            let { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    "error": "Please provide user name and password"
                })
            }

            // if the request has both email and password
            let userDocument = {
                email,
                password: await bcrypt.hash(password, 12)
            };

            let result = await db.collection("users").insertOne(userDocument);

            res.json({
                "message": "New user account has been created",
                result
            })

        } catch (e) {
            console.error(e);
            res.status(500);
        }
    })


    // the client is supposed to provide the email and password in req.body
    app.post('/login', async function (req, res) {
        try {
            let { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    'message': 'Please provide email and password'
                })
            }

            // find the user by their email
            let user = await db.collection('users').findOne({
                "email": email
            });

            // if the user exists
            if (user) {
                // check the password (compare plaintext with the hashed one in the database)
                if (bcrypt.compareSync(password, user.password)) {
                    let accessToken = generateAccessToken(user._id, user.email);
                    res.json({
                        "accessToken": accessToken
                    })
                } else {
                    res.status(401);
                }
            } else {
                res.status(401);
            }

        } catch (e) {
            console.error(e);
            res.status(500);
        }
    })

    app.get('/profile', verifyToken, async function (req, res) {

        // get the payload
        let user = req.user;

        res.json({
            user
        })

    })

}
main();


// 3. START SERVER (Don't put any routes after this line)
app.listen(3000, function () {
    console.log("Server has started");
})