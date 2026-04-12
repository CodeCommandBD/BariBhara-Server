import express, { type Application } from 'express';
import "dotenv/config";
import "../config/database.js";
import cors from 'cors';


const app: Application = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// home route

app.get('/', (req,res) => {
    res.send('Hello World!');
})

// register route
app.post('/register', (req,res) => {
    res.send('Register route');
})

// login route
app.post('/login', (req,res) => {
    res.send('Login route');
})

// protected route 
app.get('/profile', (req,res) => {
    res.send('Profile route');
    
})




// resourse not found
app.use((req,res,next) => {
    res.status(404).json({
        success: false,
        message: 'Resourse not found!'
    });
})

// global error handler
app.use((err:any,req:any,res:any,next:any) => {
    console.log(err);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
})

export default app;
