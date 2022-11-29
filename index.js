const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
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
    const allReportedProductOfTM = TMDB.collection('reported-product');

    // Root Path Response Welcome Message
    app.get('/',(req,res)=>{
        res.send('YAY! Welcome THRIFT-MOTORS API');
    })

    // generate jwt secret key
    function generateJWT (email) {
        return jwt.sign(email,process.env.JWT_SECRET_KEY);
    }

    // verify JWT
    function verifyJWT (req,res,next){
        const authorization = req.headers.authorization;

        // when req authorization code not found or null
        if(!authorization) return res.status(401).send(`Go to your Grandmother house`);

        const encryptToken = authorization.split(' ')[1];
        jwt.verify(encryptToken,process.env.JWT_SECRET_KEY,(err,decryptCode)=>{

            // if when decrypt not successfull
            if(err) return res.status(401).send();

            req.decryptCode = decryptCode;            
            return next()
        })
    }

    // get encrypt jwt
    app.get('/jwt',(req,res)=>{
        const reqQuery = req.query.email;
        const encryptToken = {encryptToken:generateJWT(reqQuery)};
        res.send(encryptToken)
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
        const sendUnSoldCar = result.filter(car => car.paid !== true);
        res.send(sendUnSoldCar);
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
    app.get('/userSoldCount',verifyJWT,async(req,res)=>{
        const paidType = req.query.paid;
        const boolean = paidType === 'true' ? true : false;
        const query = {'postOwnerInfo.email': req.query.email, paid: boolean};
        const result = await allPostedDataOfTM.find(query).toArray();
        res.send(result);
    })

    // get seller post count number
    app.get('/userPostCount',verifyJWT,async(req,res)=>{
        const query = {'postOwnerInfo.email': req.query.email};
        const result = await allPostedDataOfTM.find(query).toArray();
        res.send(result);
    })

    // get all user information
    app.get('/allUser',verifyJWT,async(req,res)=>{
        const query = {};
        const result = await allUsersDataOfTM.find(query).toArray();
        const users = result.filter(user => user.userRole !== 'admin')
        res.send(users);
    })

    // update user verify value
    app.patch('/allUser',verifyJWT,async(req,res)=>{
        let status = true
        if(req.body.status){
            status = false;
        };
        const updateDoc = {$set:{userVarified: status}};
        const thisUserAllPostUpdateDoc = {$set:{'postOwnerInfo.varified':status}};
        const query = {_id: ObjectId(req.body._id),userEmail:req.body.userEmail};
        const filterThisUserAllPost = {'postOwnerInfo.email':req.body.userEmail}
        const updateThisUserAllPost = await allPostedDataOfTM.updateMany(filterThisUserAllPost,thisUserAllPostUpdateDoc)
        const result = await allUsersDataOfTM.updateOne(query,updateDoc);
        res.send(result);
    })    

    // store bookedCar data
    app.post('/bookedCar',verifyJWT,async(req,res)=>{
        const reqBody = req.body;
        const result = await allBookedDataOfTM.insertOne(reqBody);
        res.send(result)
    })

    // get all bookedCar data
    app.get('/bookedCar',async(req,res)=>{
        const reqEmail = req.query.email;
        const allPosts = await allPostedDataOfTM.find({}).toArray();
        const allBookedData = await allBookedDataOfTM.find({buyerEmail: reqEmail}).toArray();
        // get same post qual to ProductID and postData _id
        const MatchedPost = allPosts.filter(elm1 => {
            return allBookedData.some(elm2 => {
                return elm1._id.toString() === elm2.bookedProductId
            })
        })
        res.send(MatchedPost)
    })

    // store new product or added product post
    app.post('/new-post',verifyJWT,async(req,res)=>{
        const reqBody = req.body;
        const backup = await allPostBackup.insertOne(reqBody);
        const result = await allPostedDataOfTM.insertOne(reqBody);
        res.send(result)
    })

    // get product by user email
    app.get('/my-product/:email',verifyJWT,async(req,res)=>{
        const query = {'postOwnerInfo.email': req.params.email }
        const result = await allPostedDataOfTM.find(query).toArray();
        res.send(result)
    })

    // delete product by id and email
    app.delete('/postedData',verifyJWT,async(req,res)=>{
        const query = {_id: ObjectId(req.query.id),'postOwnerInfo.email':req.query.email}
        const result = await allPostedDataOfTM.deleteOne(query);
        res.send(result);
    })

    // delete user by id
    app.delete('/userInfo',verifyJWT,async(req,res)=>{
        const query = {_id: ObjectId(req.query.id)}
        const result = await allUsersDataOfTM.deleteOne(query);
        res.send(result);
    })

    // advertise postedData by post id
    app.patch('/postedData',verifyJWT,async(req,res)=>{
        const reqBody = req.body;
        const filter = {_id: ObjectId(reqBody.id),'postOwnerInfo.email':reqBody.email};
        const updateAdvertise = {$set:{advertise: true}};
        const result = await allPostedDataOfTM.updateOne(filter,updateAdvertise);
        res.send(result)
    })

    // reported post store by seller id and reported product id
    app.post('/reportedProd',async(req,res)=>{
        const reqBody = req.body;
        const result = await allReportedProductOfTM.insertOne(reqBody);
        res.send(result);
    })

    // get reported post
    app.get('/reportedProd',async(req,res)=>{
        const allPost = await allPostedDataOfTM.find({}).toArray();
        const reportedPost = await allReportedProductOfTM.find({}).toArray();
        const matchedPost = allPost.filter(felm => {
            return reportedPost.some(selm => {
                return felm._id.toString() === selm.productId
            })
        })
        res.send(matchedPost)
        
    })


}

run().catch(console.dir)

app.listen(port,()=>console.log('this api is running on',port))
