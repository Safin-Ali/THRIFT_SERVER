const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require('cors');

// Connect to the MongoDB
const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_USER_PASS}@cluster01.rhyj5nw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// middleware
app.use(cors());
app.use(express.json());

async function run () {

    const TMDB = client.db('thrift-motors');
    const brandOfTM = TMDB.collection('brand');
    const allPostedDataOfTM = TMDB.collection('postedData');
    const allUsersDataOfTM = TMDB.collection('usersInfo');
    const allBookedDataOfTM = TMDB.collection('bookedCar');
    const allPostBackup = TMDB.collection('backupPost');
    const allBlogsOfTM = TMDB.collection('blogs');
    const sliderImagesTM = TMDB.collection('sliderImages');

    // Root Path Response Welcome Message
    app.get('/',(req,res)=>{
        res.send('YAY! Welcome THRIFT-MOTORS API');
    })

    // get slider images array
    app.get('/sliderImage',async (req,res)=>{
        const result = await sliderImagesTM.findOne({});
        res.send(result)
    })

    // get all brand by id
    app.get('/all-brand',async(req,res)=>{
        const query = {};
        const result = await brandOfTM.find(query).toArray();
        res.send(result)
    })

    // get blogs text
    app.get('/blogs',async(req,res)=>{
        const result = await allBlogsOfTM.find({}).toArray();
        res.send(result)
    })

    // get only Advertised post data
    app.get('/advertised',async(req,res)=>{
        const filter = {advertise: true};
        const result = await allPostedDataOfTM.find(filter).toArray();
        res.send(result);
    })

    // get posted data by catetory name/'id'
    app.get('/category/:id',async(req,res)=>{
        const reqParams = req.params;
        const filter = {serviceId: reqParams.id};
        const result = await allPostedDataOfTM.find(filter).toArray();
        res.send(result);
    })

    // store user account information
    app.post(`/userinfo`,async(req,res)=>{
        const reqBody = req.body;
        delete reqBody.password;
        delete reqBody.confirmPassword;
        const result = await allUsersDataOfTM.insertOne(req.body);
        res.send(result)
    })

    // get user information by id
    app.get('/userinfo',async(req,res)=>{
        const query = {userEmail: req.query.email};
        const result = await allUsersDataOfTM.findOne(query);
        res.send(result)
    });

    // get user all sold Count number
    app.get('/userSoldCount',async(req,res)=>{
        const paidType = req.query.paid;
        const boolean = paidType === 'true' ? true : false;
        const query = {'postOwnerInfo.email': req.query.email, paid: boolean};
        const result = await allPostedDataOfTM.find(query).toArray();
        res.send(result);
    })

    // get seller post count number
    app.get('/userPostCount',async(req,res)=>{
        const query = {'postOwnerInfo.email': req.query.email};
        const result = await allPostedDataOfTM.find(query).toArray();
        res.send(result);
    })

    // get all user information
    app.get('/allUser',async(req,res)=>{
        const query = {userRole: req.query.role};
        const result = await allUsersDataOfTM.find(query).toArray();
        console.log()
        res.send(result);
    })
    

    // store all bookedCar data
    app.post('/bookedCar',async(req,res)=>{
        const reqBody = req.body;
        const backup = await allPsotBackup.insertOne(reqBody);
        const result = await allBookedDataOfTM.insertOne(reqBody);
        res.send(result)
    })

    // store new product post
    app.post('/new-post',async(req,res)=>{
        const reqBody = req.body;
        const backup = await allPostBackup.insertOne(reqBody);
        const result = await allPostedDataOfTM.insertOne(reqBody);
        res.send(result)
    })

    // get product by user email
    app.get('/my-product/:email',async(req,res)=>{
        const query = {'postOwnerInfo.email': req.params.email }
        const result = await allPostedDataOfTM.find(query).toArray();
        res.send(result)
    })

    // delete product by id and email
    app.delete('/postedData',async(req,res)=>{
        const query = {_id: ObjectId(req.query.id),'postOwnerInfo.email':req.query.email}
        const result = await allPostedDataOfTM.deleteOne(query);
        res.send(result);
    })

    // advertise postedData by post id
    app.patch('/postedData',async(req,res)=>{
        const reqBody = req.body;
        const filter = {_id: ObjectId(reqBody.id),'postOwnerInfo.email':reqBody.email};
        const updateAdvertise = {$set:{advertise: true}};
        const result = await allPostedDataOfTM.updateOne(filter,updateAdvertise);
        res.send(result)
    })

}

run().catch(console.dir)

app.listen(port,()=>console.log('this api is running on',port))
